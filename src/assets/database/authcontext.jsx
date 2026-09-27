import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebaseconfig";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      const currentRequest = ++requestVersion;
      setUser(authUser);
      setRole(null);
      setIsLoading(true);

      if (!authUser) {
        if (active && currentRequest === requestVersion) setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getDoc(doc(db, "usuarios", authUser.uid));
        if (active && currentRequest === requestVersion) {
          setRole(userProfile.exists() ? userProfile.data().rol : null);
        }
      } catch (profileError) {
        console.error("No se pudo cargar el perfil de acceso:", profileError);
      } finally {
        if (active && currentRequest === requestVersion) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, isLoggedIn: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
