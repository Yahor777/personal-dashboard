// 🤖 AI Анализатор предложений OLX + Обучение на предпочтениях пользователя

import type { OLXListing } from '../data/mockOLXData';
import { adjustScoreByPreferences } from './userPreferences';

export interface AIRecommendation {
  score: number; // 0-100
  category: 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';
  reasons: string[];
  pros: string[];
  cons: string[];
  priceAnalysis: {
    isGoodPrice: boolean;
    priceLevel: 'очень дешево' | 'дешево' | 'средняя цена' | 'дорого' | 'очень дорого';
    comparedToAverage: number; // процент отклонения
  };
}

// 📊 Средние рыночные цены (база данных для сравнения)
const MARKET_PRICES: Record<string, number> = {
  // Видеокарты
  'rtx 3060': 1400,
  'rtx 3060 ti': 1800,
  'rtx 3070': 2200,
  'rtx 3080': 3000,
  'rtx 4060': 1600,
  'rtx 4070': 2800,
  'rtx 4080': 4500,
  
  // Процессоры
  'ryzen 5 5600': 600,
  'ryzen 5 5600x': 800,
  'ryzen 7 5800x': 1200,
  'ryzen 7 5800x3d': 1500,
  'ryzen 7 7800x3d': 2000,
  'i5-12400': 700,
  'i5-13600k': 1300,
  'i7-13700k': 1800,
  
  // Смартфоны
  'iphone 13': 2800,
  'iphone 13 pro': 3500,
  'iphone 14': 3200,
  'iphone 14 pro': 4200,
  'iphone 15': 3800,
  'samsung s23': 3000,
  'samsung s23 ultra': 4500,
  'samsung s24': 3500,
  
  // Ноутбуки
  'laptop gaming': 4000,
  'macbook air': 4500,
  'macbook pro': 7000,
  
  // Консоли
  'playstation 5': 2500,
  'ps5': 2500,
  'xbox series x': 2300,
  'nintendo switch': 1300,
  'nintendo switch oled': 1500,
};

/**
 * 🧠 Главная функция AI анализа
 */
export function analyzeOffer(listing: OLXListing, allListings: OLXListing[]): AIRecommendation {
  const pros: string[] = [];
  const cons: string[] = [];
  const reasons: string[] = [];
  let score = 50; // Базовая оценка
  
  // 1. Анализ цены
  const priceAnalysis = analyzePriceCompetitiveness(listing, allListings);
  
  if (priceAnalysis.isGoodPrice) {
    score += 20;
    pros.push(`💰 Выгодная цена (${priceAnalysis.comparedToAverage > 0 ? '+' : ''}${priceAnalysis.comparedToAverage.toFixed(0)}% от средней)`);
  } else if (priceAnalysis.priceLevel === 'очень дорого') {
    score -= 25;
    cons.push(`💸 Завышенная цена (+${priceAnalysis.comparedToAverage.toFixed(0)}% от средней)`);
  }
  
  // 2. Анализ состояния
  if (listing.condition === 'new') {
    score += 15;
    pros.push('✨ Новый товар с гарантией');
  } else {
    if (listing.price < (getMarketPrice(listing.title) * 0.7)) {
      pros.push('📦 Б/У но очень выгодная цена');
    } else {
      cons.push('⚠️ Б/У товар по высокой цене');
      score -= 10;
    }
  }
  
  // 3. Анализ продавца
  if (listing.seller.type === 'business') {
    score += 10;
    pros.push('🏢 Магазин - официальная гарантия');
  } else if (listing.seller.rating && listing.seller.rating >= 4.5) {
    score += 5;
    pros.push(`⭐ Высокий рейтинг продавца (${listing.seller.rating}/5)`);
  } else if (listing.seller.rating && listing.seller.rating < 3) {
    score -= 15;
    cons.push(`⚠️ Низкий рейтинг продавца (${listing.seller.rating}/5)`);
  }
  
  // 4. Промо объявления
  if (listing.promoted) {
    score += 5;
    reasons.push('📢 Промо объявление - больше внимания');
  }
  
  // 5. Анализ даты публикации
  const daysOld = getDaysOld(listing.publishedAt);
  if (daysOld < 2) {
    pros.push('🆕 Свежее объявление');
    score += 5;
  } else if (daysOld > 30) {
    cons.push('⏰ Старое объявление - возможно уже продано');
    score -= 10;
  }
  
  // 6. Проверка на подозрительность
  if (listing.price < getMarketPrice(listing.title) * 0.4) {
    cons.push('🚨 ПОДОЗРИТЕЛЬНО низкая цена - возможно мошенничество');
    score -= 30;
    reasons.push('Слишком хорошо чтобы быть правдой');
  }
  
  // 7. Анализ локации
  const popularCities = ['warszawa', 'krakow', 'wroclaw', 'poznan', 'gdansk'];
  if (popularCities.includes(listing.city.toLowerCase())) {
    reasons.push('📍 Популярный город - легче получить/осмотреть');
  }
  
  // 🧠 ОБУЧЕНИЕ: Корректируем оценку на основе предпочтений пользователя
  const adjustedScore = adjustScoreByPreferences(listing, score);
  
  // Если оценка изменилась из-за предпочтений - добавляем пояснение
  if (adjustedScore !== score) {
    const diff = adjustedScore - score;
    if (diff > 0) {
      reasons.unshift(`🎓 AI обучился: +${diff} (похоже на то что вам нравится)`);
    } else {
      reasons.unshift(`🎓 AI обучился: ${diff} (похоже на то что вы избегаете)`);
    }
  }
  
  // Определяем категорию на основе СКОРРЕКТИРОВАННОЙ оценки
  let category: AIRecommendation['category'];
  if (adjustedScore >= 80) {
    category = 'excellent';
    reasons.unshift('🎯 ОТЛИЧНОЕ ПРЕДЛОЖЕНИЕ - рекомендую брать!');
  } else if (adjustedScore >= 65) {
    category = 'good';
    reasons.unshift('✅ Хорошее предложение');
  } else if (adjustedScore >= 45) {
    category = 'fair';
    reasons.unshift('🤔 Среднее предложение - можно рассмотреть');
  } else if (adjustedScore >= 30) {
    category = 'poor';
    reasons.unshift('⚠️ Слабое предложение - ищите лучше');
  } else {
    category = 'avoid';
    reasons.unshift('🚫 ИЗБЕГАТЬ - высокий риск!');
  }
  
  return {
    score: Math.max(0, Math.min(100, adjustedScore)),
    category,
    reasons,
    pros,
    cons,
    priceAnalysis,
  };
}

