import { FormEvent, useEffect, useState } from "react";
import { getRedirectResult, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { AlertCircle, Sparkles, X } from "lucide-react";

import { auth, googleProvider } from '../config/firebase';
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type GoogleUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

interface LoginRegisterModalProps {
  onLogin: (email: string, password: string) => boolean;
  onRegister: (name: string, email: string, password: string) => boolean;
  onGoogleLogin?: (user: GoogleUser) => void;
  onClose?: () => void;
}

const MIN_PASSWORD_LENGTH = 6;

function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code ?? "");

    if (code.includes("popup-blocked")) {
      return "Всплывающее окно заблокировано. Разрешите всплывающие окна для этого сайта.";
    }
    if (code.includes("popup-closed-by-user")) {
      return "Окно Google было закрыто до завершения авторизации.";
    }
    if (code.includes("cancelled-popup-request")) {
      return "Попробуйте снова после завершения предыдущей попытки входа.";
    }
    if (code.includes("network-request-failed")) {
      return "Проблема с сетью. Проверьте интернет-соединение.";
    }
    if (code.includes("unauthorized-domain")) {
      return "Домен не авторизован в Firebase. Добавьте текущий домен в Firebase Console.";
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message ?? "Произошла ошибка");
  }

  return "Произошла ошибка. Попробуйте снова.";
}

export function LoginRegisterModal({ onLogin, onRegister, onGoogleLogin, onClose }: LoginRegisterModalProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resolveRedirectResult = async () => {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (!isMounted) {
          return;
        }

        if (result?.user && onGoogleLogin) {
          onGoogleLogin({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          });
        }
      } catch (redirectError) {
        if (isMounted) {
          setError(getFirebaseErrorMessage(redirectError));
        }
      } finally {
        if (isMounted) {
          setGoogleLoading(false);
        }
      }
    };

    resolveRedirectResult();

    return () => {
      isMounted = false;
    };
  }, [onGoogleLogin]);

  useEffect(() => {
    if (!onClose) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const submitLogin = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setError(null);

    if (!loginEmail || !loginPassword) {
      setError("Заполните все поля");
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError("Введите корректный email адрес");
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      const success = onLogin(loginEmail, loginPassword);
      if (!success) {
        setError("Неверный email или пароль");
      }
      setIsLoading(false);
    }, 300);
  };

  const submitRegister = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setError(null);

    if (!registerName || !registerEmail || !registerPassword) {
      setError("Заполните все поля");
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setError("Введите корректный email адрес");
      return;
    }

    if (registerPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      const success = onRegister(registerName, registerEmail, registerPassword);
      if (!success) {
        setError("Пользователь с таким email уже существует");
      }
      setIsLoading(false);
    }, 300);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && onGoogleLogin) {
        onGoogleLogin({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      }
    } catch (popupError: unknown) {
      const code =
        typeof popupError === "object" && popupError && "code" in popupError
          ? String((popupError as { code?: string }).code ?? "")
          : "";

      if (
        code.includes("popup-blocked") ||
        code.includes("popup-closed-by-user") ||
        code.includes("cancelled-popup-request")
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      setError(getFirebaseErrorMessage(popupError));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md p-4" onClick={(event) => event.stopPropagation()}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 text-muted-foreground"
          onClick={() => onClose?.()}
          aria-label="Закрыть модальное окно"
        >
          <X className="h-4 w-4" />
        </Button>

        <Tabs defaultValue="login" className="w-full">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl font-semibold">Personal Dashboard</CardTitle>
              <CardDescription className="text-center">
                Быстрый доступ к задачам, уведомлениям и OLX поиску в одном месте.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Войти</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              {error ? (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p className="text-sm leading-5">{error}</p>
                </div>
              ) : null}

              <TabsContent value="login" className="mt-6">
                <form className="space-y-4" onSubmit={submitLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="********"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Выполняем вход..." : "Войти"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form className="space-y-4" onSubmit={submitRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Имя</Label>
                    <Input
                      id="register-name"
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                      placeholder="Иван Иванов"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      placeholder="Минимум 6 символов"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Создаем аккаунт..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </TabsContent>

              <div className="mt-6 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>или</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? "Подключаем Google..." : "Войти через Google"}
              </Button>
            </CardContent>

            <CardFooter className="justify-center text-center text-xs text-muted-foreground">
              Продолжая, вы подтверждаете, что согласны с политикой конфиденциальности и принятиями оферты.
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
