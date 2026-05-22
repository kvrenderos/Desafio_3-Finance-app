import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { StatCard } from '../components/DashboardChart';

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FinanceApp</Text>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.emailText}>{userEmail || 'Usuario'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen del Mes</Text>
        <View style={styles.statsContainer}>
          <StatCard 
            icon="plus-circle"
            label="Ingresos"
            value="$0.00"
            color="#4CAF50"
          />
          <StatCard 
            icon="minus-circle"
            label="Gastos"
            value="$0.00"
            color="#FF6B6B"
          />
          <StatCard 
            icon="wallet"
            label="Balance"
            value="$0.00"
            color="#2196F3"
          />
        </View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Transacciones')}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.actionText}>Agregar Transacción</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Accounts')}>
          <MaterialCommunityIcons name="bank-plus" size={24} color="#fff" />
          <Text style={styles.actionText}>Nueva Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Budgets')}>
          <MaterialCommunityIcons name="chart-pie" size={24} color="#fff" />
          <Text style={styles.actionText}>Nuevo Presupuesto</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  welcomeCard: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
