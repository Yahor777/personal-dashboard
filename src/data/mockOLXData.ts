// 🎭 Mock данные для OLX (пока backend не работает)

export interface OLXListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  condition: 'new' | 'used';
  description: string;
  image: string;
  seller: {
    name: string;
    type: 'private' | 'business';
    rating?: number;
  };
  publishedAt: string;
  promoted: boolean;
  category: string;
  url?: string; // Прямая ссылка на объявление OLX
  brand?: string; // Бренд товара
  specs?: {
    [key: string]: string; // Характеристики
  };
  views?: number;
  favorites?: number;
}

// 🎮 Mock объявления (реалистичные данные)
export const MOCK_OLX_LISTINGS: OLXListing[] = [
  {
    id: '1',
    title: 'MSI GeForce RTX 3060 Ti VENTUS 2X 8GB OC',
    price: 1299,
    currency: 'zł',
    location: 'Warszawa, Śródmieście',
    city: 'warszawa',
    condition: 'used',
    description: 'Sprzedam RTX 3060 Ti w idealnym stanie. Używana 6 miesięcy do gier. Pełna sprawność, bez OC. Gwarancja do 2026.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
    seller: {
      name: 'Piotr K.',
      type: 'private',
      rating: 4.8,
    },
    publishedAt: '2024-10-12',
    promoted: true,
    category: 'pc-components',
    brand: 'MSI',
    specs: {
      'Pamięć': '8GB GDDR6',
      'Chipset': 'NVIDIA RTX 3060 Ti',
      'Taktowanie': '1410 MHz',
    },
    views: 245,
    favorites: 18,
  },
  {
    id: '2',
    title: 'AMD Ryzen 5 5600X BOX',
    price: 549,
    currency: 'zł',
    location: 'Kraków, Podgórze',
    city: 'krakow',
    condition: 'used',
    description: 'Procesor w bardzo dobrym stanie. 6 rdzeni, 12 wątków. Świetny do gier i pracy. Oryginalne opakowanie.',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
    seller: {
      name: 'Tech-Store',
      type: 'business',
    },
    publishedAt: '2024-10-13',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '3',
    title: 'Gigabyte B550 AORUS ELITE V2',
    price: 429,
    currency: 'zł',
    location: 'Wrocław, Fabryczna',
    city: 'wroclaw',
    condition: 'new',
    description: 'Nowa płyta główna, socket AM4, PCIe 4.0, WiFi 6. Idealna pod Ryzen 5000. Gwarancja producenta 3 lata.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
    seller: {
      name: 'PC-World',
      type: 'business',
    },
    publishedAt: '2024-10-11',
    promoted: true,
    category: 'pc-components',
  },
  {
    id: '4',
    title: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4 3200MHz',
    price: 189,
    currency: 'zł',
    location: 'Poznań, Wilda',
    city: 'poznan',
    condition: 'used',
    description: 'Pamięć RAM DDR4, 2x8GB, 3200MHz CL16. Testowana, działa bez problemu. Idealna do gamingu.',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400',
    seller: {
      name: 'Marek Z.',
      type: 'private',
      rating: 5.0,
    },
    publishedAt: '2024-10-10',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '5',
    title: 'Corsair RM850x 850W 80+ Gold Modular',
    price: 499,
    currency: 'zł',
    location: 'Gdańsk, Wrzeszcz',
    city: 'gdansk',
    condition: 'used',
    description: 'Zasilacz modularny 850W, certyfikat 80+ Gold. Stan bardzo dobry, cicha praca. Gwarancja do 2025.',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400',
    seller: {
      name: 'Kamil M.',
      type: 'private',
      rating: 4.9,
    },
    publishedAt: '2024-10-13',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '6',
    title: 'Samsung 970 EVO Plus 1TB NVMe M.2',
    price: 329,
    currency: 'zł',
    location: 'Łódź, Śródmieście',
    city: 'lodz',
    condition: 'used',
    description: 'Dysk SSD NVMe 1TB, prędkość do 3500 MB/s. Stan idealny, health 99%. Szybki i niezawodny.',
    image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400',
    seller: {
      name: 'Jan N.',
      type: 'private',
      rating: 4.7,
    },
    publishedAt: '2024-10-09',
    promoted: true,
    category: 'pc-components',
  },
  {
    id: '7',
    title: 'NZXT H510 Elite Tempered Glass ATX',
    price: 389,
    currency: 'zł',
    location: 'Katowice, Śródmieście',
    city: 'katowice',
    condition: 'used',
    description: 'Obudowa ATX z hartowanym szkłem. Świetne chłodzenie, RGB LED. Stan bardzo dobry, bez zadrapań.',
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
    seller: {
      name: 'Gaming-Parts',
      type: 'business',
    },
    publishedAt: '2024-10-12',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '8',
    title: 'Intel Core i5-12400F BOX',
    price: 629,
    currency: 'zł',
    location: 'Warszawa, Mokotów',
    city: 'warszawa',
    condition: 'new',
    description: 'Nowy procesor Intel 12 generacji. 6 rdzeni, 12 wątków. Świetna wydajność w grach. Gwarancja 3 lata.',
    image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
    seller: {
      name: 'CPU-Shop',
      type: 'business',
    },
    publishedAt: '2024-10-13',
    promoted: true,
    category: 'pc-components',
  },
  {
    id: '9',
    title: 'MSI MAG B660M MORTAR WiFi DDR4',
    price: 559,
    currency: 'zł',
    location: 'Wrocław, Krzyki',
    city: 'wroclaw',
    condition: 'new',
    description: 'Płyta główna micro-ATX, socket LGA1700, WiFi 6E, DDR4. Świetna jakość wykonania. Gwarancja 2 lata.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
    seller: {
      name: 'Motherboard-Pro',
      type: 'business',
    },
    publishedAt: '2024-10-11',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '10',
    title: 'ASUS TUF Gaming GeForce RTX 3070 Ti 8GB',
    price: 1899,
    currency: 'zł',
    location: 'Poznań, Grunwald',
    city: 'poznan',
    condition: 'used',
    description: 'Karta graficzna RTX 3070 Ti w super stanie. Używana tylko do gier, bez kopania. Gwarancja do 2025.',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
    seller: {
      name: 'Adam W.',
      type: 'private',
      rating: 4.9,
    },
    publishedAt: '2024-10-13',
    promoted: true,
    category: 'pc-components',
  },
  {
    id: '11',
    title: 'Kingston FURY Beast 32GB (2x16GB) DDR4 3600MHz',
    price: 369,
    currency: 'zł',
    location: 'Gdańsk, Oliwa',
    city: 'gdansk',
    condition: 'new',
    description: 'Nowa pamięć RAM DDR4, 32GB dual channel. Wysoka częstotliwość 3600MHz. Idealna do wymagających zadań.',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400',
    seller: {
      name: 'RAM-Store',
      type: 'business',
    },
    publishedAt: '2024-10-10',
    promoted: false,
    category: 'pc-components',
  },
  {
    id: '12',
    title: 'be quiet! Dark Rock Pro 4',
    price: 289,
    currency: 'zł',
    location: 'Kraków, Krowodrza',
    city: 'krakow',
    condition: 'used',
    description: 'Wieżowy cooler CPU. Cicha praca, świetne chłodzenie. Stan bardzo dobry, komplet akcesoriów.',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
    seller: {
      name: 'Tomasz S.',
      type: 'private',
      rating: 5.0,
    },
    publishedAt: '2024-10-12',
    promoted: false,
    category: 'pc-components',
  },
];

