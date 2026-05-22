import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

/**
 * Obtener todas las transacciones del mes actual
 */
export const getMonthlyTransactions = async (userId) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Usar solo un filtro where para evitar requerir índice compuesto
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filtrar por fecha en JavaScript
      if (data.date >= monthStart && data.date <= monthEnd) {
        transactions.push({ id: doc.id, ...data });
      }
    });
    // Ordenar por fecha descendente en JavaScript
    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn('Error obteniendo transacciones mensuales (retornando vacío):', error.message);
    // Retornar array vacío para que dashboard siga funcionando
    return [];
  }
};

/**
 * Calcular balance total (ingresos - gastos)
 */
export const calculateMonthlyBalance = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  return {
    income,
    expenses,
    balance: income - expenses,
  };
};

/**
 * Desglosar gastos por categoría
 */
export const getExpensesByCategory = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const byCategory = {};

  expenses.forEach(t => {
    const category = t.category || 'Sin categoría';
    if (!byCategory[category]) {
      byCategory[category] = 0;
    }
    byCategory[category] += parseFloat(t.amount);
  });

  // Convertir a array y ordenar
  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
};

/**
 * Calcular porcentaje de gastos por categoría
 */
export const getExpensesPercentage = (expenses, totalExpenses) => {
  if (totalExpenses === 0) return [];
  return expenses.map(e => ({
    category: e.category,
    amount: e.amount,
    percentage: (e.amount / totalExpenses) * 100,
  }));
};

/**
 * Obtener datos para gráfica de pastel (Pie Chart)
 */
export const getPieChartData = (transactions) => {
  const expensesByCategory = getExpensesByCategory(transactions);
  const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  return expensesByCategory.map((e, index) => ({
    name: e.category,
    amount: e.amount,
    percentage: ((e.amount / totalExpenses) * 100).toFixed(1),
    color: colors[index % colors.length],
  }));
};

/**
 * Obtener datos para gráfica de barras (Bar Chart)
 */
export const getBarChartData = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const byDay = {};

  expenses.forEach(t => {
    const day = t.date.substring(8); // Último 2 caracteres (día)
    if (!byDay[day]) {
      byDay[day] = 0;
    }
    byDay[day] += parseFloat(t.amount);
  });

  return Object.entries(byDay)
    .map(([day, amount]) => ({
      day,
      amount: parseFloat(amount),
    }))
    .sort((a, b) => parseInt(a.day) - parseInt(b.day));
};

/**
 * Obtener estadísticas resumen
 */
export const getDashboardSummary = (transactions, accounts) => {
  const { income, expenses, balance } = calculateMonthlyBalance(transactions);
  const totalAccountBalance = accounts.reduce(
    (sum, a) => sum + (a.balance || 0),
    0
  );
  const expensesByCategory = getExpensesByCategory(transactions);
  const topExpenseCategory =
    expensesByCategory.length > 0
      ? expensesByCategory[0].category
      : 'N/A';

  return {
    monthlyIncome: income,
    monthlyExpenses: expenses,
    monthlyBalance: balance,
    totalAccountBalance,
    topExpenseCategory,
    expenseByCategoryCount: expensesByCategory.length,
  };
};
