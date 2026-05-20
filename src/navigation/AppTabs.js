import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";

import TransactionsScreen from "../screens/TransactionsScreen";
import TransactionFormScreen from "../screens/TransactionFormScreen";

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

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2ecc71', 
        tabBarInactiveTintColor: '#7f8c8d',
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />

      <Tab.Screen 
        name="Transacciones" 
        component={TransactionsStack} 
        options={{ title: 'Mis Finanzas' }}
      />
    </Tab.Navigator>
  );
}