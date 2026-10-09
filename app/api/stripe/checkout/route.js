import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase';
import {getIntegrationSecret} from '@/lib/app-settings';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(b,s=200)=>NextResponse.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function POST(req){
 try{
  const secret=await getIntegrationSecret('STRIPE_SECRET_KEY');
  if(!secret)return out({error:'أضف STRIPE_SECRET_KEY من الإعدادات العليا قبل تفعيل الدفع.'},503);
  const body=await req.json(),ids=Array.isArray(body.productIds)?body.productIds:[];
  if(!ids.length||ids.length>20||ids.some(id=>typeof id!=='string'))return out({error:'اختر منتجًا واحدًا على الأقل.'},400);
  const db=getSupabaseAdmin();
  const {data:products,error}=await db.from('products').select('id,name_en,name_ar,price_cents,currency,is_active,stock').in('id',ids).eq('is_active',true);
  if(error)throw error;
  if(!products||products.length!==new Set(ids).size)return out({error:'بعض المنتجات غير متاحة حاليًا.'},400);
  const origin=new URL(req.url).origin,form=new URLSearchParams();
  form.set('mode','payment');form.set('success_url',origin+'/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}');form.set('cancel_url',origin+'/shop?checkout=cancelled');
  form.set('client_reference_id',typeof body.customerEmail==='string'?body.customerEmail.slice(0,254):'');
  products.forEach((p,i)=>{form.set(`line_items[${i}][price_data][currency]`,String(p.currency||'USD').toLowerCase());form.set(`line_items[${i}][price_data][unit_amount]`,String(p.price_cents));form.set(`line_items[${i}][price_data][product_data][name]`,String(p.name_en||p.name_ar).slice(0,250));form.set(`line_items[${i}][quantity]`,'1')});
  if(typeof body.customerEmail==='string'&&body.customerEmail.includes('@'))form.set('customer_email',body.customerEmail.slice(0,254));
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!response.ok){console.error('[stripe checkout]',response.status,data?.error?.type||'provider_error');return out({error:'رفض Stripe إنشاء جلسة الدفع. تحقق من المفتاح وإعدادات الحساب.'},502)}
  return out({success:true,sessionId:data.id,url:data.url});
 }catch(e){console.error('[stripe checkout]',e.message);return out({error:'تعذر إنشاء جلسة الدفع.'},500)}
}
