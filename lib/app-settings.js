import { getSupabaseAdmin } from '@/lib/supabase';
import { decryptSecret } from '@/lib/secret-crypto';

/** Server-only integration secret lookup: encrypted DB value wins, env is a fallback. */
export async function getIntegrationSecret(key) {
  if (typeof window !== 'undefined') throw new Error('Server-only secret access');
  const {data,error}=await getSupabaseAdmin().from('app_settings').select('setting_value,is_encrypted').eq('setting_key',key).maybeSingle();
  if(error && error.code!=='PGRST116') throw error;
  if(data?.setting_value) return data.is_encrypted ? decryptSecret(data.setting_value) : data.setting_value;
  return process.env[key] || '';
}
