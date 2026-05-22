import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  Alert, TextInput, SafeAreaView,
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import { getTransactionsByUserId, deleteTransaction, getUserAccounts } from '../services/transactionService';

export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, thisMonth, lastMonth

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const txData = await getTransactionsByUserId(userId);
      const accData = await getUserAccounts(userId);
      setTransactions(txData);
      setAccounts(accData);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al sincronizar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    if (filterCategory.trim() !== '') {
      result = result.filter(t =>
        t.category.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }
    if (filterAccount !== '') {
      result = result.filter(t => t.accountId === filterAccount);
    }
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }
    if (filterPeriod !== 'all') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      let prefix;
      if (filterPeriod === 'thisMonth') {
        prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      } else if (filterPeriod === 'lastMonth') {
        const lm = month === 0 ? 12 : month;
        const ly = month === 0 ? year - 1 : year;
        prefix = `${ly}-${String(lm).padStart(2, '0')}`;
      }
      if (prefix) result = result.filter(t => t.date && t.date.startsWith(prefix));
    }

    setFilteredTransactions(result);
  }, [filterCategory, filterAccount, filterType, filterPeriod, transactions]);

  const handleDeleteAlert = (item) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta transacción? Se recalculará el saldo de la cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(item);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la transacción.');
            }
          },
        },
      ]
    );
  };

  const getAccountName = (id) => {
    const account = accounts.find(a => a.id === id);
    return account ? account.name : 'Cuenta desconocida';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.description}>{item.description || 'Sin descripción'}</Text>
        <Text style={styles.subtext}>📂 {item.category}</Text>
        <Text style={styles.accountText}>🏦 {getAccountName(item.accountId)}</Text>
        <Text style={styles.dateText}>📅 {item.date}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.amount, item.type === 'expense' ? styles.expense : styles.income]}>
          {item.type === 'expense' ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionForm', { transaction: item })}
            style={styles.btnEdit}
          >
            <Text style={styles.btnText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteAlert(item)} style={styles.btnDelete}>
            <Text style={styles.btnText}>Borrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const TypeChip = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.chip, filterType === value && styles.chipActive]}
      onPress={() => setFilterType(filterType === value ? 'all' : value)}
    >
      <Text style={filterType === value ? styles.chipTextActive : styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );

  const PeriodChip = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.chip, filterPeriod === value && styles.chipActivePeriod]}
      onPress={() => setFilterPeriod(filterPeriod === value ? 'all' : value)}
    >
      <Text style={filterPeriod === value ? styles.chipTextActive : styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterBox}>
        <TextInput
          placeholder="🔍 Buscar por categoría..."
          placeholderTextColor="#94a3b8"
          value={filterCategory}
          onChangeText={setFilterCategory}
          style={styles.inputSearch}
        />

        <View style={styles.filterRow}>
          <TypeChip label="Todos" value="all" />
          <TypeChip label="Gastos" value="expense" />
          <TypeChip label="Ingresos" value="income" />
        </View>

        <View style={styles.filterRow}>
          <PeriodChip label="Mes actual" value="thisMonth" />
          <PeriodChip label="Mes anterior" value="lastMonth" />
        </View>

        {accounts.length > 0 && (
          <View style={[styles.filterRow, { flexWrap: 'wrap' }]}>
            <TouchableOpacity
              style={[styles.chip, filterAccount === '' && styles.chipActivePeriod]}
              onPress={() => setFilterAccount('')}
            >
              <Text style={filterAccount === '' ? styles.chipTextActive : styles.chipText}>Todas las cuentas</Text>
            </TouchableOpacity>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.chip, filterAccount === acc.id && styles.chipActivePeriod]}
                onPress={() => setFilterAccount(filterAccount === acc.id ? '' : acc.id)}
              >
                <Text style={filterAccount === acc.id ? styles.chipTextActive : styles.chipText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadData}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Cargando...' : 'No hay transacciones que coincidan con los filtros.'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('TransactionForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 12 },
  filterBox: {
    backgroundColor: '#1e293b', padding: 12, borderRadius: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  inputSearch: {
    backgroundColor: '#0f172a', color: '#f8fafc', padding: 10,
    borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#334155',
  },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  chip: {
    backgroundColor: '#0f172a', paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  chipActivePeriod: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  chipTextActive: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  cardLeft: { flex: 1, paddingRight: 10 },
  cardRight: { justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 65 },
  description: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  subtext: { color: '#64748b', fontSize: 12, marginTop: 3 },
  accountText: { color: '#475569', fontSize: 12 },
  dateText: { color: '#334155', fontSize: 11, marginTop: 4 },
  amount: { fontSize: 17, fontWeight: '800' },
  expense: { color: '#ef4444' },
  income: { color: '#22c55e' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  btnEdit: { backgroundColor: '#3b82f6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  btnDelete: { backgroundColor: '#475569', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: '#22c55e', width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
