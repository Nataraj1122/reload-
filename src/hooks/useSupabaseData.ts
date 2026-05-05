import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';

export function useSupabaseCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setCategories(data.map(cat => ({
          id: cat.id,
          name: cat.name,
          image: cat.image_url
        })));
      } catch (error) {
        console.error("Error fetching Supabase categories:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return { categories, loading };
}

export function useSupabaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name || 'Untitled Product',
          price: p.price || 0,
          categoryId: p.category_id || p.category || 'all',
          images: p.image_url ? [p.image_url] : [],
          description: p.description || '',
          stock: p.stock_quantity || 0,
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          isTrending: p.is_trending || false,
          isNewArrival: p.is_new_arrival ?? true
        })));
      } catch (error) {
        console.error("Error fetching Supabase products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return { products, loading };
}
