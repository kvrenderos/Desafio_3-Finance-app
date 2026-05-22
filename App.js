import AuthProvider from "./src/context/AuthContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import RootNavigation from "./src/navigation/RootNavigation";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigation />
      </ThemeProvider>
    </AuthProvider>
  );
}
