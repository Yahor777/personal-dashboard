import { toast } from "sonner";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  onError?: (error: unknown) => void;
  retries?: number;
  retryDelayMs?: number;
  rethrow?: boolean;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message);
    return new Error(message || "Неизвестная ошибка");
  }
  return new Error("Неизвестная ошибка");
};

const buildToastMessage = (error: unknown, context: string): string => {
  const err = toError(error);
  if (!context) {
    return err.message || "Произошла ошибка";
  }
  if (err.message && err.message !== "Неизвестная ошибка") {
    return `Ошибка в ${context}: ${err.message}`;
  }
  return `Ошибка в ${context}. Попробуйте снова.`;
};

export const errorHandler = {
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context = "operation",
    options: ErrorHandlerOptions = {}
  ): Promise<T | undefined> {
    const {
      showToast = true,
      toastMessage,
      onError,
      retries = 0,
      retryDelayMs = 500,
      rethrow = false,
    } = options;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`[errorHandler:${context}] attempt ${attempt + 1} failed`, error);
        onError?.(error);

        if (attempt === retries) {
          if (showToast) {
            const message = toastMessage ?? buildToastMessage(error, context);
            toast.error(message);
          }

          if (rethrow) {
            throw toError(error);
          }
          break;
        }

        attempt += 1;
        const waitMs = Math.max(retryDelayMs, 0) * attempt;
        if (waitMs) {
          await delay(waitMs);
        }
      }
    }

    return undefined;
  },
};
