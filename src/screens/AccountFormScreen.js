import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { createAccount, updateAccount } from '../services/accountService';

const ACCOUNT_TYPES = ['Efectivo', 'Tarjeta', 'Banco', 'Ahorro'];

export default function AccountFormScreen({ route, navigation }) {
  const editingAccount = route.params?.account || null;
  const userId = auth.currentUser?.uid;

  const [name, setName] = useState('');
  const [type, setType] = useState('Efectivo');
  const [initialBalance, setInitialBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setInitialBalance(editingAccount.balance.toString());
    }
  }, [editingAccount]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta es requerido');
      return false;
    }
    if (name.length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!initialBalance || isNaN(initialBalance) || parseFloat(initialBalance) < 0) {
      Alert.alert('Error', 'Ingresa un balance válido (número no negativo)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: name.trim(),
          type,
          balance: parseFloat(initialBalance),
        });
        Alert.alert('Éxito', 'Cuenta actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createAccount(userId, {
          name: name.trim(),
          type,
          initialBalance: parseFloat(initialBalance),
        });
        Alert.alert('Éxito', 'Cuenta creada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la cuenta');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color="#2196F3"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de la Cuenta *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Mi Tarjeta de Crédito"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Tipo de Cuenta */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tipo de Cuenta *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScrollView}
              >
                {ACCOUNT_TYPES.map((accountType) => (
                  <TouchableOpacity
                    key={accountType}
                    onPress={() => setType(accountType)}
                    style={[
                      styles.typeButton,
                      type === accountType && styles.typeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === accountType && styles.typeButtonTextActive,
                      ]}
                    >
                      {accountType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Balance Inicial */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {editingAccount ? 'Balance Actual' : 'Balance Inicial'} *
              </Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.helperText}>
                {editingAccount
                  ? 'Edita el balance manualmente si es necesario'
                  : 'Ingresa el balance inicial de esta cuenta'}
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color="#2196F3"
              />
              <Text style={styles.infoText}>
                El balance se calculará automáticamente cuando agregues transacciones
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingAccount ? 'Actualizar' : 'Crear Cuenta'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  typeScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#1565c0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
