'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const themes = {
  gold: 'border-out-gold/40 text-out-gold from-out-gold/15 to-transparent',
  green: 'border-green-500/40 text-green-400 from-green-500/15 to-transparent',
  blue: 'border-blue-500/40 text-blue-400 from-blue-500/15 to-transparent',
  purple: 'border-purple-500/40 text-purple-400 from-purple-500/15 to-transparent',
  red: 'border-red-500/40 text-red-400 from-red-500/15 to-transparent',
};

export default function StatsCard({ icon: Icon, label, value, trend = null, color = 'gold', delay = 0, loading = false }) {
  const theme = themes[color] || themes.gold;
  const textClass = theme.split(' ')[1];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${theme} p-5 backdrop-blur-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-out-silver text-xs mb-1 truncate">{label}</p>
          {loading ? <div className="h-9 w-24 bg-out-card rounded animate-pulse" /> :
            <p className="text-3xl font-black text-white truncate">{value ?? '—'}</p>}
          {trend !== null && !loading && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span><span className="text-out-silver/60">مقابل الأسبوع الماضي</span>
            </div>
          )}
        </div>
        {Icon && <div className={`w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center flex-shrink-0 ${textClass}`}>
          <Icon className="w-6 h-6" />
        </div>}
      </div>
      <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-current opacity-10 blur-3xl pointer-events-none ${textClass}`} />
    </motion.div>
  );
}