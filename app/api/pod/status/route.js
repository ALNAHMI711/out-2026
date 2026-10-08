import { NextResponse } from 'next/server';
import { POD_PLATFORMS } from '@/lib/pod-platforms';

export async function GET() {
  const status = {};
  for (const [key, p] of Object.entries(POD_PLATFORMS || {})) {
    status[key] = {
      name: p.name || key,
      configured: p.envKey ? Boolean(process.env[p.envKey]) : false,
      supportsAutomation: Boolean(p.supportsAutomation),
      requiresRPA: Boolean(p.requiresRPA),
      apiType: p.apiType || null,
    };
  }
  return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } });
}