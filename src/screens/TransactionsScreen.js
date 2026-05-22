import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { getTransactionsByUserId, deleteTransaction, getUserAccounts } from '../services/transactionService';

export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense

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
      let txData = [];
      try {
        txData = await getTransactionsByUserId(userId);
      } catch (txError) {
        console.warn('No se pudieron cargar transacciones:', txError.message);
        // Continuar sin transacciones si falla la carga
      }
      
      const accData = await getUserAccounts(userId);
      setTransactions(txData);
      setFilteredTransactions(txData);
      setAccounts(accData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // No mostrar alerta para no disruptar UX
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = transactions;

    if (filterCategory.trim() !== '') {
      result = result.filter(t => t.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    if (filterAccount !== '') {
      result = result.filter(t => t.accountId === filterAccount);
    }

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    setFilteredTransactions(result);
  }, [filterCategory, filterAccount, filterType, transactions]);

  const handleDeleteAlert = (item) => {
    Alert.alert(
      "Confirmar acción",
      "¿Estás seguro de que deseas eliminar permanentemente esta transacción? Esto recalculará el balance de tu cuenta.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteTransaction(item);
              loadData();
            } catch (err) {
              Alert.alert("Error", err.message || "No se pudo eliminar.");
            }
          } 
        }
      ]
    );
  };

  const getAccountName = (id) => {
    const account = accounts.find(a => a.id === id);
    return account ? account.name : "Cuenta Desconocida";
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.leftCard}>
        <Text style={styles.description}>{item.description || 'Sin descripción'}</Text>
        <Text style={styles.subtext}>Categoría: {item.category}</Text>
        <Text style={styles.accountText}>Cuenta: {getAccountName(item.accountId)}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.rightCard}>
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
          <TouchableOpacity 
            onPress={() => handleDeleteAlert(item)} 
            style={styles.btnDelete}
          >
            <Text style={styles.btnText}>Borrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBox}>
        <TextInput 
          placeholder="🔍 Buscar categoría..." 
          value={filterCategory} 
          onChangeText={setFilterCategory} 
          style={styles.inputSearch}
        />
        <View style={styles.filterRowButton}>
          <TouchableOpacity 
            style={[styles.chip, filterType === 'all' && styles.chipActive]} 
            onPress={() => setFilterType('all')}
          >
            <Text style={filterType === 'all' ? styles.chipTextActive : styles.chipText}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chip, filterType === 'expense' && styles.chipActiveExpense]} 
            onPress={() => setFilterType(filterType === 'expense' ? 'all' : 'expense')}
          >
            <Text style={filterType === 'expense' ? styles.chipTextActive : styles.chipText}>Gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chip, filterType === 'income' && styles.chipActiveIncome]} 
            onPress={() => setFilterType(filterType === 'income' ? 'all' : 'income')}
          >
            <Text style={filterType === 'income' ? styles.chipTextActive : styles.chipText}>Ingresos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay transacciones registradas o no coinciden con los filtros.</Text>}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('TransactionForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
  },
  filterBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  inputSearch: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  filterRowButton: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#34495e',
  },
  chipActiveExpense: {
    backgroundColor: '#e74c3c',
  },
  chipActiveIncome: {
    backgroundColor: '#2ecc71',
  },
  chipText: {
    color: '#333',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1.5,
  },
  leftCard: {
    flex: 1,
    paddingRight: 10,
  },
  rightCard: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    minHeight: 65,
  },
  description: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  subtext: {
    color: '#7f8c8d',
    fontSize: 13,
    marginTop: 2,
  },
  accountText: {
    color: '#95a5a6',
    fontSize: 12,
  },
  dateText: {
    color: '#bdc3c7',
    fontSize: 11,
    marginTop: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
  },
  expense: {
    color: '#e74c3c',
  },
  income: {
    color: '#2ecc71',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnEdit: {
    backgroundColor: '#3498db',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnDelete: {
    backgroundColor: '#95a5a6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});