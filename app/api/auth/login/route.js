import {NextResponse} from "next/server";
import {SignJWT} from "jose";
import bcrypt from "bcryptjs";
const attempts=new Map();
const MAX=5, WINDOW=15*60*1000;
function ip(req){return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"}
function register(ipv){
  const now=Date.now(); let r=attempts.get(ipv);
  if(!r||now>r.reset) r={count:0,reset:now+WINDOW};
  r.count++; attempts.set(ipv,r);
  if(attempts.size>10000) for(const [k,v] of attempts) if(v.reset<now) attempts.delete(k);
  return r;
}
export async function POST(req){
  const ipv=ip(req), current=attempts.get(ipv);
  if(current&&Date.now()<current.reset&&current.count>=MAX) return NextResponse.json({error:"محاولات كثيرة. حاول لاحقاً."},{status:429});
  try{
    const body=await req.json(), password=body?.password;
    if(typeof password!=="string"||!password) return NextResponse.json({error:"كلمة السر مطلوبة"},{status:400});
    const configs=[
      ["production",process.env.OUT_PRODUCTION_PASSWORD_HASH],
      ["marketing",process.env.OUT_MARKETING_PASSWORD_HASH],
      ["owner",process.env.OUT_MASTER_PASSWORD_HASH]
    ];
    let area=null,role=null;
    for(const [a,h] of configs) if(h&&await bcrypt.compare(password,h)){area=a;role=a==="owner"?"owner":"admin";break}
    if(!area){
      // Diagnostics stay in server logs; never expose environment configuration to unauthenticated clients.
      console.warn("[auth/login] Authentication failed", {
        inputLength: password.length,
        configuredHashes: {
          production: Boolean(process.env.OUT_PRODUCTION_PASSWORD_HASH),
          marketing: Boolean(process.env.OUT_MARKETING_PASSWORD_HASH),
          master: Boolean(process.env.OUT_MASTER_PASSWORD_HASH)
        }
      });
      register(ipv);
      return NextResponse.json({error:"بيانات غير صحيحة"},{status:401});
    }
    if(!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
    const token=await new SignJWT({role,area}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("24h").setIssuer("out-2026").sign(new TextEncoder().encode(process.env.JWT_SECRET));
    const res=NextResponse.json({success:true,redirect:area==="marketing"?"/admin-marketing":"/admin-production"});
    res.cookies.set("out_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",maxAge:86400,path:"/"});
    attempts.delete(ipv);
    return res;
  }catch(e){console.error("[auth/login]",e);return NextResponse.json({error:"خطأ في السيرفر"},{status:500})}
}
