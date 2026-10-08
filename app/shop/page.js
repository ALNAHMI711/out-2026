'use client';

import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Globe } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CartDrawer, { addToCart } from '@/components/CartDrawer';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '🛍️' },
  { id: 'sports', name: 'رياضة', icon: '⚽' },
  { id: 'romantic', name: 'رومانسية', icon: '💕' },
  { id: 'animals', name: 'حيوانات', icon: '🐾' },
  { id: 'cars', name: 'سيارات', icon: '🚗' },
  { id: 'military', name: 'عسكرية', icon: '🎖️' },
  { id: 'kids', name: 'أطفال', icon: '🧒' },
];

function getCartCount(items) {
  return Array.isArray(items) ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
}

export default function ShopPage() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      setCartCount(getCartCount(JSON.parse(localStorage.getItem('out_cart_v1') || '[]')));
    } catch {
      setCartCount(0);
    }
    const update = (event) => setCartCount(getCartCount(event.detail?.items || []));
    window.addEventListener('out:cart-updated', update);
    return () => window.removeEventListener('out:cart-updated', update);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-out-black" dir="rtl">
      <header className="sticky top-0 z-30 glass border-b border-out-gold/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black gold-gradient">OUT 2026</h1>
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-out-silver" />
            <input type="search" placeholder="ابحث عن تصميم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-out-card border border-out-border rounded-full py-2 pr-12 pl-4 text-white placeholder-out-silver focus:outline-none focus:border-out-gold" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/')} className="p-2 bg-out-card border border-out-border rounded-lg text-out-gold hover:border-out-gold" aria-label="الرئيسية"><Globe className="w-4 h-4" /></button>
            <button type="button" onClick={() => setCartOpen(true)} className="relative p-2 bg-out-card border border-out-border rounded-lg text-out-gold hover:border-out-gold" aria-label="السلة">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-out-gold text-out-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>
        <div className="md:hidden px-6 pb-4 relative">
          <Search className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-out-silver" />
          <input type="search" placeholder="ابحث عن تصميم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-out-card border border-out-border rounded-xl py-2 pr-10 pl-4 text-white placeholder-out-silver focus:outline-none focus:border-out-gold" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {CATEGORIES.map((cat) => <button type="button" key={cat.id} onClick={() => setCategory(cat.id)} className={`flex-shrink-0 px-5 py-3 rounded-xl border transition flex items-center gap-2 ${category === cat.id ? 'bg-gradient-to-r from-out-gold to-out-gold-light text-out-black border-out-gold font-bold' : 'bg-out-card border-out-border text-white hover:border-out-gold'}`}><span>{cat.icon}</span>{cat.name}</button>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <ProductGrid category={category} search={search} onAddToCart={handleAddToCart} />
      </section>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); router.push('/checkout'); }} />
    </div>
  );
}
