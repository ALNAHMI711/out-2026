import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, supabasePublic } from "@/lib/supabase";

const ProductSchema = z.object({
  design_id: z.string().uuid(),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name_ar: z.string().min(2).max(200),
  name_en: z.string().min(2).max(200),
  name_es: z.string().max(200).nullable().optional(),
  price_cents: z.number().int().min(1).max(100000000),
  currency: z.string().length(3).toUpperCase().default("USD"),
  category: z.string().min(1).max(80),
  stock: z.number().int().min(0).max(1000000).default(0),
  is_active: z.boolean().default(false),
});

export async function GET(req) {
  if (!supabasePublic) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const u = new URL(req.url);
  const category = u.searchParams.get("category");
  const search = u.searchParams.get("search");
  const limit = Math.min(Math.max(parseInt(u.searchParams.get("limit") || "24", 10) || 24, 1), 100);
  let q = supabasePublic.from("products").select("id,slug,name_ar,name_en,price_cents,currency,category,rating,sales_count,designs(image_url,thumbnail_url)").eq("is_active", true).order("sales_count", { ascending: false }).limit(limit);
  if (category) q = q.eq("category", category);
  if (search) {
    const s = search.replace(/[%_]/g, "").slice(0, 100);
    if (s) q = q.or("name_ar.ilike.%" + s + "%,name_en.ilike.%" + s + "%");
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "تعذر تحميل المنتجات" }, { status: 500 });
  return NextResponse.json({ products: data || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  try {
    const parsed = ProductSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات المنتج غير صحيحة" }, { status: 400 });
    const b = parsed.data;
    const admin = getSupabaseAdmin();
    const d = await admin.from("designs").select("id").eq("id", b.design_id).single();
    if (d.error || !d.data) return NextResponse.json({ error: "التصميم غير موجود" }, { status: 400 });
    const allowed = { ...b, name_es: b.name_es || null, rating: 5, sales_count: 0 };
    const q = await admin.from("products").insert(allowed).select().single();
    if (q.error) return NextResponse.json({ error: "تعذر إنشاء المنتج" }, { status: 400 });
    return NextResponse.json({ product: q.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
  }
}
