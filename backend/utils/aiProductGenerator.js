/**
 * 🤖 AI Product Generator
 * Генерирует реалистичные товары для OLX через AI
 * Использует бесплатные модели OpenRouter
 */

import axios from 'axios';

// OpenRouter API (бесплатные модели)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-your-key-here';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Бесплатные модели (без лимитов)
const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
];

/**
 * 🎲 Генерация товаров через AI
 */
export async function generateProducts(query, count = 20) {
  console.log(`[AI Generator] Generating ${count} products for: "${query}"`);
  
  const prompt = createPrompt(query, count);
  
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: FREE_MODELS[0], // Llama 3.1 8B (быстрая и хорошая)
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating realistic product listings for OLX marketplace in Poland. Generate ONLY valid JSON, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // Высокая креативность
        max_tokens: 4000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Personal Dashboard OLX',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Извлекаем JSON из ответа
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const products = JSON.parse(jsonMatch[0]);
    
    // Добавляем поля OLX формата
    const formattedProducts = products.map((product, index) => ({
      id: `ai-${Date.now()}-${index}`,
      title: product.title,
      price: product.price,
      currency: 'zł',
      condition: product.condition || 'used',
      city: product.city || 'Warszawa',
      location: product.city || 'Warszawa',  // Добавляем location
      category: product.category || 'Elektronika',
      brand: product.brand || extractBrand(product.title),
      description: product.description || product.title,
      seller: product.seller || generateSellerName(),  // Просто строка
      image: `https://picsum.photos/400/300?random=${index}`,
      url: `https://www.olx.pl/d/oferta/ai-${index}`,
      publishedAt: generateDate(),
      marketplace: 'olx',
    }));
    
    console.log(`[AI Generator] ✅ Generated ${formattedProducts.length} products`);
    return formattedProducts;
    
  } catch (error) {
    console.error('[AI Generator] Error:', error.message);
    
    // Fallback: генерируем локально без AI
    console.log('[AI Generator] Falling back to local generation');
    return generateProductsLocally(query, count);
  }
}

/**
 * 📝 Создание prompt для AI
 */
function createPrompt(query, count) {
  return `Generate ${count} realistic OLX marketplace listings for: "${query}"

Requirements:
- Polish market context
- Realistic prices in PLN (zł)
- Varied conditions (new/used)
- Different cities in Poland
- Realistic seller names
- Detailed descriptions in Polish

Return ONLY a JSON array with this structure:
[
  {
    "title": "Product name",
    "price": 1299,
    "condition": "used",
    "city": "Warszawa",
    "category": "Elektronika",
    "brand": "Brand name",
    "description": "Detailed description in Polish",
    "seller": "Seller name"
  }
]

Examples:
- "RTX 3060" → "MSI GeForce RTX 3060 Gaming X 12GB", 1299 zł, used, Warszawa
- "iPhone 13" → "Apple iPhone 13 128GB Niebieski", 2499 zł, used, Kraków
- "RX 580" → "Sapphire RX 580 Nitro+ 8GB", 450 zł, used, Wrocław

Generate NOW:`;
}

/**
 * 🏪 Локальная генерация (fallback без AI)
 */
function generateProductsLocally(query, count) {
  const products = [];
  const queryLower = query.toLowerCase();
  
  // Определяем категорию по запросу
  let template;
  if (queryLower.includes('rx') || queryLower.includes('rtx') || queryLower.includes('gtx')) {
    template = getGPUTemplate(query);
  } else if (queryLower.includes('iphone') || queryLower.includes('samsung') || queryLower.includes('xiaomi')) {
    template = getPhoneTemplate(query);
  } else if (queryLower.includes('laptop') || queryLower.includes('notebook')) {
    template = getLaptopTemplate(query);
  } else if (queryLower.includes('ryzen') || queryLower.includes('intel') || queryLower.includes('cpu')) {
    template = getCPUTemplate(query);
  } else {
    template = getGenericTemplate(query);
  }
  
  for (let i = 0; i < count; i++) {
    products.push(generateFromTemplate(template, i));
  }
  
  return products;
}

/**
 * 🎮 Шаблон для видеокарт
 */
