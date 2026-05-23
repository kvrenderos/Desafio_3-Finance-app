import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { getAllCategories } from './categoryService';

const COLLECTION_NAME = 'transactions';

// Helper for normalization
const normalizeCategory = (cat) => cat ? cat.trim().charAt(0).toUpperCase() + cat.trim().slice(1).toLowerCase() : '';

export const getTransactionsByUserId = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn("Error al obtener transacciones (retornando vacío): ", error.message);
    return [];
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const accountRef = doc(db, 'accounts', transactionData.accountId);
    
    // Buscar presupuesto para sincronizar gasto, o auto-crearlo si no existe
    let budgetRef = null;
    let isNewBudget = false;
    let newBudgetData = null;
    
    const normalizedCategory = normalizeCategory(transactionData.category);

    if (transactionData.type === 'expense' && normalizedCategory) {
      const [yearStr, monthStr] = transactionData.date.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      
      const q = query(
        collection(db, 'budgets'),
        where('userId', '==', transactionData.userId),
        where('category', '==', normalizedCategory),
        where('month', '==', month),
        where('year', '==', year)
      );
      const budgetSnap = await getDocs(q);
      
      if (!budgetSnap.empty) {
        budgetRef = doc(db, 'budgets', budgetSnap.docs[0].id);
      } else {
        budgetRef = doc(collection(db, 'budgets'));
        isNewBudget = true;
        newBudgetData = {
          userId: transactionData.userId,
          category: normalizedCategory,
          limit: 0, // Presupuesto auto-creado sin límite
          spent: 0,
          month: month,
          year: year,
          createdAt: new Date().toISOString()
        };
      }
    }
    
    await runTransaction(db, async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) {
        throw new Error("La cuenta seleccionada no existe.");
      }

      const currentBalance = accountDoc.data().balance || 0;
      const change = transactionData.type === 'expense' ? -transactionData.amount : transactionData.amount;
      const newBalance = currentBalance + change;

      const newTransactionRef = doc(collection(db, COLLECTION_NAME));
      
      const finalData = {
        ...transactionData,
        category: normalizedCategory,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      transaction.set(newTransactionRef, finalData);
      transaction.update(accountRef, { balance: newBalance });

      // Sincronizar presupuesto
      if (budgetRef) {
        if (isNewBudget) {
          transaction.set(budgetRef, {
            ...newBudgetData,
            spent: transactionData.amount
          });
        } else {
          const budgetDoc = await transaction.get(budgetRef);
          if (budgetDoc.exists()) {
            const currentSpent = budgetDoc.data().spent || 0;
            transaction.update(budgetRef, { spent: currentSpent + transactionData.amount });
          }
        }
      }
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

    const oldNormalizedCat = normalizeCategory(oldTransaction.category);
    const newNormalizedCat = normalizeCategory(newTransactionData.category);

    // Buscar presupuesto antiguo
    let oldBudgetRef = null;
    if (oldTransaction.type === 'expense' && oldNormalizedCat) {
      const [yearStr, monthStr] = oldTransaction.date.split('-');
      const qOld = query(collection(db, 'budgets'), 
        where('userId', '==', oldTransaction.userId),
        where('category', '==', oldNormalizedCat),
        where('month', '==', parseInt(monthStr)),
        where('year', '==', parseInt(yearStr))
      );
      const oldSnap = await getDocs(qOld);
      if (!oldSnap.empty) oldBudgetRef = doc(db, 'budgets', oldSnap.docs[0].id);
    }

    // Buscar presupuesto nuevo o crearlo
    let newBudgetRef = null;
    let isNewBudgetUpdate = false;
    let newBudgetDataUpdate = null;
    
    if (newTransactionData.type === 'expense' && newNormalizedCat) {
      const [yearStr, monthStr] = newTransactionData.date.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      
      const qNew = query(collection(db, 'budgets'), 
        where('userId', '==', newTransactionData.userId),
        where('category', '==', newNormalizedCat),
        where('month', '==', month),
        where('year', '==', year)
      );
      const newSnap = await getDocs(qNew);
      
      if (!newSnap.empty) {
        newBudgetRef = doc(db, 'budgets', newSnap.docs[0].id);
      } else {
        newBudgetRef = doc(collection(db, 'budgets'));
        isNewBudgetUpdate = true;
        newBudgetDataUpdate = {
          userId: newTransactionData.userId,
          category: newNormalizedCat,
          limit: 0,
          spent: 0,
          month: month,
          year: year,
          createdAt: new Date().toISOString()
        };
      }
    }

    await runTransaction(db, async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) throw new Error("La cuenta no existe.");

      const currentBalance = accountDoc.data().balance || 0;
      const oldChange = oldTransaction.type === 'expense' ? -oldTransaction.amount : oldTransaction.amount;
      const newChange = newTransactionData.type === 'expense' ? -newTransactionData.amount : newTransactionData.amount;
      const finalBalance = (currentBalance - oldChange) + newChange;

      const finalData = {
        ...newTransactionData,
        category: newNormalizedCat
      };

      const txRef = doc(db, COLLECTION_NAME, transactionId);
      transaction.update(txRef, finalData);
      transaction.update(accountRef, { balance: finalBalance });

      // Si es el mismo presupuesto, calcular la diferencia
      if (oldBudgetRef && newBudgetRef && oldBudgetRef.id === newBudgetRef.id) {
        const budgetDoc = await transaction.get(newBudgetRef);
        if (budgetDoc.exists()) {
          const spent = budgetDoc.data().spent || 0;
          const netChange = newTransactionData.amount - oldTransaction.amount;
          transaction.update(newBudgetRef, { spent: Math.max(0, spent + netChange) });
        }
      } else {
        // Restar del antiguo
        if (oldBudgetRef) {
          const oldBudgetDoc = await transaction.get(oldBudgetRef);
          if (oldBudgetDoc.exists()) {
            const spent = oldBudgetDoc.data().spent || 0;
            transaction.update(oldBudgetRef, { spent: Math.max(0, spent - oldTransaction.amount) });
          }
        }
        // Sumar al nuevo
        if (newBudgetRef) {
          if (isNewBudgetUpdate) {
            transaction.set(newBudgetRef, {
              ...newBudgetDataUpdate,
              spent: newTransactionData.amount
            });
          } else {
            const newBudgetDoc = await transaction.get(newBudgetRef);
            if (newBudgetDoc.exists()) {
              const spent = newBudgetDoc.data().spent || 0;
              transaction.update(newBudgetRef, { spent: spent + newTransactionData.amount });
            }
          }
        }
      }
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

    let budgetRef = null;
    const normalizedCategory = normalizeCategory(transactionItem.category);
    
    if (transactionItem.type === 'expense' && normalizedCategory) {
      const [yearStr, monthStr] = transactionItem.date.split('-');
      const q = query(
        collection(db, 'budgets'),
        where('userId', '==', transactionItem.userId),
        where('category', '==', normalizedCategory),
        where('month', '==', parseInt(monthStr)),
        where('year', '==', parseInt(yearStr))
      );
      const budgetSnap = await getDocs(q);
      if (!budgetSnap.empty) {
        budgetRef = doc(db, 'budgets', budgetSnap.docs[0].id);
      }
    }

    await runTransaction(db, async (transactionContext) => {
      const accountDoc = await transactionContext.get(accountRef);
      if (!accountDoc.exists()) throw new Error("La cuenta no existe.");

      const currentBalance = accountDoc.data().balance || 0;
      const change = transactionItem.type === 'expense' ? transactionItem.amount : -transactionItem.amount;
      const newBalance = currentBalance + change;

      const txRef = doc(db, COLLECTION_NAME, transactionItem.id);
      transactionContext.delete(txRef);
      transactionContext.update(accountRef, { balance: newBalance });

      if (budgetRef) {
        const budgetDoc = await transactionContext.get(budgetRef);
        if (budgetDoc.exists()) {
          const currentSpent = budgetDoc.data().spent || 0;
          transactionContext.update(budgetRef, { spent: Math.max(0, currentSpent - transactionItem.amount) });
        }
      }
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
  return await getAllCategories();
};