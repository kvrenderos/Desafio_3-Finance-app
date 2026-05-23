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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import {
  getBudgetsForCurrentMonth,
  deleteBudget,
  calculateBudgetProgress,
  isBudgetWarning,
  isBudgetExceeded,
} from '../services/budgetService';
import { getMonthlyTransactions } from '../services/dashboardService';

export default function BudgetScreen({ navigation }) {
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBudgets();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBudgets = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getBudgetsForCurrentMonth(userId);
      const transactions = await getMonthlyTransactions(userId);
      const spentByCategory = {};
      transactions.forEach(t => {
        if (t.type === 'expense') {
          const cat = t.category ? t.category.trim().toLowerCase() : '';
          spentByCategory[cat] = (spentByCategory[cat] || 0) + parseFloat(t.amount || 0);
        }
      });
      const budgetsWithActualSpent = data.map(budget => {
        const cat = budget.category ? budget.category.trim().toLowerCase() : '';
        return {
          ...budget,
          spent: spentByCategory[cat] || 0
        };
      });
      setBudgets(budgetsWithActualSpent);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = (budget) => {
    Alert.alert(
      'Eliminar Presupuesto',
      `¿Eliminar el presupuesto de ${budget.category}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              Alert.alert('Éxito', 'Presupuesto eliminado correctamente');
              loadBudgets();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el presupuesto');
            }
          },
        },
      ]
    );
  };

  const getTotalBudget = () => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  };

  const renderBudgetItem = ({ item }) => {
    const progress = calculateBudgetProgress(item.spent, item.limit);
    const isWarning = isBudgetWarning(item.spent, item.limit);
    const isExceeded = isBudgetExceeded(item.spent, item.limit);

    return (
      <View style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <View style={styles.budgetHeader}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.iconContainer,
                isExceeded
                  ? { backgroundColor: '#ffebee' }
                  : isWarning
                  ? { backgroundColor: '#fff3e0' }
                  : { backgroundColor: '#e8f5e9' },
              ]}
            >
              <MaterialCommunityIcons
                name={isExceeded ? 'alert-circle' : 'alert'}
                size={20}
                color={
                  isExceeded ? '#c62828' : isWarning ? '#f57c00' : '#2e7d32'
                }
              />
            </View>
            <View style={styles.categoryNameContainer}>
              <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{item.category}</Text>
              <Text style={[styles.spentText, { color: theme.textMuted }]}>
                Gastado: ${parseFloat(item.spent).toFixed(2)} / $
                {parseFloat(item.limit).toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('BudgetForm', { budget: item })
              }
              style={styles.iconButton}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteBudget(item)}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons
                name="trash-can"
                size={18}
                color="#f44336"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isExceeded
                  ? '#c62828'
                  : isWarning
                  ? '#f57c00'
                  : '#4caf50',
              },
            ]}
          />
        </View>

        {/* Progress Text */}
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>{progress.toFixed(0)}% usado</Text>
          {isExceeded && (
            <Text style={styles.exceededText}>
              ¡Presupuesto excedido!
            </Text>
          )}
          {isWarning && !isExceeded && (
            <Text style={styles.warningText}>
              Alerta: Has alcanzado el 80%
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading && budgets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Presupuestos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('BudgetForm')}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>No tienes presupuestos</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('BudgetForm')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>
              Crear tu primer presupuesto
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderLeftColor: theme.accent }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Presupuesto</Text>
                <Text style={styles.summaryAmount}>
                  ${getTotalBudget().toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Gastado</Text>
                <Text
                  style={[
                    styles.summaryAmount,
                    getTotalSpent() > getTotalBudget() && {
                      color: '#c62828',
                    },
                  ]}
                >
                  ${getTotalSpent().toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryProgressContainer}>
              <View
                style={[
                  styles.summaryProgressBar,
                  {
                    width: `${Math.min(
                      (getTotalSpent() / getTotalBudget()) * 100,
                      100
                    )}%`,
                    backgroundColor:
                      getTotalSpent() > getTotalBudget()
                        ? '#c62828'
                        : getTotalSpent() / getTotalBudget() >= 0.8
                        ? '#f57c00'
                        : '#4caf50',
                  },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={budgets}
            renderItem={renderBudgetItem}
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
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryProgressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryNameContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  spentText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  warningText: {
    fontSize: 11,
    color: '#f57c00',
    fontWeight: '600',
  },
  exceededText: {
    fontSize: 11,
    color: '#c62828',
    fontWeight: '600',
  },
});
