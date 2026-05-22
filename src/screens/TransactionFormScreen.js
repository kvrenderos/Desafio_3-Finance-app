import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import { createTransaction, updateTransaction } from '../services/transactionService';
import { getUserAccounts } from '../services/accountService';

const EXPENSE_CATEGORIES = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Entretenimiento',
  'Educación', 'Ropa', 'Servicios', 'Otros',
];
const INCOME_CATEGORIES = [
  'Salario', 'Freelance', 'Negocio', 'Inversiones', 'Regalo', 'Otros',
];

export default function TransactionFormScreen({ route, navigation }) {
  const editingTransaction = route.params?.transaction || null;
  const userId = auth.currentUser?.uid;

  const [accounts, setAccounts] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRequirements() {
      try {
        const accs = await getUserAccounts(userId);
        setAccounts(accs);
        if (accs.length > 0 && !editingTransaction) {
          setAccountId(accs[0].id);
        }
      } catch (err) {
        Alert.alert('Error', 'No se pudieron cargar las cuentas.');
      } finally {
        setLoadingConfig(false);
      }
    }
    loadRequirements();
  }, []);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
    }
  }, [editingTransaction]);

  const handleSubmit = async () => {
    const finalCategory = customCategory.trim() || category;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto numérico mayor a cero.');
      return;
    }
    if (!finalCategory) {
      Alert.alert('Categoría requerida', 'Selecciona o escribe una categoría.');
      return;
    }
    if (!accountId) {
      Alert.alert('Cuenta requerida', 'Selecciona una cuenta para la transacción.');
      return;
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Fecha inválida', 'La fecha debe tener el formato AAAA-MM-DD.');
      return;
    }

    const payload = {
      userId,
      accountId,
      type,
      amount: parseFloat(amount),
      category: finalCategory,
      description: description.trim(),
      date,
    };

    setSaving(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, editingTransaction, payload);
        Alert.alert('Actualizado', 'Transacción actualizada correctamente.');
      } else {
        await createTransaction(payload);
        Alert.alert('Guardado', 'Transacción registrada con éxito.');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la transacción.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingConfig) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}</Text>

        {/* Tipo */}
        <Text style={styles.label}>Tipo de movimiento *</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
            onPress={() => { setType('expense'); setCategory(''); setCustomCategory(''); }}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>📉 Gasto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
            onPress={() => { setType('income'); setCategory(''); setCustomCategory(''); }}
          >
            <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>📈 Ingreso</Text>
          </TouchableOpacity>
        </View>

        {/* Monto */}
        <Text style={styles.label}>Monto ($) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#475569"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Cuenta */}
        <Text style={styles.label}>Cuenta *</Text>
        {accounts.length === 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ No tienes cuentas creadas. Ve a la pestaña Cuentas primero.</Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.chip, accountId === acc.id && styles.chipSelected,
                  editingTransaction && { opacity: 0.6 }]}
                onPress={() => !editingTransaction && setAccountId(acc.id)}
                disabled={!!editingTransaction}
              >
                <Text style={accountId === acc.id ? styles.chipTextActive : styles.chipText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {editingTransaction && (
          <Text style={styles.hintText}>* La cuenta no se puede cambiar al editar.</Text>
        )}

        {/* Categoría */}
        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.chipRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipSelected]}
              onPress={() => { setCategory(cat); setCustomCategory(''); }}
            >
              <Text style={category === cat ? styles.chipTextActive : styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="O escribe una categoría personalizada..."
          placeholderTextColor="#475569"
          value={customCategory}
          onChangeText={(v) => { setCustomCategory(v); setCategory(''); }}
        />

        {/* Fecha */}
        <Text style={styles.label}>Fecha (AAAA-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 2026-05-21"
          placeholderTextColor="#475569"
          value={date}
          onChangeText={setDate}
        />

        {/* Descripción */}
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Supermercado La Colonia"
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={[styles.btnSubmit, saving && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnSubmitText}>{editingTransaction ? '✅ Actualizar' : '✅ Guardar Transacción'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 20 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    color: '#f8fafc', padding: 14, borderRadius: 10, fontSize: 15,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  typeBtnExpense: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  typeBtnIncome: { backgroundColor: '#14532d', borderColor: '#22c55e' },
  typeBtnText: { color: '#64748b', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155',
  },
  chipSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  chipTextActive: { color: '#fff', fontSize: 12, fontWeight: '600' },
  warningBox: { backgroundColor: '#431407', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#c2410c' },
  warningText: { color: '#fb923c', fontSize: 13 },
  hintText: { color: '#475569', fontSize: 11, marginTop: 4 },
  btnSubmit: {
    backgroundColor: '#3b82f6', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 28,
  },
  btnSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
