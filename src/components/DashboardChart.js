import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Componente para mostrar gráfica de pastel (Pie Chart) - Versión Simplificada
 */
export const PieChart = ({ data, size = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Text style={styles.noDataText}>Sin datos</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartWrapper}>
      <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2 }}>
        <Text style={styles.noDataText}>Gráfica</Text>
      </View>
    </View>
  );
};

/**
 * Componente para mostrar leyenda de la gráfica
 */
export const ChartLegend = ({ data }) => {
  return (
    <View style={styles.legendContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: item.color },
            ]}
          />
          <View style={styles.legendContent}>
            <Text style={styles.legendLabel}>{item.name}</Text>
            <Text style={styles.legendValue}>
              ${item.amount.toFixed(2)} ({item.percentage}%)
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Componente para gráfica de barras horizontal
 */
export const BarChart = ({ data, maxValue }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.noDataText}>Sin datos disponibles</Text>
      </View>
    );
  }

  const actualMaxValue = maxValue || Math.max(...data.map(d => d.amount));

  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => {
        const percentage = (item.amount / actualMaxValue) * 100;
        return (
          <View key={index} style={styles.barItem}>
            <Text style={styles.barLabel}>{item.day}</Text>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  { width: `${percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.barValue}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/**
 * Componente para mostrar tarjeta de estadística
 */
export const StatCard = ({ icon, label, value, color = '#2196F3', subtext }) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
      </View>
    </View>
  );
};

/**
 * Componente para mostrar comparación (Ingreso vs Gasto)
 */
export const ComparisonCard = ({ income, expenses }) => {
  const maxAmount = Math.max(income, expenses);
  const incomePercent = (income / maxAmount) * 100;
  const expensePercent = (expenses / maxAmount) * 100;

  return (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonTitle}>Ingresos vs Gastos</Text>
      
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonItem}>
          <View style={styles.comparisonBar}>
            <View
              style={[
                styles.comparisonBarFill,
                {
                  width: `${incomePercent}%`,
                  backgroundColor: '#4CAF50',
                },
              ]}
            />
          </View>
          <Text style={styles.comparisonLabel}>Ingresos</Text>
          <Text style={[styles.comparisonAmount, { color: '#4CAF50' }]}>
            ${income.toFixed(2)}
          </Text>
        </View>

        <View style={styles.comparisonItem}>
          <View style={styles.comparisonBar}>
            <View
              style={[
                styles.comparisonBarFill,
                {
                  width: `${expensePercent}%`,
                  backgroundColor: '#FF6B6B',
                },
              ]}
            />
          </View>
          <Text style={styles.comparisonLabel}>Gastos</Text>
          <Text style={[styles.comparisonAmount, { color: '#FF6B6B' }]}>
            ${expenses.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginVertical: 16,
  },
  chartWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  svg: {
    flex: 1,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
  },
  legendContainer: {
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 12,
    marginTop: 2,
  },
  legendContent: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    color: '#666',
  },
  barChartContainer: {
    paddingVertical: 12,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barLabel: {
    width: 30,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  barValue: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: '#999',
  },
  comparisonCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonBar: {
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
