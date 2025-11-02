// 🖥️ База данных PC компонентов для калькулятора совместимости

export interface CPUSpecs {
  id: string;
  name: string;
  brand: 'Intel' | 'AMD';
  socket: string;
  tdp: number; // Watts
  generation: string;
  cores: number;
  threads: number;
  price: number; // zł
  performance: number; // Relative score
}

export interface MotherboardSpecs {
  id: string;
  name: string;
  socket: string;
  chipset: string;
  ramType: 'DDR4' | 'DDR5';
  ramSlots: number;
  maxRam: number; // GB
  pcie: string; // PCIe version
  formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX';
  price: number;
}

export interface RAMSpecs {
  id: string;
  name: string;
  type: 'DDR4' | 'DDR5';
  speed: number; // MHz
  capacity: number; // GB
  sticks: number; // Number of sticks in kit
  price: number;
}

export interface GPUSpecs {
  id: string;
  name: string;
  brand: 'Nvidia' | 'AMD' | 'Intel';
  vram: number; // GB
  tdp: number; // Watts
  length: number; // mm
  performance: number; // Relative score
  price: number;
}

export interface PSUSpecs {
  id: string;
  name: string;
  wattage: number;
  efficiency: '80+ Bronze' | '80+ Silver' | '80+ Gold' | '80+ Platinum' | '80+ Titanium';
  modular: 'Fully Modular' | 'Semi-Modular' | 'Non-Modular';
  price: number;
}

export interface CaseSpecs {
  id: string;
  name: string;
  formFactor: ('ATX' | 'Micro-ATX' | 'Mini-ITX')[];
  maxGPULength: number; // mm
  maxCPUCoolerHeight: number; // mm
  price: number;
}

export interface StorageSpecs {
  id: string;
  name: string;
  type: 'NVMe SSD' | 'SATA SSD' | 'HDD';
  capacity: number; // GB
  price: number;
}

// 🎮 Популярные CPU на рынке Польши (2025)
export const POPULAR_CPUS: CPUSpecs[] = [
  // AMD Ryzen
  {
    id: 'ryzen-5-5600',
    name: 'AMD Ryzen 5 5600',
    brand: 'AMD',
    socket: 'AM4',
    tdp: 65,
    generation: 'Zen 3',
    cores: 6,
    threads: 12,
    price: 400,
    performance: 85,
  },
  {
    id: 'ryzen-5-7600',
    name: 'AMD Ryzen 5 7600',
    brand: 'AMD',
    socket: 'AM5',
    tdp: 65,
    generation: 'Zen 4',
    cores: 6,
    threads: 12,
    price: 850,
    performance: 95,
  },
  {
    id: 'ryzen-7-5700x',
    name: 'AMD Ryzen 7 5700X',
    brand: 'AMD',
    socket: 'AM4',
    tdp: 65,
    generation: 'Zen 3',
    cores: 8,
    threads: 16,
    price: 600,
    performance: 90,
  },
  {
    id: 'ryzen-7-7700',
    name: 'AMD Ryzen 7 7700',
    brand: 'AMD',
    socket: 'AM5',
    tdp: 65,
    generation: 'Zen 4',
    cores: 8,
    threads: 16,
    price: 1200,
    performance: 100,
  },
  // Intel
  {
    id: 'intel-i5-12400f',
    name: 'Intel Core i5-12400F',
    brand: 'Intel',
    socket: 'LGA1700',
    tdp: 65,
    generation: '12th Gen',
    cores: 6,
    threads: 12,
    price: 500,
    performance: 87,
  },
  {
    id: 'intel-i5-13400f',
    name: 'Intel Core i5-13400F',
    brand: 'Intel',
    socket: 'LGA1700',
    tdp: 65,
    generation: '13th Gen',
    cores: 10,
    threads: 16,
    price: 750,
    performance: 93,
  },
  {
    id: 'intel-i5-14400f',
    name: 'Intel Core i5-14400F',
    brand: 'Intel',
    socket: 'LGA1700',
    tdp: 65,
    generation: '14th Gen',
    cores: 10,
    threads: 16,
    price: 850,
    performance: 95,
  },
];

