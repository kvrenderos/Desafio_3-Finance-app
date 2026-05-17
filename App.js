import AuthProvider from "./src/context/AuthContext";
import RootNavigation from "./src/navigation/RootNavigation";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}