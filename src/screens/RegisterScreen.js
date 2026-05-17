import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../services/firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Complete todos los campos");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      Alert.alert("Éxito", "Usuario creado");

      navigation.navigate("Login");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          Alert.alert("Error", "Ese correo ya existe");
          break;

        case "auth/weak-password":
          Alert.alert(
            "Error",
            "La contraseña es demasiado débil"
          );
          break;

        default:
          Alert.alert("Error", "No se pudo registrar");
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={handleRegister}>
        <Text>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}