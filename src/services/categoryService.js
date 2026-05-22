import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', color: '#FF6B6B' },
  { name: 'Transporte', color: '#4ECDC4' },
  { name: 'Entretenimiento', color: '#45B7D1' },
  { name: 'Salud', color: '#FFA07A' },
  { name: 'Educación', color: '#98D8C8' },
  { name: 'Compras', color: '#F7DC6F' },
  { name: 'Servicios', color: '#BB8FCE' },
  { name: 'Utilidades', color: '#85C1E2' },
  { name: 'Otros', color: '#A3A3A3' },
];

/**
 * Inicializar categorías por defecto en Firestore
 * Se ejecuta una sola vez cuando la app inicia
 */
export const initializeCategories = async () => {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    
    // Si ya existen categorías, no hacer nada
    if (!snap.empty) {
      return;
    }

    // Crear categorías por defecto
    for (const category of DEFAULT_CATEGORIES) {
      await addDoc(collection(db, 'categories'), {
        name: category.name,
        color: category.color,
        createdAt: Timestamp.fromDate(new Date()),
        isDefault: true,
      });
    }

    console.log('Categorías inicializadas correctamente');
  } catch (error) {
    console.error('Error inicializando categorías:', error);
  }
};

/**
 * Obtener todas las categorías
 */
export const getAllCategories = async () => {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return DEFAULT_CATEGORIES.map((cat, idx) => ({ id: idx, ...cat }));
  }
};

/**
 * Crear categoría personalizada
 */
export const createCategory = async (name, color) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      name,
      color: color || '#A3A3A3',
      createdAt: Timestamp.fromDate(new Date()),
      isDefault: false,
    });
    return { id: docRef.id, name, color };
  } catch (error) {
    console.error('Error creando categoría:', error);
    throw error;
  }
};
