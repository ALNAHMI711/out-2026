'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, Eye, EyeOff, Plus, AlertCircle } from 'lucide-react';

const LOCK_LENGTH = 10;

export default function SuitcaseLock({ lockId, title = 'قفل الأمان', items = [], onAddItem, onUnlock, children }) {
  const [code, setCode] = useState(Array(LOCK_LENGTH).fill(''));
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState(null);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!isOpen && isVisible) inputsRef.current[0]?.focus();
  }, [isOpen, isVisible]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code]; next[index] = value; setCode(next); setError('');
    if (value && index < LOCK_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'Enter') handleUnlock();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LOCK_LENGTH);
    if (!pasted) return;
    const next = Array(LOCK_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next); setError('');
    inputsRef.current[Math.min(pasted.length, LOCK_LENGTH - 1)]?.focus();
    e.preventDefault();
  };

  async function handleUnlock() {
    const password = code.join('');
    if (password.length !== LOCK_LENGTH) return setError('أدخل 10 أرقام كاملة');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/locks/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || 'رمز خاطئ'); setCode(Array(LOCK_LENGTH).fill('')); inputsRef.current[0]?.focus(); return;
      }
      setSessionToken(data.sessionToken || null); setIsOpen(true); onUnlock?.(data.sessionToken);
    } catch { setError('فشل الاتصال'); }
    finally { setLoading(false); }
  }

  const handleClose = () => { setIsOpen(false); setSessionToken(null); setCode(Array(LOCK_LENGTH).fill('')); };
  const handleHide = () => { handleClose(); setIsVisible(false); };

  if (!isVisible) return (
    <button onClick={() => setIsVisible(true)} className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-out-gold to-out-gold-light text-out-black shadow-gold-lg flex items-center justify-center hover:scale-110 transition" title="إظهار القفل">
      <Eye className="w-6 h-6" />
    </button>
  );

  return (
    <div className="glass rounded-2xl p-6 border border-out-gold/30 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">{isOpen ? <Unlock className="w-6 h-6 text-green-400" /> : <Lock className="w-6 h-6 text-out-gold" />}<h3 className="text-xl font-bold text-white">{title}</h3></div>
        <button onClick={handleHide} className="text-out-silver hover:text-red-400 transition" title="إخفاء القفل"><EyeOff className="w-5 h-5" /></button>
      </div>
      {!isOpen && <>
        <div className="flex flex-wrap justify-center gap-1.5 mb-5" dir="ltr" onPaste={handlePaste}>
          {code.map((digit, i) => <input key={i} ref={(el) => (inputsRef.current[i] = el)} type="password" inputMode="numeric" maxLength={1} value={digit}
            onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} disabled={loading}
            aria-label={`رقم ${i + 1}`} className="w-9 h-12 text-center text-xl font-bold bg-out-card border-2 border-out-border rounded-lg text-out-gold focus:border-out-gold focus:outline-none focus:shadow-gold transition disabled:opacity-50" />)}
        </div>
        {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm justify-center mb-4"><AlertCircle className="w-4 h-4" />{error}</motion.div>}
        <button onClick={handleUnlock} disabled={loading || code.some((d) => !d)} className="w-full bg-gradient-to-r from-out-gold to-out-gold-light text-out-black font-bold py-3 rounded-lg hover:shadow-gold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? <div className="w-5 h-5 border-2 border-out-black border-t-transparent rounded-full animate-spin" /> : <><Unlock className="w-5 h-5" />فتح</>}
        </button>
      </>}
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-out-gold/30 pt-4">
        {children || <div className="space-y-2 max-h-64 overflow-y-auto">{items.length === 0 ? <p className="text-out-silver/50 text-sm text-center py-4">لا توجد عناصر بعد</p> : items.map((item, i) => <div key={i} className="bg-out-card border border-out-border rounded-lg p-3 flex justify-between items-center"><span className="text-white text-sm">{item.name}</span><span className="text-out-gold text-xs">{item.value}</span></div>)}</div>}
        {onAddItem && <button onClick={() => onAddItem(sessionToken)} className="w-full mt-3 bg-out-card border border-dashed border-out-gold/50 text-out-gold py-2 rounded-lg hover:bg-out-gold/10 transition flex items-center justify-center gap-2"><Plus className="w-4 h-4" />إضافة عنصر جديد</button>}
        <button onClick={handleClose} className="w-full mt-3 bg-red-600/20 border border-red-600/50 text-red-400 py-2 rounded-lg hover:bg-red-600/30 transition flex items-center justify-center gap-2"><X className="w-4 h-4" />إغلاق وإخفاء</button>
      </motion.div>}</AnimatePresence>
    </div>
  );
}