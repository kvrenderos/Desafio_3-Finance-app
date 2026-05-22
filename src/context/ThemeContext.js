import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_mode';

export const lightTheme = {
  mode: 'light',
  // Backgrounds
  background: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F7F9FF',
  // Text
  textPrimary: '#0D1117',
  textSecondary: '#5A6478',
  textMuted: '#9AA3B2',
  textOnAccent: '#FFFFFF',
  // Brand
  accent: '#3D6FFF',
  accentLight: '#EEF2FF',
  accentDark: '#2554D6',
  // Status
  income: '#00C47D',
  incomeLight: '#E6FBF3',
  expense: '#FF4D6D',
  expenseLight: '#FFF0F3',
  balance: '#3D6FFF',
  balanceLight: '#EEF2FF',
  // UI
  border: '#E8ECF5',
  borderLight: '#F0F3FB',
  shadow: 'rgba(61, 111, 255, 0.08)',
  overlay: 'rgba(13, 17, 23, 0.4)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8ECF5',
  // Charts
  chartColors: ['#3D6FFF', '#FF4D6D', '#00C47D', '#FF9500', '#AF52DE', '#FF6B35', '#00BCD4', '#795548'],
};

export const darkTheme = {
  mode: 'dark',
  // Backgrounds
  background: '#080C14',
  surface: '#111827',
  surfaceElevated: '#1A2235',
  card: '#111827',
  cardAlt: '#151E2E',
  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8A9BB8',
  textMuted: '#4A5568',
  textOnAccent: '#FFFFFF',
  // Brand
  accent: '#4D7BFF',
  accentLight: '#1A2444',
  accentDark: '#6B94FF',
  // Status
  income: '#00D988',
  incomeLight: '#0A2B1E',
  expense: '#FF6080',
  expenseLight: '#2B0F16',
  balance: '#4D7BFF',
  balanceLight: '#0F1A33',
  // UI
  border: '#1E2D45',
  borderLight: '#162030',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBar: '#0D1525',
  tabBarBorder: '#1E2D45',
  // Charts
  chartColors: ['#4D7BFF', '#FF6080', '#00D988', '#FFB340', '#BF7EFF', '#FF8C5A', '#26D4ED', '#A07850'],
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved !== null) {
        setIsDark(saved === 'dark');
      }
    } catch (e) {
      console.warn('Error loading theme:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Error saving theme:', e);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