// 🔍 Функция фильтрации результатов
export function filterOLXListings(params: {
  query?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  category?: string;
}): OLXListing[] {
  console.log('[Mock OLX] Filter params:', params);
  let results = [...MOCK_OLX_LISTINGS];
  console.log('[Mock OLX] Initial count:', results.length);
  
  // Фильтр по запросу (только если запрос не пустой)
  if (params.query && params.query.trim() !== '') {
    const q = params.query.toLowerCase().trim();
    results = results.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q)
    );
    console.log('[Mock OLX] After query filter:', results.length);
  }
  
  // Фильтр по городу
  if (params.city && params.city !== 'all') {
    results = results.filter(item => item.city === params.city);
    console.log('[Mock OLX] After city filter:', results.length);
  }
  
  // Фильтр по цене
  if (params.minPrice) {
    results = results.filter(item => item.price >= params.minPrice!);
  }
  if (params.maxPrice) {
    results = results.filter(item => item.price <= params.maxPrice!);
  }
  
  // Фильтр по состоянию
  if (params.condition && params.condition !== 'all') {
    results = results.filter(item => item.condition === params.condition);
  }
  
  // Фильтр по категории (только если указана конкретная категория)
  if (params.category && params.category !== 'all' && params.category !== 'pc-components') {
    results = results.filter(item => item.category === params.category);
  }
  // Если категория pc-components или all - показываем все
  
  // Сортировка: промо вверху, потом по дате
  results.sort((a, b) => {
    if (a.promoted && !b.promoted) return -1;
    if (!a.promoted && b.promoted) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  
  console.log('[Mock OLX] Final results count:', results.length);
  return results;
}
