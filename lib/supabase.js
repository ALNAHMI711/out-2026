import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublic=url&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}}):null;
let adminClient=null;
export function getSupabaseAdmin(){
  if(typeof window!=="undefined") throw new Error("getSupabaseAdmin() is server-only");
  if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server credentials are missing");
  if(!adminClient) adminClient=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
  return adminClient;
}