/**
 * 💰 Анализ конкурентоспособности цены
 */
function analyzePriceCompetitiveness(listing: OLXListing, allListings: OLXListing[]) {
  const marketPrice = getMarketPrice(listing.title);
  const actualPrice = listing.price;
  
  // Процент отклонения от рыночной цены
  const comparedToAverage = ((actualPrice - marketPrice) / marketPrice) * 100;
  
  let priceLevel: AIRecommendation['priceAnalysis']['priceLevel'];
  let isGoodPrice: boolean;
  
  if (comparedToAverage < -30) {
    priceLevel = 'очень дешево';
    isGoodPrice = true;
  } else if (comparedToAverage < -10) {
    priceLevel = 'дешево';
    isGoodPrice = true;
  } else if (comparedToAverage < 10) {
    priceLevel = 'средняя цена';
    isGoodPrice = false;
  } else if (comparedToAverage < 30) {
    priceLevel = 'дорого';
    isGoodPrice = false;
  } else {
    priceLevel = 'очень дорого';
    isGoodPrice = false;
  }
  
  return {
    isGoodPrice,
    priceLevel,
    comparedToAverage,
  };
}

/**
 * 💵 Получить среднюю рыночную цену
 */
function getMarketPrice(title: string): number {
  const titleLower = title.toLowerCase();
  
  // Ищем совпадения в базе цен
  for (const [key, price] of Object.entries(MARKET_PRICES)) {
    if (titleLower.includes(key)) {
      return price;
    }
  }
  
  // Если не нашли - возвращаем среднюю цену категории
  if (titleLower.includes('rtx') || titleLower.includes('video') || titleLower.includes('gpu')) {
    return 2000;
  }
  if (titleLower.includes('ryzen') || titleLower.includes('intel') || titleLower.includes('cpu')) {
    return 1000;
  }
  if (titleLower.includes('iphone')) {
    return 3500;
  }
  if (titleLower.includes('samsung')) {
    return 3000;
  }
  if (titleLower.includes('laptop') || titleLower.includes('macbook')) {
    return 4500;
  }
  if (titleLower.includes('ps5') || titleLower.includes('playstation')) {
    return 2500;
  }
  if (titleLower.includes('switch')) {
    return 1400;
  }
  
  // Дефолтная средняя цена
  return 1500;
}

/**
 * 📅 Сколько дней назад опубликовано
 */
function getDaysOld(publishedAt: string): number {
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 🏆 Получить ТОП-3 лучших предложения
 */
export function getTopOffers(listings: OLXListing[]): OLXListing[] {
  const analyzed = listings.map(listing => ({
    listing,
    recommendation: analyzeOffer(listing, listings),
  }));
  
  // Сортируем по score
  analyzed.sort((a, b) => b.recommendation.score - a.recommendation.score);
  
  // Возвращаем топ-3
  return analyzed.slice(0, 3).map(item => item.listing);
}

/**
 * ⚠️ Получить предложения которых лучше избегать
 */
export function getOffersToAvoid(listings: OLXListing[]): OLXListing[] {
  const analyzed = listings.map(listing => ({
    listing,
    recommendation: analyzeOffer(listing, listings),
  }));
  
  // Фильтруем те у которых категория 'avoid' или 'poor'
  const toAvoid = analyzed.filter(item => 
    item.recommendation.category === 'avoid' || item.recommendation.score < 40
  );
  
  return toAvoid.map(item => item.listing);
}
