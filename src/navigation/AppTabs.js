import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from "../screens/HomeScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import TransactionFormScreen from "../screens/TransactionFormScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AccountFormScreen from "../screens/AccountFormScreen";
import BudgetScreen from "../screens/BudgetScreen";
import BudgetFormScreen from "../screens/BudgetFormScreen";
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionsList" component={TransactionsScreen} />
      <Stack.Screen name="TransactionForm" component={TransactionFormScreen} />
    </Stack.Navigator>
  );
}

function AccountsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountsList" component={AccountsScreen} />
      <Stack.Screen name="AccountForm" component={AccountFormScreen} />
    </Stack.Navigator>
  );
}

function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetsList" component={BudgetScreen} />
      <Stack.Screen name="BudgetForm" component={BudgetFormScreen} />
    </Stack.Navigator>
  );
}

export default function AppTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Inicio: 'home',
            Transacciones: 'swap-horizontal',
            Accounts: 'bank',
            Budgets: 'chart-pie',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name] || 'circle'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Transacciones" component={TransactionsStack} options={{ title: 'Movimientos' }} />
      <Tab.Screen name="Accounts" component={AccountsStack} options={{ title: 'Cuentas' }} />
      <Tab.Screen name="Budgets" component={BudgetStack} options={{ title: 'Presupuestos' }} />
    </Tab.Navigator>
  );
}
