import { NextResponse } from 'next/server';
import { SOCIAL_PLATFORMS } from '@/lib/social-platforms';

export async function GET() {
  const status = {};
  for (const [key, p] of Object.entries(SOCIAL_PLATFORMS)) {
    status[key] = {
      name: p.name,
      icon: p.icon,
      configured: p.envKeys.every((k) => Boolean(process.env[k])),
      supportsAutomation: p.supportsAutomation,
      requiresRPA: p.requiresRPA,
    };
  }
  return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } });
}
