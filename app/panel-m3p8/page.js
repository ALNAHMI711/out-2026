'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, ShoppingCart, Instagram, Facebook, Youtube, Music, Share2, Bot, RefreshCw, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SuitcaseLock from '@/components/SuitcaseLock';
import SocialConfigManager from '@/components/SocialConfigManager';
const ICONS = { Instagram, Facebook, Youtube, Music, Share2 };

export default function AdminMarketingPage() {
  const [stats,setStats]=useState(null),[socialStatus,setSocialStatus]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  async function loadAll(){setLoading(true);setError('');try{const [a,b]=await Promise.all([fetch('/api/stats',{credentials:'include',cache:'no-store'}),fetch('/api/social/status',{credentials:'include',cache:'no-store'})]);const sd=await a.json().catch(()=>({})),soc=await b.json().catch(()=>({}));if(!a.ok)throw new Error(sd.error||'فشل تحميل الإحصائيات');if(!b.ok)throw new Error(soc.error||'فشل تحميل حالة المنصات');setStats(sd);setSocialStatus(soc.status||{});}catch(e){setError(e.message||'فشل تحميل البيانات')}finally{setLoading(false)}}
  useEffect(()=>{loadAll()},[]);
  const financial=stats?.financial||{};
  const socialCounts=useMemo(()=>{
    const values=Object.values(socialStatus);
    return {
      total: values.length,
      configured: values.filter((platform)=>platform.configured).length,
      automation: values.filter((platform)=>platform.configured&&platform.supportsAutomation).length
    };
  },[socialStatus]);
  const revenue=financial.totalRevenue;
  const profit=stats?.stats?.daily?.profit;
  const visitors=stats?.stats?.daily?.visitors;
  const orders=financial.totalOrders;
  return <div className="min-h-screen bg-out-black p-4 md:p-6" dir="rtl">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"><div><h1 className="text-3xl md:text-4xl font-black gold-gradient mb-1">لوحة الإدارة والتسويق</h1><p className="text-out-silver text-sm">OUT 2026 | Hyper-Automation OS</p></div><button onClick={loadAll} disabled={loading} aria-label="تحديث لوحة التسويق" className="px-4 py-3 bg-out-card border border-out-border text-out-silver rounded-xl hover:border-out-gold"><RefreshCw className={loading?'w-5 h-5 animate-spin':'w-5 h-5'}/></button></div>
    {error&&<div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

    {/* Four headline screens/cards; unavailable metrics are labelled honestly instead of fabricated. */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-3">
      <StatsCard icon={DollarSign} label="الأموال / إجمالي الإيرادات" value={revenue!=null?'$'+Number(revenue).toFixed(2):'—'} color="green" loading={loading}/>
      <StatsCard icon={TrendingUp} label="الأرباح الصافية" value={profit!=null?'$'+Number(profit).toFixed(2):'غير متاح'} color="gold" loading={loading}/>
      <StatsCard icon={Users} label="الزوار" value={visitors!=null?Number(visitors).toLocaleString('ar'): 'غير متاح'} color="blue" loading={loading}/>
      <StatsCard icon={ShoppingCart} label="المبيعات / الطلبات" value={orders!=null?Number(orders).toLocaleString('ar'):'—'} color="purple" loading={loading}/>
    </div>
    <p className="text-xs text-out-silver/70 mb-8">الأرباح والزوار لا تُحسب حاليًا: واجهة الإحصائيات لا توفر تكلفة المنتجات أو تكامل تحليلات الزيارات. رقم الطلبات يستثني الطلبات الملغاة والمستردة.</p>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{opacity:0}} animate={{opacity:1}}>
        <SuitcaseLock lockId="social_platforms" title="منصات التواصل — منطقة خاصة"><SocialConfigManager /></SuitcaseLock>
      </motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="lg:col-span-2 glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Share2 className="w-5 h-5 text-out-gold"/>منصات التواصل الاجتماعي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">{Object.entries(socialStatus).map(([key,s])=>{const Icon=ICONS[s.icon]||Share2;return <div key={key} className="bg-out-card border border-out-border rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Icon className="w-8 h-8 text-out-gold"/><div><h3 className="text-white font-bold">{s.name}</h3><p className="text-out-silver text-xs">{s.configured?'مفاتيح البيئة موجودة':'يحتاج إعداد'}</p></div></div><span className={s.supportsAutomation?'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400':'text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400'}>{s.supportsAutomation?'يدعم API':'قد يتطلب تكاملًا إضافيًا'}</span></div>})}</div>
        <div className="bg-gradient-to-br from-out-gold/20 to-transparent border border-out-gold/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3"><Bot className="w-8 h-8 text-out-gold"/><div><h3 className="text-white font-bold">بوت التسويق التلقائي</h3><p className="text-amber-300 text-xs">غير مفعّل — واجهة الحالة فقط</p></div></div>
          <p className="text-out-silver text-sm mb-3">لم يتم ربط جدولة الحملات أو النشر الآلي بمشغّل خلفي في هذه الصفحة. لن ندّعي تنفيذ النشر قبل وجود تكامل فعلي ومفاتيح صالحة.</p>
          <div className="flex items-center gap-2 text-xs text-out-silver/80"><Activity className="w-4 h-4"/>حالة الإعداد: {socialCounts.configured} من {socialCounts.total} منصات لديها مفاتيح بيئة.</div>
        </div>
      </motion.div>
    </div>

    <div className="glass rounded-2xl p-6 mt-6">
      <h2 className="text-xl font-bold text-white mb-4">🌍 أفضل الدول مبيعاً</h2>
      {stats?.countryRevenue&&Object.keys(stats.countryRevenue).length>0 ? Object.entries(stats.countryRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,amount])=><div key={country} className="flex justify-between py-3 border-b border-out-border/50 text-sm"><span className="text-white">{country}</span><span className="text-out-gold font-bold">{'$'+Number(amount).toFixed(2)}</span></div>) : <p className="text-sm text-out-silver/70 py-3">لا توجد بيانات مبيعات حسب الدولة حتى الآن.</p>}
    </div>
  </div>;
}
