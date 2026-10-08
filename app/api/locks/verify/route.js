import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';

const Schema = z.object({ lockId: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/), password: z.string().length(10).regex(/^\d{10}$/) });
const attempts = new Map();
const MAX = 5;
const WINDOW = 10 * 60 * 1000;

function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim().slice(0, 100);
}

export async function POST(request) {
  const key = clientKey(request);
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, reset: now + WINDOW };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + WINDOW; }
  if (rec.count >= MAX) return NextResponse.json({ error: 'محاولات كثيرة. انتظر 10 دقائق' }, { status: 429 });

  try {
    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    const { lockId, password } = parsed.data;
    const admin = getSupabaseAdmin();
    const { data: lock, error } = await admin.from('locks').select('id,password_hash,lock_id').eq('lock_id', lockId).maybeSingle();
    if (error) { console.error('[locks/verify] db error', error.message); return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 }); }
    if (!lock) return NextResponse.json({ error: 'قفل غير موجود' }, { status: 404 });

    const valid = await bcrypt.compare(password, lock.password_hash);
    if (!valid) {
      rec.count += 1; attempts.set(key, rec);
      return NextResponse.json({ error: 'رمز خاطئ' }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) return NextResponse.json({ error: 'الخدمة غير مهيأة' }, { status: 503 });
    const token = await new SignJWT({ lockId, type: 'lock_session' })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('5m').setIssuer('out-2026-locks')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    attempts.delete(key);
    return NextResponse.json({ success: true, sessionToken: token, expiresIn: 300 });
  } catch (error) {
    console.error('[locks/verify] unexpected', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}