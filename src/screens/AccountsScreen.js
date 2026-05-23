import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { getUserAccounts, deleteAccount } from '../services/accountService';

export default function AccountsScreen({ navigation }) {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAccounts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadAccounts = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUserAccounts(userId);
      setAccounts(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (account) => {
    Alert.alert(
      'Eliminar Cuenta',
      `¿Eliminar la cuenta "${account.name}"? Solo se pueden eliminar cuentas sin transacciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              Alert.alert('Éxito', 'Cuenta eliminada correctamente');
              loadAccounts();
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la cuenta');
            }
          },
        },
      ]
    );
  };

  const getAccountIcon = (type) => {
    const iconMap = {
      efectivo: 'wallet',
      tarjeta: 'credit-card',
      banco: 'bank',
      ahorro: 'piggy-bank',
    };
    return iconMap[type?.toLowerCase()] || 'account';
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };

  const renderAccountItem = ({ item }) => (
    <View style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
      <View style={styles.accountLeft}>
        <View
          style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}
        >
          <MaterialCommunityIcons
            name={getAccountIcon(item.type)}
            size={24}
            color="#1976d2"
          />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: theme.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.accountType, { color: theme.textMuted }]}>{item.type || 'Cuenta'}</Text>
        </View>
      </View>
      <View style={styles.accountRight}>
        <Text style={styles.balance}>
          ${parseFloat(item.balance).toFixed(2)}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('AccountForm', { account: item })
            }
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteAccount(item)}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="trash-can" size={18} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && accounts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mis Cuentas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AccountForm')}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bank-outline"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>No tienes cuentas</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountForm')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Crear tu primera cuenta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: theme.accent }]}>
            <Text style={styles.summaryLabel}>Balance Total</Text>
            <Text style={styles.summaryAmount}>
              ${getTotalBalance().toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>
              {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
});