// 🔌 Популярные материнские платы
export const POPULAR_MOTHERBOARDS: MotherboardSpecs[] = [
  // AM4
  {
    id: 'b450-tomahawk',
    name: 'MSI B450 Tomahawk Max',
    socket: 'AM4',
    chipset: 'B450',
    ramType: 'DDR4',
    ramSlots: 4,
    maxRam: 128,
    pcie: 'PCIe 3.0',
    formFactor: 'ATX',
    price: 300,
  },
  {
    id: 'b550-aorus',
    name: 'Gigabyte B550 AORUS Elite',
    socket: 'AM4',
    chipset: 'B550',
    ramType: 'DDR4',
    ramSlots: 4,
    maxRam: 128,
    pcie: 'PCIe 4.0',
    formFactor: 'ATX',
    price: 450,
  },
  // AM5
  {
    id: 'b650-pro',
    name: 'ASUS B650 TUF Gaming Pro',
    socket: 'AM5',
    chipset: 'B650',
    ramType: 'DDR5',
    ramSlots: 4,
    maxRam: 128,
    pcie: 'PCIe 5.0',
    formFactor: 'ATX',
    price: 700,
  },
  // LGA1700
  {
    id: 'b660-pro',
    name: 'MSI B660M PRO',
    socket: 'LGA1700',
    chipset: 'B660',
    ramType: 'DDR4',
    ramSlots: 4,
    maxRam: 128,
    pcie: 'PCIe 4.0',
    formFactor: 'Micro-ATX',
    price: 400,
  },
  {
    id: 'b760-ds3h',
    name: 'Gigabyte B760 DS3H',
    socket: 'LGA1700',
    chipset: 'B760',
    ramType: 'DDR4',
    ramSlots: 4,
    maxRam: 128,
    pcie: 'PCIe 4.0',
    formFactor: 'ATX',
    price: 500,
  },
];

// 💾 Популярная оперативная память
export const POPULAR_RAM: RAMSpecs[] = [
  // DDR4
  {
    id: 'ddr4-3200-16gb',
    name: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4-3200',
    type: 'DDR4',
    speed: 3200,
    capacity: 16,
    sticks: 2,
    price: 200,
  },
  {
    id: 'ddr4-3600-32gb',
    name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3600',
    type: 'DDR4',
    speed: 3600,
    capacity: 32,
    sticks: 2,
    price: 350,
  },
  // DDR5
  {
    id: 'ddr5-5600-16gb',
    name: 'Kingston FURY Beast 16GB (2x8GB) DDR5-5600',
    type: 'DDR5',
    speed: 5600,
    capacity: 16,
    sticks: 2,
    price: 300,
  },
  {
    id: 'ddr5-6000-32gb',
    name: 'G.Skill Trident Z5 32GB (2x16GB) DDR5-6000',
    type: 'DDR5',
    speed: 6000,
    capacity: 32,
    sticks: 2,
    price: 550,
  },
];

// 🎮 Популярные видеокарты
export const POPULAR_GPUS: GPUSpecs[] = [
  // Nvidia
  {
    id: 'rtx-3060',
    name: 'Nvidia RTX 3060 12GB',
    brand: 'Nvidia',
    vram: 12,
    tdp: 170,
    length: 240,
    performance: 75,
    price: 1200,
  },
  {
    id: 'rtx-4060',
    name: 'Nvidia RTX 4060 8GB',
    brand: 'Nvidia',
    vram: 8,
    tdp: 115,
    length: 240,
    performance: 80,
    price: 1400,
  },
  {
    id: 'rtx-4060-ti',
    name: 'Nvidia RTX 4060 Ti 8GB',
    brand: 'Nvidia',
    vram: 8,
    tdp: 160,
    length: 267,
    performance: 88,
    price: 1800,
  },
  // AMD
  {
    id: 'rx-6600',
    name: 'AMD RX 6600 8GB',
    brand: 'AMD',
    vram: 8,
    tdp: 132,
    length: 240,
    performance: 72,
    price: 900,
  },
  {
    id: 'rx-6650-xt',
    name: 'AMD RX 6650 XT 8GB',
    brand: 'AMD',
    vram: 8,
    tdp: 180,
    length: 267,
    performance: 78,
    price: 1100,
  },
  {
    id: 'rx-7600',
    name: 'AMD RX 7600 8GB',
    brand: 'AMD',
    vram: 8,
    tdp: 165,
    length: 240,
    performance: 82,
    price: 1300,
  },
];

