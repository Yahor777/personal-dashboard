import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { CommandPalette } from "./components/CommandPalette";
import { Dashboard } from "./components/pages/Dashboard";
import { TasksKanban } from "./components/pages/TasksKanban";
import { Analytics } from "./components/pages/Analytics";
import { CS2Tracker } from "./components/pages/CS2Tracker";
import { OLXSearch } from "./components/pages/OLXSearch";
import { PCBuilder } from "./components/pages/PCBuilder";
import { AIAssistant } from "./components/pages/AIAssistant";
import { PythonLearning } from "./components/pages/PythonLearning";
import { RecentSearches } from "./components/pages/RecentSearches";
import { RecentProjects } from "./components/pages/RecentProjects";
import { Gallery } from "./components/pages/Gallery";
import { ImportExport } from "./components/pages/ImportExport";
import { Settings } from "./components/pages/Settings";
import { Toaster } from "./components/ui/sonner";
import { LoginRegisterModal } from "./components/LoginRegisterModal";
import { useDashboardStore } from "./store/dashboardStore";
import { toast } from "sonner";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [commandOpen, setCommandOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const saved = window.localStorage.getItem("theme");
    return (saved as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const registerUser = useDashboardStore((state) => state.registerUser);
  const loginUser = useDashboardStore((state) => state.loginUser);
  const loginWithGoogle = useDashboardStore((state) => state.loginWithGoogle);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "tasks":
        return <TasksKanban />;
      case "analytics":
        return <Analytics />;
      case "cs2":
        return <CS2Tracker />;
      case "olx":
        return <OLXSearch />;
      case "pc-builder":
        return <PCBuilder />;
      case "ai":
        return <AIAssistant onOpenSettings={() => setCurrentPage("settings")} />;
      case "python":
        return <PythonLearning />;
      case "recent-searches":
        return <RecentSearches />;
      case "recent-projects":
        return <RecentProjects />;
      case "gallery":
        return <Gallery />;
      case "import-export":
        return <ImportExport />;
      case "settings":
        return <Settings theme={theme} onThemeChange={setTheme} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const handleLogin = (email: string, password: string) => {
    const result = loginUser(email, password);
    if (result.success) {
      toast.success("Добро пожаловать!", { description: email });
      setAuthModalOpen(false);
      return true;
    }
    if (result.message) {
      toast.error(result.message);
    }
    return false;
  };

  const handleRegister = (name: string, email: string, password: string) => {
    const result = registerUser(name, email, password);
    if (result.success) {
      toast.success("Аккаунт создан", { description: email });
      setAuthModalOpen(false);
      return true;
    }
    if (result.message) {
      toast.error(result.message);
    }
    return false;
  };

  const handleGoogleLogin = (user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }) => {
    if (!user.email) {
      toast.error("Google не вернул email");
      return;
    }
    loginWithGoogle({
      id: user.uid,
      name: user.displayName ?? user.email,
      email: user.email,
      avatar: user.photoURL,
    });
    toast.success("Вход через Google выполнен");
    setAuthModalOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        onCommandOpen={() => setCommandOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={setCurrentPage}
        onLoginClick={() => setAuthModalOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={(page) => {
          setCurrentPage(page);
          setCommandOpen(false);
        }}
      />
      <Toaster />
      {authModalOpen && (
        <LoginRegisterModal
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
        />
      )}
    </div>
  );
}
