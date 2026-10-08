import {NextResponse} from "next/server";
import {getSupabaseAdmin,supabasePublic} from "@/lib/supabase";
export async function GET(req){
 if(!supabasePublic)return NextResponse.json({error:"Supabase is not configured"},{status:503});
 const u=new URL(req.url),category=u.searchParams.get("category"),search=u.searchParams.get("search");
 const limit=Math.min(Math.max(parseInt(u.searchParams.get("limit")||"24",10)||24,1),100);
 let q=supabasePublic.from("products").select("id,slug,name_ar,name_en,price_cents,currency,category,rating,sales_count,designs(image_url,thumbnail_url)").eq("is_active",true).order("sales_count",{ascending:false}).limit(limit);
 if(category)q=q.eq("category",category);
 if(search){const s=search.replace(/[%_]/g,"").slice(0,100);if(s)q=q.or("name_ar.ilike.%"+s+"%,name_en.ilike.%"+s+"%")}
 const {data,error}=await q;if(error)return NextResponse.json({error:"تعذر تحميل المنتجات"},{status:500});return NextResponse.json({products:data||[]});
}
export async function POST(req){
 try{
  const b=await req.json();if(!b?.design_id)return NextResponse.json({error:"design_id مطلوب"},{status:400});
  const admin=getSupabaseAdmin(),d=await admin.from("designs").select("id").eq("id",b.design_id).single();
  if(d.error||!d.data)return NextResponse.json({error:"التصميم غير موجود"},{status:400});
  const allowed={design_id:b.design_id,slug:b.slug,name_ar:b.name_ar,name_en:b.name_en,name_es:b.name_es||null,price_cents:b.price_cents,currency:b.currency||"USD",category:b.category,stock:b.stock??0,sales_count:0,rating:b.rating??5,is_active:!!b.is_active};
  const q=await admin.from("products").insert(allowed).select().single();if(q.error)return NextResponse.json({error:q.error.message},{status:400});return NextResponse.json({product:q.data},{status:201});
 }catch{return NextResponse.json({error:"طلب غير صحيح"},{status:400})}
}