// 🔋 Популярные блоки питания
export const POPULAR_PSUS: PSUSpecs[] = [
  {
    id: 'be-quiet-500w',
    name: 'be quiet! System Power 10 500W',
    wattage: 500,
    efficiency: '80+ Bronze',
    modular: 'Non-Modular',
    price: 200,
  },
  {
    id: 'corsair-650w',
    name: 'Corsair CV650 650W',
    wattage: 650,
    efficiency: '80+ Bronze',
    modular: 'Non-Modular',
    price: 250,
  },
  {
    id: 'seasonic-750w',
    name: 'Seasonic Focus GX-750 750W',
    wattage: 750,
    efficiency: '80+ Gold',
    modular: 'Fully Modular',
    price: 400,
  },
];

// 📦 Популярные корпуса
export const POPULAR_CASES: CaseSpecs[] = [
  {
    id: 'nzxt-h510',
    name: 'NZXT H510',
    formFactor: ['ATX', 'Micro-ATX', 'Mini-ITX'],
    maxGPULength: 381,
    maxCPUCoolerHeight: 165,
    price: 300,
  },
  {
    id: 'corsair-4000d',
    name: 'Corsair 4000D Airflow',
    formFactor: ['ATX', 'Micro-ATX', 'Mini-ITX'],
    maxGPULength: 360,
    maxCPUCoolerHeight: 170,
    price: 350,
  },
];

// 💿 Популярные накопители
export const POPULAR_STORAGE: StorageSpecs[] = [
  {
    id: 'samsung-980-500gb',
    name: 'Samsung 980 500GB NVMe',
    type: 'NVMe SSD',
    capacity: 500,
    price: 200,
  },
  {
    id: 'crucial-p3-1tb',
    name: 'Crucial P3 1TB NVMe',
    type: 'NVMe SSD',
    capacity: 1000,
    price: 300,
  },
  {
    id: 'wd-blue-1tb',
    name: 'WD Blue 1TB HDD',
    type: 'HDD',
    capacity: 1000,
    price: 150,
  },
];

// 🎯 Готовые сборки
export interface PCBuild {
  id: string;
  name: string;
  description: string;
  budget: number;
  purpose: string;
  cpu: string;
  motherboard: string;
  ram: string;
  gpu: string;
  psu: string;
  case: string;
  storage: string[];
  totalPrice: number;
  performance: {
    gaming: number;
    productivity: number;
    value: number;
  };
}

