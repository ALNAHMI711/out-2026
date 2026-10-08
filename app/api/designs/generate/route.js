import {NextResponse} from "next/server";
import {z} from "zod";
import {generateDesign} from "@/lib/ai-engine";
import {getSupabaseAdmin} from "@/lib/supabase";
const Schema=z.object({category:z.enum(["sports","romantic","animals","cars","ships","buses","aircraft","military","kids"]),customIdea:z.string().max(200).optional(),count:z.number().int().min(1).max(10).default(1)});
export const maxDuration=60;
export async function POST(req){
 try{
  const parsed=Schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"بيانات غير صحيحة"},{status:400});
  const admin=getSupabaseAdmin(),results=[],errors=[];
  for(let i=0;i<parsed.data.count;i++){
   const result=await generateDesign(parsed.data);
   if(!result.success){errors.push({index:i,error:result.error});continue}
   const q=await admin.from("designs").insert({title:parsed.data.category+"-"+Date.now()+"-"+i,category:parsed.data.category,image_url:result.imageUrl,prompt:result.prompt,ai_engine:result.engine,status:"generated"}).select().single();
   if(q.error)errors.push({index:i,error:q.error.message});else results.push(q.data);
   if(i<parsed.data.count-1)await new Promise(r=>setTimeout(r,1200));
  }
  if(!results.length)return NextResponse.json({success:false,error:"فشل توليد كل التصاميم",errors},{status:502});
  return NextResponse.json({success:true,generated:results.length,designs:results,errors});
 }catch(e){console.error("[designs/generate]",e);return NextResponse.json({error:"خطأ داخلي"},{status:500})}
}
export async function GET(){return NextResponse.json({providers:{leonardo:!!process.env.LEONARDO_API_KEY,huggingface:!!process.env.HUGGINGFACE_API_KEY}})}
