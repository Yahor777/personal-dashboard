// 🗂️ Категории и города OLX (точь-в-точь как на OLX)

export interface OLXCategory {
  id: string;
  name: string;
  olxId: string; // ID категории на OLX
  subcategories?: OLXCategory[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  region: string;
}

// 📦 Категории OLX (Электроника → Комплектующие для ПК)
export const OLX_CATEGORIES: OLXCategory[] = [
  {
    id: 'all',
    name: 'Все категории',
    olxId: '',
  },
  {
    id: 'electronics',
    name: '💻 Электроника',
    olxId: '5',
    subcategories: [
      {
        id: 'computers',
        name: 'Компьютеры',
        olxId: '733',
        subcategories: [
          { id: 'pc-components', name: 'Комплектующие для ПК', olxId: '238' },
          { id: 'laptops', name: 'Ноутбуки', olxId: '244' },
          { id: 'monitors', name: 'Мониторы', olxId: '246' },
          { id: 'peripherals', name: 'Периферия', olxId: '285' },
        ],
      },
      {
        id: 'phones-tablets',
        name: 'Телефоны и планшеты',
        olxId: '1429',
        subcategories: [
          { id: 'phones', name: 'Телефоны', olxId: '1437' },
          { id: 'tablets', name: 'Планшеты', olxId: '1439' },
          { id: 'accessories', name: 'Аксессуары', olxId: '1442' },
        ],
      },
    ],
  },
  {
    id: 'home-garden',
    name: '🏠 Дом и сад',
    olxId: '36',
  },
  {
    id: 'fashion',
    name: '👔 Мода',
    olxId: '3',
  },
];

// 🏙️ Города Польши (популярные)
export const POLISH_CITIES: City[] = [
  { id: 'all', name: 'Вся Польша', slug: '', region: 'all' },
  
  // Мазовецкое воеводство
  { id: 'warszawa', name: 'Warszawa', slug: 'warszawa', region: 'mazowieckie' },
  { id: 'radom', name: 'Radom', slug: 'radom', region: 'mazowieckie' },
  { id: 'plock', name: 'Płock', slug: 'plock', region: 'mazowieckie' },
  
  // Малопольское воеводство
  { id: 'krakow', name: 'Kraków', slug: 'krakow', region: 'malopolskie' },
  { id: 'tarnow', name: 'Tarnów', slug: 'tarnow', region: 'malopolskie' },
  { id: 'nowy-sacz', name: 'Nowy Sącz', slug: 'nowy-sacz', region: 'malopolskie' },
  
  // Силезское воеводство
  { id: 'katowice', name: 'Katowice', slug: 'katowice', region: 'slaskie' },
  { id: 'gliwice', name: 'Gliwice', slug: 'gliwice', region: 'slaskie' },
  { id: 'sosnowiec', name: 'Sosnowiec', slug: 'sosnowiec', region: 'slaskie' },
  { id: 'bielsko-biala', name: 'Bielsko-Biała', slug: 'bielsko-biala', region: 'slaskie' },
  
  // Великопольское воеводство
  { id: 'poznan', name: 'Poznań', slug: 'poznan', region: 'wielkopolskie' },
  { id: 'kalisz', name: 'Kalisz', slug: 'kalisz', region: 'wielkopolskie' },
  
  // Нижнесилезское воеводство
  { id: 'wroclaw', name: 'Wrocław', slug: 'wroclaw', region: 'dolnoslaskie' },
  { id: 'walbrzych', name: 'Wałbrzych', slug: 'walbrzych', region: 'dolnoslaskie' },
  { id: 'legnica', name: 'Legnica', slug: 'legnica', region: 'dolnoslaskie' },
  
  // Поморское воеводство
  { id: 'gdansk', name: 'Gdańsk', slug: 'gdansk', region: 'pomorskie' },
  { id: 'gdynia', name: 'Gdynia', slug: 'gdynia', region: 'pomorskie' },
  { id: 'slupsk', name: 'Słupsk', slug: 'slupsk', region: 'pomorskie' },
  
  // Лодзинское воеводство
  { id: 'lodz', name: 'Łódź', slug: 'lodz', region: 'lodzkie' },
  { id: 'piotrkow-trybunalski', name: 'Piotrków Trybunalski', slug: 'piotrkow-trybunalski', region: 'lodzkie' },
  
  // Западно-Поморское воеводство
  { id: 'szczecin', name: 'Szczecin', slug: 'szczecin', region: 'zachodniopomorskie' },
  { id: 'koszalin', name: 'Koszalin', slug: 'koszalin', region: 'zachodniopomorskie' },
  
  // Люблинское воеводство
  { id: 'lublin', name: 'Lublin', slug: 'lublin', region: 'lubelskie' },
  { id: 'zamosc', name: 'Zamość', slug: 'zamosc', region: 'lubelskie' },
  
  // Подкарпатское воеводство
  { id: 'rzeszow', name: 'Rzeszów', slug: 'rzeszow', region: 'podkarpackie' },
  { id: 'przemysl', name: 'Przemyśl', slug: 'przemysl', region: 'podkarpackie' },
  
  // Другие
  { id: 'bydgoszcz', name: 'Bydgoszcz', slug: 'bydgoszcz', region: 'kujawsko-pomorskie' },
  { id: 'torun', name: 'Toruń', slug: 'torun', region: 'kujawsko-pomorskie' },
  { id: 'bialystok', name: 'Białystok', slug: 'bialystok', region: 'podlaskie' },
  { id: 'olsztyn', name: 'Olsztyn', slug: 'olsztyn', region: 'warminsko-mazurskie' },
  { id: 'kielce', name: 'Kielce', slug: 'kielce', region: 'swietokrzyskie' },
  { id: 'opole', name: 'Opole', slug: 'opole', region: 'opolskie' },
  { id: 'zielona-gora', name: 'Zielona Góra', slug: 'zielona-gora', region: 'lubuskie' },
];

// 🏷️ Состояние товара
export const ITEM_CONDITIONS = [
  { id: 'all', name: 'Любое' },
  { id: 'new', name: 'Новое', olxValue: 'new' },
  { id: 'used', name: 'Б/У', olxValue: 'used' },
];

// 👤 Тип продавца
export const SELLER_TYPES = [
  { id: 'all', name: 'Все' },
  { id: 'private', name: 'Частное лицо' },
  { id: 'business', name: 'Бизнес' },
];

// 📅 Дата публикации
export const DATE_FILTERS = [
  { id: 'all', name: 'Любая дата' },
  { id: 'today', name: 'Сегодня', days: 1 },
  { id: 'week', name: 'За неделю', days: 7 },
  { id: 'month', name: 'За месяц', days: 30 },
];

// 🔽 Сортировка
export const SORT_OPTIONS = [
  { id: 'date_desc', name: 'Сначала новые' },
  { id: 'date_asc', name: 'Сначала старые' },
  { id: 'price_asc', name: 'Сначала дешёвые' },
  { id: 'price_desc', name: 'Сначала дорогие' },
  { id: 'relevance', name: 'По релевантности' },
  { id: 'popular', name: 'Популярные' },
];

// 🏷️ Бренды (для PC компонентов)
export const PC_BRANDS = [
  { id: 'all', name: 'Все бренды' },
  { id: 'nvidia', name: 'NVIDIA' },
  { id: 'amd', name: 'AMD' },
  { id: 'intel', name: 'Intel' },
  { id: 'msi', name: 'MSI' },
  { id: 'asus', name: 'ASUS' },
  { id: 'gigabyte', name: 'Gigabyte' },
  { id: 'corsair', name: 'Corsair' },
  { id: 'kingston', name: 'Kingston' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'gskill', name: 'G.Skill' },
];

// 💰 Быстрые фильтры цены (для комплектующих ПК)
export const PRICE_PRESETS = [
  { id: 'any', name: 'Любая', min: null, max: null },
  { id: 'budget', name: 'До 500 zł', min: null, max: 500 },
  { id: 'mid', name: '500-1500 zł', min: 500, max: 1500 },
  { id: 'high', name: '1500-3000 zł', min: 1500, max: 3000 },
  { id: 'premium', name: 'От 3000 zł', min: 3000, max: null },
];

// 🔍 Функция для построения OLX URL
export function buildOLXUrl(params: {
  query: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
}): string {
  const { query, category, city, minPrice, maxPrice, condition } = params;
  
  // Базовый URL
  let url = 'https://www.olx.pl';
  
  // Добавляем город если выбран
  if (city && city !== 'all') {
    const cityData = POLISH_CITIES.find(c => c.id === city);
    if (cityData && cityData.slug) {
      url += `/${cityData.slug}`;
    }
  }
  
  // Добавляем категорию если выбрана
  if (category && category !== 'all') {
    const cat = findCategoryById(category);
    if (cat && cat.olxId) {
      url += `/elektronika`;
    }
  }
  
  // Добавляем поисковый запрос
  url += `/d/oferty/q-${encodeURIComponent(query)}`;
  
  // Параметры
  const urlParams = new URLSearchParams();
  
  // Фильтр цены
  if (minPrice) urlParams.append('search[filter_float_price:from]', minPrice.toString());
  if (maxPrice) urlParams.append('search[filter_float_price:to]', maxPrice.toString());
  
  // Фильтр состояния
  if (condition && condition !== 'all') {
    const cond = ITEM_CONDITIONS.find(c => c.id === condition);
    if (cond && cond.olxValue) {
      urlParams.append('search[filter_enum_condition][0]', cond.olxValue);
    }
  }
  
  // Добавляем параметры к URL
  const paramString = urlParams.toString();
  if (paramString) {
    url += `?${paramString}`;
  }
  
  return url;
}

// Вспомогательная функция для поиска категории по ID
function findCategoryById(id: string, categories: OLXCategory[] = OLX_CATEGORIES): OLXCategory | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.subcategories) {
      const found = findCategoryById(id, cat.subcategories);
      if (found) return found;
    }
  }
  return null;
}