export const TEMPLATE_BUILDS: PCBuild[] = [
  {
    id: 'budget-cs2',
    name: 'Бюджетный Gaming (CS2)',
    description: 'Оптимальная сборка для CS2 с 200+ FPS',
    budget: 2500,
    purpose: 'Gaming - CS2, Valorant, League of Legends',
    cpu: 'ryzen-5-5600',
    motherboard: 'b450-tomahawk',
    ram: 'ddr4-3200-16gb',
    gpu: 'rx-6600',
    psu: 'corsair-650w',
    case: 'nzxt-h510',
    storage: ['crucial-p3-1tb'],
    totalPrice: 2400,
    performance: {
      gaming: 85,
      productivity: 70,
      value: 95,
    },
  },
  {
    id: 'optimal-allround',
    name: 'Оптимальная сборка',
    description: 'Баланс цены и производительности для игр и Python',
    budget: 3500,
    purpose: 'Gaming + Programming + Streaming',
    cpu: 'intel-i5-13400f',
    motherboard: 'b760-ds3h',
    ram: 'ddr4-3600-32gb',
    gpu: 'rtx-4060',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['crucial-p3-1tb'],
    totalPrice: 3450,
    performance: {
      gaming: 90,
      productivity: 88,
      value: 92,
    },
  },
  {
    id: 'ultra-budget',
    name: '💰 Ультрабюджет 1000zł',
    description: 'Минимальная сборка для учёбы и лёгких игр',
    budget: 1000,
    purpose: 'Учёба, браузер, лёгкие игры (Minecraft, League of Legends)',
    cpu: 'ryzen-5-5600',
    motherboard: 'b450-tomahawk',
    ram: 'ddr4-3200-16gb',
    gpu: 'rx-6600',
    psu: 'corsair-650w',
    case: 'nzxt-h510',
    storage: ['crucial-p3-500gb'],
    totalPrice: 1050,
    performance: {
      gaming: 60,
      productivity: 65,
      value: 100,
    },
  },
  {
    id: 'python-ml',
    name: '🐍 Python + Machine Learning',
    description: 'Мощная сборка для обучения ML и Data Science',
    budget: 4500,
    purpose: 'Python, TensorFlow, PyTorch, Jupyter Notebooks',
    cpu: 'ryzen-7-5700x',
    motherboard: 'b550-aorus',
    ram: 'ddr4-3600-32gb',
    gpu: 'rtx-4060-ti',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['samsung-970-1tb', 'crucial-p3-1tb'],
    totalPrice: 4380,
    performance: {
      gaming: 88,
      productivity: 95,
      value: 85,
    },
  },
  {
    id: 'cs2-esports',
    name: '🎮 CS2 E-Sports Pro',
    description: '300+ FPS в CS2, низкий input lag, 1% lows стабильны',
    budget: 3200,
    purpose: 'CS2 на максимум FPS, Faceit Level 10',
    cpu: 'intel-i5-14400f',
    motherboard: 'b760-ds3h',
    ram: 'ddr4-3600-32gb',
    gpu: 'rx-6650-xt',
    psu: 'seasonic-750w',
    case: 'nzxt-h510',
    storage: ['samsung-970-1tb'],
    totalPrice: 3100,
    performance: {
      gaming: 95,
      productivity: 75,
      value: 88,
    },
  },
  {
    id: 'content-creator',
    name: '🎥 YouTube Контент-мейкер',
    description: 'Монтаж 4K видео, стриминг, рендеринг',
    budget: 5500,
    purpose: 'Premiere Pro, After Effects, OBS Studio',
    cpu: 'ryzen-7-7700',
    motherboard: 'b650-gaming',
    ram: 'ddr5-6000-32gb',
    gpu: 'rtx-4060-ti',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['samsung-980-2tb', 'crucial-p3-1tb'],
    totalPrice: 5450,
    performance: {
      gaming: 85,
      productivity: 98,
      value: 80,
    },
  },
  {
    id: 'student-budget',
    name: '📚 Для студента 1500zł',
    description: 'Учёба, программирование, лёгкий гейминг',
    budget: 1500,
    purpose: 'VS Code, PyCharm, Google Docs, CS2 на средних',
    cpu: 'ryzen-5-5600',
    motherboard: 'b450-tomahawk',
    ram: 'ddr4-3200-16gb',
    gpu: 'rx-6600',
    psu: 'corsair-650w',
    case: 'nzxt-h510',
    storage: ['crucial-p3-500gb'],
    totalPrice: 1520,
    performance: {
      gaming: 70,
      productivity: 75,
      value: 95,
    },
  },
  {
    id: 'aaa-gaming',
    name: '🔥 AAA Gaming 1440p',
    description: 'Cyberpunk, RDR2, GTA VI на ультра настройках',
    budget: 6000,
    purpose: 'Современные AAA игры 1440p 120+ FPS',
    cpu: 'intel-i5-14400f',
    motherboard: 'b760-ds3h',
    ram: 'ddr5-6000-32gb',
    gpu: 'rtx-4060-ti',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['samsung-980-2tb'],
    totalPrice: 5850,
    performance: {
      gaming: 98,
      productivity: 85,
      value: 75,
    },
  },
  {
    id: 'workstation',
    name: '💼 Рабочая станция',
    description: 'Профессиональная работа: CAD, 3D, видеомонтаж',
    budget: 7000,
    purpose: 'AutoCAD, Blender, Premiere Pro, Photoshop',
    cpu: 'ryzen-7-7700',
    motherboard: 'b650-gaming',
    ram: 'ddr5-6000-32gb',
    gpu: 'rtx-4060-ti',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['samsung-980-2tb', 'samsung-970-1tb'],
    totalPrice: 6950,
    performance: {
      gaming: 90,
      productivity: 99,
      value: 70,
    },
  },
  {
    id: 'balanced-2024',
    name: '⚖️ Сбалансированная 2024',
    description: 'Золотая середина: игры, работа, учёба - всё на высоте',
    budget: 4000,
    purpose: 'Универсальная сборка на 5+ лет',
    cpu: 'ryzen-5-7600',
    motherboard: 'b650-gaming',
    ram: 'ddr5-5600-32gb',
    gpu: 'rtx-4060',
    psu: 'seasonic-750w',
    case: 'corsair-4000d',
    storage: ['samsung-970-1tb'],
    totalPrice: 3980,
    performance: {
      gaming: 92,
      productivity: 90,
      value: 90,
    },
  },
];

