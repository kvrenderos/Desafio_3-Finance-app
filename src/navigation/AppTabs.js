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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TransactionsList" 
        component={TransactionsScreen} 
      />
      <Stack.Screen 
        name="TransactionForm" 
        component={TransactionFormScreen} 
      />
    </Stack.Navigator>
  );
}

function AccountsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="AccountsList" 
        component={AccountsScreen} 
      />
      <Stack.Screen 
        name="AccountForm" 
        component={AccountFormScreen} 
      />
    </Stack.Navigator>
  );
}

function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="BudgetsList" 
        component={BudgetScreen} 
      />
      <Stack.Screen 
        name="BudgetForm" 
        component={BudgetFormScreen} 
      />
    </Stack.Navigator>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = 'home';
          } else if (route.name === 'Transacciones') {
            iconName = 'swap-horizontal';
          } else if (route.name === 'Accounts') {
            iconName = 'bank';
          } else if (route.name === 'Budgets') {
            iconName = 'chart-pie';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />

      <Tab.Screen 
        name="Transacciones" 
        component={TransactionsStack} 
        options={{ title: 'Transacciones' }}
      />

      <Tab.Screen 
        name="Accounts" 
        component={AccountsStack} 
        options={{ title: 'Cuentas' }}
      />

      <Tab.Screen 
        name="Budgets" 
        component={BudgetStack} 
        options={{ title: 'Presupuestos' }}
      />
    </Tab.Navigator>
  );
}