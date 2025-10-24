import * as React from 'react';
import AppHeader from '../components/AppHeader';
import { Button } from '../components/ui/button';
import Spotlight from '../components/ui/spotlight';
import AnimatedGradient from '../components/aceternity/AnimatedGradient';
import BentoGrid, { BentoItem } from '../components/aceternity/BentoGrid';
import TiltCard from '../components/aceternity/TiltCard';
import ParallaxScroll from '../components/aceternity/ParallaxScroll';
import { Sparkles, Brain, ShoppingBag, LayoutGrid, LineChart, Settings } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <AppHeader />
      </div>

      {/* Hero */}
      <section className="relative px-6 pt-14 pb-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-2xl border border-white/10 bg-card/80 shadow-sm backdrop-blur-sm">
            <AnimatedGradient opacity={0.55} />
            <div className="p-8 sm:p-12">
              <div className="flex items-start sm:items-center justify-between gap-6">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                    Personal Dashboard — Aceternity UI + shadcn
                  </h1>
                  <p className="max-w-2xl text-muted-foreground">
                    Соберите задачи, аналитику и ИИ‑инструменты в одном месте. Современные анимации,
                    параллакс, 3D‑элементы и отзывчивый дизайн — всё готово.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg">
                      <Sparkles className="mr-2 size-4" /> Попробовать демо
                    </Button>
                    <Button size="lg" variant="outline">
                      Документация
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:block min-w-[260px]">
                  <Spotlight className="rounded-xl p-6">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Hover для эффекта Spotlight</p>
                      <Button variant="default">Кнопка shadcn</Button>
                    </div>
                  </Spotlight>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features (Bento Grid) */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ключевые возможности</h2>
            <p className="text-muted-foreground">Интуитивная навигация, визуальные акценты и плавные переходы.</p>
          </div>
          <BentoGrid>
            <BentoItem
              title="AI ассистент"
              description="Помогает анализировать задачи, генерировать идеи и оптимизировать процессы."
              icon={<Brain className="size-5" />}
            />
            <BentoItem
              title="OLX поиск"
              description="Находите товары быстрее с динамическими фильтрами и интерактивными карточками."
              icon={<ShoppingBag className="size-5" />}
            />
            <BentoItem
              title="Канбан‑борд"
              description="Управляйте задачами через простые drag‑and‑drop взаимодействия."
              icon={<LayoutGrid className="size-5" />}
            />
            <BentoItem
              title="Аналитика"
              description="Визуализируйте прогресс и метрики в удобных графиках."
              icon={<LineChart className="size-5" />}
            />
            <BentoItem
              title="Импорт/Экспорт"
              description="Лёгкая миграция данных — JSON, CSV и другие форматы."
            />
            <BentoItem
              title="Настройки"
              description="Темы, язык, уведомления и конфиденциальность в одном месте."
              icon={<Settings className="size-5" />}
            />
          </BentoGrid>
        </div>
      </section>

      {/* 3D Tilt Cards */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Интерактивные карточки</h2>
            <p className="text-muted-foreground">Лёгкий 3D‑tilt с бликом для акцентирования внимания.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TiltCard>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Задачи</h3>
                <p className="text-sm text-muted-foreground">Создавайте, сортируйте и отслеживайте выполнение.</p>
              </div>
            </TiltCard>
            <TiltCard>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Покупки</h3>
                <p className="text-sm text-muted-foreground">Сравнивайте позиции и сохраняйте избранное.</p>
              </div>
            </TiltCard>
            <TiltCard>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Аналитика</h3>
                <p className="text-sm text-muted-foreground">Следите за трендами и корректируйте план.</p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Parallax section */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <ParallaxScroll />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-card/80 p-8 shadow-sm backdrop-blur-sm text-center">
            <h3 className="text-2xl font-semibold">Готовы к инновациям?</h3>
            <p className="mt-2 text-muted-foreground">
              Включите Aceternity‑компоненты в свои страницы — получите современный UI/UX с высокой производительностью и доступностью.
            </p>
            <div className="mt-5">
              <Button size="lg"><Sparkles className="mr-2 size-4" /> Начать сейчас</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}