/**
 * Справочник предметов для игры Bunker Survivors
 */

export interface Item {
    id: string;
    name: string;
    spritePath: string;
    description: string;
    price: number;
    category?: 'consumable' | 'equipment' | 'weapon' | 'resource' | 'tool' | 'quest' | 'sidequest';
    // Дополнительные поля для UI/инвентаря
    shortDescription?: string;
    fullDescription?: string;
    // Человекочитаемый тип для UI (ресурс, предмет, квестовый, используемый)
    typeDisplay?: string;
    // Путь к иконке (дубль spritePath для совместимости UI)
    iconPath?: string;
    // Флаг: стакается ли предмет в инвентаре
    stackable?: boolean;
  }
  
  export const ITEMS_DATABASE: Item[] = [
    {
      id: 'ammo',
      name: 'Патроны',
      spritePath: 'src/sprites/items/ammo.png',
      description: 'Боеприпасы для огнестрельного оружия',
      price: 15,
      category: 'resource'
    },
    {
      id: 'arrow',
      name: 'Стрелы',
      spritePath: 'src/sprites/items/arrow.png',
      description: 'Боеприпасы для лука',
      price: 8,
      category: 'resource'
    },
    {
      id: 'backpack',
      name: 'Рюкзак',
      spritePath: 'src/sprites/items/backpack.png',
      description: 'Увеличивает вместимость инвентаря',
      price: 50,
      category: 'equipment'
    },
    {
      id: 'battery',
      name: 'Батарейка',
      spritePath: 'src/sprites/items/battery.png',
      description: 'Источник энергии для устройств',
      price: 12,
      category: 'resource'
    },
    {
      id: 'book1',
      name: 'Книга',
      spritePath: 'src/sprites/items/sidequest/book1.png',
      description: 'Полезная информация для выживания',
      price: 25,
      category: 'sidequest'
    },
    {
      id: 'book2',
      name: 'Техническая книга',
      spritePath: 'src/sprites/items/sidequest/book2.png',
      description: 'Руководство по ремонту и крафту',
      price: 35,
      category: 'sidequest'
    },
    {
      id: 'boots',
      name: 'Ботинки',
      spritePath: 'src/sprites/items/boots.png',
      description: 'Устойчивая обувь для выживания',
      price: 40,
      category: 'equipment'
    },
    {
      id: 'bottle',
      name: 'Бутылка',
      spritePath: 'src/sprites/items/bottle.png',
      description: 'Пустая бутылка для воды',
      price: 5,
      category: 'tool'
    },
    {
      id: 'c4',
      name: 'Взрывчатка C4',
      spritePath: 'src/sprites/items/c4.png',
      description: 'Мощное взрывное устройство',
      price: 200,
      category: 'weapon'
    },
    {
      id: 'cap',
      name: 'Кепка',
      spritePath: 'src/sprites/items/cap.png',
      description: 'Легкая головная защита',
      price: 15,
      category: 'equipment'
    },
    {
      id: 'car_tires',
      name: 'Автошины',
      spritePath: 'src/sprites/items/car_tires.png',
      description: 'Материал для крафта и баррикад',
      price: 30,
      category: 'resource'
    },
    {
      id: 'coal',
      name: 'Уголь',
      spritePath: 'src/sprites/items/coal.png',
      description: 'Топливо для печей и костров',
      price: 8,
      category: 'resource'
    },
    {
      id: 'compass',
      name: 'Компас',
      spritePath: 'src/sprites/items/sidequest/compass.png',
      description: 'Помогает ориентироваться на местности',
      price: 45,
      category: 'sidequest'
    },
    {
      id: 'cup',
      name: 'Кружка',
      spritePath: 'src/sprites/items/cup.png',
      description: 'Для питья и хранения жидкостей',
      price: 8,
      category: 'tool'
    },
    {
      id: 'flashlight',
      name: 'Фонарик',
      spritePath: 'src/sprites/items/flashlight.png',
      description: 'Источник света в темное время',
      price: 35,
      category: 'tool'
    },
    {
      id: 'floppy_disk',
      name: 'Дискета',
      spritePath: 'src/sprites/items/sidequest/floppy_disk.png',
      description: 'Хранит важную информацию',
      price: 60,
      category: 'sidequest'
    },
    {
      id: 'food',
      name: 'Еда',
      spritePath: 'src/sprites/items/food.png',
      description: 'Восстанавливает здоровье и силы',
      price: 20,
      category: 'consumable'
    },
    {
      id: 'fur',
      name: 'Мех',
      spritePath: 'src/sprites/items/fur.png',
      description: 'Материал для теплой одежды',
      price: 25,
      category: 'resource'
    },
    {
      id: 'glass',
      name: 'Стекло',
      spritePath: 'src/sprites/items/glass.png',
      description: 'Материал для крафта и ремонта',
      price: 12,
      category: 'resource'
    },
    {
      id: 'gps',
      name: 'GPS-навигатор',
      spritePath: 'src/sprites/items/quest/gps.png',
      description: 'Координаты повстанцев',
      price: 150,
      category: 'quest'
    },
    {
      id: 'hat',
      name: 'Шляпа',
      spritePath: 'src/sprites/items/hat.png',
      description: 'Защита от солнца и дождя',
      price: 20,
      category: 'equipment'
    },
    {
      id: 'jacket1',
      name: 'Куртка',
      spritePath: 'src/sprites/items/jacket1.png',
      description: 'Теплая верхняя одежда',
      price: 55,
      category: 'equipment'
    },
    {
      id: 'jacket2',
      name: 'Плащ',
      spritePath: 'src/sprites/items/jacket2.png',
      description: 'Водонепроницаемая одежда',
      price: 65,
      category: 'equipment'
    },
    {
      id: 'jeans',
      name: 'Джинсы',
      spritePath: 'src/sprites/items/jeans.png',
      description: 'Прочные штаны для выживания',
      price: 35,
      category: 'equipment'
    },
    {
      id: 'laptop',
      name: 'Ноутбук',
      spritePath: 'src/sprites/items/quest/laptop.png',
      description: 'Ноутбук с выходом в свободный интернет',
      price: 300,
      category: 'quest'
    },
    {
      id: 'light_bulb',
      name: 'Лампочка',
      spritePath: 'src/sprites/items/light_bulb.png',
      description: 'Источник искусственного света',
      price: 18,
      category: 'tool'
    },
    {
      id: 'lighter',
      name: 'Зажигалка',
      spritePath: 'src/sprites/items/lighter.png',
      description: 'Для разжигания огня',
      price: 15,
      category: 'tool'
    },
    {
      id: 'map',
      name: 'Карта',
      spritePath: 'src/sprites/items/sidequest/compass.png',
      description: 'Помогает ориентироваться в местности',
      price: 30,
      category: 'quest'
    },
    {
      id: 'matches',
      name: 'Спички',
      spritePath: 'src/sprites/items/matches.png',
      description: 'Для разжигания огня',
      price: 10,
      category: 'tool'
    },
    {
      id: 'med_backpack',
      name: 'Медицинский рюкзак',
      spritePath: 'src/sprites/items/med_backpack.png',
      description: 'Содержит медицинские принадлежности',
      price: 120,
      category: 'equipment'
    },
    {
      id: 'medicine',
      name: 'Лекарство',
      spritePath: 'src/sprites/items/medicine.png',
      description: 'Восстанавливает здоровье',
      price: 40,
      category: 'consumable'
    },
    {
      id: 'medicine2',
      name: 'Аптечка',
      spritePath: 'src/sprites/items/medicine2.png',
      description: 'Комплект первой медицинской помощи',
      price: 80,
      category: 'consumable'
    },
    {
      id: 'metal',
      name: 'Металл',
      spritePath: 'src/sprites/items/metal.png',
      description: 'Материал для крафта и ремонта',
      price: 20,
      category: 'resource'
    },
    {
      id: 'molotov',
      name: 'Коктейль Молотова',
      spritePath: 'src/sprites/items/molotov.png',
      description: 'Взрывное устройство с огнем',
      price: 45,
      category: 'weapon'
    },
    {
      id: 'money',
      name: 'Деньги',
      spritePath: 'src/sprites/items/money.png',
      description: 'Валюта для торговли',
      price: 0, // Деньги не имеют цены в деньгах
      category: 'resource'
    },
    {
      id: 'multi_tool',
      name: 'Мультитул',
      spritePath: 'src/sprites/items/multi_tool.png',
      description: 'Набор различных инструментов',
      price: 75,
      category: 'tool'
    },
    {
      id: 'nails',
      name: 'Гвозди',
      spritePath: 'src/sprites/items/nails.png',
      description: 'Материал для строительства',
      price: 10,
      category: 'resource'
    },
    {
      id: 'newspaper',
      name: 'Газета',
      spritePath: 'src/sprites/items/sidequest/newspaper.png',
      description: 'Содержит полезную информацию',
      price: 8,
      category: 'sidequest'
    },
    {
      id: 'oil_canister',
      name: 'Канистра с маслом',
      spritePath: 'src/sprites/items/oil_canister.png',
      description: 'Смазка для механизмов',
      price: 25,
      category: 'resource'
    },
    {
      id: 'pants',
      name: 'Штаны',
      spritePath: 'src/sprites/items/pants.png',
      description: 'Обычные штаны',
      price: 25,
      category: 'equipment'
    },
    {
      id: 'pants3',
      name: 'Укрепленные штаны',
      spritePath: 'src/sprites/items/pants3.png',
      description: 'Прочные штаны с защитой',
      price: 45,
      category: 'equipment'
    },
    {
      id: 'paper',
      name: 'Бумага',
      spritePath: 'src/sprites/items/paper.png',
      description: 'Материал для записей',
      price: 5,
      category: 'resource'
    },
    {
      id: 'petrol_canister',
      name: 'Канистра с бензином',
      spritePath: 'src/sprites/items/petrol_canister.png',
      description: 'Топливо для транспорта и генераторов',
      price: 35,
      category: 'resource'
    },
    {
      id: 'phone',
      name: 'Телефон',
      spritePath: 'src/sprites/items/quest/phone.png',
      description: 'Телефон одного из мародеров',
      price: 100,
      category: 'quest'
    },
    {
      id: 'radio',
      name: 'Рация',
      spritePath: 'src/sprites/items/quest/radio.png',
      description: 'Радио с частотой Штаба',
      price: 85,
      category: 'quest'
    },
    {
      id: 'raw_meat',
      name: 'Сырое мясо',
      spritePath: 'src/sprites/items/raw_meat.png',
      description: 'Нужно приготовить перед употреблением',
      price: 15,
      category: 'consumable'
    },
    {
      id: 'rope',
      name: 'Веревка',
      spritePath: 'src/sprites/items/rope.png',
      description: 'Полезна для связывания и подъема',
      price: 18,
      category: 'tool'
    },
    {
      id: 'seeds',
      name: 'Семена',
      spritePath: 'src/sprites/items/seeds.png',
      description: 'Для выращивания растений',
      price: 12,
      category: 'resource'
    },
    {
      id: 'shirt',
      name: 'Рубашка',
      spritePath: 'src/sprites/items/shirt.png',
      description: 'Легкая верхняя одежда',
      price: 20,
      category: 'equipment'
    },
    {
      id: 'shirt2',
      name: 'Футболка',
      spritePath: 'src/sprites/items/shirt2.png',
      description: 'Обычная футболка',
      price: 15,
      category: 'equipment'
    },
    {
      id: 'shoes',
      name: 'Обувь',
      spritePath: 'src/sprites/items/shoes.png',
      description: 'Базовая обувь',
      price: 25,
      category: 'equipment'
    },
    {
      id: 'shoes2',
      name: 'Кроссовки',
      spritePath: 'src/sprites/items/shoes2.png',
      description: 'Удобная спортивная обувь',
      price: 35,
      category: 'equipment'
    },
    {
      id: 'silencer',
      name: 'Глушитель',
      spritePath: 'src/sprites/items/silencer.png',
      description: 'Уменьшает шум от выстрелов',
      price: 70,
      category: 'weapon'
    },
    {
      id: 'smoke_grenade',
      name: 'Дымовая граната',
      spritePath: 'src/sprites/items/smoke_grenade.png',
      description: 'Создает дымовую завесу',
      price: 25,
      category: 'weapon'
    },
    {
      id: 'tape',
      name: 'Скотч',
      spritePath: 'src/sprites/items/tape.png',
      description: 'Для склеивания и ремонта',
      price: 8,
      category: 'tool'
    },
    {
      id: 'thread',
      name: 'Нитки',
      spritePath: 'src/sprites/items/thread.png',
      description: 'Для шитья и ремонта одежды',
      price: 6,
      category: 'resource'
    },
    {
      id: 'transmitter',
      name: 'Передатчик',
      spritePath: 'src/sprites/items/quest/transmitter.png',
      description: 'Трансмиттер на таинственной частоте',
      price: 90,
      category: 'quest'
    },
    {
      id: 'waffles',
      name: 'Вафли',
      spritePath: 'src/sprites/items/waffles.png',
      description: 'Сухой паек, долго хранится',
      price: 18,
      category: 'consumable'
    },
    {
      id: 'water',
      name: 'Вода',
      spritePath: 'src/sprites/items/water.png',
      description: 'Необходима для выживания',
      price: 10,
      category: 'consumable'
    },
    {
      id: 'wires',
      name: 'Провода',
      spritePath: 'src/sprites/items/wires.png',
      description: 'Материал для электрических устройств',
      price: 15,
      category: 'resource'
    },
    {
      id: 'wood',
      name: 'Дерево',
      spritePath: 'src/sprites/items/wood.png',
      description: 'Материал для строительства и огня',
      price: 12,
      category: 'resource'
    }
  ];
  
  /**
   * Преобразует базовую запись предмета в нормализованный объект с заполненными
   * полями для UI (краткое/полное описание, человекочитаемый тип, стакаемость).
   */
  function normalizeItem(base: Item): Item {
    // Определяем человекочитаемый тип
    const category = base.category || 'tool'
    let typeDisplay = 'предмет'
    if (category === 'resource') typeDisplay = 'ресурс'
    else if (category === 'consumable') typeDisplay = 'используемый'
    else if (category === 'weapon') typeDisplay = 'предмет'
    else if (category === 'equipment') typeDisplay = 'предмет'
    else if (category === 'quest') typeDisplay = 'квестовый'
    else if (category === 'sidequest') typeDisplay = 'информационный'

    // Определяем стакаемость по категории, если не задано явно
    const stackable = typeof base.stackable === 'boolean'
      ? base.stackable
      : (category === 'resource' || category === 'consumable')

    return {
      ...base,
      shortDescription: base.shortDescription || base.description,
      fullDescription: base.fullDescription || base.description,
      typeDisplay,
      iconPath: base.iconPath || base.spritePath,
      stackable
    }
  }

  /**
   * Получить предмет по ID
   */
  export function getItemById(id: string): Item | undefined {
    const item = ITEMS_DATABASE.find(item => item.id === id);
    return item ? normalizeItem(item) : undefined;
  }
  
  /**
   * Получить предметы по категории
   */
  export function getItemsByCategory(category: Item['category']): Item[] {
    return ITEMS_DATABASE.filter(item => item.category === category).map(normalizeItem);
  }
  
  /**
   * Поиск предметов по названию
   */
  export function searchItems(query: string): Item[] {
    const lowerQuery = query.toLowerCase();
    return ITEMS_DATABASE.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    ).map(normalizeItem);
  }

  /**
   * Получить нормализованные данные предмета для UI (алиас к getItemById)
   */
  export function getItemDetails(id: string): Item | undefined {
    return getItemById(id)
  }

  /**
   * Интерфейс для квестовых предметов с функционалом
   */
  export interface QuestItem extends Item {
    questType: 'main' | 'side';
    functionality?: {
      type: 'internet' | 'coordinates' | 'communication' | 'radio' | 'transmitter';
      description: string;
      action?: () => void;
    };
  }

  /**
   * Заготовки для квестовых предметов с уникальным функционалом
   */
  export const QUEST_ITEMS_FUNCTIONALITY: Record<string, QuestItem['functionality']> = {
    'laptop': {
      type: 'internet',
      description: 'Открывает доступ к свободному интернету. Позволяет получать информацию о мире и событиях.',
      action: () => {
        console.log('[Quest] Laptop: Opening internet access...');
        // TODO: Реализовать интерфейс интернета
      }
    },
    'gps': {
      type: 'coordinates',
      description: 'Показывает координаты повстанцев. Открывает новые локации для исследования.',
      action: () => {
        console.log('[Quest] GPS: Showing rebel coordinates...');
        // TODO: Показать карту с координатами повстанцев
      }
    },
    'phone': {
      type: 'communication',
      description: 'Телефон мародера. Позволяет прослушивать переговоры и получать информацию.',
      action: () => {
        console.log('[Quest] Phone: Listening to marauder communications...');
        // TODO: Показать интерфейс прослушивания
      }
    },
    'radio': {
      type: 'radio',
      description: 'Радио с частотой Штаба. Позволяет получать официальные сообщения.',
      action: () => {
        console.log('[Quest] Radio: Tuning to HQ frequency...');
        // TODO: Показать радиопередачи Штаба
      }
    },
    'transmitter': {
      type: 'transmitter',
      description: 'Трансмиттер на таинственной частоте. Открывает доступ к скрытым каналам связи.',
      action: () => {
        console.log('[Quest] Transmitter: Accessing mysterious frequency...');
        // TODO: Показать таинственные передачи
      }
    }
  };

  /**
   * Проверить, является ли предмет квестовым с функционалом
   */
  export function isQuestItemWithFunctionality(itemId: string): boolean {
    return itemId in QUEST_ITEMS_FUNCTIONALITY;
  }

  /**
   * Получить функционал квестового предмета
   */
  export function getQuestItemFunctionality(itemId: string): QuestItem['functionality'] | undefined {
    return QUEST_ITEMS_FUNCTIONALITY[itemId];
  }

  /**
   * Выполнить действие квестового предмета
   */
  export function executeQuestItemAction(itemId: string): boolean {
    const functionality = getQuestItemFunctionality(itemId);
    if (functionality && functionality.action) {
      functionality.action();
      return true;
    }
    return false;
  }