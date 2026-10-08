import {NextResponse} from "next/server";
import {z} from "zod";
import {createHash} from "crypto";
import {generateDesign} from "@/lib/ai-engine";
import {getSupabaseAdmin} from "@/lib/supabase";

const Schema=z.object({
  category:z.enum(["sports","romantic","animals","cars","ships","buses","aircraft","military","kids"]),
  customIdea:z.string().max(200).optional(),
  count:z.number().int().min(1).max(10).default(1)
});

const WINDOW=60*60*1000;
const MAX_DESIGNS_PER_WINDOW=10;
const usage=new Map();

function clientKey(req){
  const token=req.cookies.get("out_session")?.value||"";
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("x-real-ip")||"unknown";
  const tokenHash=token?createHash("sha256").update(token).digest("hex").slice(0,16):"anonymous";
  return ip.slice(0,100)+":"+tokenHash;
}

function reserveQuota(key,count){
  const now=Date.now();
  const current=usage.get(key);
  const rec=!current||now>=current.resetAt
    ? {used:0,resetAt:now+WINDOW}
    : current;
  if(rec.used+count>MAX_DESIGNS_PER_WINDOW) return {allowed:false,remaining:Math.max(0,MAX_DESIGNS_PER_WINDOW-rec.used),retryAfter:Math.ceil((rec.resetAt-now)/1000)};
  rec.used+=count;
  usage.set(key,rec);
  if(usage.size>10000) for(const [k,v] of usage) if(v.resetAt<=now) usage.delete(k);
  return {allowed:true,remaining:MAX_DESIGNS_PER_WINDOW-rec.used,retryAfter:0};
}

export const maxDuration=60;

export async function POST(req){
  try{
    const parsed=Schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"بيانات غير صحيحة"},{status:400});

    const quota=reserveQuota(clientKey(req),parsed.data.count);
    if(!quota.allowed){
      return NextResponse.json(
        {error:"تم بلوغ حد توليد التصاميم لهذا الحساب مؤقتاً",remaining:quota.remaining,retryAfter:quota.retryAfter},
        {status:429,headers:{"Retry-After":String(quota.retryAfter)}}
      );
    }

    const admin=getSupabaseAdmin(),results=[],errors=[];
    for(let i=0;i<parsed.data.count;i++){
      const result=await generateDesign(parsed.data);
      if(!result.success){errors.push({index:i,error:result.error});continue}
      const q=await admin.from("designs").insert({
        title:parsed.data.category+"-"+Date.now()+"-"+i,
        category:parsed.data.category,
        image_url:result.imageUrl,
        prompt:result.prompt,
        ai_engine:result.engine,
        status:"generated"
      }).select().single();
      if(q.error)errors.push({index:i,error:"database_insert_failed"});else results.push(q.data);
      if(i<parsed.data.count-1)await new Promise(r=>setTimeout(r,1200));
    }
    if(!results.length)return NextResponse.json({success:false,error:"فشل توليد كل التصاميم",errors},{status:502});
    return NextResponse.json({success:true,generated:results.length,designs:results,errors,quotaRemaining:quota.remaining});
  }catch(e){
    console.error("[designs/generate]",e instanceof Error?e.message:"unknown");
    return NextResponse.json({error:"خطأ داخلي"},{status:500});
  }
}
