import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, WishlistItem } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query,
  getDocs,
  writeBatch
} from 'firebase/firestore';

interface AppContextType {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  addToBag: (product: Product, size: string) => void;
  updateQuantity: (cartItemId: string, change: number) => void;
  removeFromBag: (cartItemId: string) => void;
  clearCart: () => Promise<void>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  cartTotalCount: number;
  cartSubtotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('wishlistItems');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync Cart with Firestore
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return;
    }

    const cartRef = collection(db, 'users', user.uid, 'cart');
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as CartItem);
      setCartItems(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Wishlist with Firestore
  useEffect(() => {
    if (!user) {
      localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
      return;
    }

    const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
    const unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as WishlistItem);
      setWishlistItems(items);
    });

    return () => unsubscribe();
  }, [user]);

  const addToBag = async (product: Product, size: string) => {
    const cartItemId = `${product.id}-${size}`;
    const existing = cartItems.find((item) => item.cartItemId === cartItemId);
    
    const newItem: CartItem = existing 
      ? { ...existing, quantity: existing.quantity + 1 }
      : { 
          id: product.id, 
          cartItemId, 
          name: product.name, 
          price: product.price, 
          image: product.images[0], 
          size, 
          quantity: 1 
        };

    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'cart', cartItemId), newItem);
    } else {
      setCartItems(prev => {
        if (existing) {
          return prev.map(item => item.cartItemId === cartItemId ? newItem : item);
        }
        return [...prev, newItem];
      });
    }
    setCartOpen(true);
  };

  const updateQuantity = async (cartItemId: string, change: number) => {
    const item = cartItems.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) return;

    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'cart', cartItemId), {
        ...item,
        quantity: newQuantity
      });
    } else {
      setCartItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i));
    }
  };

  const removeFromBag = async (cartItemId: string) => {
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItemId));
    } else {
      setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    }
  };

  const clearCart = async () => {
    if (user) {
      const batch = writeBatch(db);
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snapshot = await getDocs(cartRef);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else {
      setCartItems([]);
      localStorage.removeItem('cartItems');
    }
  };

  const toggleWishlist = async (product: Product) => {
    const existing = wishlistItems.find(item => item.id === product.id);
    
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'wishlist', product.id);
      if (existing) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]
        });
      }
    } else {
      setWishlistItems(prev => {
        if (existing) {
          return prev.filter(item => item.id !== product.id);
        }
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]
        }];
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cartOpen,
        setCartOpen,
        searchOpen,
        setSearchOpen,
        cartItems,
        wishlistItems,
        addToBag,
        updateQuantity,
        removeFromBag,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartTotalCount,
        cartSubtotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
