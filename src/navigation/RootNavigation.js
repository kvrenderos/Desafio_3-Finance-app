import { NavigationContainer } from "@react-navigation/native";
import { useContext } from "react";

import AuthStack from "./AuthStack";
import AppTabs from "./AppTabs";

import { AuthContext } from "../context/AuthContext";

export default function RootNavigation() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {userToken ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}