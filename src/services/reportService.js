import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const escapeCsv = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return {
    start,
    end,
    label: `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`,
    fileSuffix: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
};

const getMonthlyTransactions = (transactions, start, end) =>
  transactions.filter((tx) => tx.date >= start && tx.date <= end);

const getCategoryTotals = (transactions) =>
  transactions.reduce((acc, tx) => {
    const key = tx.category || 'Sin categoria';
    if (!acc[key]) acc[key] = { income: 0, expense: 0 };
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') acc[key].income += amount;
    if (tx.type === 'expense') acc[key].expense += amount;
    return acc;
  }, {});

export const exportMonthlyCsvReport = async (transactions, getAccountName) => {
  const { start, end, label, fileSuffix } = getCurrentMonthRange();
  const monthly = getMonthlyTransactions(transactions, start, end);

  if (monthly.length === 0) {
    Alert.alert('Sin datos', 'No hay transacciones en el mes actual para exportar.');
    return;
  }

  const totalIncome = monthly
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalExpense = monthly
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const categoryTotals = getCategoryTotals(monthly);

  const lines = [
    ['Reporte mensual', label].map(escapeCsv).join(','),
    ['Desde', start, 'Hasta', end].map(escapeCsv).join(','),
    [],
    ['Resumen'].map(escapeCsv).join(','),
    ['Ingresos', totalIncome.toFixed(2)].map(escapeCsv).join(','),
    ['Gastos', totalExpense.toFixed(2)].map(escapeCsv).join(','),
    ['Balance', (totalIncome - totalExpense).toFixed(2)].map(escapeCsv).join(','),
    [],
    ['Totales por categoria'].map(escapeCsv).join(','),
    ['Categoria', 'Ingresos', 'Gastos'].map(escapeCsv).join(','),
    ...Object.entries(categoryTotals).map(([category, totals]) =>
      [category, totals.income.toFixed(2), totals.expense.toFixed(2)].map(escapeCsv).join(',')
    ),
    [],
    ['Transacciones'].map(escapeCsv).join(','),
    ['Fecha', 'Tipo', 'Categoria', 'Cuenta', 'Descripcion', 'Monto', 'Recibo'].map(escapeCsv).join(','),
    ...monthly.map((tx) =>
      [
        tx.date,
        tx.type === 'income' ? 'Ingreso' : 'Gasto',
        tx.category,
        getAccountName(tx.accountId),
        tx.description,
        Number(tx.amount || 0).toFixed(2),
        tx.receiptUri ? 'Adjunto' : 'Sin adjunto',
      ].map(escapeCsv).join(',')
    ),
  ];

  const fileUri = `${FileSystem.documentDirectory}reporte-financiero-${fileSuffix}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, lines.join('\n'), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('Reporte generado', `El archivo CSV se guardo en: ${fileUri}`);
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Compartir reporte ${label}`,
    UTI: 'public.comma-separated-values-text',
  });
};
