import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

import { ADMIN_EMAIL } from '../constants';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  syncAccount: (user: User, additionalData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  logout: async () => {},
  loginWithGoogle: async () => {},
  syncAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync user data to Firestore
  const syncAccount = async (user: User, additionalData: any = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const basicData = {
        uid: user.uid,
        name: user.displayName || additionalData.name || 'Anonymous',
        email: user.email || additionalData.email || '',
        phone: user.phoneNumber || additionalData.phone || '',
        updatedAt: serverTimestamp(),
      };

      if (!userDoc.exists()) {
        // First login: create user document
        await setDoc(userRef, {
          ...basicData,
          totalOrders: 0,
          totalSpent: 0,
          role: 'customer',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log("New user created in Firestore:", user.uid);
      } else {
        // Subsequent logins: update last login time and basic info
        await setDoc(userRef, {
          ...basicData,
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("User lastLogin synced to Firestore:", user.uid);
      }
    } catch (error) {
      console.error("Error syncing user to Firestore:", error);
      // Don't throw here to avoid blocking the whole app if sync fails
    }
  };

  useEffect(() => {
    // Handle redirect result on mount
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        syncAccount(result.user);
      }
    }).catch((error) => {
      console.error("Error handling redirect result:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        syncAccount(user);
        // First check hardcoded email for immediate access
        const isAuthAdmin = user.email === ADMIN_EMAIL;
        
        if (isAuthAdmin) {
          setIsAdmin(true);
        } else {
          try {
            // Check both admins collection (legacy) and role field in users collection
            const [adminDoc, userDoc] = await Promise.all([
              getDoc(doc(db, 'admins', user.uid)),
              getDoc(doc(db, 'users', user.uid))
            ]);
            
            const hasAdminRole = userDoc.exists() && userDoc.data().role === 'admin';
            setIsAdmin(adminDoc.exists() || hasAdminRole);
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      console.log("Attempting Google Sign-In with Popup...", { authDomain: auth.config.authDomain });
      const result = await signInWithPopup(auth, provider);
      console.log("Google Sign-In Popup Success:", result.user.uid);
      if (result.user) {
        await syncAccount(result.user);
      }
    } catch (error: any) {
      console.warn("Popup login failed or was blocked:", error.code, error.message);
      
      // Handle potential cross-origin or popup blocked errors
      if (
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/network-request-failed' ||
        error.code === 'auth/internal-error' ||
        error.code === 'auth/web-storage-unsupported'
      ) {
        try {
          console.log("Attempting Google Sign-In with Redirect...");
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("Redirect login failed:", redirectError.code, redirectError.message);
          throw redirectError;
        }
      } else {
        console.error("Critical Google Sign-In Error:", error.code, error.message);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout, loginWithGoogle, syncAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