function getGPUTemplate(query) {
  const brands = ['MSI', 'ASUS', 'Gigabyte', 'Sapphire', 'XFX', 'PowerColor'];
  const models = ['Gaming X', 'TUF', 'Eagle', 'Nitro+', 'Pulse', 'Red Devil'];
  const memory = ['4GB', '6GB', '8GB', '12GB', '16GB'];
  
  return {
    type: 'GPU',
    baseName: query.toUpperCase(),
    brands,
    models,
    memory,
    priceRange: [400, 3500],
    cities: ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Katowice'],
  };
}

/**
 * 📱 Шаблон для телефонов
 */
function getPhoneTemplate(query) {
  const storage = ['64GB', '128GB', '256GB', '512GB'];
  const colors = ['Czarny', 'Biały', 'Niebieski', 'Różowy', 'Zielony'];
  
  return {
    type: 'Phone',
    baseName: query,
    storage,
    colors,
    priceRange: [800, 5000],
    cities: ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Łódź'],
  };
}

/**
 * 💻 Шаблон для ноутбуков
 */
function getLaptopTemplate(query) {
  const brands = ['Lenovo', 'Dell', 'HP', 'ASUS', 'Acer', 'MSI'];
  const specs = ['i5/8GB/256GB SSD', 'i7/16GB/512GB SSD', 'Ryzen 5/16GB/512GB'];
  
  return {
    type: 'Laptop',
    baseName: 'Laptop ' + query,
    brands,
    specs,
    priceRange: [1500, 6000],
    cities: ['Warszawa', 'Kraków', 'Wrocław'],
  };
}

/**
 * 🔧 Шаблон для процессоров
 */
function getCPUTemplate(query) {
  return {
    type: 'CPU',
    baseName: query,
    priceRange: [300, 2000],
    cities: ['Warszawa', 'Kraków', 'Poznań'],
  };
}

/**
 * 📦 Общий шаблон
 */
function getGenericTemplate(query) {
  return {
    type: 'Generic',
    baseName: query,
    priceRange: [100, 2000],
    cities: ['Warszawa', 'Kraków', 'Wrocław', 'Poznań'],
  };
}

/**
 * 🎲 Генерация из шаблона
 */
function generateFromTemplate(template, index) {
  const city = template.cities[index % template.cities.length];
  const price = Math.floor(Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]);
  const condition = Math.random() > 0.3 ? 'used' : 'new';
  
  let title;
  if (template.type === 'GPU') {
    const brand = template.brands[index % template.brands.length];
    const model = template.models[index % template.models.length];
    const mem = template.memory[index % template.memory.length];
    title = `${brand} ${template.baseName} ${model} ${mem}`;
  } else if (template.type === 'Phone') {
    const storage = template.storage[index % template.storage.length];
    const color = template.colors[index % template.colors.length];
    title = `${template.baseName} ${storage} ${color}`;
  } else {
    title = `${template.baseName} #${index + 1}`;
  }
  
  return {
    id: `local-${Date.now()}-${index}`,
    title,
    price,
    currency: 'zł',
    condition,
    city,
    location: city,  // Добавляем location для frontend
    category: 'Elektronika',
    brand: extractBrand(title),
    description: `${title} w dobry stanie. ${condition === 'new' ? 'Nowy, nieużywany.' : 'Używany, sprawny.'}`,
    seller: generateSellerName(),  // Упрощаем - возвращаем просто строку
    image: `https://picsum.photos/400/300?random=${index}`,
    url: `https://www.olx.pl/d/oferta/local-${index}`,
    publishedAt: generateDate(),
    marketplace: 'olx',
  };
}

/**
 * 🏷️ Извлечение бренда
 */
function extractBrand(title) {
  const brands = ['MSI', 'ASUS', 'Gigabyte', 'Sapphire', 'AMD', 'NVIDIA', 'Intel', 
                  'Apple', 'Samsung', 'Xiaomi', 'Lenovo', 'Dell', 'HP'];
  
  for (const brand of brands) {
    if (title.toUpperCase().includes(brand.toUpperCase())) {
      return brand;
    }
  }
  
  return 'Generic';
}

/**
 * 👤 Генерация имени продавца
 */
function generateSellerName() {
  const names = ['Jan Kowalski', 'Anna Nowak', 'Piotr Wiśniewski', 'Katarzyna Wójcik', 
                 'TechStore_PL', 'GamingShop', 'ElektroMarket', 'PCParts_Warszawa'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * 📅 Генерация даты публикации
 */
function generateDate() {
  const days = Math.floor(Math.random() * 30);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default { generateProducts };
