import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  StatCard,
  PieChart,
  ChartLegend,
  BarChart,
  ComparisonCard,
  AccountCard,
} from '../components/DashboardChart';
import {
  getMonthlyTransactions,
  calculateMonthlyBalance,
  getPieChartData,
  getBarChartData,
} from '../services/dashboardService';
import { getUserAccounts } from '../services/accountService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { theme, isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState({ income: 0, expenses: 0, balance: 0 });
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [activeChart, setActiveChart] = useState('pie'); // 'pie' | 'bar'

  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;
  const currentMonth = MONTHS_ES[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (!isRefresh) setLoading(true);

    try {
      const [txs, accs] = await Promise.all([
        getMonthlyTransactions(userId),
        getUserAccounts(userId),
      ]);

      setTransactions(txs);
      setAccounts(accs);
      setBalance(calculateMonthlyBalance(txs));
      setPieData(getPieChartData(txs));
      setBarData(getBarChartData(txs));

      if (!isRefresh) {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const totalAccountBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const topCategory = pieData[0];

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Cargando dashboard…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── HEADER ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerGreeting, { color: theme.textMuted }]}>
            {currentMonth} {currentYear}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mi Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout-variant" size={20} color={theme.expense} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ─── BALANCE HERO ────────────────────────────────────── */}
          <View style={[styles.heroCard, {
            backgroundColor: balance.balance >= 0 ? theme.accent : theme.expense,
          }]}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>Balance del Mes</Text>
                <Text style={styles.heroAmount}>
                  {balance.balance < 0 ? '-' : ''}${Math.abs(balance.balance).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <MaterialCommunityIcons
                  name={balance.balance >= 0 ? 'trending-up' : 'trending-down'}
                  size={28}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="arrow-up-circle" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}> Ingresos</Text>
                <Text style={styles.heroStatValue}>${balance.income.toFixed(2)}</Text>
              </View>
              <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}> Gastos</Text>
                <Text style={styles.heroStatValue}>${balance.expenses.toFixed(2)}</Text>
              </View>
              <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="wallet" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatLabel}> Total Cuentas</Text>
                <Text style={styles.heroStatValue}>${totalAccountBalance.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ─── STAT CARDS ──────────────────────────────────────── */}
          <View style={styles.statRow}>
            <StatCard
              icon="arrow-up-circle"
              label="Ingresos"
              value={`$${balance.income.toFixed(2)}`}
              color={theme.income}
              subtext={`${transactions.filter(t => t.type === 'income').length} transacciones`}
              style={{ marginRight: 6 }}
            />
            <StatCard
              icon="arrow-down-circle"
              label="Gastos"
              value={`$${balance.expenses.toFixed(2)}`}
              color={theme.expense}
              subtext={`${transactions.filter(t => t.type === 'expense').length} transacciones`}
              style={{ marginLeft: 6 }}
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              icon="bank-outline"
              label="Saldo Neto"
              value={`${balance.balance < 0 ? '-' : ''}$${Math.abs(balance.balance).toFixed(2)}`}
              color={balance.balance >= 0 ? theme.income : theme.expense}
              subtext="ingresos − gastos"
              style={{ marginRight: 6 }}
            />
            <StatCard
              icon="shape"
              label="Top Categoría"
              value={topCategory ? topCategory.name : 'N/A'}
              color={topCategory ? topCategory.color : theme.accent}
              subtext={topCategory ? `${topCategory.percentage}% del gasto` : 'Sin gastos'}
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* ─── INGRESOS VS GASTOS ───────────────────────────────── */}
          <SectionCard title="Comparativa Mensual" theme={theme}>
            <ComparisonCard income={balance.income} expenses={balance.expenses} />
          </SectionCard>

          {/* ─── CHART TOGGLE + CHART ─────────────────────────────── */}
          <SectionCard
            title="Análisis de Gastos"
            theme={theme}
            right={
              <View style={[styles.chartToggle, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    activeChart === 'pie' && { backgroundColor: theme.accent },
                  ]}
                  onPress={() => setActiveChart('pie')}
                >
                  <MaterialCommunityIcons
                    name="chart-pie"
                    size={16}
                    color={activeChart === 'pie' ? '#fff' : theme.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    activeChart === 'bar' && { backgroundColor: theme.accent },
                  ]}
                  onPress={() => setActiveChart('bar')}
                >
                  <MaterialCommunityIcons
                    name="chart-bar"
                    size={16}
                    color={activeChart === 'bar' ? '#fff' : theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
            }
          >
            {activeChart === 'pie' ? (
              <>
                <PieChart data={pieData} size={180} />
                {pieData.length > 0 && <ChartLegend data={pieData} />}
              </>
            ) : (
              <>
                <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
                  Gastos por día del mes
                </Text>
                <BarChart data={barData} color={theme.expense} />
              </>
            )}
          </SectionCard>

          {/* ─── DESGLOSE CATEGORÍAS ─────────────────────────────── */}
          {pieData.length > 0 && (
            <SectionCard title="Desglose por Categoría" theme={theme}>
              {pieData.map((item, i) => (
                <CategoryRow key={i} item={item} theme={theme} total={balance.expenses} />
              ))}
            </SectionCard>
          )}

          {/* ─── CUENTAS ─────────────────────────────────────────── */}
          <SectionCard
            title="Mis Cuentas"
            theme={theme}
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
                <Text style={[styles.seeAll, { color: theme.accent }]}>Ver todas</Text>
              </TouchableOpacity>
            }
          >
            {accounts.length === 0 ? (
              <EmptyState
                icon="bank-outline"
                message="No tienes cuentas registradas"
                action="Crear cuenta"
                onPress={() => navigation.navigate('Accounts')}
                theme={theme}
              />
            ) : (
              accounts.map((acc) => <AccountCard key={acc.id} account={acc} />)
            )}
          </SectionCard>

          {/* ─── ACCIONES RÁPIDAS ────────────────────────────────── */}
          <SectionCard title="Acciones Rápidas" theme={theme}>
            <View style={styles.quickGrid}>
              <QuickAction
                icon="plus-circle-outline"
                label="Nueva Transacción"
                color={theme.accent}
                theme={theme}
                onPress={() => navigation.navigate('Transacciones')}
              />
              <QuickAction
                icon="bank-plus"
                label="Nueva Cuenta"
                color={theme.income}
                theme={theme}
                onPress={() => navigation.navigate('Accounts')}
              />
              <QuickAction
                icon="chart-donut"
                label="Presupuestos"
                color="#AF52DE"
                theme={theme}
                onPress={() => navigation.navigate('Budgets')}
              />
              <QuickAction
                icon="swap-horizontal"
                label="Transacciones"
                color={theme.expense}
                theme={theme}
                onPress={() => navigation.navigate('Transacciones')}
              />
            </View>
          </SectionCard>

          {/* User info footer */}
          <View style={styles.footer}>
            <MaterialCommunityIcons name="account-circle-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.footerText, { color: theme.textMuted }]}>{userEmail}</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────────

