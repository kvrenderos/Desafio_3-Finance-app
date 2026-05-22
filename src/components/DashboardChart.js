import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── PIE CHART (sin SVG — compatible con Expo Go) ──────────────────────────────
// Muestra barras horizontales apiladas en lugar de torta, visualmente equivalente
export const PieChart = ({ data, size = 200 }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="chart-pie" size={40} color={theme.textMuted} />
        <Text style={[styles.noDataText, { color: theme.textMuted }]}>Sin gastos este mes</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <View style={styles.pieWrapper}>
      {/* Barra apilada horizontal */}
      <View style={styles.stackedBarContainer}>
        <View style={styles.stackedBar}>
          {data.map((item, i) => (
            <View
              key={i}
              style={[
                styles.stackedSegment,
                {
                  flex: item.amount,
                  backgroundColor: item.color,
                  borderRadius: i === 0 ? 8 : i === data.length - 1 ? 8 : 0,
                  borderTopLeftRadius: i === 0 ? 8 : 0,
                  borderBottomLeftRadius: i === 0 ? 8 : 0,
                  borderTopRightRadius: i === data.length - 1 ? 8 : 0,
                  borderBottomRightRadius: i === data.length - 1 ? 8 : 0,
                },
              ]}
            />
          ))}
        </View>
        {/* Total centrado debajo */}
        <View style={styles.stackedTotalRow}>
          <Text style={[styles.stackedTotalLabel, { color: theme.textMuted }]}>Total gastos</Text>
          <Text style={[styles.stackedTotalValue, { color: theme.textPrimary }]}>
            ${total.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── CHART LEGEND ───────────────────────────────────────────────────────────────
export const ChartLegend = ({ data }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.legendContainer}>
      {data.map((item, index) => (
        <View key={index} style={[styles.legendItem, { borderBottomColor: theme.borderLight }]}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={[styles.legendLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.legendRight}>
            <Text style={[styles.legendPct, { color: item.color }]}>{item.percentage}%</Text>
            <Text style={[styles.legendAmt, { color: theme.textPrimary }]}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── BAR CHART ─────────────────────────────────────────────────────────────────
export const BarChart = ({ data, maxValue, color }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="chart-bar" size={40} color={theme.textMuted} />
        <Text style={[styles.noDataText, { color: theme.textMuted }]}>Sin datos disponibles</Text>
      </View>
    );
  }

  const accentColor = color || theme.accent;
  const actualMax = maxValue || Math.max(...data.map((d) => d.amount));

  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => {
        const pct = actualMax > 0 ? (item.amount / actualMax) * 100 : 0;
        return (
          <AnimatedBar
            key={index}
            item={item}
            pct={pct}
            color={accentColor}
            theme={theme}
            delay={index * 40}
          />
        );
      })}
    </View>
  );
};

function AnimatedBar({ item, pct, color, theme, delay }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const animWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barDayLabel, { color: theme.textMuted }]}>
        {item.day}
      </Text>
      <View style={[styles.barTrack, { backgroundColor: theme.borderLight }]}>
        <Animated.View style={[styles.barFill, { width: animWidth, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barAmtLabel, { color: theme.textSecondary }]}>
        ${item.amount >= 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount.toFixed(0)}
      </Text>
    </View>
  );
}

// ─── STAT CARD ──────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color, subtext, style }) => {
  const { theme } = useTheme();
  const cardColor = color || theme.accent;

  return (
    <View style={[
      styles.statCard,
      {
        backgroundColor: theme.card,
        borderColor: theme.border,
        shadowColor: theme.shadow,
      },
      style,
    ]}>
      <View style={[styles.statIconBg, { backgroundColor: cardColor + '18' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={cardColor} />
      </View>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: cardColor }]}>{value}</Text>
      {subtext ? (
        <Text style={[styles.statSubtext, { color: theme.textMuted }]}>{subtext}</Text>
      ) : null}
    </View>
  );
};

