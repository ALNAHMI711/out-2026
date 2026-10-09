import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
export async function requireAdmin(request, allowedAreas=[]) {
 const token=request.cookies.get('out_session')?.value;
 if(!token||!process.env.JWT_SECRET) return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
 try {
  const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.JWT_SECRET),{issuer:'out-2026'});
  if(!['owner','admin'].includes(payload.role)||(payload.role!=='owner'&&!allowedAreas.includes(payload.area))) return {error:NextResponse.json({error:'Forbidden'},{status:403})};
  return {payload};
 } catch { return {error:NextResponse.json({error:'Unauthorized'},{status:401})}; }
}