function SectionCard({ title, children, theme, right }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function CategoryRow({ item, theme, total }) {
  const pct = total > 0 ? (item.amount / total) * 100 : 0;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.catRow}>
      <View style={[styles.catDot, { backgroundColor: item.color }]} />
      <View style={styles.catInfo}>
        <View style={styles.catTopRow}>
          <Text style={[styles.catName, { color: theme.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.catAmt, { color: theme.textSecondary }]}>${item.amount.toFixed(2)}</Text>
        </View>
        <View style={[styles.catTrack, { backgroundColor: theme.borderLight }]}>
          <Animated.View style={[
            styles.catBar,
            {
              width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              backgroundColor: item.color,
            }
          ]} />
        </View>
        <Text style={[styles.catPct, { color: theme.textMuted }]}>{item.percentage}%</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, color, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: color + '14', borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.quickLabel, { color: theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, message, action, onPress, theme }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={36} color={theme.textMuted} />
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.emptyAction, { color: theme.accent }]}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerGreeting: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  scroll: { padding: 16, paddingBottom: 40 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: 12,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: 2,
  },
  heroStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 4,
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  // Section card
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // Chart toggle
  chartToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    gap: 2,
  },
  toggleBtn: {
    width: 30,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },

  // Category rows
  catRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    marginRight: 12,
  },
  catInfo: { flex: 1 },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  catName: { fontSize: 13, fontWeight: '600' },
  catAmt: { fontSize: 13, fontWeight: '600' },
  catTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  catBar: {
    height: '100%',
    borderRadius: 3,
  },
  catPct: { fontSize: 11, fontWeight: '500' },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    width: (SCREEN_WIDTH - 32 - 32 - 30 - 10) / 2,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Empty
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 13, fontWeight: '500' },
  emptyAction: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerText: { fontSize: 11, fontWeight: '500' },
});
