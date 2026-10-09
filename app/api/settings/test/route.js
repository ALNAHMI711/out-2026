import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api-auth';
import { getIntegrationSecret } from '@/lib/app-settings';
export const runtime='nodejs';
const out=(b,s=200)=>NextResponse.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function POST(req){
 const auth=await requireAdmin(req,['production']); if(auth.error)return auth.error;
 try{
  const {key}=await req.json();
  const allowed=['LEONARDO_API_KEY','HUGGINGFACE_API_KEY','PRINTFUL_API_KEY','PRINTIFY_API_KEY','STRIPE_SECRET_KEY','STRIPE_PUBLISHABLE_KEY'];
  if(!allowed.includes(key))return out({error:'اختبار هذا المفتاح غير مدعوم من لوحة الإنتاج'},400);
  const value=await getIntegrationSecret(key);
  if(!value)return out({success:false,error:'المفتاح غير مُعد'},400);
  let response;
  if(key==='LEONARDO_API_KEY') response=await fetch('https://cloud.leonardo.ai/api/rest/v1/me',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(10000)});
  else if(key==='HUGGINGFACE_API_KEY') response=await fetch('https://huggingface.co/api/whoami-v2',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(10000)});
  else if(key==='PRINTFUL_API_KEY') response=await fetch('https://api.printful.com/store',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(10000)});
  else if(key==='PRINTIFY_API_KEY') response=await fetch('https://api.printify.com/v1/shops.json',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(10000)});
  else if(key==='STRIPE_SECRET_KEY') response=await fetch('https://api.stripe.com/v1/account',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(10000)});
  else return out({success:true,message:'المفتاح العام محفوظ؛ لا يمكن التحقق منه سرًا دون إنشاء عملية دفع.'});
  return response.ok?out({success:true,message:'تم التحقق من المفتاح لدى المزود.'}):out({success:false,error:'رفض المزود المفتاح أو الصلاحية (HTTP '+response.status+').'},400);
 }catch(e){return out({success:false,error:'تعذر اختبار الاتصال: '+(e.name==='TimeoutError'?'انتهت المهلة':'تحقق من الاتصال وإعداد المفتاح')},502)}
}
