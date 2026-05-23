import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../services/firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { createTransaction, updateTransaction, getUserAccounts, getCategories } from '../services/transactionService';

export default function TransactionFormScreen({ route, navigation }) {
  const editingTransaction = route.params?.transaction || null;
  const userId = auth.currentUser?.uid;
  const { theme } = useTheme();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUri, setReceiptUri] = useState('');

  useEffect(() => {
    async function loadFormRequirements() {
      try {
        const accs = await getUserAccounts(userId);
        const cats = await getCategories();
        setAccounts(accs);
        setCategories(cats);

        if (accs.length > 0 && !editingTransaction) {
          setAccountId(accs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadFormRequirements();
  }, []);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setReceiptUri(editingTransaction.receiptUri || '');
    }
  }, [editingTransaction]);

  const persistReceipt = async (assetUri) => {
    const extension = assetUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `receipt-${Date.now()}.${extension}`;
    const directory = `${FileSystem.documentDirectory}receipts/`;
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    const destination = `${directory}${fileName}`;
    await FileSystem.copyAsync({ from: assetUri, to: destination });
    setReceiptUri(destination);
  };

  const attachReceiptFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara para tomar la foto del recibo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistReceipt(result.assets[0].uri);
    }
  };

  const attachReceiptFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galeria para adjuntar el recibo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistReceipt(result.assets[0].uri);
    }
  };

  const handleProcessSubmit = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Dato inválido", "Por favor ingresa un monto numérico mayor a cero.");
      return;
    }
    if (!category || !accountId || !date) {
      Alert.alert("Campos obligatorios", "Asegúrate de completar el tipo, categoría, cuenta y fecha.");
      return;
    }

    const transactionPayload = {
      userId,
      accountId,
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
      receiptUri,
    };

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, editingTransaction, transactionPayload);
        Alert.alert("Sincronizado", "Transacción editada correctamente.");
      } else {
        await createTransaction(transactionPayload);
        Alert.alert("Sincronizado", "Transacción registrada con éxito.");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error de proceso", error.message || "No se pudo guardar la operación en Firestore.");
    }
  };

  if (loadingConfig) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Preparando requerimientos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.titleHead}>{editingTransaction ? "Modificar Transacción" : "Nueva Transacción"}</Text>

      <Text style={styles.label}>Tipo de movimiento</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'expense' && styles.activeExpense]} 
          onPress={() => setType('expense')}
        >
          <Text style={type === 'expense' ? styles.textActive : styles.textInactive}>Gasto (-)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'income' && styles.activeIncome]} 
          onPress={() => setType('income')}
        >
          <Text style={type === 'income' ? styles.textActive : styles.textInactive}>Ingreso (+)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Monto económico ($) *</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="numeric" 
        placeholder="0.00"
        value={amount} 
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Cuenta financiera origen *</Text>
      {accounts.length === 0 ? (
        <Text style={styles.warningText}>⚠️ No tienes cuentas creadas. Ve al módulo de cuentas primero.</Text>
      ) : (
        <View style={styles.selectorContainer}>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              disabled={!!editingTransaction} 
              style={[styles.selectorItem, accountId === acc.id && styles.selectorItemSelected, editingTransaction && { opacity: 0.6 }]}
              onPress={() => setAccountId(acc.id)}
            >
              <Text style={accountId === acc.id ? styles.textActive : styles.textItem}>{acc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Categoría de asignación *</Text>
      <View style={styles.selectorContainer}>

        {categories.filter(c => c.type === type).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.selectorItem, category === cat.name && styles.selectorItemSelected]}
            onPress={() => setCategory(cat.name)}
          >
            <Text style={category === cat.name ? styles.textActive : styles.textItem}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput 
        style={styles.input} 
        placeholder="O escribe otra categoría personalizada..." 
        value={category} 
        onChangeText={setCategory}
      />

      <Text style={styles.label}>Fecha (AAAA-MM-DD) *</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Ej: 2026-05-19" 
        value={date} 
        onChangeText={setDate}
      />

      <Text style={styles.label}>Concepto / Descripción breve</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Ej: Compra de despensa semanal" 
        value={description} 
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Foto del recibo</Text>
      <View style={styles.receiptActions}>
        <TouchableOpacity style={styles.receiptButton} onPress={attachReceiptFromCamera}>
          <Text style={styles.receiptButtonText}>Tomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.receiptButton} onPress={attachReceiptFromGallery}>
          <Text style={styles.receiptButtonText}>Galeria</Text>
        </TouchableOpacity>
      </View>
      {receiptUri ? (
        <View style={styles.receiptPreview}>
          <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
          <TouchableOpacity onPress={() => setReceiptUri('')}>
            <Text style={styles.removeReceipt}>Quitar recibo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.receiptHint}>Sin recibo adjunto</Text>
      )}

      <TouchableOpacity style={styles.btnSubmit} onPress={handleProcessSubmit}>
        <Text style={styles.btnSubmitText}>{editingTransaction ? "Actualizar Registro" : "Confirmar e Insertar"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleHead: {
    color: '#2c3e50',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  label: {
    color: '#34495e',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
  warningText: {
    color: '#e67e22',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    color: '#2f3640',
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    paddingVertical: 6,
    marginBottom: 5,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 6,
  },
  activeExpense: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  activeIncome: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  selectorItem: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 4,
  },
  selectorItemSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  textItem: {
    color: '#2c3e50',
    fontSize: 13,
  },
  textActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textInactive: {
    color: '#7f8c8d',
  },
  btnSubmit: {
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    padding: 14,
    borderRadius: 6,
    marginTop: 30,
    marginBottom: 50,
  },
  btnSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  receiptButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  receiptButtonText: {
    color: '#3498db',
    fontWeight: '700',
  },
  receiptPreview: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  receiptImage: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 8,
  },
  removeReceipt: {
    color: '#e74c3c',
    fontWeight: '700',
    textAlign: 'center',
  },
  receiptHint: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 6,
  },
});
