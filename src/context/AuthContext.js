import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { initializeCategories } from "../services/categoryService";
import { auth } from "../services/firebaseConfig";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("userToken");

    if (token) {
      setUserToken(token);
      // Inicializar categorías cuando el usuario está autenticado
      await initializeCategories();
    }

    setLoading(false);
  };

  const login = async (token) => {
    await AsyncStorage.setItem("userToken", token);
    setUserToken(token);
    // Inicializar categorías después del login
    await initializeCategories();
  };

  const logout = async () => {
    await signOut(auth).catch(() => {});
    await AsyncStorage.removeItem("userToken");
    setUserToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
