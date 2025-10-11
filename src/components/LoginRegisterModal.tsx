import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Sparkles } from 'lucide-react';
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useEffect } from 'react';

interface LoginRegisterModalProps {
  onLogin: (email: string, password: string) => boolean;
  onRegister: (name: string, email: string, password: string) => boolean;
  onGoogleLogin?: (user: any) => void;
}

export function LoginRegisterModal({ onLogin, onRegister, onGoogleLogin }: LoginRegisterModalProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && onGoogleLogin) {
          onGoogleLogin({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          });
        }
      } catch (error: any) {
        console.error('Google redirect error:', error);
        setError('Ошибка входа через Google. Попробуйте снова.');
      }
    };

    checkRedirectResult();
  }, [onGoogleLogin]);

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Use redirect instead of popup to avoid COOP errors
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/invalid-project-id') {
        setError('Firebase не настроен. Пожалуйста, настройте Firebase в консоли разработчика.');
      } else {
        setError('Ошибка входа через Google: ' + (error.message || 'Неизвестная ошибка'));
      }
      setGoogleLoading(false);
    }
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!loginEmail || !loginPassword) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }

    // Simulate async operation
    setTimeout(() => {
      const success = onLogin(loginEmail, loginPassword);
      if (!success) {
        setError('Неверный email или пароль');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!registerName || !registerEmail || !registerPassword) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }

    if (registerPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      setIsLoading(false);
      return;
    }

    // Simulate async operation
    setTimeout(() => {
      const success = onRegister(registerName, registerEmail, registerPassword);
      if (!success) {
        setError('Пользователь с таким email уже существует');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-4">
        <Tabs defaultValue="login" className="w-full">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="size-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Personal Dashboard</CardTitle>
              <CardDescription className="text-center">
                Управляйте задачами с AI ассистентом
              </CardDescription>
            </CardHeader>

            {/* Google Sign-In Button */}
            <CardContent className="pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? 'Вход через Google...' : 'Войти через Google'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Или используйте email
                  </span>
                </div>
              </div>
            </CardContent>

            <TabsList className="grid w-full grid-cols-2 mx-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="size-4" />
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Имя</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Ваше имя"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Минимум 6 символов
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="size-4" />
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Card>
        </Tabs>

        <div className="mt-4 space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Данные хранятся локально в вашем браузере
          </p>
          <p className="text-center text-xs text-muted-foreground">
            🔒 Для Google входа требуется настройка Firebase
          </p>
        </div>
      </div>
    </div>
  );
}
