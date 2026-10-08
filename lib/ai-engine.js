const CATEGORY_PROMPTS={
 sports:"dynamic sports emblem",romantic:"elegant romantic composition",animals:"bold animal illustration",
 cars:"detailed automotive illustration",ships:"nautical ship illustration",buses:"classic bus illustration",
 aircraft:"aviation illustration",military:"historical military-inspired illustration",kids:"playful children's illustration"
};
export function buildPrompt(category,customIdea=""){
 if(!CATEGORY_PROMPTS[category])throw new Error("Unknown category");
 return [CATEGORY_PROMPTS[category],customIdea,"professional premium t-shirt graphic","clean composition","transparent PNG","print-ready"].filter(Boolean).join(", ");
}
async function withTimeout(promise,ms){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Timeout")),ms))])}
async function generateWithLeonardo(prompt){
 const key=process.env.LEONARDO_API_KEY;if(!key)throw new Error("LEONARDO_API_KEY missing");
 const res=await withTimeout(fetch("https://cloud.leonardo.ai/api/rest/v1/generations",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({prompt,modelId:"aa77f04e-3eec-4034-9c07-d0f619684628",width:1024,height:1024,num_images:1,guidance_scale:7,presetStyle:"ILLUSTRATION"})}),15000);
 if(!res.ok)throw new Error("Leonardo "+res.status);
 const data=await res.json(),id=data.sdGenerationJob?.generationId;if(!id)throw new Error("Leonardo job creation failed");
 for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,3000));const q=await fetch("https://cloud.leonardo.ai/api/rest/v1/generations/"+id,{headers:{Authorization:"Bearer "+key}});const d=await q.json(),g=d.generations_by_pk;if(g?.status==="COMPLETE"&&g.generated_images?.[0]?.url)return{imageUrl:g.generated_images[0].url,engine:"leonardo"};if(g?.status==="FAILED")throw new Error("Leonardo generation failed")}
 throw new Error("Leonardo timeout");
}
async function generateWithHuggingFace(prompt){
 const key=process.env.HUGGINGFACE_API_KEY;if(!key)throw new Error("HUGGINGFACE_API_KEY missing");
 const res=await withTimeout(fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({inputs:prompt})}),30000);
 if(!res.ok)throw new Error("HuggingFace "+res.status);
 const buffer=Buffer.from(await res.arrayBuffer()),{getSupabaseAdmin}=await import("@/lib/supabase"),admin=getSupabaseAdmin();
 const path="designs/"+Date.now()+"-"+crypto.randomUUID()+".png",upload=await admin.storage.from("designs").upload(path,buffer,{contentType:"image/png",upsert:false});
 if(upload.error)throw upload.error;return{imageUrl:admin.storage.from("designs").getPublicUrl(path).data.publicUrl,engine:"huggingface"};
}
export async function generateDesign({category,customIdea=""}){
 const prompt=buildPrompt(category,customIdea),errors=[];
 for(const fn of [generateWithLeonardo,generateWithHuggingFace])try{return{success:true,prompt,...await fn(prompt)}}catch(e){errors.push({provider:fn.name,error:e.message})}
 return{success:false,error:"All AI providers failed",errors,prompt};
}
