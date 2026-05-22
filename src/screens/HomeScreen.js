import React, { useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Alert } from 'react-native';

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);
  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await logout();
            } catch (err) {
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Bienvenido 👋</Text>
        <Text style={styles.email}>{user?.email || 'Usuario'}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🚀 FinanceApp</Text>
        <Text style={styles.infoText}>
          Controla tus finanzas personales con facilidad. Usa las pestañas de abajo para navegar.
        </Text>
      </View>

      <View style={styles.quickLinks}>
        <Text style={styles.sectionTitle}>Secciones disponibles</Text>

        {[
          { icon: '💸', label: 'Transacciones', desc: 'Registra ingresos y gastos' },
          { icon: '🏦', label: 'Cuentas', desc: 'Administra tus cuentas' },

        ].map(item => (
          <View key={item.label} style={styles.linkCard}>
            <Text style={styles.linkIcon}>{item.icon}</Text>
            <View>
              <Text style={styles.linkLabel}>{item.label}</Text>
              <Text style={styles.linkDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  email: { fontSize: 14, color: '#64748b', marginTop: 4 },
  infoBox: {
    backgroundColor: '#1e3a5f', borderRadius: 14, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: '#2563eb40',
  },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#60a5fa', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#93c5fd', lineHeight: 20 },
  quickLinks: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#94a3b8', marginBottom: 12 },
  linkCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  linkIcon: { fontSize: 26 },
  linkLabel: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  linkDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
