import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useData';
import { useAppContext } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import { Product } from '../types';
import { ProductSkeleton, CategorySkeleton } from '../components/Skeleton';
import ProductCard from '../components/ProductCard';

const IMAGES = {
  hero: "https://lh3.googleusercontent.com/aida/ADBb0uh7L9P2M6Kk9L0_D6c_xJ_Z_R_K_Y_W_P_L_Y_W_P_L_Y_W_P_L_Y_W_P_L", // Placeholder if not found
  autumn: "https://lh3.googleusercontent.com/aida/ADBb0ugepjQaXljnUR7WRHCi9bjT-gSW1VD93hSEfHTzWldq2nnDKMtK5D1U58bqgR5Uc7Yuu2bNoR00-I6Ghy3K-Avl1HlGdTfkSvEx-V0k1uO3pA_Nt0GfS2GqG2eJNkiLXq4YL-C0QDezMT-C0JydFkEsXS62Po5QdM259YqRZF_ugNP7RRxwaTESKexEOnRL2Z7cJJ7eh2dwcPzxxQK2ABALjKCztSU8gaZR91o_ay871gfwux7tdyIQJbuE6KJ2-JBc6sebBbMPVQ",
  dolenga: "https://lh3.googleusercontent.com/aida/ADBb0uh61mtIFxacblFU2-Zru9FzSgEDryN4NkNm5uRPld9Hm0eOunRppsbWIcZyCp2PHie4m_ijO_5fI81cUm3XR0Tv92c1Lqkfc9Y4Ek0maA_xafflF5_lNtTcRRQKCoxX5oIhB8WRE0dFdqLLmb575bKIiQ_G7TEexeJVGWAWOHS0vfiM3ysUeM0XLyoeBTuy-m95ck4q6bJ2PbV3WBWVuoF6Yo_-3SYN-TBv2gjQOt9rtV6OXQRziDAIr4jfabuWZd3b6dW3YWRjdw",
  summer: "https://lh3.googleusercontent.com/aida/ADBb0ugepjQaXljnUR7WRHCi9bjT-gSW1VD93hSEfHTzWldq2nnDKMtK5D1U58bqgR5Uc7Yuu2bNoR00-I6Ghy3K-Avl1HlGdTfkSvEx-V0k1uO3pA_Nt0GfS2GqG2eJNkiLXq4YL-C0QDezMT-C0JydFkEsXS62Po5QdM259YqRZF_ugNP7RRxwaTESKexEOnRL2Z7cJJ7eh2dwcPzxxQK2ABALjKCztSU8gaZR91o_ay871gfwux7tdyIQJbuE6KJ2-JBc6sebBbMPVQ"
};

