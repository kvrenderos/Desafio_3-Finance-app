import { db } from './firebaseConfig';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  runTransaction,
} from 'firebase/firestore';

const COLLECTION_NAME = 'transactions';

export const getTransactionsByUserId = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const accountRef = doc(db, 'accounts', transactionData.accountId);
    await runTransaction(db, async (tx) => {
      const accountDoc = await tx.get(accountRef);
      if (!accountDoc.exists()) throw new Error('La cuenta seleccionada no existe.');

      const currentBalance = accountDoc.data().balance || 0;
      const change = transactionData.type === 'expense'
        ? -transactionData.amount
        : transactionData.amount;

      const newTxRef = doc(collection(db, COLLECTION_NAME));
      tx.set(newTxRef, { ...transactionData, createdAt: new Date().toISOString() });
      tx.update(accountRef, { balance: currentBalance + change });
    });
    return true;
  } catch (error) {
    console.error('Error al crear transacción:', error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, oldTransaction, newTransactionData) => {
  try {
    const accountRef = doc(db, 'accounts', newTransactionData.accountId);
    await runTransaction(db, async (tx) => {
      const accountDoc = await tx.get(accountRef);
      if (!accountDoc.exists()) throw new Error('La cuenta no existe.');

      const currentBalance = accountDoc.data().balance || 0;
      const oldChange = oldTransaction.type === 'expense'
        ? -oldTransaction.amount
        : oldTransaction.amount;
      const newChange = newTransactionData.type === 'expense'
        ? -newTransactionData.amount
        : newTransactionData.amount;
      const finalBalance = currentBalance - oldChange + newChange;

      const txRef = doc(db, COLLECTION_NAME, transactionId);
      tx.update(txRef, newTransactionData);
      tx.update(accountRef, { balance: finalBalance });
    });
    return true;
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionItem) => {
  try {
    const accountRef = doc(db, 'accounts', transactionItem.accountId);
    await runTransaction(db, async (tx) => {
      const accountDoc = await tx.get(accountRef);
      if (!accountDoc.exists()) throw new Error('La cuenta no existe.');

      const currentBalance = accountDoc.data().balance || 0;
      const reversal = transactionItem.type === 'expense'
        ? transactionItem.amount
        : -transactionItem.amount;

      const txRef = doc(db, COLLECTION_NAME, transactionItem.id);
      tx.delete(txRef);
      tx.update(accountRef, { balance: currentBalance + reversal });
    });
    return true;
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    throw error;
  }
};

// Kept for backwards compatibility (TransactionsScreen still imports this)
export { getUserAccounts } from './accountService';
