import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const registerRestaurant = async (email, password, businessName, location) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data = { role: 'restaurant', businessName, location, email, createdAt: Date.now(), rating: 0, totalOrders: 0 };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setProfile(data);
    return cred;
  };

  const registerCustomer = async (email, password, name, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data = { role: 'customer', name, phone, email, createdAt: Date.now(), totalSaved: 0, mealsRescued: 0 };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setProfile(data);
    return cred;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, registerRestaurant, registerCustomer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
