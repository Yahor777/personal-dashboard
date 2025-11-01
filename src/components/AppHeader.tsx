import { useEffect, useState } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "./ui/navigation-menu";
import { Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "./ui/utils";
import { motion } from "framer-motion";

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark", "apple");
      root.classList.remove("neon", "minimal");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark", "neon", "minimal");
      root.classList.add("apple");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        aria-label="Переключить тему"
        variant="ghost"
        className="size-10 rounded-full p-0 hover:bg-accent/50 transition-all duration-200"
        onClick={() => setIsDark((v) => !v)}
      >
        {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </Button>
    </motion.div>
  );
}

export default function AppHeader() {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-30 w-full",
        "backdrop-blur-xl bg-background/80",
        "border-b border-border/50",
        "shadow-sm"
      )}
    >      
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:flex hidden rounded-full hover:bg-accent/50 transition-all" />
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <Sparkles className="size-6 text-primary" />
            </motion.div>
            <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Karo Dashboard
            </span>
          </motion.div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="#" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative group"
                >
                  Главная
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full"></span>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="#" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative group"
                >
                  Задачи
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full"></span>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="#" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative group"
                >
                  Аналитика
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full"></span>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="#" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative group"
                >
                  AI
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full"></span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="default" 
              size="sm" 
              className="hidden md:inline-flex rounded-full shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Sparkles className="mr-2 size-4" />
              Быстрый доступ
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
