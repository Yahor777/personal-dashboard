import { useState } from "react";
import { Search, Moon, Sun, Bell, User, BellOff } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useDashboardStore } from "../store/dashboardStore";

interface HeaderProps {
  onCommandOpen: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  onNavigate: (page: string) => void;
  onLoginClick: () => void;
}

export function Header({ onCommandOpen, theme, onThemeChange, onNavigate, onLoginClick }: HeaderProps) {
  const notifications = useDashboardStore((state) => state.notifications);
  const markNotificationRead = useDashboardStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useDashboardStore((state) => state.markAllNotificationsRead);
  const clearNotifications = useDashboardStore((state) => state.clearNotifications);
  const currentUser = useDashboardStore((state) => state.currentUser);
  const logout = useDashboardStore((state) => state.logout);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <div className="flex flex-1 items-center gap-2">
          <h1 className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
        </div>

        <Button
          variant="outline"
          className="relative w-64 justify-start gap-2 px-3"
          onClick={onCommandOpen}
        >
          <Search className="h-4 w-4 opacity-50" />
          <span className="opacity-50">Поиск...</span>
          <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 sm:flex">
            <span className="text-xs">⌘</span>
            <span className="text-xs">K</span>
          </kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span>Уведомления</span>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={markAllNotificationsRead}
                  >
                    Прочитать все
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={clearNotifications}
                  >
                    Очистить
                  </Button>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <BellOff className="mb-2 h-8 w-8" />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={notification.read ? "opacity-60" : ""}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <span>{notification.title}</span>
                      </div>
                      <span className="text-muted-foreground">{notification.time}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {currentUser.name?.[0]?.toUpperCase() ?? <User className="h-5 w-5" />}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("settings")}>
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                }}
                className="text-destructive"
              >
                Выход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="gap-2" onClick={onLoginClick}>
            <User className="h-4 w-4" />
            Войти
          </Button>
        )}
      </div>
    </header>
  );
}
