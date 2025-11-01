import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Bell, Plus, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useStore } from "../store/useStore";

export default function AppHeader() {
  const { authState } = useStore();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
          <SidebarTrigger className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <span className="sr-only">Открыть меню</span>
              <svg
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </SidebarTrigger>

          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Karo
            </span>
            <span className="text-lg font-semibold leading-tight text-foreground">
              Dashboard
            </span>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Найдите задачу, заметку или вкладку"
              className="h-10 rounded-xl border-border/50 pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Уведомления</span>
          </Button>

          <Button
            size="sm"
            className="hidden rounded-xl bg-foreground text-background hover:bg-foreground/90 md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-2 text-sm font-medium">Новая карточка</span>
          </Button>

          <div className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            {authState.currentUser?.name?.[0]?.toUpperCase() ?? "K"}
          </div>
        </div>
      </div>
    </header>
  );
}
