import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCemFtb8_jg8j7GdrRHDRX4Gkbi_6LXgzg",
  authDomain: "finance-app-6fbb6.firebaseapp.com",
  projectId: "finance-app-6fbb6",
  storageBucket: "finance-app-6fbb6.firebasestorage.app",
  messagingSenderId: "446568245414",
  appId: "1:446568245414:web:15b3d9f1443bc7076f6c67"
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);