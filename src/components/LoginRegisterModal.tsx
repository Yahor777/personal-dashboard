import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Sparkles, Lock, Mail, User, Rocket } from 'lucide-react';

interface LoginRegisterModalProps {
  onLogin: (email: string, password: string) => boolean;
  onRegister: (name: string, email: string, password: string) => boolean;
}

export function LoginRegisterModal({ onLogin, onRegister }: LoginRegisterModalProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail || !loginPassword) {
      setError('Заполните все поля');
      return;
    }

    const success = onLogin(loginEmail, loginPassword);
    if (!success) {
      setError('Неверный email или пароль');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerName || !registerEmail || !registerPassword) {
      setError('Заполните все поля');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    const success = onRegister(registerName, registerEmail, registerPassword);
    if (!success) {
      setError('Пользователь с таким email уже существует');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-80 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-accent/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-md p-4 animate-in fade-in zoom-in duration-500">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="border-2 shadow-2xl backdrop-blur-sm bg-background/95">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-gradient-to-br from-primary to-accent p-4 shadow-lg animate-in spin-in duration-700">
                  <Sparkles className="size-10 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Personal Dashboard
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Управляйте задачами с AI ассистентом 🚀
                </CardDescription>
              </div>
            </CardHeader>

            <div className="px-6 pb-2">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80"
                >
                  Вход
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80"
                >
                  Регистрация
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="size-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 border-2 focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="size-4 text-primary" />
                      Пароль
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 border-2 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border-2 border-destructive/20 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="size-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Rocket className="mr-2 size-4" />
                    Войти
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-primary hover:underline font-medium"
                    >
                      Зарегистрируйтесь
                    </button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="flex items-center gap-2">
                      <User className="size-4 text-accent" />
                      Имя
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Ваше имя"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="h-11 border-2 focus:border-accent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center gap-2">
                      <Mail className="size-4 text-accent" />
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="h-11 border-2 focus:border-accent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="size-4 text-accent" />
                      Пароль
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="h-11 border-2 focus:border-accent transition-all"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Минимальная длина: 6 символов
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border-2 border-destructive/20 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="size-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="mr-2 size-4" />
                    Создать аккаунт
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Уже есть аккаунт?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-accent hover:underline font-medium"
                    >
                      Войдите
                    </button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Card>
        </Tabs>

        {/* Features list */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-background/80 backdrop-blur-sm border p-3">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xs text-muted-foreground">Kanban доски</p>
          </div>
          <div className="rounded-lg bg-background/80 backdrop-blur-sm border p-3">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs text-muted-foreground">AI ассистент</p>
          </div>
          <div className="rounded-lg bg-background/80 backdrop-blur-sm border p-3">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-muted-foreground">Аналитика</p>
          </div>
        </div>
      </div>
    </div>
  );
}
