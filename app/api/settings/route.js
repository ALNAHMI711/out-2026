import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api-auth';
import { encryptSecret } from '@/lib/secret-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const KEYS = new Set(['LEONARDO_API_KEY','HUGGINGFACE_API_KEY','PRINTFUL_API_KEY','PRINTIFY_API_KEY','STRIPE_SECRET_KEY','STRIPE_PUBLISHABLE_KEY','TIKTOK_ACCESS_TOKEN','INSTAGRAM_ACCESS_TOKEN','FACEBOOK_ACCESS_TOKEN','PINTEREST_ACCESS_TOKEN']);
const out = (body, status=200) => NextResponse.json(body, {status, headers:{'Cache-Control':'no-store'}});
export async function GET(req) {
  const auth = await requireAdmin(req, ['production']);
  if (auth.error) return auth.error;
  try {
    const {data,error}=await getSupabaseAdmin().from('app_settings').select('setting_key,setting_value,is_encrypted,updated_at');
    if(error) throw error;
    const stored=new Map((data||[]).map(x=>[x.setting_key,x]));
    return out({settings:[...KEYS].map(key=>({key,configured:Boolean(stored.get(key)?.setting_value),is_encrypted:stored.get(key)?.is_encrypted??true,updated_at:stored.get(key)?.updated_at??null}))});
  } catch(e) {
    console.error('[settings GET]',e.message);
    return out({error:'تعذر قراءة المفاتيح. تحقق من تشغيل migration 007_app_settings.sql.'},500);
  }
}
export async function POST(req) {
  const auth = await requireAdmin(req, ['production']);
  if (auth.error) return auth.error;
  try {
    const body=await req.json();
    if(typeof body.key!=='string'||!KEYS.has(body.key)) return out({error:'اسم المفتاح غير مسموح'},400);
    if(typeof body.value!=='string'||body.value.trim().length<4||body.value.length>8192) return out({error:'أدخل قيمة مفتاح صالحة'},400);
    const encrypted=encryptSecret(body.value.trim());
    const {data,error}=await getSupabaseAdmin().from('app_settings').upsert({setting_key:body.key,setting_value:encrypted,is_encrypted:true,updated_at:new Date().toISOString()},{onConflict:'setting_key'}).select('setting_key,updated_at').single();
    if(error) throw error;
    return out({success:true,key:data.setting_key,configured:true,updated_at:data.updated_at},200);
  } catch(e) {
    console.error('[settings POST]',e.message);
    return out({error:e.message.includes('APP_ENCRYPTION_KEY')?'التشفير غير مهيأ على الخادم؛ يلزم مفتاح AES-256 ثابت في إعدادات تشغيل الخادم.':'تعذر حفظ المفتاح في قاعدة البيانات.'},500);
  }
}
