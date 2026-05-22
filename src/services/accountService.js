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
  getDoc,
} from 'firebase/firestore';

const ACCOUNTS_COLLECTION = 'accounts';
const TRANSACTIONS_COLLECTION = 'transactions';

export const getUserAccounts = async (userId) => {
  const q = query(collection(db, ACCOUNTS_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createAccount = async (userId, name, initialBalance = 0) => {
  if (!name || name.trim() === '') throw new Error('El nombre de la cuenta es obligatorio.');
  const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
    userId,
    name: name.trim(),
    balance: parseFloat(initialBalance) || 0,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, userId, name: name.trim(), balance: parseFloat(initialBalance) || 0 };
};

export const updateAccount = async (accountId, name) => {
  if (!name || name.trim() === '') throw new Error('El nombre de la cuenta es obligatorio.');
  const ref = doc(db, ACCOUNTS_COLLECTION, accountId);
  await updateDoc(ref, { name: name.trim() });
};

export const deleteAccount = async (accountId, userId) => {
  // Check if there are transactions linked to this account
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('accountId', '==', accountId),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error('No se puede eliminar una cuenta con transacciones activas. Elimina primero sus transacciones.');
  }
  await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accountId));
};
