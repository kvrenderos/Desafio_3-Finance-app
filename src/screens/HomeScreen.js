import { View, Button } from "react-native";
import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);

  return (
    <View>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}