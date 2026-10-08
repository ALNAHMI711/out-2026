import {NextResponse} from "next/server";
import {getSupabaseAdmin} from "@/lib/supabase";
import {z} from "zod";
const Schema=z.object({customer:z.object({name:z.string().min(2).max(100),email:z.string().email(),phone:z.string().max(30).optional()}),shippingAddress:z.object({address1:z.string().min(5).max(200),city:z.string().min(2).max(100),country_code:z.string().length(2),zip:z.string().min(3).max(20)}),items:z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(10)})).min(1).max(20)});
export async function POST(req){
 try{
  const parsed=Schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"بيانات غير صحيحة"},{status:400});
  const admin=getSupabaseAdmin(),{items,customer,shippingAddress}=parsed.data,ids=[...new Set(items.map(i=>i.productId))];
  const q=await admin.from("products").select("id,price_cents,name_en,is_active").in("id",ids);
  if(q.error||!q.data||q.data.length!==ids.length)return NextResponse.json({error:"منتجات غير متوفرة"},{status:400});
  if(q.data.some(x=>!x.is_active))return NextResponse.json({error:"منتج غير متاح"},{status:400});
  const orderItems=items.map(i=>{const p=q.data.find(x=>x.id===i.productId);return{productId:p.id,name:p.name_en,price_cents:p.price_cents,quantity:i.quantity}});
  const subtotal=orderItems.reduce((s,i)=>s+i.price_cents*i.quantity,0),shipping=subtotal>5000?0:800,total=subtotal+shipping;
  const orderNumber="OUT-"+Date.now().toString(36).toUpperCase();
  const ins=await admin.from("orders").insert({order_number:orderNumber,customer_email:customer.email,customer_name:customer.name,items:orderItems,subtotal_cents:subtotal,shipping_cents:shipping,total_cents:total,shipping_country:shippingAddress.country_code,status:"pending"}).select().single();
  if(ins.error)return NextResponse.json({error:"تعذر إنشاء الطلب"},{status:500});
  return NextResponse.json({success:true,orderNumber:ins.data.order_number,total:total/100});
 }catch(e){console.error("[orders/POST]",e);return NextResponse.json({error:"خطأ داخلي"},{status:500})}
}
export async function PATCH(req){
 try{
  const Body=z.object({
    orderId:z.string().uuid(),
    newStatus:z.enum(["pending","paid","processing","shipped","delivered","cancelled","refunded"]),
    reason:z.string().max(500).optional()
  });
  const parsed=Body.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"بيانات تحديث الطلب غير صحيحة"},{status:400});

  const {assertTransition}=await import("@/lib/orders/state-machine");
  const admin=getSupabaseAdmin();
  const {orderId,newStatus,reason}=parsed.data;
  const current=await admin.from("orders").select("id,status").eq("id",orderId).single();
  if(current.error||!current.data)return NextResponse.json({error:"الطلب غير موجود"},{status:404});

  try{
    assertTransition(current.data.status,newStatus);
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"انتقال حالة غير مسموح"},{status:409});
  }

  const now=new Date().toISOString();
  const patch={status:newStatus,updated_at:now};
  if(newStatus==="shipped")patch.shipped_at=now;
  if(newStatus==="delivered")patch.delivered_at=now;
  if(newStatus==="cancelled")patch.cancelled_at=now;

  // Optimistic concurrency: only update if the status is still the one we validated.
  const updated=await admin.from("orders")
    .update(patch)
    .eq("id",orderId)
    .eq("status",current.data.status)
    .select()
    .single();

  if(updated.error||!updated.data)return NextResponse.json({error:"تعذر تحديث الطلب؛ ربما تغيّرت حالته بالفعل"},{status:409});

  const history=await admin.from("order_status_history").insert({
    order_id:orderId,
    from_status:current.data.status,
    to_status:newStatus,
    reason:reason||null
  });
  if(history.error){
    console.error("[orders/PATCH] status history error",history.error.message);
    return NextResponse.json({error:"تم تحديث الطلب لكن تعذر تسجيل سجل الحالة"},{status:500});
  }

  return NextResponse.json({success:true,order:updated.data});
 }catch(e){
  console.error("[orders/PATCH]",e instanceof Error?e.message:"unknown");
  return NextResponse.json({error:"خطأ داخلي"},{status:500});
}
}

export async function GET(req){
 const admin=getSupabaseAdmin(),status=new URL(req.url).searchParams.get("status");let q=admin.from("orders").select("*").order("created_at",{ascending:false}).limit(100);if(status)q=q.eq("status",status);const r=await q;if(r.error)return NextResponse.json({error:"تعذر تحميل الطلبات"},{status:500});return NextResponse.json({orders:r.data||[]});
}
