// @ts-nocheck
import { Plus, Settings, BarChart3, Download, Upload, Home, Sparkles, Search, LogOut, Cpu, Code2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
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
}

export function AppSidebar({ onOpenSettings, onOpenImportExport, onOpenAnalytics, onOpenAI, onOpenOLXSearch, onOpenPCBuilder, onOpenPythonLearning }: AppSidebarProps) {
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
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <Home className="size-5" />
            <h2>{workspace.name}</h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-4">
              <span>Вкладки</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsNewTabDialogOpen(true)}
              >
                <Plus className="size-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="flex-1">
                <SidebarMenu>
                  {(!workspace.tabs || workspace.tabs.length === 0) ? (
                    <div className="px-4 py-8 text-center text-muted-foreground">
                      <p className="mb-4">{t('emptyTab')}</p>
                      <Button onClick={() => setIsNewTabDialogOpen(true)} size="sm">
                        <Plus className="mr-2 size-4" />
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
                              className="w-full justify-between"
                            >
                              <span className="truncate">{tab.title}</span>
                            </SidebarMenuButton>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                                className="text-destructive"
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

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenAI} className="text-primary">
                <Sparkles className="size-4" />
                <span>{t('aiAssistant')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenOLXSearch} className="text-green-600">
                <Search className="size-4" />
                <span>🛒 OLX Поиск</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenPCBuilder} className="text-blue-600">
                <Cpu className="size-4" />
                <span>🖥️ PC Builder</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenPythonLearning} className="text-green-600">
                <Code2 className="size-4" />
                <span>🐍 Python Roadmap</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenAnalytics}>
                <BarChart3 className="size-4" />
                <span>{t('analytics')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenImportExport}>
                <Download className="size-4" />
                <span>Импорт/Экспорт</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenSettings}>
                <Settings className="size-4" />
                <span>{t('settings')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => {
                  if (confirm('Выйти из аккаунта?')) {
                    logout();
                  }
                }} 
                className="text-destructive"
              >
                <LogOut className="size-4" />
                <span>Выйти {authState.currentUser && `(${authState.currentUser.name})`}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isNewTabDialogOpen} onOpenChange={setIsNewTabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('newTab')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-title">{t('cardTitle')}</Label>
              <Input
                id="tab-title"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                placeholder="Например: Учёба, Проекты..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTab();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab-template">Шаблон</Label>
              <Select value={newTabTemplate} onValueChange={(v: string) => setNewTabTemplate(v as TabTemplate)}>
                <SelectTrigger id="tab-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Button variant="outline" onClick={() => setIsNewTabDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateTab} disabled={!newTabTitle.trim()}>
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
