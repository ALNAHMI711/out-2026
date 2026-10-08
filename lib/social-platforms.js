export const SOCIAL_PLATFORMS = {
  instagram: { name: 'Instagram', envKeys: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID'], supportsAutomation: true, requiresRPA: false, icon: 'Instagram' },
  facebook: { name: 'Facebook', envKeys: ['FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID'], supportsAutomation: true, requiresRPA: false, icon: 'Facebook' },
  youtube: { name: 'YouTube', envKeys: ['YOUTUBE_ACCESS_TOKEN'], supportsAutomation: true, requiresRPA: false, icon: 'Youtube' },
  tiktok: { name: 'TikTok', envKeys: ['TIKTOK_ACCESS_TOKEN'], supportsAutomation: false, requiresRPA: true, icon: 'Music' },
  pinterest: { name: 'Pinterest', envKeys: ['PINTEREST_ACCESS_TOKEN'], supportsAutomation: true, requiresRPA: false, icon: 'Share2' },
};
