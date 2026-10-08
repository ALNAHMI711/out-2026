export const POD_PLATFORMS = {
  printful: { name: 'Printful', envKey: 'PRINTFUL_API_KEY', supportsAutomation: true, requiresRPA: false, apiType: 'REST API', description: 'طباعة وشحن عبر API' },
  printify: { name: 'Printify', envKey: 'PRINTIFY_API_KEY', supportsAutomation: true, requiresRPA: false, apiType: 'REST API', description: 'كتالوج وطباعة عبر API' },
  redbubble: { name: 'Redbubble', supportsAutomation: false, requiresRPA: true, apiType: 'RPA', description: 'لا يوجد تكامل API معتمد هنا' },
};

async function apiJson(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
  return res.json();
}

export async function getPrintfulProducts() {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) return [];
  const data = await apiJson('https://api.printful.com/products', { headers: { Authorization: `Bearer ${key}` } });
  return data.result || [];
}

export async function getPrintifyBlueprints() {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) return [];
  return apiJson('https://api.printify.com/v1/catalog/blueprints.json', { headers: { Authorization: `Bearer ${key}` } });
}
