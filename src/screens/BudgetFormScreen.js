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
import { createBudget, updateBudget } from '../services/budgetService';
import { getCategories } from '../services/transactionService';
import { createCategory } from '../services/categoryService';
import { useTheme } from '../context/ThemeContext';

export default function BudgetFormScreen({ route, navigation }) {
  const editingBudget = route.params?.budget || null;
  const userId = auth.currentUser?.uid;
  const { theme } = useTheme();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingBudget) {
      setSelectedCategory(editingBudget.category);
      setLimit(editingBudget.limit.toString());
    }
  }, [editingBudget]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      if (!editingBudget && data.length > 0) {
        setSelectedCategory(data[0].name || data[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría');
      return false;
    }
    if (!limit || isNaN(limit) || parseFloat(limit) <= 0) {
      Alert.alert('Error', 'Ingresa un límite válido (número mayor a 0)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Capitalize category name to maintain consistency
    const finalCategory = selectedCategory.trim().charAt(0).toUpperCase() + selectedCategory.trim().slice(1).toLowerCase();

    setIsLoading(true);
    try {
      // Check if it's a new category and save it globally
      const isNewCategory = !categories.some(c => c.name.toLowerCase() === finalCategory.toLowerCase());
      if (isNewCategory && finalCategory) {
        await createCategory(finalCategory, '#2196F3');
      }

      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          limit: parseFloat(limit),
        });
        Alert.alert('Éxito', 'Presupuesto actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createBudget(userId, {
          category: finalCategory,
          limit: parseFloat(limit),
        });
        Alert.alert('Éxito', 'Presupuesto creado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el presupuesto');
      setIsLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={theme.accent}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Form Content */}
          <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
            {/* Categoría */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoría *</Text>
              <View style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id || cat.name}
                    onPress={() =>
                      setSelectedCategory(cat.name || cat.id)
                    }
                    style={[
                      styles.categoryButton,
                      (selectedCategory === cat.name ||
                        selectedCategory === cat.id) &&
                        styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        (selectedCategory === cat.name ||
                          selectedCategory === cat.id) &&
                          styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.name || cat.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput 
                style={{
                  color: '#2f3640',
                  fontSize: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: '#dcdde1',
                  paddingVertical: 6,
                  marginTop: 10,
                }}
                placeholder="O escribe otra categoría personalizada..." 
                value={selectedCategory} 
                onChangeText={setSelectedCategory}
              />
            </View>

            {/* Límite */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Límite Mensual *</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  value={limit}
                  onChangeText={setLimit}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.helperText}>
                Define el gasto máximo permitido para esta categoría cada mes
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color="#2196F3"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Alertas automáticas</Text>
                <Text style={styles.infoText}>
                  Recibirás una alerta cuando alcances el 80% del límite y si lo
                  excedes
                </Text>
              </View>
            </View>

            {/* Reset Info */}
            <View style={styles.infoBox2}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={20}
                color="#f57c00"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle2}>Reinicio mensual</Text>
                <Text style={styles.infoText}>
                  Los presupuestos se reinician automáticamente el 1º de cada mes
                </Text>
              </View>
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
                  {editingBudget ? 'Actualizar' : 'Crear Presupuesto'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
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
    marginBottom: 12,
  },
  infoBox2: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 2,
  },
  infoTitle2: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 16,
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
