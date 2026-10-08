import {NextResponse} from "next/server";
import {jwtVerify} from "jose";
const rules=[["/admin-production","production"],["/admin-marketing","marketing"]];
const protectedApi=[["/api/designs",["POST"]],["/api/pod",["POST","PUT","DELETE"]],["/api/social",["POST"]],["/api/stats",["GET"]],["/api/products",["POST","PUT","PATCH","DELETE"]],["/api/orders",["GET","PUT","PATCH","DELETE"]]];
export async function middleware(req){
 const path=req.nextUrl.pathname,method=req.method;
 const pageRule=rules.find(x=>path.startsWith(x[0]));
 const apiRule=protectedApi.find(x=>path.startsWith(x[0])&&x[1].includes(method));
 if(!pageRule&&!apiRule)return NextResponse.next();
 const token=req.cookies.get("out_session")?.value;
 if(!token)return pageRule?NextResponse.redirect(new URL("/",req.url)):NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  if(!process.env.JWT_SECRET)throw new Error("JWT_SECRET missing");
  const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.JWT_SECRET),{issuer:"out-2026"});
  if(pageRule&&payload.role!=="owner"&&payload.area!==pageRule[1])return NextResponse.redirect(new URL("/",req.url));
  return NextResponse.next();
 }catch{
  const res=pageRule?NextResponse.redirect(new URL("/",req.url)):NextResponse.json({error:"Unauthorized"},{status:401});
  res.cookies.delete("out_session");return res;
 }
}
export const config={matcher:["/admin-production/:path*","/admin-marketing/:path*","/api/designs/:path*","/api/pod/:path*","/api/orders/:path*","/api/social/:path*","/api/stats/:path*","/api/products/:path*"]};
