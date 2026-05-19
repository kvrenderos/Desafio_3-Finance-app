import { NavigationContainer } from "@react-navigation/native";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";

import AuthStack from "./AuthStack";
import AppTabs from "./AppTabs";

import { AuthContext } from "../context/AuthContext";

export default function RootNavigation() {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}