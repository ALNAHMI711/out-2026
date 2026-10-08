import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const [designs, uploaded, products, orders] = await Promise.all([
      db.from('designs').select('id,category,status', { count: 'exact', head: false }).limit(10000),
      db.from('designs').select('id', { count: 'exact', head: true }).eq('status', 'uploaded'),
      db.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      db.from('orders').select('total_cents,shipping_country,status').limit(10000),
    ]);
    const firstError = [designs, uploaded, products, orders].find((x) => x.error);
    if (firstError) {
      console.error('[stats] database error', firstError.error.message);
      return NextResponse.json({ error: 'تعذر جلب الإحصائيات' }, { status: 500 });
    }

    const categoryCounts = {};
    for (const row of designs.data || []) categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;

    const countryRevenue = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    for (const row of orders.data || []) {
      if (row.status === 'cancelled' || row.status === 'refunded') continue;
      totalOrders += 1;
      const amount = Number(row.total_cents || 0) / 100;
      totalRevenue += amount;
      const country = row.shipping_country || 'غير محدد';
      countryRevenue[country] = (countryRevenue[country] || 0) + amount;
    }

    return NextResponse.json({
      designsTotal: designs.count ?? 0,
      stats: {
        designs_uploaded: uploaded.count ?? 0,
        active_products: products.count ?? 0,
        daily: { profit: null, visitors: null },
      },
      financial: { totalRevenue, totalOrders, currency: 'USD' },
      categoryCounts,
      countryRevenue,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[stats] unexpected', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}