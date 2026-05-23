import { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { AuthContext } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const googleAuth = Constants.expoConfig?.extra?.googleAuth || {};
  const hasGoogleConfig = Boolean(
    googleAuth.expoClientId ||
    googleAuth.iosClientId ||
    googleAuth.androidClientId ||
    googleAuth.webClientId
  );

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: googleAuth.webClientId || googleAuth.expoClientId || "google-sign-in-not-configured.apps.googleusercontent.com",
    expoClientId: googleAuth.expoClientId || undefined,
    iosClientId: googleAuth.iosClientId || undefined,
    androidClientId: googleAuth.androidClientId || undefined,
    webClientId: googleAuth.webClientId || undefined,
  });

  useEffect(() => {
    const finishGoogleLogin = async () => {
      if (googleResponse?.type !== "success") return;

      const { id_token: idToken } = googleResponse.params || {};
      const accessToken = googleResponse.authentication?.accessToken;

      if (!idToken && !accessToken) {
        Alert.alert("Google Sign-In", "No se recibieron credenciales de Google.");
        return;
      }

      setIsLoading(true);
      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        const userCredential = await signInWithCredential(auth, credential);
        await login(userCredential.user.uid);
      } catch (error) {
        Alert.alert("Google Sign-In", error.message || "No se pudo iniciar sesion con Google.");
      } finally {
        setIsLoading(false);
      }
    };

    finishGoogleLogin();
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    if (!hasGoogleConfig) {
      Alert.alert(
        "Configura Google Sign-In",
        "Agrega los client IDs de OAuth en app.json > extra.googleAuth para activar este inicio de sesion."
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (error) {
      Alert.alert("Google Sign-In", "No se pudo abrir el flujo de autenticacion.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Correo inválido", "El formato del correo electrónico no es correcto.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña corta",
        "La contraseña debe tener mínimo 6 caracteres."
      );
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = userCredential.user.uid;
      await login(token);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          Alert.alert("Acceso denegado", "Correo o contraseña incorrectos.");
          break;
        case "auth/invalid-email":
          Alert.alert("Error", "El formato del correo es inválido.");
          break;
        case "auth/too-many-requests":
          Alert.alert("Error", "Demasiados intentos. Intenta más tarde.");
          break;
        default:
          Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>FinanceApp</Text>
          <Text style={styles.subtitle}>Tu control financiero inteligente</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading || !googleRequest}
            activeOpacity={0.8}
          >
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Sleek dark mode slate-900
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#cbd5e1",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3b82f6", // Vibrant blue
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#2563eb80",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  linkText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "bold",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  googleButtonDisabled: {
    opacity: 0.55,
  },
});