// 🔧 Функции для проверки совместимости
export interface CompatibilityCheck {
  compatible: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export function checkCPUMotherboardCompatibility(
  cpu: CPUSpecs,
  motherboard: MotherboardSpecs
): CompatibilityCheck {
  const result: CompatibilityCheck = {
    compatible: true,
    warnings: [],
    errors: [],
    suggestions: [],
  };

  // Проверка socket
  if (cpu.socket !== motherboard.socket) {
    result.compatible = false;
    result.errors.push(
      `❌ Несовместимые сокеты: CPU использует ${cpu.socket}, а материнская плата ${motherboard.socket}`
    );
  }

  return result;
}

export function checkRAMCompatibility(
  ram: RAMSpecs,
  motherboard: MotherboardSpecs
): CompatibilityCheck {
  const result: CompatibilityCheck = {
    compatible: true,
    warnings: [],
    errors: [],
    suggestions: [],
  };

  // Проверка типа памяти
  if (ram.type !== motherboard.ramType) {
    result.compatible = false;
    result.errors.push(
      `❌ Несовместимый тип памяти: RAM ${ram.type}, материнская плата поддерживает ${motherboard.ramType}`
    );
  }

  // Проверка количества слотов
  if (ram.sticks > motherboard.ramSlots) {
    result.compatible = false;
    result.errors.push(
      `❌ Недостаточно слотов: RAM требует ${ram.sticks} слота(ов), доступно ${motherboard.ramSlots}`
    );
  }

  // Проверка максимального объёма
  if (ram.capacity > motherboard.maxRam) {
    result.warnings.push(
      `⚠️ Объём памяти превышает максимальный: ${ram.capacity}GB > ${motherboard.maxRam}GB`
    );
  }

  return result;
}

export function calculatePSURequirement(
  cpu: CPUSpecs,
  gpu: GPUSpecs,
  additionalWattage: number = 100
): number {
  // Формула: CPU TDP + GPU TDP + 100W (для остальных компонентов) + 20% запас
  const totalWattage = cpu.tdp + gpu.tdp + additionalWattage;
  const recommendedWattage = Math.ceil(totalWattage * 1.2 / 50) * 50; // Округление до ближайших 50W
  return recommendedWattage;
}

export function checkGPUCaseCompatibility(
  gpu: GPUSpecs,
  caseSpecs: CaseSpecs
): CompatibilityCheck {
  const result: CompatibilityCheck = {
    compatible: true,
    warnings: [],
    errors: [],
    suggestions: [],
  };

  if (gpu.length > caseSpecs.maxGPULength) {
    result.compatible = false;
    result.errors.push(
      `❌ Видеокарта не влезет в корпус: ${gpu.length}mm > ${caseSpecs.maxGPULength}mm`
    );
  } else if (gpu.length > caseSpecs.maxGPULength * 0.9) {
    result.warnings.push(
      `⚠️ Видеокарта почти впритык: ${gpu.length}mm / ${caseSpecs.maxGPULength}mm`
    );
  }

  return result;
}

export function calculateTotalBuildPrice(build: Partial<PCBuild>): number {
  let total = 0;
  
  if (build.cpu) {
    const cpu = POPULAR_CPUS.find(c => c.id === build.cpu);
    if (cpu) total += cpu.price;
  }
  
  if (build.motherboard) {
    const mb = POPULAR_MOTHERBOARDS.find(m => m.id === build.motherboard);
    if (mb) total += mb.price;
  }
  
  if (build.ram) {
    const ram = POPULAR_RAM.find(r => r.id === build.ram);
    if (ram) total += ram.price;
  }
  
  if (build.gpu) {
    const gpu = POPULAR_GPUS.find(g => g.id === build.gpu);
    if (gpu) total += gpu.price;
  }
  
  if (build.psu) {
    const psu = POPULAR_PSUS.find(p => p.id === build.psu);
    if (psu) total += psu.price;
  }
  
  if (build.case) {
    const caseItem = POPULAR_CASES.find(c => c.id === build.case);
    if (caseItem) total += caseItem.price;
  }
  
  if (build.storage) {
    build.storage.forEach(storageId => {
      const storage = POPULAR_STORAGE.find(s => s.id === storageId);
      if (storage) total += storage.price;
    });
  }
  
  return total;
}
