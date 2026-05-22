import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StyleSheet, Modal, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import { getUserAccounts, createAccount, updateAccount, deleteAccount } from '../services/accountService';

export default function AccountsScreen() {
  const userId = auth.currentUser?.uid;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUserAccounts(userId);
      setAccounts(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las cuentas.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setAccountName('');
    setInitialBalance('0');
    setModalVisible(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setInitialBalance(account.balance.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!accountName.trim()) {
      Alert.alert('Campo requerido', 'El nombre de la cuenta no puede estar vacío.');
      return;
    }
    if (isNaN(initialBalance)) {
      Alert.alert('Dato inválido', 'El saldo inicial debe ser un número válido.');
      return;
    }
    setSaving(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, accountName);
        Alert.alert('Actualizado', 'El nombre de la cuenta fue actualizado.');
      } else {
        await createAccount(userId, accountName, initialBalance);
        Alert.alert('Cuenta creada', `La cuenta "${accountName}" fue creada exitosamente.`);
      }
      setModalVisible(false);
      loadAccounts();
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (account) => {
    Alert.alert(
      'Eliminar cuenta',
      `¿Estás seguro de que deseas eliminar la cuenta "${account.name}"? Esta acción es irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id, userId);
              loadAccounts();
            } catch (err) {
              Alert.alert('No se puede eliminar', err.message || 'Error al eliminar la cuenta.');
            }
          },
        },
      ]
    );
  };

  const renderAccount = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.accountIcon}>🏦</Text>
        <View>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountBalanceLabel}>Saldo actual</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.balance, item.balance < 0 ? styles.negative : styles.positive]}>
          ${parseFloat(item.balance || 0).toFixed(2)}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnEdit} onPress={() => openEditModal(item)}>
            <Text style={styles.btnText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(item)}>
            <Text style={styles.btnText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mis Cuentas</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={renderAccount}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>Aún no tienes cuentas registradas.</Text>
              <Text style={styles.emptySubtext}>Crea tu primera cuenta usando el botón +</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</Text>

            <Text style={styles.inputLabel}>Nombre de la cuenta *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Efectivo, Tarjeta Visa, Banco Agrícola..."
              placeholderTextColor="#94a3b8"
              value={accountName}
              onChangeText={setAccountName}
              autoFocus
            />

            {!editingAccount && (
              <>
                <Text style={styles.inputLabel}>Saldo inicial ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                />
              </>
            )}

            {editingAccount && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 El saldo se calcula automáticamente a partir de tus transacciones. Solo puedes editar el nombre.
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 16 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  accountIcon: { fontSize: 28 },
  accountName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  accountBalanceLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  balance: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  positive: { color: '#22c55e' },
  negative: { color: '#ef4444' },
  actions: { flexDirection: 'row', gap: 6 },
  btnEdit: { backgroundColor: '#3b82f6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  btnDelete: { backgroundColor: '#475569', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#475569', fontSize: 13, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#3b82f6', width: 58, height: 58,
    borderRadius: 29, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: '#334155',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    color: '#f8fafc', padding: 14, borderRadius: 10, fontSize: 15, marginBottom: 16,
  },
  infoBox: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  infoText: { color: '#60a5fa', fontSize: 12 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  btnCancelText: { color: '#94a3b8', fontWeight: '600' },
  btnSave: { flex: 1, backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
