import { Plus, Settings, BarChart3, Download, Home, Sparkles, Search, LogOut, Cpu, Code2, Gamepad2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { TabTemplate } from '../types';

interface AppSidebarProps {
  onOpenSettings: () => void;
  onOpenImportExport: () => void;
  onOpenAnalytics: () => void;
  onOpenAI: () => void;
  onOpenOLXSearch: () => void;
  onOpenPCBuilder: () => void;
  onOpenPythonLearning: () => void;
  onOpenCS2Tracker: () => void;
}

export function AppSidebar({ 
  onOpenSettings, 
  onOpenImportExport, 
  onOpenAnalytics, 
  onOpenAI, 
  onOpenOLXSearch, 
  onOpenPCBuilder, 
  onOpenPythonLearning, 
  onOpenCS2Tracker 
}: AppSidebarProps) {
  const { workspace, currentTabId, setCurrentTab, addTab, deleteTab, updateTab, authState, logout } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [isNewTabDialogOpen, setIsNewTabDialogOpen] = useState(false);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTabTemplate, setNewTabTemplate] = useState<TabTemplate>('blank');

  const handleCreateTab = () => {
    if (newTabTitle.trim()) {
      addTab(newTabTitle.trim(), newTabTemplate);
      setNewTabTitle('');
      setNewTabTemplate('blank');
      setIsNewTabDialogOpen(false);
    }
  };

  return (
    <>
      <Sidebar className="border-r border-border/60 bg-background">
        <SidebarHeader className="border-b border-border/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
                <Home className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">{workspace.name}</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Вкладки
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-lg hover:bg-accent/50"
                onClick={() => setIsNewTabDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="flex-1">
                <SidebarMenu>
                  {(!workspace.tabs || workspace.tabs.length === 0) ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <p className="mb-4">{t('emptyTab')}</p>
                      <Button onClick={() => setIsNewTabDialogOpen(true)} size="sm" className="rounded-lg">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        {t('newTab')}
                      </Button>
                    </div>
                  ) : (
                    (workspace.tabs || [])
                      .sort((a, b) => a.order - b.order)
                      .map((tab) => (
                        <SidebarMenuItem key={tab.id}>
                          <DropdownMenu>
                            <SidebarMenuButton
                              isActive={currentTabId === tab.id}
                              onClick={() => setCurrentTab(tab.id)}
                              className={`
                                w-full justify-between rounded-lg transition-all
                                ${currentTabId === tab.id 
                                  ? 'bg-foreground/10 text-foreground hover:bg-foreground/15' 
                                  : 'hover:bg-accent/50'
                                }
                              `}
                            >
                              <span className="truncate text-sm font-medium">{tab.title}</span>
                            </SidebarMenuButton>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100 rounded-lg"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-lg">
                              <DropdownMenuItem
                                onClick={() => {
                                  const newTitle = prompt(t('renameTab'), tab.title);
                                  if (newTitle) updateTab(tab.id, { title: newTitle });
                                }}
                              >
                                {t('renameTab')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm('Удалить вкладку?')) {
                                    deleteTab(tab.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                {t('deleteTab')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/60 p-3 space-y-1">
          <SidebarMenu>
            {[
              { icon: Sparkles, label: t('aiAssistant'), onClick: onOpenAI },
              { icon: Search, label: 'OLX Поиск', onClick: onOpenOLXSearch },
              { icon: Cpu, label: 'PC Builder', onClick: onOpenPCBuilder },
              { icon: Code2, label: 'Python', onClick: onOpenPythonLearning },
              { icon: Gamepad2, label: 'CS2 Tracker', onClick: onOpenCS2Tracker },
              { icon: BarChart3, label: t('analytics'), onClick: onOpenAnalytics },
              { icon: Download, label: 'Импорт/Экспорт', onClick: onOpenImportExport },
              { icon: Settings, label: t('settings'), onClick: onOpenSettings },
            ].map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  onClick={item.onClick}
                  className="rounded-lg hover:bg-accent/50 text-sm"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => {
                  if (confirm('Выйти из аккаунта?')) {
                    logout();
                  }
                }} 
                className="text-destructive hover:bg-destructive/10 rounded-lg text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="truncate">
                  Выйти {authState.currentUser && `(${authState.currentUser.name})`}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isNewTabDialogOpen} onOpenChange={setIsNewTabDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{t('newTab')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-title" className="text-sm font-medium">{t('cardTitle')}</Label>
              <Input
                id="tab-title"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                placeholder="Например: Учёба, Проекты..."
                className="rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTab();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab-template" className="text-sm font-medium">Шаблон</Label>
              <Select value={newTabTemplate} onValueChange={(v: string) => setNewTabTemplate(v as TabTemplate)}>
                <SelectTrigger id="tab-template" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="blank">{t('templateBlank')}</SelectItem>
                  <SelectItem value="school">{t('templateSchool')}</SelectItem>
                  <SelectItem value="cooking">{t('templateCooking')}</SelectItem>
                  <SelectItem value="personal">{t('templatePersonal')}</SelectItem>
                  <SelectItem value="pc-repair">💻 {t('templatePcRepair')}</SelectItem>
                  <SelectItem value="marketplace">🛒 {t('templateMarketplace')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTabDialogOpen(false)} className="rounded-lg">
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateTab} disabled={!newTabTitle.trim()} className="rounded-lg">
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
