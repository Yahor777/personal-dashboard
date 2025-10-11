import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

export function OnboardingOverlay() {
  const { workspace, updateSettings } = useStore();
  const [step, setStep] = useState(0);

  if (workspace.settings.onboardingCompleted) return null;

  const steps = [
    {
      title: 'Добро пожаловать в Мою Панель! 👋',
      description: 'Организуйте учёбу, рецепты и личные заметки в одном месте с помощью удобных канбан-досок.',
      emoji: '🎯',
    },
    {
      title: 'Создайте вкладку',
      description: 'Вкладки помогают разделить разные сферы жизни. Например: Учёба, Рецепты, Личное.',
      emoji: '📂',
    },
    {
      title: 'Добавьте карточки',
      description: 'Карточки — это ваши задачи, заметки, рецепты или flashcards. Перетаскивайте их между колонками!',
      emoji: '📝',
    },
    {
      title: 'Готово! 🎉',
      description: 'Используйте поиск, фильтры, теги и умные функции для максимальной продуктивности.',
      emoji: '✨',
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      updateSettings({ onboardingCompleted: true });
    }
  };

  const handleSkip = () => {
    updateSettings({ onboardingCompleted: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-2xl"
        >
          {/* Progress */}
          <div className="mb-6 flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">{currentStep.emoji}</div>
            <h2 className="mb-4">{currentStep.title}</h2>
            <p className="text-muted-foreground">
              {currentStep.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {step < steps.length - 1 ? (
              <>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Пропустить
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Далее
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} className="w-full">
                <Check className="mr-2 size-4" />
                Начать работу
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
