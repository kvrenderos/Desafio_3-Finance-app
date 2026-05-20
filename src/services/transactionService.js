import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  runTransaction
} from 'firebase/firestore';

const COLLECTION_NAME = 'transactions';

export const getTransactionsByUserId = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (error) {
    console.error("Error al obtener transacciones: ", error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const accountRef = doc(db, 'accounts', transactionData.accountId);
    
    await runTransaction(db, async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) {
        throw new Error("La cuenta seleccionada no existe.");
      }

      const currentBalance = accountDoc.data().balance || 0;
      const change = transactionData.type === 'expense' ? -transactionData.amount : transactionData.amount;
      const newBalance = currentBalance + change;

      const newTransactionRef = doc(collection(db, COLLECTION_NAME));
      transaction.set(newTransactionRef, {
        ...transactionData,
        createdAt: new Date().toISOString().split('T')[0]
      });

      transaction.update(accountRef, { balance: newBalance });
    });
    return true;
  } catch (error) {
    console.error("Error al crear transacción: ", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, oldTransaction, newTransactionData) => {
  try {
    const accountRef = doc(db, 'accounts', newTransactionData.accountId);

    await runTransaction(db, async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) {
        throw new Error("La cuenta no existe.");
      }

      const currentBalance = accountDoc.data().balance || 0;

      const oldChange = oldTransaction.type === 'expense' ? -oldTransaction.amount : oldTransaction.amount;
      let tempBalance = currentBalance - oldChange;

      const newChange = newTransactionData.type === 'expense' ? -newTransactionData.amount : newTransactionData.amount;
      const finalBalance = tempBalance + newChange;

      const txRef = doc(db, COLLECTION_NAME, transactionId);
      transaction.update(txRef, newTransactionData);
      transaction.update(accountRef, { balance: finalBalance });
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar transacción: ", error);
    throw error;
  }
};

export const deleteTransaction = async (transactionItem) => {
  try {
    const accountRef = doc(db, 'accounts', transactionItem.accountId);

    await runTransaction(db, async (transactionContext) => {
      const accountDoc = await transactionContext.get(accountRef);
      if (!accountDoc.exists()) {
        throw new Error("La cuenta no existe.");
      }

      const currentBalance = accountDoc.data().balance || 0;
      
      const change = transactionItem.type === 'expense' ? transactionItem.amount : -transactionItem.amount;
      const newBalance = currentBalance + change;

      const txRef = doc(db, COLLECTION_NAME, transactionItem.id);
      transactionContext.delete(txRef);
      transactionContext.update(accountRef, { balance: newBalance });
    });
    return true;
  } catch (error) {
    console.error("Error al eliminar transacción: ", error);
    throw error;
  }
};

export const getUserAccounts = async (userId) => {
  const q = query(collection(db, 'accounts'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getCategories = async () => {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};