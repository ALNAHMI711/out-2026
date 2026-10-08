import {NextResponse} from "next/server";
export async function POST(req){
 try{
  const body=await req.json(),platforms=Array.isArray(body.platforms)?body.platforms:[],imageUrl=body.imageUrl,caption=body.caption||"";
  if(!imageUrl)return NextResponse.json({error:"imageUrl مطلوب"},{status:400});
  const results=[];
  for(const platform of platforms){
   if(platform!=="instagram"){results.push({platform,success:false,reason:"not_implemented_without_official_api"});continue}
   const token=process.env.INSTAGRAM_ACCESS_TOKEN,id=process.env.INSTAGRAM_BUSINESS_ID;
   if(!token||!id){results.push({platform,success:false,reason:"not_configured"});continue}
   try{
    const c=await fetch("https://graph.facebook.com/v21.0/"+id+"/media",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({image_url:imageUrl,caption,access_token:token})}),cj=await c.json();
    if(!cj.id){results.push({platform,success:false,reason:cj.error?.message||"media_creation_failed"});continue}
    const p=await fetch("https://graph.facebook.com/v21.0/"+id+"/media_publish",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({creation_id:cj.id,access_token:token})}),pj=await p.json();
    results.push({platform,success:!!pj.id,postId:pj.id,reason:pj.error?.message});
   }catch(e){results.push({platform,success:false,reason:e.message})}
  }
  return NextResponse.json({success:results.length>0&&results.every(r=>r.success),results});
 }catch{return NextResponse.json({error:"طلب غير صحيح"},{status:400})}
}