// ─── COMPARISON CARD ────────────────────────────────────────────────────────────
export const ComparisonCard = ({ income, expenses }) => {
  const { theme } = useTheme();
  const total = income + expenses;
  const incPct = total > 0 ? (income / total) * 100 : 50;
  const expPct = total > 0 ? (expenses / total) * 100 : 50;

  const incAnim = useRef(new Animated.Value(0)).current;
  const expAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(incAnim, { toValue: incPct, duration: 800, useNativeDriver: false }),
      Animated.timing(expAnim, { toValue: expPct, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [incPct, expPct]);

  return (
    <View style={[styles.compCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.compTitle, { color: theme.textPrimary }]}>Ingresos vs Gastos</Text>

      <View style={styles.compRow}>
        {/* Income */}
        <View style={styles.compCol}>
          <View style={styles.compHeader}>
            <View style={[styles.compDot, { backgroundColor: theme.income }]} />
            <Text style={[styles.compLabel, { color: theme.textSecondary }]}>Ingresos</Text>
          </View>
          <Text style={[styles.compAmount, { color: theme.income }]}>${income.toFixed(2)}</Text>
          <View style={[styles.compBarTrack, { backgroundColor: theme.incomeLight }]}>
            <Animated.View style={[
              styles.compBarFill,
              {
                width: incAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: theme.income,
              }
            ]} />
          </View>
          <Text style={[styles.compPct, { color: theme.textMuted }]}>{incPct.toFixed(0)}%</Text>
        </View>

        <View style={[styles.compDivider, { backgroundColor: theme.border }]} />

        {/* Expenses */}
        <View style={styles.compCol}>
          <View style={styles.compHeader}>
            <View style={[styles.compDot, { backgroundColor: theme.expense }]} />
            <Text style={[styles.compLabel, { color: theme.textSecondary }]}>Gastos</Text>
          </View>
          <Text style={[styles.compAmount, { color: theme.expense }]}>${expenses.toFixed(2)}</Text>
          <View style={[styles.compBarTrack, { backgroundColor: theme.expenseLight }]}>
            <Animated.View style={[
              styles.compBarFill,
              {
                width: expAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: theme.expense,
              }
            ]} />
          </View>
          <Text style={[styles.compPct, { color: theme.textMuted }]}>{expPct.toFixed(0)}%</Text>
        </View>
      </View>
    </View>
  );
};

// ─── ACCOUNT CARD ───────────────────────────────────────────────────────────────
const ACCOUNT_ICONS = {
  efectivo: 'cash',
  tarjeta: 'credit-card',
  banco: 'bank',
  ahorros: 'piggy-bank',
  'inversión': 'trending-up',
  default: 'wallet',
};

export const AccountCard = ({ account }) => {
  const { theme } = useTheme();
  const iconName = ACCOUNT_ICONS[account.type?.toLowerCase()] || ACCOUNT_ICONS.default;
  const isPositive = (account.balance || 0) >= 0;

  return (
    <View style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.accountIconWrap, { backgroundColor: theme.accentLight }]}>
        <MaterialCommunityIcons name={iconName} size={20} color={theme.accent} />
      </View>
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: theme.textPrimary }]} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={[styles.accountType, { color: theme.textMuted }]}>
          {account.type || 'Cuenta'} · {account.currency || 'USD'}
        </Text>
      </View>
      <Text style={[
        styles.accountBalance,
        { color: isPositive ? theme.income : theme.expense }
      ]}>
        {isPositive ? '' : '-'}${Math.abs(account.balance || 0).toFixed(2)}
      </Text>
    </View>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  emptyChart: {
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  noDataText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Stacked bar (reemplaza el pie SVG)
  pieWrapper: {
    paddingVertical: 8,
  },
  stackedBarContainer: {
    gap: 12,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    gap: 2,
  },
  stackedSegment: {
    height: '100%',
  },
  stackedTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stackedTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stackedTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Legend
  legendContainer: {
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  legendAmt: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'right',
  },
  // Bar chart
  barChartContainer: {
    paddingTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  barDayLabel: {
    width: 24,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginRight: 8,
  },
  barTrack: {
    flex: 1,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 9,
  },
  barAmtLabel: {
    width: 44,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
  },
  // Stat card
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statSubtext: {
    fontSize: 10,
    marginTop: 3,
  },
  // Comparison
  compCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  compCol: {
    flex: 1,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  compDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  compAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  compBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  compBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  compPct: {
    fontSize: 11,
    fontWeight: '600',
  },
  compDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  // Account card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  accountIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
