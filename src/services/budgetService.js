import { db } from './firebaseConfig';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

const BUDGETS_COLLECTION = 'budgets';

/**
 * Obtener presupuestos del mes actual para un usuario
 */
export const getBudgetsForCurrentMonth = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('userId', '==', userId),
      where('month', '==', currentMonth),
      where('year', '==', currentYear)
    );
    const snapshot = await getDocs(q);
    const budgets = [];
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });
    return budgets;
  } catch (error) {
    console.error('Error obteniendo presupuestos:', error);
    throw error;
  }
};

/**
 * Obtener todos los presupuestos de un usuario
 */
export const getUserBudgets = async (userId) => {
  try {
    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const budgets = [];
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });
    return budgets;
  } catch (error) {
    console.error('Error obteniendo presupuestos:', error);
    throw error;
  }
};

/**
 * Crear un nuevo presupuesto
 */
export const createBudget = async (userId, budgetData) => {
  try {
    const now = new Date();
    const newBudget = {
      userId,
      category: budgetData.category,
      limit: parseFloat(budgetData.limit),
      spent: 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(
      collection(db, BUDGETS_COLLECTION),
      newBudget
    );
    return { id: docRef.id, ...newBudget };
  } catch (error) {
    console.error('Error creando presupuesto:', error);
    throw error;
  }
};

/**
 * Actualizar un presupuesto
 */
export const updateBudget = async (budgetId, updates) => {
  try {
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await updateDoc(budgetRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return true;
  } catch (error) {
    console.error('Error actualizando presupuesto:', error);
    throw error;
  }
};

/**
 * Actualizar gasto en un presupuesto
 */
export const updateBudgetSpent = async (budgetId, newSpent) => {
  try {
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await updateDoc(budgetRef, {
      spent: newSpent,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return true;
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    throw error;
  }
};

/**
 * Eliminar un presupuesto
 */
export const deleteBudget = async (budgetId) => {
  try {
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await deleteDoc(budgetRef);
    return true;
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    throw error;
  }
};

/**
 * Obtener presupuesto por categoría (mes actual)
 */
export const getBudgetByCategory = async (userId, category) => {
  try {
    const now = new Date();
    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('userId', '==', userId),
      where('category', '==', category),
      where('month', '==', now.getMonth() + 1),
      where('year', '==', now.getFullYear())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error);
    throw error;
  }
};

/**
 * Calcular progreso del presupuesto (porcentaje)
 */
export const calculateBudgetProgress = (spent, limit) => {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

/**
 * Verificar si presupuesto está en alerta (80%)
 */
export const isBudgetWarning = (spent, limit) => {
  if (limit === 0) return false;
  return (spent / limit) >= 0.8 && (spent / limit) < 1;
};

/**
 * Verificar si presupuesto fue excedido (100%+)
 */
export const isBudgetExceeded = (spent, limit) => {
  if (limit === 0) return false;
  return spent >= limit;
};

/**
 * Reset de presupuestos al cambiar de mes (ejecutar automáticamente)
 */
export const resetMonthlyBudgets = async (userId) => {
  try {
    const now = new Date();
    const lastMonth = now.getMonth();
    const year = now.getFullYear();

    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('userId', '==', userId),
      where('month', '==', lastMonth),
      where('year', '==', year)
    );
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      const budgetRef = doc(db, BUDGETS_COLLECTION, docSnap.id);
      // Crear nuevo presupuesto para el mes actual
      await addDoc(collection(db, BUDGETS_COLLECTION), {
        userId,
        category: docSnap.data().category,
        limit: docSnap.data().limit,
        spent: 0,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    });

    return true;
  } catch (error) {
    console.error('Error reseteando presupuestos:', error);
    throw error;
  }
};
