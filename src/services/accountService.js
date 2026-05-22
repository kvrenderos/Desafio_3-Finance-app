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
  runTransaction,
} from 'firebase/firestore';

const ACCOUNTS_COLLECTION = 'accounts';

/**
 * Obtener todas las cuentas del usuario
 */
export const getUserAccounts = async (userId) => {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const accounts = [];
    snapshot.forEach(doc => {
      accounts.push({ id: doc.id, ...doc.data() });
    });
    return accounts;
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    throw error;
  }
};

/**
 * Crear una nueva cuenta
 */
export const createAccount = async (userId, accountData) => {
  try {
    const newAccount = {
      userId,
      name: accountData.name,
      type: accountData.type, // 'efectivo', 'tarjeta', 'banco', etc.
      initialBalance: parseFloat(accountData.initialBalance) || 0,
      balance: parseFloat(accountData.initialBalance) || 0,
      currency: accountData.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(
      collection(db, ACCOUNTS_COLLECTION),
      newAccount
    );
    return { id: docRef.id, ...newAccount };
  } catch (error) {
    console.error('Error creando cuenta:', error);
    throw error;
  }
};

/**
 * Actualizar una cuenta (nombre, tipo)
 */
export const updateAccount = async (accountId, updates) => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(accountRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error actualizando cuenta:', error);
    throw error;
  }
};

/**
 * Eliminar una cuenta (solo si no tiene transacciones)
 */
export const deleteAccount = async (accountId) => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    
    // Verificar que no haya transacciones
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('accountId', '==', accountId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    if (!transactionsSnapshot.empty) {
      throw new Error('No se puede eliminar una cuenta con transacciones activas. Elimina las transacciones primero.');
    }

    await deleteDoc(accountRef);
    return true;
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    throw error;
  }
};

/**
 * Obtener saldo de una cuenta
 */
export const getAccountBalance = async (accountId) => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    const snapshot = await getDocs(query(
      collection(db, ACCOUNTS_COLLECTION),
      where('__name__', '==', accountId)
    ));
    
    if (snapshot.empty) {
      throw new Error('Cuenta no encontrada');
    }

    return snapshot.docs[0].data().balance || 0;
  } catch (error) {
    console.error('Error obteniendo balance:', error);
    throw error;
  }
};

/**
 * Obtener una cuenta por ID
 */
export const getAccountById = async (accountId) => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    const snapshot = await getDocs(query(
      collection(db, ACCOUNTS_COLLECTION),
      where('__name__', '==', accountId)
    ));
    
    if (snapshot.empty) {
      throw new Error('Cuenta no encontrada');
    }

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error obteniendo cuenta:', error);
    throw error;
  }
};

/**
 * Actualizar balance (usado internamente por transacciones)
 */
export const updateAccountBalance = async (accountId, newBalance) => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(accountRef, { 
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error actualizando balance:', error);
    throw error;
  }
};
