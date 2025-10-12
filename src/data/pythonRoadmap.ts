// 🐍 Python Learning Roadmap Data
// Интерактивный план обучения Python от новичка до профи

export interface PythonTopic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[]; // IDs других тем
  resources: {
    type: 'video' | 'article' | 'book' | 'practice' | 'project';
    title: string;
    url?: string;
    description: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    solution?: string;
  }[];
}

export interface PythonModule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  topics: PythonTopic[];
}

export const PYTHON_ROADMAP: PythonModule[] = [
  {
    id: 'basics',
    name: 'Основы Python',
    emoji: '🌱',
    description: 'Базовый синтаксис, типы данных, условия, циклы',
    color: 'green',
    topics: [
      {
        id: 'basics-1',
        title: 'Установка и первая программа',
        description: 'Установка Python, VS Code, написание Hello World',
        estimatedHours: 2,
        difficulty: 'beginner',
        prerequisites: [],
        resources: [
          {
            type: 'video',
            title: 'Python для начинающих - Установка',
            description: 'Как установить Python и настроить VS Code',
          },
          {
            type: 'article',
            title: 'Официальная документация Python',
            url: 'https://docs.python.org/3/tutorial/',
            description: 'Туториал от создателей Python',
          },
        ],
        tasks: [
          {
            id: 'basics-1-task-1',
            title: 'Напиши Hello World',
            description: 'Создай файл main.py и выведи "Hello, World!"',
            solution: 'print("Hello, World!")',
          },
          {
            id: 'basics-1-task-2',
            title: 'Арифметика',
            description: 'Посчитай (5 + 3) * 2 и выведи результат',
            solution: 'result = (5 + 3) * 2\nprint(result)  # 16',
          },
        ],
      },
      {
        id: 'basics-2',
        title: 'Переменные и типы данных',
        description: 'int, float, str, bool, None, type()',
        estimatedHours: 3,
        difficulty: 'beginner',
        prerequisites: ['basics-1'],
        resources: [
          {
            type: 'article',
            title: 'Типы данных в Python',
            description: 'Основные типы: числа, строки, булевы',
          },
          {
            type: 'practice',
            title: 'Задачи на переменные',
            description: '10 простых задач для тренировки',
          },
        ],
        tasks: [
          {
            id: 'basics-2-task-1',
            title: 'Калькулятор возраста',
            description: 'Создай переменные: имя, год рождения. Посчитай возраст.',
            solution: 'name = "Егор"\nbirth_year = 2008\nage = 2025 - birth_year\nprint(f"{name}, тебе {age} лет")',
          },
          {
            id: 'basics-2-task-2',
            title: 'Конвертер температуры',
            description: 'Переведи 25°C в Fahrenheit (F = C * 9/5 + 32)',
            solution: 'celsius = 25\nfahrenheit = celsius * 9/5 + 32\nprint(f"{celsius}°C = {fahrenheit}°F")',
          },
        ],
      },
      {
        id: 'basics-3',
        title: 'Строки и форматирование',
        description: 'f-strings, методы строк, срезы',
        estimatedHours: 4,
        difficulty: 'beginner',
        prerequisites: ['basics-2'],
        resources: [
          {
            type: 'article',
            title: 'Работа со строками',
            description: 'Методы: upper(), lower(), split(), join()',
          },
        ],
        tasks: [
          {
            id: 'basics-3-task-1',
            title: 'Генератор ников',
            description: 'Пользователь вводит имя, ты добавляешь "PRO" и делаешь UPPERCASE',
            solution: 'name = input("Введи имя: ")\nnickname = (name + "PRO").upper()\nprint(f"Твой ник: {nickname}")',
          },
        ],
      },
      {
        id: 'basics-4',
        title: 'Условия (if/elif/else)',
        description: 'Логические операторы, сравнения, ветвление',
        estimatedHours: 3,
        difficulty: 'beginner',
        prerequisites: ['basics-2'],
        resources: [
          {
            type: 'practice',
            title: '15 задач на условия',
            description: 'От простых до сложных проверок',
          },
        ],
        tasks: [
          {
            id: 'basics-4-task-1',
            title: 'Чётное или нечётное',
            description: 'Проверь число на чётность',
            solution: 'num = int(input("Число: "))\nif num % 2 == 0:\n    print("Чётное")\nelse:\n    print("Нечётное")',
          },
          {
            id: 'basics-4-task-2',
            title: 'Калькулятор оценок',
            description: 'По баллам (0-100) выведи оценку: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)',
            solution: 'score = int(input("Баллы: "))\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelif score >= 60:\n    print("D")\nelse:\n    print("F")',
          },
        ],
      },
      {
        id: 'basics-5',
        title: 'Циклы (for/while)',
        description: 'Итерации, range(), break, continue',
        estimatedHours: 4,
        difficulty: 'beginner',
        prerequisites: ['basics-4'],
        resources: [
          {
            type: 'video',
            title: 'Циклы в Python',
            description: 'Как работают for и while',
          },
        ],
        tasks: [
          {
            id: 'basics-5-task-1',
            title: 'Таблица умножения',
            description: 'Выведи таблицу умножения на 5',
            solution: 'for i in range(1, 11):\n    print(f"5 x {i} = {5 * i}")',
          },
          {
            id: 'basics-5-task-2',
            title: 'Сумма чисел',
            description: 'Посчитай сумму всех чисел от 1 до 100',
            solution: 'total = 0\nfor i in range(1, 101):\n    total += i\nprint(total)  # 5050',
          },
        ],
      },
    ],
  },
  {
    id: 'data-structures',
    name: 'Структуры данных',
    emoji: '📦',
    description: 'Списки, словари, множества, кортежи',
    color: 'blue',
    topics: [
      {
        id: 'ds-1',
        title: 'Списки (Lists)',
        description: 'Методы списков, срезы, list comprehensions',
        estimatedHours: 5,
        difficulty: 'beginner',
        prerequisites: ['basics-5'],
        resources: [
          {
            type: 'article',
            title: 'Списки в Python',
            description: 'Всё о списках: создание, методы, примеры',
          },
        ],
        tasks: [
          {
            id: 'ds-1-task-1',
            title: 'Фильтр чётных',
            description: 'Из списка [1,2,3,4,5,6,7,8,9,10] получи только чётные',
            solution: 'nums = [1,2,3,4,5,6,7,8,9,10]\neven = [n for n in nums if n % 2 == 0]\nprint(even)  # [2,4,6,8,10]',
          },
          {
            id: 'ds-1-task-2',
            title: 'TODO список',
            description: 'Создай список задач, добавь 3 задачи, удали одну',
            solution: 'todos = []\ntodos.append("Учить Python")\ntodos.append("Сделать ДЗ")\ntodos.append("Поиграть в CS2")\ntodos.remove("Сделать ДЗ")\nprint(todos)',
          },
        ],
      },
      {
        id: 'ds-2',
        title: 'Словари (Dictionaries)',
        description: 'Ключи и значения, методы, dict comprehensions',
        estimatedHours: 5,
        difficulty: 'intermediate',
        prerequisites: ['ds-1'],
        resources: [
          {
            type: 'practice',
            title: '20 задач на словари',
            description: 'Практика работы с dict',
          },
        ],
        tasks: [
          {
            id: 'ds-2-task-1',
            title: 'База игроков CS2',
            description: 'Создай словарь с ником, рангом, часами игры',
            solution: 'player = {\n    "nickname": "Yahor777",\n    "rank": "Gold Nova 2",\n    "hours": 450,\n    "favorite_map": "Dust 2"\n}\nprint(player["nickname"])',
          },
        ],
      },
    ],
  },
  {
    id: 'functions',
    name: 'Функции',
    emoji: '⚙️',
    description: 'Создание функций, аргументы, return, lambda',
    color: 'purple',
    topics: [
      {
        id: 'func-1',
        title: 'Базовые функции',
        description: 'def, параметры, return, docstrings',
        estimatedHours: 4,
        difficulty: 'intermediate',
        prerequisites: ['ds-2'],
        resources: [
          {
            type: 'article',
            title: 'Функции в Python',
            description: 'Как создавать и использовать функции',
          },
        ],
        tasks: [
          {
            id: 'func-1-task-1',
            title: 'Калькулятор BMI',
            description: 'Функция calculate_bmi(weight, height) -> float',
            solution: 'def calculate_bmi(weight, height):\n    """Считает индекс массы тела"""\n    return weight / (height ** 2)\n\nbmi = calculate_bmi(70, 1.75)\nprint(f"BMI: {bmi:.2f}")',
          },
        ],
      },
    ],
  },
  {
    id: 'oop',
    name: 'ООП (Объектно-ориентированное программирование)',
    emoji: '🎯',
    description: 'Классы, объекты, наследование, инкапсуляция',
    color: 'red',
    topics: [
      {
        id: 'oop-1',
        title: 'Классы и объекты',
        description: 'class, __init__, self, методы',
        estimatedHours: 6,
        difficulty: 'intermediate',
        prerequisites: ['func-1'],
        resources: [
          {
            type: 'video',
            title: 'ООП в Python для начинающих',
            description: 'Полный курс по классам и объектам',
          },
        ],
        tasks: [
          {
            id: 'oop-1-task-1',
            title: 'Класс Player для CS2',
            description: 'Создай класс с атрибутами: nickname, rank, kills, deaths. Метод kd_ratio()',
            solution: 'class Player:\n    def __init__(self, nickname, rank):\n        self.nickname = nickname\n        self.rank = rank\n        self.kills = 0\n        self.deaths = 0\n    \n    def kd_ratio(self):\n        return self.kills / self.deaths if self.deaths > 0 else self.kills\n\nplayer = Player("Yahor777", "GN2")\nplayer.kills = 25\nplayer.deaths = 18\nprint(f"K/D: {player.kd_ratio():.2f}")',
          },
        ],
      },
    ],
  },
  {
    id: 'libraries',
    name: 'Популярные библиотеки',
    emoji: '📚',
    description: 'requests, pandas, numpy, matplotlib',
    color: 'yellow',
    topics: [
      {
        id: 'lib-1',
        title: 'requests - HTTP запросы',
        description: 'GET, POST, API, JSON',
        estimatedHours: 3,
        difficulty: 'intermediate',
        prerequisites: ['oop-1'],
        resources: [
          {
            type: 'article',
            title: 'Работа с API в Python',
            description: 'Библиотека requests',
          },
        ],
        tasks: [
          {
            id: 'lib-1-task-1',
            title: 'Получи данные с API',
            description: 'Запроси данные с https://jsonplaceholder.typicode.com/users/1',
            solution: 'import requests\n\nresponse = requests.get("https://jsonplaceholder.typicode.com/users/1")\nuser = response.json()\nprint(f"Имя: {user[\'name\']}")\nprint(f"Email: {user[\'email\']}")',
          },
        ],
      },
    ],
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    emoji: '🤖',
    description: 'scikit-learn, TensorFlow, PyTorch',
    color: 'indigo',
    topics: [
      {
        id: 'ml-1',
        title: 'Введение в ML',
        description: 'Supervised learning, datasets, models',
        estimatedHours: 10,
        difficulty: 'advanced',
        prerequisites: ['lib-1'],
        resources: [
          {
            type: 'book',
            title: 'Hands-On Machine Learning',
            description: 'Лучшая книга по ML для начинающих',
          },
        ],
        tasks: [
          {
            id: 'ml-1-task-1',
            title: 'Первая модель',
            description: 'Обучи линейную регрессию на данных о ценах домов',
            solution: 'from sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Площадь домов\nX = np.array([[50], [80], [120], [150], [200]])\n# Цены\ny = np.array([100000, 150000, 220000, 280000, 350000])\n\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Предсказание для дома 100м²\nprice = model.predict([[100]])\nprint(f"Цена: {price[0]:.0f} zł")',
          },
        ],
      },
    ],
  },
];

// Функция для подсчёта прогресса
export function calculateProgress(completedTopicIds: string[]): {
  totalTopics: number;
  completedTopics: number;
  percentage: number;
  totalHours: number;
  completedHours: number;
} {
  let totalTopics = 0;
  let totalHours = 0;
  let completedHours = 0;

  PYTHON_ROADMAP.forEach(module => {
    module.topics.forEach(topic => {
      totalTopics++;
      totalHours += topic.estimatedHours;
      if (completedTopicIds.includes(topic.id)) {
        completedHours += topic.estimatedHours;
      }
    });
  });

  return {
    totalTopics,
    completedTopics: completedTopicIds.length,
    percentage: Math.round((completedTopicIds.length / totalTopics) * 100),
    totalHours,
    completedHours,
  };
}