export default function Home() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();
  const { addToBag, toggleWishlist, isInWishlist } = useAppContext();
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  const trendingProducts = products.filter(p => p.isTrending);
  const newArrivals = products.filter(p => p.isNewArrival);

  const trendingRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      trendingRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-brand-bone overflow-x-hidden">
      {/* Hero Section - Reload Cinematic */}
      <section ref={heroRef} className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">
        {/* MAIN IMAGE */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 w-full h-full flex items-center justify-center"
        >
          <img 
            src="https://i.ibb.co/1hBp929/13733681-2435-4874-8009-331bfceb1b58.jpg" 
            alt="Reload Hero"
            className="w-full h-full object-contain"
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </motion.div>

        {/* HERO CONTENT */}
        <div className="absolute bottom-20 w-full z-10 flex flex-col items-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <p className="text-white text-[13px] md:text-sm uppercase tracking-[0.3em] font-medium mb-8">
              PREMIUM MENSWEAR
            </p>
            <button 
              onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-3 rounded-full bg-white text-black font-bold uppercase text-[11px] tracking-[0.15em] shadow-2xl hover:bg-black hover:text-white transition-all duration-500 active:scale-95"
            >
              SHOP NOW
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10"
        >
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
        </motion.div>
      </section>

      {/* Categories - Refined Round */}
      <section id="categories" className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-6 md:mb-12">
             <h2 className="text-[10px] md:text-sm font-sans uppercase tracking-[0.4em] font-bold text-zinc-400 mb-2 md:mb-4">Curated Selections</h2>
             <div className="w-8 md:w-12 h-px bg-zinc-200"></div>
          </div>
          
          <div className="flex overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-12 pb-2 scrollbar-none snap-x snap-mandatory">
            {categoriesLoading ? (
               Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
                categories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex-none w-28 md:w-auto snap-center"
                  >
                    <Link to={`/category/${category.id}`} className="group flex flex-col items-center">
                      <div className="aspect-square w-full rounded-full bg-brand-sand mb-3 md:mb-6 relative overflow-hidden border border-zinc-50 group-hover:shadow-xl transition-shadow duration-500">
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <h4 className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-zinc-500 group-hover:text-black transition-colors text-center">{category.name}</h4>
                    </Link>
                  </motion.div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Trending Section - Horizontal Carousel */}
      <section id="trending" className="py-8 md:py-16 overflow-hidden bg-brand-bone border-y border-zinc-50">
        <div className="max-w-7xl mx-auto px-6 mb-6 md:mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-5xl font-serif text-zinc-900 mb-1 md:mb-4 uppercase tracking-tight">Trending</h2>
            <p className="text-[8px] md:text-[11px] text-zinc-400 uppercase tracking-widest font-bold">Featured Pieces</p>
          </div>
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => scrollTrending('left')}
              className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => scrollTrending('right')}
              className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div 
            ref={trendingRef}
            className="flex gap-4 md:gap-8 overflow-x-auto pb-4 md:pb-10 scrollbar-none snap-x snap-mandatory"
          >
            {productsLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex-none w-[160px] md:w-[280px]">
                   <ProductSkeleton />
                 </div>
               ))
            ) : (
                trendingProducts.map((item) => (
                  <div key={item.id} className="flex-none w-[160px] md:w-[280px] snap-center">
                    <ProductCard product={item} />
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Full Width Banner with Animation */}
      <section className="relative w-full h-[60vh] md:h-[90vh] bg-black overflow-hidden flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <img 
            src="https://i.pinimg.com/736x/18/22/96/182296e7cfa5cd168a47a34e872b82e1.jpg" 
            alt="Modern Luxury"
            className="w-full h-full object-cover"
          />
          {/* Elegant Dark Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-brightness-75"></div>
        </motion.div>
        
        <div className="relative z-10 flex flex-col items-center justify-center text-white text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <h3 className="text-4xl md:text-8xl font-serif mb-6 md:mb-10 leading-tight tracking-tight max-w-4xl">
              Modern Luxury <br className="md:hidden" /> Redefined
            </h3>
            <button 
              onClick={() => navigate('/shop')}
              className="bg-white text-black px-10 py-4 uppercase text-[10px] font-bold tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-500 shadow-2xl rounded-full"
            >
              Discover More
            </button>
          </motion.div>
        </div>
      </section>

      {/* New Arrivals - Grid / Horizontal Mobile */}
      <section id="new-arrivals" className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center mb-8 md:mb-20">
             <h2 className="text-2xl md:text-6xl font-serif text-center uppercase mb-3 tracking-tighter">New Arrivals</h2>
             <div className="w-12 h-px bg-black"></div>
          </div>

          <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-8 md:gap-y-12 pb-6 md:pb-12 scrollbar-none snap-x snap-mandatory">
            {productsLoading ? (
               Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
                newArrivals.slice(0, 8).map((product) => (
                  <div key={product.id} className="flex-none w-[160px] md:w-auto snap-center">
                    <ProductCard product={product} />
                  </div>
                ))
            )}
          </div>

          <div className="mt-6 md:mt-20 flex justify-center">
             <Link to="/shop" className="btn-secondary px-8 py-3 text-[10px]">View All Items</Link>
          </div>
        </div>
      </section>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-[111] bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Reuse Detailed View Content from before or keep simplified as requested */}
              <div className="flex-1 bg-brand-sand overflow-y-auto scrollbar-none">
                 <div className="grid grid-cols-1 gap-1">
                    {selectedProduct.images.map((img, idx) => (
                       <img key={idx} src={img} alt={selectedProduct.name} className="w-full h-screen object-cover" />
                    ))}
                 </div>
              </div>
              <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center overflow-y-auto scrollbar-none bg-white">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-8 right-8 z-20 w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
                <div className="max-w-md mx-auto w-full">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-6 block">Premium Edition</span>
                  <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">{selectedProduct.name}</h2>
                  <p className="text-3xl font-serif text-zinc-400 mb-10">{formatINR(selectedProduct.price)}</p>
                  
                  <div className="mb-12">
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-6 block border-b border-zinc-100 pb-2">Description</span>
                    <p className="text-zinc-500 leading-loose text-sm font-light">
                       {selectedProduct.description}
                    </p>
                  </div>

                  <div className="mb-12">
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-6 block">Size Selection</span>
                    <div className="flex flex-wrap gap-4">
                      {['S', 'M', 'L', 'XL', '2XL'].map((s) => (
                        <button 
                          key={s} 
                          onClick={() => setSelectedSize(s)}
                          className={`w-14 h-14 border flex items-center justify-center text-[11px] font-bold transition-all ${selectedSize === s ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 btn-primary py-7" onClick={() => {
                          addToBag(selectedProduct, selectedSize);
                          setSelectedProduct(null);
                    }}>Add to Bag</button>
                    <button 
                      onClick={() => toggleWishlist(selectedProduct)}
                      className={`w-20 h-20 border shrink-0 flex items-center justify-center transition-all ${isInWishlist(selectedProduct.id) ? 'bg-black border-black text-white' : 'border-zinc-200 hover:border-black'}`}
                    >
                      <Heart size={24} fill={isInWishlist(selectedProduct.id) ? "currentColor" : "none"} strokeWidth={1} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
