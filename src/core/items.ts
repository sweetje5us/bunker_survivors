/**
 * Справочник предметов для игры Bunker Survivors
 */

export interface Item {
    id: string;
    name: string;
    spritePath: string;
    description: string;
    price: number;
    category?: 'consumable' | 'equipment' | 'weapon' | 'resource' | 'tool';
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
      spritePath: 'src/sprites/items/book1.png',
      description: 'Полезная информация для выживания',
      price: 25,
      category: 'tool'
    },
    {
      id: 'book2',
      name: 'Техническая книга',
      spritePath: 'src/sprites/items/book2.png',
      description: 'Руководство по ремонту и крафту',
      price: 35,
      category: 'tool'
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
      spritePath: 'src/sprites/items/compass.png',
      description: 'Помогает ориентироваться на местности',
      price: 45,
      category: 'tool'
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
      spritePath: 'src/sprites/items/floppy_disk.png',
      description: 'Хранит важную информацию',
      price: 60,
      category: 'tool'
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
      spritePath: 'src/sprites/items/gps.png',
      description: 'Точное определение местоположения',
      price: 150,
      category: 'tool'
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
      spritePath: 'src/sprites/items/laptop.png',
      description: 'Мощное вычислительное устройство',
      price: 300,
      category: 'tool'
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
      spritePath: 'src/sprites/items/map.png',
      description: 'Помогает ориентироваться в местности',
      price: 30,
      category: 'tool'
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
      spritePath: 'src/sprites/items/newspaper.png',
      description: 'Содержит полезную информацию',
      price: 8,
      category: 'tool'
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
      spritePath: 'src/sprites/items/phone.png',
      description: 'Мобильный телефон для связи',
      price: 100,
      category: 'tool'
    },
    {
      id: 'radio',
      name: 'Рация',
      spritePath: 'src/sprites/items/radio.png',
      description: 'Устройство для дальней связи',
      price: 85,
      category: 'tool'
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
      spritePath: 'src/sprites/items/transmitter.png',
      description: 'Устройство для передачи сигналов',
      price: 90,
      category: 'tool'
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
   * Получить предмет по ID
   */
  export function getItemById(id: string): Item | undefined {
    return ITEMS_DATABASE.find(item => item.id === id);
  }
  
  /**
   * Получить предметы по категории
   */
  export function getItemsByCategory(category: Item['category']): Item[] {
    return ITEMS_DATABASE.filter(item => item.category === category);
  }
  
  /**
   * Поиск предметов по названию
   */
  export function searchItems(query: string): Item[] {
    const lowerQuery = query.toLowerCase();
    return ITEMS_DATABASE.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  }