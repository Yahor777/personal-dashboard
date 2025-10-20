// 👍👎 Система предпочтений пользователя

import type { OLXListing } from '../data/mockOLXData';

export interface UserPreference {
  listingId: string;
  action: 'like' | 'dislike' | 'neutral';
  timestamp: number;
  listingData: {
    title: string;
    price: number;
    condition: string;
    brand?: string;
    category: string;
    seller: string;
  };
}

export interface PreferenceProfile {
  likes: UserPreference[];
  dislikes: UserPreference[];
  
  // Анализ предпочтений
  preferredBrands: string[];
  avoidedBrands: string[];
  preferredPriceRange: { min: number; max: number };
  preferredCondition: 'new' | 'used' | 'any';
  preferredSellers: string[];
}

const STORAGE_KEY = 'olx_user_preferences';

/**
 * 💾 Сохранить предпочтение
 */
export function savePreference(listing: OLXListing, action: 'like' | 'dislike'): void {
  const preferences = getPreferences();
  
  const preference: UserPreference = {
    listingId: listing.id,
    action,
    timestamp: Date.now(),
    listingData: {
      title: listing.title,
      price: listing.price,
      condition: listing.condition,
      brand: listing.brand,
      category: listing.category,
      seller: listing.seller.name,
    },
  };
  
  // Удаляем старое предпочтение для этого товара если было
  const filtered = preferences.filter(p => p.listingId !== listing.id);
  
  // Добавляем новое
  filtered.push(preference);
  
  // Сохраняем (максимум 500 предпочтений)
  const toSave = filtered.slice(-500);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log(`[Preferences] Saved ${action} for: ${listing.title}`);
  } catch (error) {
    console.error('[Preferences] Save error:', error);
  }
}

/**
 * 📊 Получить все предпочтения
 */
export function getPreferences(): UserPreference[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Preferences] Load error:', error);
    return [];
  }
}

/**
 * 🔍 Получить действие для товара
 */
export function getPreferenceForListing(listingId: string): 'like' | 'dislike' | 'neutral' {
  const preferences = getPreferences();
  const pref = preferences.find(p => p.listingId === listingId);
  return pref?.action || 'neutral';
}

/**
 * 🧠 Создать профиль предпочтений пользователя
 */
export function buildPreferenceProfile(): PreferenceProfile {
  const preferences = getPreferences();
  
  const likes = preferences.filter(p => p.action === 'like');
  const dislikes = preferences.filter(p => p.action === 'dislike');
  
  // Анализ брендов
  const likedBrands = likes
    .filter(p => p.listingData.brand)
    .map(p => p.listingData.brand!);
  const dislikedBrands = dislikes
    .filter(p => p.listingData.brand)
    .map(p => p.listingData.brand!);
  
  const preferredBrands = Array.from(new Set(likedBrands));
  const avoidedBrands = Array.from(new Set(dislikedBrands));
  
  // Анализ цен
  const likedPrices = likes.map(p => p.listingData.price).filter(p => p > 0);
  const preferredPriceRange = likedPrices.length > 0 ? {
    min: Math.min(...likedPrices),
    max: Math.max(...likedPrices),
  } : { min: 0, max: 10000 };
  
  // Анализ состояния
  const likedConditions = likes.map(p => p.listingData.condition);
  const newCount = likedConditions.filter(c => c === 'new').length;
  const usedCount = likedConditions.filter(c => c === 'used').length;
  const preferredCondition = newCount > usedCount ? 'new' : usedCount > newCount ? 'used' : 'any';
  
  // Анализ продавцов
  const preferredSellers = Array.from(new Set(
    likes.map(p => p.listingData.seller)
  ));
  
  return {
    likes,
    dislikes,
    preferredBrands,
    avoidedBrands,
    preferredPriceRange,
    preferredCondition,
    preferredSellers,
  };
}

/**
 * 🎯 AI оценка с учётом предпочтений пользователя
 */
export function adjustScoreByPreferences(
  listing: OLXListing,
  baseScore: number
): number {
  const profile = buildPreferenceProfile();
  
  let adjustment = 0;
  
  // Бонус за предпочитаемый бренд
  if (listing.brand && profile.preferredBrands.includes(listing.brand)) {
    adjustment += 15;
    console.log(`[AI+Prefs] +15 for preferred brand: ${listing.brand}`);
  }
  
  // Штраф за избегаемый бренд
  if (listing.brand && profile.avoidedBrands.includes(listing.brand)) {
    adjustment -= 20;
    console.log(`[AI+Prefs] -20 for avoided brand: ${listing.brand}`);
  }
  
  // Бонус если цена в предпочитаемом диапазоне
  if (listing.price >= profile.preferredPriceRange.min &&
      listing.price <= profile.preferredPriceRange.max) {
    adjustment += 10;
    console.log(`[AI+Prefs] +10 for price in preferred range`);
  }
  
  // Бонус за предпочитаемое состояние
  if (profile.preferredCondition !== 'any' &&
      listing.condition === profile.preferredCondition) {
    adjustment += 10;
    console.log(`[AI+Prefs] +10 for preferred condition: ${listing.condition}`);
  }
  
  // Бонус за предпочитаемого продавца
  if (profile.preferredSellers.includes(listing.seller.name)) {
    adjustment += 15;
    console.log(`[AI+Prefs] +15 for preferred seller: ${listing.seller.name}`);
  }
  
  // Проверка на прямой дизлайк этого товара
  const pref = getPreferenceForListing(listing.id);
  if (pref === 'dislike') {
    adjustment -= 50; // Сильный штраф за дизлайкнутый товар
    console.log(`[AI+Prefs] -50 for previously disliked`);
  } else if (pref === 'like') {
    adjustment += 30; // Бонус за ранее лайкнутый товар
    console.log(`[AI+Prefs] +30 for previously liked`);
  }
  
  const finalScore = Math.max(0, Math.min(100, baseScore + adjustment));
  
  if (adjustment !== 0) {
    console.log(`[AI+Prefs] Score adjusted: ${baseScore} → ${finalScore} (${adjustment > 0 ? '+' : ''}${adjustment})`);
  }
  
  return finalScore;
}

/**
 * 🗑️ Очистить все предпочтения
 */
export function clearPreferences(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[Preferences] Cleared all preferences');
}

/**
 * 📈 Статистика предпочтений
 */
export function getPreferenceStats() {
  const preferences = getPreferences();
  const profile = buildPreferenceProfile();
  
  return {
    total: preferences.length,
    likes: profile.likes.length,
    dislikes: profile.dislikes.length,
    preferredBrands: profile.preferredBrands.length,
    avoidedBrands: profile.avoidedBrands.length,
    priceRange: profile.preferredPriceRange,
    condition: profile.preferredCondition,
  };
}
