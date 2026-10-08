'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, FolderOpen, Sparkles, Globe, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SuitcaseLock from '@/components/SuitcaseLock';

export default function AdminProductionPage() {
  const [stats, setStats] = useState(null), [platformStatus, setPlatformStatus] = useState({});
  const [designs, setDesigns] = useState([]), [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false), [error, setError] = useState('');

  async function loadStats() {
    setLoading(true); setError('');
    try {
      const [statsRes, podRes] = await Promise.all([
        fetch('/api/stats', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pod/status', { credentials: 'include', cache: 'no-store' })
      ]);
      const sd = await statsRes.json().catch(() => ({})), pd = await podRes.json().catch(() => ({}));
      if (!statsRes.ok) throw new Error(sd.error || 'فشل جلب الإحصائيات');
      setStats(sd); setPlatformStatus(pd.status || {});
    } catch (e) { setError(e.message || 'فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadStats(); }, []);

  async function generateDesigns() {
    setGenerating(true); setError('');
    try {
      const res = await fetch('/api/designs/generate', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'sports', count: 3 }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل التوليد');
      setDesigns((prev) => [...(data.designs || []), ...prev]); await loadStats();
    } catch (e) { setError(e.message || 'فشل التوليد'); } finally { setGenerating(false); }
  }

  const bestCategory = Object.entries(stats?.categoryCounts || {}).sort((a,b) => b[1] - a[1])[0];
  return <div className="min-h-screen bg-out-black p-4 md:p-6" dir="rtl">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div><h1 className="text-3xl md:text-4xl font-black gold-gradient mb-1">لوحة إنتاج الذكاء الاصطناعي</h1><p className="text-out-silver text-sm">OUT 2026 | AI Graphics Engine</p></div>
      <div className="flex gap-3"><button onClick={loadStats} disabled={loading} className="px-4 py-3 bg-out-card border border-out-border text-out-silver rounded-xl hover:border-out-gold"><RefreshCw className={loading ? 'w-5 h-5 animate-spin' : 'w-5 h-5'} /></button><button onClick={generateDesigns} disabled={generating} className="px-5 py-3 bg-gradient-to-r from-out-gold to-out-gold-light text-out-black font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">{generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}{generating ? 'جاري التوليد...' : 'توليد تصاميم'}</button></div>
    </div>
    {error && <div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <StatsCard icon={Sparkles} label="إجمالي التصاميم" value={stats?.designsTotal ?? '—'} color="gold" loading={loading}/>
      <StatsCard icon={Upload} label="تصاميم مرفوعة" value={stats?.stats?.designs_uploaded ?? '—'} color="green" loading={loading}/>
      <StatsCard icon={FolderOpen} label={'الفئة الأفضل: ' + (bestCategory?.[0] || '—')} value={bestCategory?.[1] ?? '—'} color="blue" loading={loading}/>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="lg:col-span-2 glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-out-gold"/>أحدث التصاميم</h2>
        {designs.length === 0 ? <div className="text-center py-12 text-out-silver/60"><Palette className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد تصاميم مولدة في هذه الجلسة.</p><p className="text-xs mt-2">الإحصائيات أعلاه تأتي مباشرة من قاعدة البيانات.</p></div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{designs.slice(0,9).map((d)=><div key={d.id || d.image_url} className="relative aspect-square rounded-xl overflow-hidden border border-out-border"><img src={d.image_url} alt={d.title || 'OUT design'} className="w-full h-full object-cover" loading="lazy"/></div>)}</div>}
      </motion.div>
      <div>
        <SuitcaseLock lockId="pod_sites" title="مواقع POD"><div className="space-y-2 max-h-80 overflow-y-auto">{Object.entries(platformStatus).map(([key,p])=><div key={key} className="bg-out-card border border-out-border rounded-lg p-3 flex justify-between items-center gap-3"><div><p className="text-white text-sm font-bold">{p.name}</p><p className="text-out-silver/60 text-xs">{p.description || p.apiType || 'منصة POD'}</p></div><span className={p.configured ? 'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400' : 'text-xs px-2 py-1 rounded-full bg-out-silver/20 text-out-silver'}>{p.configured ? 'مهيأ' : 'غير مهيأ'}</span></div>)}</div></SuitcaseLock>
        {stats?.countryRevenue && Object.keys(stats.countryRevenue).length > 0 && <div className="glass rounded-2xl p-5 mt-5"><div className="flex items-center gap-2 text-out-gold mb-3"><Globe className="w-5 h-5"/><h3 className="font-bold">الإيرادات حسب الدولة</h3></div>{Object.entries(stats.countryRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,revenue])=><div key={country} className="mb-3"><div className="flex justify-between text-sm text-out-silver mb-1"><span>{country}</span><span>{'$' + Number(revenue).toFixed(2)}</span></div></div>)}</div>}
      </div>
    </div>
  </div>;
}