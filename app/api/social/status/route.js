import { NextResponse } from 'next/server';

const PLATFORMS = {
  instagram: { name: 'Instagram', envKeys: ['INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_BUSINESS_ACCOUNT_ID'], supportsAutomation: true, requiresRPA: false },
  facebook: { name: 'Facebook', envKeys: ['FACEBOOK_ACCESS_TOKEN','FACEBOOK_PAGE_ID'], supportsAutomation: true, requiresRPA: false },
  youtube: { name: 'YouTube', envKeys: ['YOUTUBE_ACCESS_TOKEN'], supportsAutomation: true, requiresRPA: false },
  tiktok: { name: 'TikTok', envKeys: ['TIKTOK_ACCESS_TOKEN'], supportsAutomation: false, requiresRPA: true },
  pinterest: { name: 'Pinterest', envKeys: ['PINTEREST_ACCESS_TOKEN'], supportsAutomation: true, requiresRPA: false },
};

export async function GET() {
  const status = {};
  for (const [key, p] of Object.entries(PLATFORMS)) {
    status[key] = {
      name: p.name,
      icon: key === 'instagram' ? 'Instagram' : key === 'facebook' ? 'Facebook' : key === 'youtube' ? 'Youtube' : key === 'tiktok' ? 'Music' : 'Share2',
      configured: p.envKeys.every((k) => Boolean(process.env[k])),
      supportsAutomation: p.supportsAutomation,
      requiresRPA: p.requiresRPA,
    };
  }
  return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } });
}