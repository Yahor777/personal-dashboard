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
import { motion } from 'framer-motion';

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
      <Sidebar className="backdrop-blur-xl bg-sidebar/95 border-r border-sidebar-border/50">
        <SidebarHeader className="border-b border-sidebar-border/50 p-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Home className="size-5 text-primary" />
            </motion.div>
            <h2 className="font-semibold tracking-tight">{workspace.name}</h2>
          </motion.div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Вкладки</span>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-accent/50 transition-all"
                  onClick={() => setIsNewTabDialogOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
              </motion.div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="flex-1">
                <SidebarMenu>
                  {(!workspace.tabs || workspace.tabs.length === 0) ? (
                    <motion.div 
                      className="px-4 py-8 text-center text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="mb-4 text-sm">{t('emptyTab')}</p>
                      <Button onClick={() => setIsNewTabDialogOpen(true)} size="sm" className="rounded-full">
                        <Plus className="mr-2 size-4" />
                        {t('newTab')}
                      </Button>
                    </motion.div>
                  ) : (
                    (workspace.tabs || [])
                      .sort((a, b) => a.order - b.order)
                      .map((tab, index) => (
                        <motion.div
                          key={tab.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <SidebarMenuItem>
                            <DropdownMenu>
                              <SidebarMenuButton
                                isActive={currentTabId === tab.id}
                                onClick={() => setCurrentTab(tab.id)}
                                className={`
                                  w-full justify-between rounded-xl transition-all duration-200
                                  ${currentTabId === tab.id 
                                    ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                                    : 'hover:bg-accent/50'
                                  }
                                `}
                              >
                                <span className="truncate font-medium">{tab.title}</span>
                              </SidebarMenuButton>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100 rounded-full transition-all"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
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
                        </motion.div>
                      ))
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50 p-3 space-y-1">
          <SidebarMenu>
            {[
              { icon: Sparkles, label: t('aiAssistant'), onClick: onOpenAI },
              { icon: Search, label: '🛒 OLX Поиск', onClick: onOpenOLXSearch },
              { icon: Cpu, label: '🖥️ PC Builder', onClick: onOpenPCBuilder },
              { icon: Code2, label: '🐍 Python Roadmap', onClick: onOpenPythonLearning },
              { icon: Gamepad2, label: '🎮 CS2 Tracker', onClick: onOpenCS2Tracker },
              { icon: BarChart3, label: t('analytics'), onClick: onOpenAnalytics },
              { icon: Download, label: 'Импорт/Экспорт', onClick: onOpenImportExport },
              { icon: Settings, label: t('settings'), onClick: onOpenSettings },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={item.onClick}
                    className="rounded-xl hover:bg-accent/50 transition-all duration-200"
                  >
                    <item.icon className="size-4" />
                    <span className="text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            ))}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => {
                    if (confirm('Выйти из аккаунта?')) {
                      logout();
                    }
                  }} 
                  className="text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                >
                  <LogOut className="size-4" />
                  <span className="text-sm truncate">
                    Выйти {authState.currentUser && `(${authState.currentUser.name})`}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </motion.div>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isNewTabDialogOpen} onOpenChange={setIsNewTabDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{t('newTab')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-title" className="text-sm font-medium">{t('cardTitle')}</Label>
              <Input
                id="tab-title"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                placeholder="Например: Учёба, Проекты..."
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTab();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tab-template" className="text-sm font-medium">Шаблон</Label>
              <Select value={newTabTemplate} onValueChange={(v: string) => setNewTabTemplate(v as TabTemplate)}>
                <SelectTrigger id="tab-template" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
            <Button variant="outline" onClick={() => setIsNewTabDialogOpen(false)} className="rounded-full">
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateTab} disabled={!newTabTitle.trim()} className="rounded-full">
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
