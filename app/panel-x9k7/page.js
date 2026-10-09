'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, FolderOpen, Sparkles, Globe, RefreshCw, Loader2, AlertCircle, Settings, X, Save, ArrowRight, LockKeyhole } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SuitcaseLock from '@/components/SuitcaseLock';
import PodConfigManager from '@/components/PodConfigManager';
import ApiKeySettings from '@/components/ApiKeySettings';

const EMPTY_SETTINGS = { brandLogo: '', brandTitle: '', email: '' };

export default function AdminProductionPage() {
  const [stats, setStats] = useState(null);
  const [designs, setDesigns] = useState([]), [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false), [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false), [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [settingsLockToken, setSettingsLockToken] = useState('');
  const [settingsPassword, setSettingsPassword] = useState(''), [settingsError, setSettingsError] = useState('');
  const [settings, setSettings] = useState(EMPTY_SETTINGS), [settingsNotice, setSettingsNotice] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const passwordRef = useRef(null);

  async function loadStats() {
    setLoading(true); setError('');
    try {
      const statsRes = await fetch('/api/stats', { credentials: 'include', cache: 'no-store' });
      const sd = await statsRes.json().catch(() => ({}));
      if (!statsRes.ok) throw new Error(sd.error || 'فشل جلب الإحصائيات');
      setStats(sd);
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

  async function openSettings() {
    setSettingsError(''); setSettingsNotice(''); setSettingsPassword(''); setSettingsUnlocked(false); setSettingsOpen(true);
    try {
      const response = await fetch('/api/brand-settings', { credentials: 'include', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'تعذر تحميل إعدادات العلامة التجارية');
      setSettings({ ...EMPTY_SETTINGS, ...(data.settings || {}) });
    } catch (e) { setSettingsError(e.message || 'تعذر تحميل الإعدادات'); }
  }

  async function unlockSettings(event) {
    event.preventDefault();
    setSettingsError('');
    try {
      // Validate against the server-side lock configuration rather than exposing the code in client JS.
      const response = await fetch('/api/locks/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ lockId: 'pod_sites', password: settingsPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setSettingsError(data.error || 'كلمة السر غير صحيحة');
        return;
      }
      setSettingsUnlocked(true);
      setSettingsLockToken(data.sessionToken || '');
      setSettingsPassword('');
      setSettingsNotice('');
    } catch {
      setSettingsError('تعذر التحقق من كلمة السر. تحقق من الاتصال وحاول مجددًا.');
    }
  }

  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSettingsNotice('');
  }

  async function saveSettings(event) {
    event.preventDefault(); setSettingsSaving(true); setSettingsError(''); setSettingsNotice('');
    try {
      const response = await fetch('/api/brand-settings', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Lock-Session': settingsLockToken }, body: JSON.stringify({ brandTitle: settings.brandTitle, email: settings.email, brandLogo: settings.brandLogo }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ الإعدادات');
      setSettings({ ...EMPTY_SETTINGS, ...(data.settings || {}) }); setSettingsNotice('تم حفظ الإعدادات في قاعدة البيانات.');
    } catch (e) { setSettingsError(e.message || 'تعذر الحفظ'); }
    finally { setSettingsSaving(false); }
  }

  async function uploadBrandLogo(event) {
    const file = event.target.files && event.target.files[0]; if (!file) return;
    if (!['image/png','image/jpeg','image/webp',].includes(file.type)) { setSettingsError('الصيغ المسموحة PNG/JPEG/WEBP'); return; }
    if (file.size > 2 * 1024 * 1024) { setSettingsError('الحد الأقصى للصورة 2 ميغابايت'); return; }
    setSettingsSaving(true); setSettingsError(''); setSettingsNotice('');
    try {
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const response = await fetch('/api/brand-settings', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Lock-Session': settingsLockToken }, body: JSON.stringify({ logoDataUrl: dataUrl }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'فشل رفع الشعار');
      setSettings(current => ({ ...current, ...(data.settings || {}) })); setSettingsNotice('تم رفع الشعار وحفظ رابطه في قاعدة البيانات.');
    } catch (e) { setSettingsError(e.message || 'فشل رفع الشعار'); }
    finally { setSettingsSaving(false); event.target.value = ''; }
  }

  function closeSettings() {
    setSettingsOpen(false); setSettingsUnlocked(false); setSettingsLockToken(''); setSettingsPassword('');
    setSettingsError(''); setSettingsNotice('');
  }

  const bestCategory = Object.entries(stats?.categoryCounts || {}).sort((a,b) => b[1] - a[1])[0];
  return <div className="min-h-screen bg-out-black p-4 md:p-6" dir="rtl">
    <nav aria-label="تنقل الإدارة" className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-out-gold/25 bg-out-card/80 p-3">
      <Link href="/panel-x9k7" className="rounded-xl border border-out-gold/40 px-4 py-2 text-sm font-bold text-out-gold hover:bg-out-gold/10">🎨 لوحة الإنتاج</Link>
      <Link href="/panel-m3p8" className="rounded-xl border border-out-gold/40 px-4 py-2 text-sm font-bold text-out-gold hover:bg-out-gold/10">📣 لوحة التسويق</Link>
      <Link href="/shop" className="rounded-xl border border-out-border px-4 py-2 text-sm text-out-silver hover:border-out-gold hover:text-out-gold">🛒 المتجر</Link>
      <Link href="/" className="mr-auto rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">🚪 خروج</Link>
    </nav>
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div><h1 className="text-3xl md:text-4xl font-black gold-gradient mb-1">لوحة إنتاج الذكاء الاصطناعي</h1><p className="text-out-silver text-sm">OUT 2026 | AI Graphics Engine</p></div>
      <div className="flex flex-wrap gap-3">
        <button onClick={loadStats} disabled={loading} aria-label="تحديث الإحصائيات" className="px-4 py-3 bg-out-card border border-out-border text-out-silver rounded-xl hover:border-out-gold"><RefreshCw className={loading ? 'w-5 h-5 animate-spin' : 'w-5 h-5'} /></button>
        <button onClick={generateDesigns} disabled={generating} className="px-5 py-3 bg-gradient-to-r from-out-gold to-out-gold-light text-out-black font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">{generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}{generating ? 'جاري التوليد...' : 'توليد تصاميم'}</button>
        <button onClick={openSettings} className="px-5 py-3 bg-out-card border border-out-gold/70 text-out-gold font-bold rounded-xl flex items-center gap-2 hover:bg-out-gold/10 transition"><Settings className="w-5 h-5" />الإعدادات العليا</button>
      </div>
    </div>

    {settingsOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6" role="dialog" aria-modal="true" aria-labelledby="top-settings-title" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSettings(); }}>
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-out-gold/50 bg-out-black shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-out-gold/25">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-out-gold/10 flex items-center justify-center"><Settings className="w-6 h-6 text-out-gold" /></div><div><h2 id="top-settings-title" className="text-xl font-black text-white">الإعدادات العليا</h2><p className="text-xs text-out-silver mt-1">إعدادات العلامة التجارية وحسابات POD</p></div></div>
          <button onClick={closeSettings} className="p-2 rounded-lg text-out-silver hover:text-white hover:bg-white/10" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        {!settingsUnlocked ? <form onSubmit={unlockSettings} className="p-5 md:p-7">
          <div className="mx-auto max-w-md text-center">
            <LockKeyhole className="w-12 h-12 text-out-gold mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">التحقق من كلمة السر</h3>
            <p className="text-sm text-out-silver mb-5">أدخل كلمة السر لفتح إعدادات الإدارة العليا.</p>
            <input ref={passwordRef} autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={settingsPassword} onChange={(event) => setSettingsPassword(event.target.value)} className="w-full rounded-xl border border-out-border bg-out-card px-4 py-3 text-center text-white tracking-widest outline-none focus:border-out-gold" placeholder="كلمة السر" aria-label="كلمة السر" />
            {settingsError && <p role="alert" className="mt-3 text-sm text-red-400">{settingsError}</p>}
            <div className="flex gap-3 mt-5"><button type="button" onClick={closeSettings} className="flex-1 rounded-xl border border-out-border px-4 py-3 text-out-silver hover:border-out-gold">رجوع</button><button type="submit" disabled={!settingsPassword || settingsSaving} className="flex-1 rounded-xl bg-gradient-to-r from-out-gold to-out-gold-light px-4 py-3 font-bold text-out-black disabled:opacity-50">تحقق وفتح</button></div>
          </div>
        </form> : <form onSubmit={saveSettings} className="p-5 md:p-7 space-y-5">
          <div><label htmlFor="brand-logo-file" className="block text-sm font-bold text-out-silver mb-2">شعار البراند</label><label className="inline-flex items-center gap-2 rounded-xl border border-out-gold/60 bg-out-card px-4 py-3 text-out-gold font-bold cursor-pointer"><Upload className="w-5 h-5" />📤 رفع صورة<input id="brand-logo-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadBrandLogo} disabled={settingsSaving} className="sr-only" /></label>{settings.brandLogo && <div className="mt-3 flex items-center gap-3"><Image unoptimized src={settings.brandLogo} alt="معاينة شعار البراند" width={80} height={80} className="h-20 w-20 rounded-xl border border-out-border bg-white object-contain p-2" /><span className="text-xs text-green-400 break-all">رابط الصورة محفوظ</span></div>}<p className="mt-2 text-xs text-out-silver/70">PNG/JPEG/WEBP — حتى 2 ميغابايت.</p></div>
          <div><label htmlFor="brand-title" className="block text-sm font-bold text-out-silver mb-2">عنوان البراند</label><input id="brand-title" type="text" value={settings.brandTitle} onChange={(event) => updateSetting('brandTitle', event.target.value)} maxLength={120} placeholder="OUT PREMIUM CRAFTSMANSHIP & APEX" className="w-full rounded-xl border border-out-border bg-out-card px-4 py-3 text-white outline-none focus:border-out-gold" /></div>
          <div><label htmlFor="brand-email" className="block text-sm font-bold text-out-silver mb-2">البريد الإلكتروني</label><input id="brand-email" type="email" value={settings.email} onChange={(event) => updateSetting('email', event.target.value)} maxLength={254} placeholder="you@example.com" className="w-full rounded-xl border border-out-border bg-out-card px-4 py-3 text-white outline-none focus:border-out-gold" /></div>
          <ApiKeySettings />
          {settingsError && <p role="alert" className="text-sm text-red-400">{settingsError}</p>}
          {settingsNotice && <p role="status" className="text-sm text-green-400">{settingsNotice}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2"><button type="submit" disabled={settingsSaving} className="flex-1 rounded-xl bg-gradient-to-r from-out-gold to-out-gold-light px-4 py-3 font-bold text-out-black flex items-center justify-center gap-2 disabled:opacity-50"><Save className="w-5 h-5" />{settingsSaving ? 'جاري الحفظ...' : 'حفظ'}</button><button type="button" onClick={() => { setSettingsUnlocked(false); setSettingsPassword(''); setSettingsError(''); setSettingsNotice(''); }} className="rounded-xl border border-out-border px-4 py-3 text-out-silver hover:border-out-gold flex items-center justify-center gap-2"><ArrowRight className="w-4 h-4" />رجوع</button><button type="button" onClick={closeSettings} className="rounded-xl border border-red-500/40 px-4 py-3 text-red-300 hover:bg-red-500/10">إخفاء</button></div>
        </form>}
      </motion.div>
    </div>}

    {error && <div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <StatsCard icon={Sparkles} label="إجمالي التصاميم" value={stats?.designsTotal ?? '—'} color="gold" loading={loading}/>
      <StatsCard icon={Upload} label="تصاميم مرفوعة" value={stats?.stats?.designs_uploaded ?? '—'} color="green" loading={loading}/>
      <StatsCard icon={FolderOpen} label={'الفئة الأفضل: ' + (bestCategory?.[0] || '—')} value={bestCategory?.[1] ?? '—'} color="blue" loading={loading}/>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="lg:col-span-2 glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-out-gold"/>أحدث التصاميم</h2>
        {designs.length === 0 ? <div className="text-center py-12 text-out-silver/60"><Palette className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>لا توجد تصاميم مولدة في هذه الجلسة.</p><p className="text-xs mt-2">الإحصائيات أعلاه تأتي مباشرة من قاعدة البيانات.</p></div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{designs.slice(0,9).map((d)=><div key={d.id || d.image_url} className="relative aspect-square rounded-xl overflow-hidden border border-out-border"><Image src={d.image_url} alt={d.title || 'OUT design'} fill sizes="(max-width: 1024px) 50vw, 66vw" className="object-cover" loading="lazy"/></div>)}</div>}
      </motion.div>
      <div>
        <SuitcaseLock lockId="pod_sites" title="مواقع POD"><PodConfigManager /></SuitcaseLock>
        {stats?.countryRevenue && Object.keys(stats.countryRevenue).length > 0 && <div className="glass rounded-2xl p-5 mt-5"><div className="flex items-center gap-2 text-out-gold mb-3"><Globe className="w-5 h-5"/><h3 className="font-bold">الإيرادات حسب الدولة</h3></div>{Object.entries(stats.countryRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,revenue])=><div key={country} className="mb-3"><div className="flex justify-between text-sm text-out-silver mb-1"><span>{country}</span><span>{'$' + Number(revenue).toFixed(2)}</span></div></div>)}</div>}
      </div>
    </div>
  </div>;
}
