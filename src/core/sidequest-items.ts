/**
 * Справочник побочных предметов для раскрытия сюжета по фракциям
 */

import type { FactionId } from './factions';

export type SidequestTheme = 'faction_lies' | 'faction_truth' | 'faction_neutral' | 'world_history' | 'enemy_origins';

export interface SidequestItem {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  theme: SidequestTheme;
  targetFaction?: FactionId; // Фракция, к которой относится предмет (если применимо)
  spritePath: string;
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  unlockRequirement?: string; // Требование для получения предмета
}

export interface SidequestItemPool {
  theme: SidequestTheme;
  items: SidequestItem[];
  description: string;
}

/**
 * Описания тем для побочных предметов
 */
export const SIDEQUEST_THEMES: Record<SidequestTheme, string> = {
  faction_lies: 'Предметы, наталкивающие на мысль что фракция обманывает',
  faction_truth: 'Предметы, намекающие на правду про фракцию',
  faction_neutral: 'Предметы с нейтральной информацией о фракции',
  world_history: 'Предметы, не относящиеся к фракциям, сообщающие историю мира',
  enemy_origins: 'Предметы, раскрывающие мотивы и происхождение врагов'
};

/**
 * Базовые спрайты для побочных предметов
 */
export const SIDEQUEST_SPRITES = {
  // Документы и файлы (заменены на существующие)
  document: 'src/sprites/items/sidequest/newspaper.png',           // вместо document.png
  classified_document: 'src/sprites/items/sidequest/newspaper.png', // вместо classified_document.png
  report: 'src/sprites/items/sidequest/newspaper.png',             // вместо report.png
  file: 'src/sprites/items/sidequest/floppy_disk.png',             // вместо file.png
  
  // Исторические материалы
  newspaper: 'src/sprites/items/sidequest/newspaper.png',
  book1: 'src/sprites/items/sidequest/book1.png',
  book2: 'src/sprites/items/sidequest/book2.png',
  diary: 'src/sprites/items/sidequest/book1.png',                  // вместо diary.png
  
  // Технические носители (заменены на существующие)
  floppy_disk: 'src/sprites/items/sidequest/floppy_disk.png',
  tape: 'src/sprites/items/sidequest/floppy_disk.png',             // вместо tape.png
  cd: 'src/sprites/items/sidequest/floppy_disk.png',               // вместо cd.png
  
  // Навигационные предметы (заменены на существующие)
  compass: 'src/sprites/items/sidequest/compass.png',
  map_fragment: 'src/sprites/items/sidequest/compass.png',         // вместо map_fragment.png
  
  // Личные вещи (заменены на существующие)
  letter: 'src/sprites/items/sidequest/newspaper.png',             // вместо letter.png
  photo: 'src/sprites/items/sidequest/newspaper.png',              // вместо photo.png
  badge: 'src/sprites/items/sidequest/compass.png',                // вместо badge.png
  key: 'src/sprites/items/sidequest/compass.png'                   // вместо key.png
};

/**
 * Класс для управления побочными предметами
 */
export class SidequestItemManager {
  private static instance: SidequestItemManager;
  private itemPools: Map<SidequestTheme, SidequestItem[]>;
  private gameSeed: number;

  private constructor(seed: number = Date.now()) {
    this.gameSeed = seed;
    this.itemPools = new Map();
    this.initializeItemPools();
  }

  public static getInstance(seed?: number): SidequestItemManager {
    if (!SidequestItemManager.instance) {
      SidequestItemManager.instance = new SidequestItemManager(seed);
    }
    return SidequestItemManager.instance;
  }

  /**
   * Инициализация пулов предметов по темам
   * Структура: 5 тем × 5 фракций × 20 предметов = 500 предметов
   */
  private initializeItemPools(): void {
    // Создаем пулы для каждой темы
    this.itemPools.set('faction_lies', []);      // 5 фракций × 20 предметов = 100
    this.itemPools.set('faction_truth', []);     // 5 фракций × 20 предметов = 100
    this.itemPools.set('faction_neutral', []);   // 5 фракций × 20 предметов = 100
    this.itemPools.set('world_history', []);     // 5 фракций × 20 предметов = 100
    this.itemPools.set('enemy_origins', []);     // 5 фракций × 20 предметов = 100
  }

  /**
   * Генератор псевдослучайных чисел на основе seed
   */
  private seededRandom(min: number, max: number): number {
    const x = Math.sin(this.gameSeed++) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  }

  /**
   * Получить предметы по теме
   */
  public getItemsByTheme(theme: SidequestTheme): SidequestItem[] {
    return this.itemPools.get(theme) || [];
  }

  /**
   * Получить случайный предмет по теме
   */
  public getRandomItemByTheme(theme: SidequestTheme): SidequestItem | null {
    const items = this.getItemsByTheme(theme);
    if (items.length === 0) return null;
    
    const randomIndex = this.seededRandom(0, items.length - 1);
    return items[randomIndex];
  }

  /**
   * Получить предметы для конкретной фракции
   */
  public getItemsForFaction(factionId: FactionId, theme: SidequestTheme): SidequestItem[] {
    const items = this.getItemsByTheme(theme);
    return items.filter(item => item.targetFaction === factionId);
  }

  /**
   * Получить случайный предмет для фракции
   */
  public getRandomItemForFaction(factionId: FactionId, theme: SidequestTheme): SidequestItem | null {
    const items = this.getItemsForFaction(factionId, theme);
    if (items.length === 0) return null;
    
    const randomIndex = this.seededRandom(0, items.length - 1);
    return items[randomIndex];
  }

  /**
   * Добавить предмет в пул
   */
  public addItem(item: SidequestItem): void {
    const pool = this.itemPools.get(item.theme);
    if (pool) {
      pool.push(item);
    }
  }

  /**
   * Добавить массив предметов в пул
   */
  public addItems(items: SidequestItem[]): void {
    items.forEach(item => this.addItem(item));
  }

  /**
   * Получить все предметы
   */
  public getAllItems(): SidequestItem[] {
    const allItems: SidequestItem[] = [];
    for (const pool of this.itemPools.values()) {
      allItems.push(...pool);
    }
    return allItems;
  }

  /**
   * Получить предмет по ID
   */
  public getItemById(id: string): SidequestItem | null {
    for (const pool of this.itemPools.values()) {
      const item = pool.find(item => item.id === id);
      if (item) return item;
    }
    return null;
  }

  /**
   * Сбросить менеджер (для новой игры)
   */
  public reset(seed?: number): void {
    if (seed) {
      this.gameSeed = seed;
    }
    this.itemPools.clear();
    this.initializeItemPools();
  }

  /**
   * Получить предметы для персонажа с учетом правдивой фракции
   * @param truthfulFaction - фракция, которая говорит правду
   * @param characterFaction - фракция персонажа (может быть undefined для нейтральных)
   * @param count - количество предметов для генерации
   */
  public getItemsForCharacter(
    truthfulFaction: FactionId, 
    characterFaction?: FactionId, 
    count: number = 1
  ): SidequestItem[] {
    const items: SidequestItem[] = [];
    
    for (let i = 0; i < count; i++) {
      let item: SidequestItem | null = null;
      
      if (characterFaction) {
        // Если у персонажа есть фракция
        if (characterFaction === truthfulFaction) {
          // Правдивая фракция - выдаем правду + нейтральную информацию
          const themes: SidequestTheme[] = ['faction_truth', 'faction_neutral'];
          const randomTheme = themes[this.seededRandom(0, themes.length - 1)];
          item = this.getRandomItemForFaction(characterFaction, randomTheme);
        } else {
          // Лживая фракция - выдаем ложь
          item = this.getRandomItemForFaction(characterFaction, 'faction_lies');
        }
      }
      
      // Если не получили предмет от фракции, выдаем нейтральную информацию
      if (!item) {
        const neutralThemes: SidequestTheme[] = ['world_history', 'enemy_origins'];
        const randomTheme = neutralThemes[this.seededRandom(0, neutralThemes.length - 1)];
        item = this.getRandomItemByTheme(randomTheme);
      }
      
      if (item) {
        items.push(item);
      }
    }
    
    return items;
  }

  /**
   * Получить случайный предмет для инвентаря жителя
   * @param truthfulFaction - правдивая фракция
   * @param characterFaction - фракция персонажа (опционально)
   */
  public getRandomItemForInventory(
    truthfulFaction: FactionId, 
    characterFaction?: FactionId
  ): SidequestItem | null {
    const items = this.getItemsForCharacter(truthfulFaction, characterFaction, 1);
    return items.length > 0 ? items[0] : null;
  }

  /**
   * Получить несколько предметов для инвентаря жителя
   * @param truthfulFaction - правдивая фракция
   * @param characterFaction - фракция персонажа (опционально)
   * @param count - количество предметов
   */
  public getMultipleItemsForInventory(
    truthfulFaction: FactionId, 
    characterFaction?: FactionId,
    count: number = 1
  ): SidequestItem[] {
    return this.getItemsForCharacter(truthfulFaction, characterFaction, count);
  }
}

/**
 * Утилиты для работы с побочными предметами
 */
export const SidequestUtils = {
  /**
   * Получить название темы
   */
  getThemeName(theme: SidequestTheme): string {
    return SIDEQUEST_THEMES[theme];
  },

  /**
   * Получить все доступные темы
   */
  getAllThemes(): SidequestTheme[] {
    return Object.keys(SIDEQUEST_THEMES) as SidequestTheme[];
  },

  /**
   * Получить случайный спрайт для предмета
   */
  getRandomSprite(): string {
    const sprites = Object.values(SIDEQUEST_SPRITES);
    const randomIndex = Math.floor(Math.random() * sprites.length);
    return sprites[randomIndex];
  },

  /**
   * Получить спрайт по типу
   */
  getSpriteByType(type: keyof typeof SIDEQUEST_SPRITES): string {
    return SIDEQUEST_SPRITES[type];
  }
};

/**
 * База данных побочных предметов
 * Структура: 5 тем × 5 фракций × 20 предметов = 500 предметов
 */

/**
 * Предметы, наталкивающие на мысль что фракция обманывает
 */

// Штаб (HQ) - 20 предметов faction_lies
export const HQ_FACTION_LIES_ITEMS: SidequestItem[] = [
  {
    id: 'hq_lies_001',
    name: 'Секретный отчет о потерях',
    description: 'Внутренний документ с заниженными цифрами потерь',
    fullDescription: 'Секретный отчет командования Штаба с явно заниженными цифрами потерь среди гражданского населения. В документе указано "минимальные жертвы", но на полях видны пометки с реальными цифрами, которые в 10 раз больше.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_002',
    name: 'Письмо перебежчика',
    description: 'Исповедь бывшего офицера Штаба',
    fullDescription: 'Письмо бывшего офицера Штаба, который сбежал из системы. Он описывает, как командование скрывает истинные масштабы катастрофы и манипулирует информацией для поддержания контроля.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_lies_003',
    name: 'Список "пропавших без вести"',
    description: 'Документ с именами людей, объявленных мертвыми',
    fullDescription: 'Список людей, официально объявленных "пропавшими без вести", но на самом деле арестованных за инакомыслие. Многие из них живы и содержатся в секретных тюрьмах Штаба.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_004',
    name: 'Фальшивая газета',
    description: 'Пропагандистская газета с ложными новостями',
    fullDescription: 'Официальная газета Штаба с "хорошими новостями" о восстановлении инфраструктуры. Но на обороте видны следы от чернил - там была напечатана правда о реальном состоянии дел.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 15,
    rarity: 'common'
  },
  {
    id: 'hq_lies_005',
    name: 'Записи радиоперехвата',
    description: 'Перехваченные переговоры командования',
    fullDescription: 'Записи радиопереговоров между офицерами Штаба, где они обсуждают необходимость "контролируемой дезинформации" для поддержания порядка среди выживших.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 50,
    rarity: 'rare'
  },
  {
    id: 'hq_lies_006',
    name: 'Дневник военного врача',
    description: 'Личные записи о реальном состоянии раненых',
    fullDescription: 'Дневник военного врача, который описывает, как командование заставляет скрывать истинное количество раненых и больных, чтобы не подрывать моральный дух.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_007',
    name: 'Секретный приказ №47',
    description: 'Приказ о сокрытии информации от населения',
    fullDescription: 'Секретный приказ командования о необходимости "фильтрации информации" для населения. В документе прямо указано: "Любая информация, способная вызвать панику, должна быть скрыта или искажена".',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_lies_008',
    name: 'Фото с места событий',
    description: 'Снимки, противоречащие официальной версии',
    fullDescription: 'Фотографии с места событий, которые противоречат официальной версии Штаба. На снимках видно, что ситуация намного хуже, чем сообщается в официальных сводках.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_009',
    name: 'Список "неблагонадежных"',
    description: 'Документ с именами людей под наблюдением',
    fullDescription: 'Список людей, находящихся под особым наблюдением Штаба за "неблагонадежность". Многие из них просто задавали неудобные вопросы или сомневались в официальной информации.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_010',
    name: 'Записка от информатора',
    description: 'Сообщение от человека внутри системы',
    fullDescription: 'Записка от информатора внутри Штаба, который предупреждает о готовящейся "массовой дезинформационной кампании" для сокрытия истинных масштабов кризиса.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'hq_lies_011',
    name: 'Отчет о "успешных операциях"',
    description: 'Документ с приукрашенными результатами',
    fullDescription: 'Отчет о "успешных операциях" Штаба, где реальные результаты приукрашены в 5-10 раз. В документе видны следы правки - оригинальные цифры были зачеркнуты и заменены на более "оптимистичные".',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_lies_012',
    name: 'Секретные протоколы',
    description: 'Протоколы заседаний с реальными планами',
    fullDescription: 'Секретные протоколы заседаний командования, где обсуждаются реальные планы по "контролю информации" и "управлению восприятием" населения.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'hq_lies_013',
    name: 'Письмо родственникам',
    description: 'Личное письмо с правдой о ситуации',
    fullDescription: 'Письмо солдата родственникам, где он описывает реальную ситуацию, противоречащую официальным сводкам. Письмо было перехвачено цензурой, но копия сохранилась.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_lies_014',
    name: 'Список "запрещенных тем"',
    description: 'Документ с темами, о которых нельзя говорить',
    fullDescription: 'Список тем, которые запрещено обсуждать в присутствии гражданских. Включает реальные цифры потерь, состояние инфраструктуры и планы командования.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_015',
    name: 'Записи разговоров',
    description: 'Стенограммы частных разговоров офицеров',
    fullDescription: 'Стенограммы частных разговоров офицеров, где они откровенно обсуждают необходимость лжи для поддержания "стабильности" и "порядка".',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_lies_016',
    name: 'Фальшивые документы',
    description: 'Поддельные документы для сокрытия правды',
    fullDescription: 'Набор поддельных документов, созданных для сокрытия правды о реальном положении дел. Включает фальшивые отчеты, справки и свидетельства.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_017',
    name: 'Секретный план "Правда"',
    description: 'План по контролю информации',
    fullDescription: 'Секретный план под кодовым названием "Правда", который описывает стратегию по контролю и фильтрации информации, поступающей к населению.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'hq_lies_018',
    name: 'Письмо от цензора',
    description: 'Исповедь человека, скрывающего правду',
    fullDescription: 'Письмо от цензора, который признается, что его работа заключается в сокрытии правды от населения. Он описывает, как ежедневно искажает информацию.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_lies_019',
    name: 'Список "лживых сводок"',
    description: 'Документ с примерами искаженной информации',
    fullDescription: 'Список официальных сводок с пометками о том, какая информация была искажена или скрыта. Показывает систематический характер дезинформации.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_lies_020',
    name: 'Приказ о "позитивной информации"',
    description: 'Директива о подаче только хороших новостей',
    fullDescription: 'Директива командования о том, что населению должна подаваться только "позитивная информация", а любые негативные факты должны скрываться или преподноситься в выгодном свете.',
    theme: 'faction_lies',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 55,
    rarity: 'rare'
  }
];

// Штаб (HQ) - 20 предметов faction_truth
export const HQ_FACTION_TRUTH_ITEMS: SidequestItem[] = [
  {
    id: 'hq_truth_001',
    name: 'Честный отчет о ситуации',
    description: 'Внутренний документ с реальными данными',
    fullDescription: 'Внутренний отчет командования Штаба с честной оценкой ситуации. Документ показывает, что руководство действительно понимает масштабы проблем и работает над их решением, несмотря на сложности.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_002',
    name: 'Письмо командира подчиненным',
    description: 'Личное обращение с правдивой оценкой',
    fullDescription: 'Письмо командира своим подчиненным, где он честно признает ошибки и призывает к честности в работе. Показывает, что не все в Штабе поддерживают политику сокрытия информации.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_003',
    name: 'Список реальных достижений',
    description: 'Документ с честными результатами работы',
    fullDescription: 'Список реальных достижений Штаба без приукрашивания. Показывает, что несмотря на проблемы, организация действительно помогает выжившим и восстанавливает инфраструктуру.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_truth_004',
    name: 'Дневник честного офицера',
    description: 'Записи офицера, работающего по совести',
    fullDescription: 'Дневник офицера Штаба, который ведет честную работу и помогает гражданским, несмотря на давление сверху. Показывает, что в организации есть порядочные люди.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_005',
    name: 'Отчет о спасенных людях',
    description: 'Документ с реальными цифрами спасенных',
    fullDescription: 'Отчет о количестве людей, реально спасенных усилиями Штаба. Показывает, что организация действительно выполняет свою миссию по защите выживших.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_truth_006',
    name: 'Письмо благодарности',
    description: 'Благодарность от спасенных людей',
    fullDescription: 'Письмо благодарности от группы выживших, которых спас отряд Штаба. Показывает, что действия организации действительно помогают людям в критических ситуациях.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_truth_007',
    name: 'Секретный приказ о помощи',
    description: 'Приказ о приоритете спасения гражданских',
    fullDescription: 'Секретный приказ командования, где четко указано, что спасение гражданских является приоритетом номер один, даже если это противоречит другим задачам.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_truth_008',
    name: 'Фото спасенной семьи',
    description: 'Снимки реальных спасенных людей',
    fullDescription: 'Фотографии семьи, спасенной отрядом Штаба. На снимках видно, что люди действительно благодарны и что операция была успешной.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_truth_009',
    name: 'Список добровольцев',
    description: 'Документ с именами добровольцев Штаба',
    fullDescription: 'Список людей, добровольно вступивших в ряды Штаба для защиты других. Показывает, что организация привлекает людей, готовых жертвовать собой ради общего блага.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_010',
    name: 'Записка от разведчика',
    description: 'Сообщение о реальной ситуации на местах',
    fullDescription: 'Записка от разведчика Штаба, который честно докладывает о ситуации на местах. Показывает, что организация получает правдивую информацию и действует на ее основе.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_011',
    name: 'Отчет о восстановлении',
    description: 'Документ с реальными результатами восстановления',
    fullDescription: 'Отчет о реальных результатах восстановительных работ, проведенных Штабом. Показывает конкретные достижения в восстановлении инфраструктуры и помощи населению.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_012',
    name: 'Секретные протоколы помощи',
    description: 'Протоколы заседаний о помощи населению',
    fullDescription: 'Секретные протоколы заседаний командования, где обсуждаются планы по оказанию помощи населению. Показывает, что руководство действительно заботится о людях.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_truth_013',
    name: 'Письмо от медика',
    description: 'Сообщение о реальной медицинской помощи',
    fullDescription: 'Письмо от военного медика, который описывает реальную работу по оказанию медицинской помощи гражданским. Показывает, что Штаб действительно заботится о здоровье людей.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_truth_014',
    name: 'Список "честных офицеров"',
    description: 'Документ с именами порядочных командиров',
    fullDescription: 'Список офицеров Штаба, известных своей честностью и преданностью делу защиты гражданских. Показывает, что в организации есть люди, которым можно доверять.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'rare'
  },
  {
    id: 'hq_truth_015',
    name: 'Записи честных переговоров',
    description: 'Стенограммы переговоров с правдивой информацией',
    fullDescription: 'Стенограммы переговоров между офицерами Штаба, где они честно обсуждают проблемы и ищут решения. Показывает, что не все в организации поддерживают политику сокрытия.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'hq_truth_016',
    name: 'Документы о реальных ресурсах',
    description: 'Честные отчеты о доступных ресурсах',
    fullDescription: 'Документы с честной оценкой доступных ресурсов и их распределения. Показывает, что Штаб действительно старается справедливо распределять то, что имеет.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_017',
    name: 'Секретный план "Честность"',
    description: 'План по улучшению прозрачности',
    fullDescription: 'Секретный план под кодовым названием "Честность", который описывает стратегию по улучшению прозрачности и доверия между Штабом и населением.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 85,
    rarity: 'legendary'
  },
  {
    id: 'hq_truth_018',
    name: 'Письмо от информатора',
    description: 'Сообщение о положительных изменениях',
    fullDescription: 'Письмо от информатора внутри Штаба, который сообщает о положительных изменениях в политике организации и о том, что руководство начинает понимать важность честности.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_truth_019',
    name: 'Список "честных сводок"',
    description: 'Документ с примерами правдивой информации',
    fullDescription: 'Список официальных сводок, которые содержат правдивую информацию. Показывает, что в Штабе есть тенденция к большей честности в некоторых вопросах.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_truth_020',
    name: 'Приказ о "честной информации"',
    description: 'Директива о правдивых сообщениях',
    fullDescription: 'Директива командования о том, что в определенных ситуациях населению должна подаваться честная информация, даже если она неприятна. Показывает эволюцию взглядов руководства.',
    theme: 'faction_truth',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 75,
    rarity: 'rare'
  }
];

// Штаб (HQ) - 20 предметов faction_neutral
export const HQ_FACTION_NEUTRAL_ITEMS: SidequestItem[] = [
  {
    id: 'hq_neutral_001',
    name: 'Официальный устав Штаба',
    description: 'Документ с основными принципами организации',
    fullDescription: 'Официальный устав Штаба, описывающий структуру организации, ее цели и методы работы. Документ нейтрален и не содержит явных признаков обмана или особой честности.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_002',
    name: 'Список подразделений',
    description: 'Документ с организационной структурой',
    fullDescription: 'Список подразделений Штаба и их функций. Показывает, как организована структура командования и распределение обязанностей между различными отделами.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_003',
    name: 'Техническое руководство',
    description: 'Инструкция по использованию оборудования',
    fullDescription: 'Техническое руководство по использованию оборудования Штаба. Содержит нейтральную информацию о том, как работает различная техника и системы связи.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_004',
    name: 'Список баз и объектов',
    description: 'Документ с расположением объектов Штаба',
    fullDescription: 'Список баз и объектов Штаба с их расположением и назначением. Содержит фактологическую информацию без оценки эффективности или проблем.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_005',
    name: 'Протокол заседания',
    description: 'Обычный протокол рабочего заседания',
    fullDescription: 'Протокол обычного рабочего заседания командования Штаба. Содержит стандартную информацию о принятых решениях и планах без особых подробностей.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 20,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_006',
    name: 'Справочник по процедурам',
    description: 'Руководство по стандартным процедурам',
    fullDescription: 'Справочник по стандартным процедурам Штаба. Описывает, как должны выполняться различные операции и какие правила необходимо соблюдать.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.book2,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_007',
    name: 'Список контактов',
    description: 'Документ с контактной информацией',
    fullDescription: 'Список контактной информации различных подразделений Штаба. Содержит номера телефонов, адреса и другие способы связи без личных оценок.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 15,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_008',
    name: 'Фото штаб-квартиры',
    description: 'Снимки здания командования',
    fullDescription: 'Фотографии штаб-квартиры Штаба и окружающей территории. Показывает внешний вид зданий и инфраструктуры без особых комментариев.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 20,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_009',
    name: 'Расписание дежурств',
    description: 'Документ с графиком работы',
    fullDescription: 'Расписание дежурств и график работы различных подразделений Штаба. Содержит информацию о том, кто и когда должен быть на посту.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 10,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_010',
    name: 'Список оборудования',
    description: 'Инвентарный список техники',
    fullDescription: 'Инвентарный список оборудования и техники, имеющейся в распоряжении Штаба. Содержит технические характеристики без оценки состояния.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_011',
    name: 'Отчет о численности',
    description: 'Документ с данными о количестве людей',
    fullDescription: 'Отчет о численности личного состава Штаба по подразделениям. Содержит статистические данные без анализа эффективности или проблем.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_012',
    name: 'Схема связи',
    description: 'Диаграмма системы коммуникаций',
    fullDescription: 'Схема системы связи и коммуникаций Штаба. Показывает, как организована передача информации между различными подразделениями.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_013',
    name: 'Список званий',
    description: 'Документ с иерархией званий',
    fullDescription: 'Список военных званий и должностей в структуре Штаба. Описывает иерархию командования и подчинения без личных характеристик.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 20,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_014',
    name: 'Техническая схема',
    description: 'Чертеж системы жизнеобеспечения',
    fullDescription: 'Техническая схема системы жизнеобеспечения одной из баз Штаба. Показывает, как организованы системы вентиляции, отопления и электроснабжения.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_015',
    name: 'Список частот',
    description: 'Документ с радиотехническими данными',
    fullDescription: 'Список рабочих частот и радиотехнических данных, используемых Штабом для связи. Содержит техническую информацию без оценки качества связи.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_016',
    name: 'Форма одежды',
    description: 'Описание униформы и снаряжения',
    fullDescription: 'Описание униформы и снаряжения, используемого личным составом Штаба. Содержит информацию о том, как должны выглядеть военнослужащие.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 15,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_017',
    name: 'Список знаков различия',
    description: 'Документ с описанием нашивок и значков',
    fullDescription: 'Список знаков различия, нашивок и значков, используемых в Штабе. Описывает, какие символы и цвета означают различные подразделения.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.badge,
    price: 20,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_018',
    name: 'Схема базы',
    description: 'План расположения объектов на базе',
    fullDescription: 'Схема расположения объектов на одной из баз Штаба. Показывает, где находятся различные здания, склады и технические сооружения.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_neutral_019',
    name: 'Список кодов',
    description: 'Документ с кодовыми обозначениями',
    fullDescription: 'Список кодовых обозначений и сокращений, используемых в документах Штаба. Помогает понять, что означают различные аббревиатуры и коды.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'hq_neutral_020',
    name: 'Техническое описание',
    description: 'Описание систем безопасности',
    fullDescription: 'Техническое описание систем безопасности, используемых на объектах Штаба. Содержит информацию о том, как организована защита баз и объектов.',
    theme: 'faction_neutral',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 50,
    rarity: 'uncommon'
  }
];

// Штаб (HQ) - 20 предметов world_history
export const HQ_WORLD_HISTORY_ITEMS: SidequestItem[] = [
  {
    id: 'hq_world_001',
    name: 'Документы о катастрофе',
    description: 'Архивные материалы о начале апокалипсиса',
    fullDescription: 'Архивные документы, описывающие первые дни катастрофы. Содержат информацию о том, как начался апокалипсис, какие события привели к краху цивилизации и как люди пытались выжить в первые месяцы.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_world_002',
    name: 'Фото разрушенного города',
    description: 'Снимки последствий катастрофы',
    fullDescription: 'Фотографии крупного города после катастрофы. Показывают масштабы разрушений, заброшенные здания и улицы, заросшие растительностью. Свидетельства того, как быстро природа отвоевывает территории у человека.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_003',
    name: 'Дневник выжившего',
    description: 'Личные записи о первых днях после катастрофы',
    fullDescription: 'Дневник человека, пережившего первые дни апокалипсиса. Описывает панику, хаос, попытки найти безопасное место и первые встречи с мутировавшими существами.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 55,
    rarity: 'rare'
  },
  {
    id: 'hq_world_004',
    name: 'Газета "Последний день"',
    description: 'Последний выпуск газеты перед катастрофой',
    fullDescription: 'Последний выпуск городской газеты, вышедший за день до катастрофы. Содержит обычные новости, рекламу и объявления - последние следы нормальной жизни перед крахом цивилизации.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_005',
    name: 'Карта до катастрофы',
    description: 'Старая карта мира до апокалипсиса',
    fullDescription: 'Карта мира, созданная до катастрофы. Показывает города, дороги, границы стран - все то, что существовало в эпоху цивилизации. Теперь многие из этих мест либо разрушены, либо недоступны.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_006',
    name: 'Записи ученого',
    description: 'Научные заметки о природе катастрофы',
    fullDescription: 'Записи ученого, изучавшего причины и последствия катастрофы. Содержат гипотезы о том, что могло вызвать апокалипсис, как изменилась экология и какие мутации произошли в природе.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_world_007',
    name: 'Письмо из прошлого',
    description: 'Последнее письмо, написанное до катастрофы',
    fullDescription: 'Письмо, написанное за несколько дней до катастрофы. Автор рассказывает о планах на будущее, мечтах и надеждах - о том, что никогда не сбудется. Трогательное напоминание о потерянном мире.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_world_008',
    name: 'Фото семьи',
    description: 'Семейное фото из эпохи до катастрофы',
    fullDescription: 'Семейная фотография, сделанная до катастрофы. На снимке счастливые люди, дети, домашние животные - все то, что было обычным в прежнем мире. Теперь это редкое напоминание о том, как жили люди раньше.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_world_009',
    name: 'Техническая документация',
    description: 'Документы о технологиях прошлого',
    fullDescription: 'Техническая документация, описывающая технологии, которые использовались до катастрофы. Содержит схемы, инструкции и спецификации устройств, многие из которых теперь недоступны или не работают.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 55,
    rarity: 'rare'
  },
  {
    id: 'hq_world_010',
    name: 'Список городов',
    description: 'Документ с названиями городов до катастрофы',
    fullDescription: 'Список городов и населенных пунктов, существовавших до катастрофы. Многие из этих мест теперь заброшены, разрушены или стали опасными. Документ показывает масштабы потерь цивилизации.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_world_011',
    name: 'Записи о погоде',
    description: 'Метеорологические данные до катастрофы',
    fullDescription: 'Метеорологические записи, сделанные до катастрофы. Показывают, какой была погода в последние дни нормальной жизни. Сравнение с нынешними условиями показывает, как изменился климат.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_012',
    name: 'Документы о правительстве',
    description: 'Архивные материалы о власти до катастрофы',
    fullDescription: 'Архивные документы о правительстве и государственных структурах, существовавших до катастрофы. Показывают, как была организована власть в прежнем мире и как она пыталась справиться с кризисом.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'hq_world_013',
    name: 'Фото школы',
    description: 'Снимки образовательных учреждений',
    fullDescription: 'Фотографии школ и университетов, сделанные до катастрофы. Показывают, как выглядели образовательные учреждения, где учились дети и студенты. Теперь эти здания либо разрушены, либо используются для других целей.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'hq_world_014',
    name: 'Записи о транспорте',
    description: 'Документы о транспортной системе',
    fullDescription: 'Документы о транспортной системе, существовавшей до катастрофы. Описывают автобусы, поезда, самолеты и другие виды транспорта. Многие из этих систем теперь не функционируют.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_015',
    name: 'Дневник врача',
    description: 'Записи медика о первых жертвах',
    fullDescription: 'Дневник врача, работавшего в первые дни катастрофы. Описывает первые жертвы, странные симптомы и попытки понять, что происходит с людьми. Содержит медицинские наблюдения о начале апокалипсиса.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_world_016',
    name: 'Фото больницы',
    description: 'Снимки медицинских учреждений',
    fullDescription: 'Фотографии больниц и клиник, сделанные до катастрофы. Показывают, как выглядели медицинские учреждения в эпоху цивилизации. Теперь многие из них заброшены или используются как убежища.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'hq_world_017',
    name: 'Записи о еде',
    description: 'Документы о пищевой промышленности',
    fullDescription: 'Документы о пищевой промышленности и сельском хозяйстве до катастрофы. Описывают, как производилась еда, какие продукты были доступны. Сравнение с нынешним дефицитом показывает масштабы потерь.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_018',
    name: 'Фото магазина',
    description: 'Снимки торговых центров',
    fullDescription: 'Фотографии магазинов и торговых центров, сделанные до катастрофы. Показывают изобилие товаров, которые были доступны людям. Теперь эти места либо разграблены, либо заброшены.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'hq_world_019',
    name: 'Записи о связи',
    description: 'Документы о коммуникационных системах',
    fullDescription: 'Документы о системах связи, существовавших до катастрофы. Описывают интернет, телефонию, телевидение и радио. Показывают, как люди общались и получали информацию в прежнем мире.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_world_020',
    name: 'Последние новости',
    description: 'Записи последних новостей перед катастрофой',
    fullDescription: 'Записи последних новостей, транслировавшихся перед катастрофой. Содержат информацию о событиях, которые происходили в мире в последние дни нормальной жизни. Последние свидетельства цивилизации.',
    theme: 'world_history',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 75,
    rarity: 'legendary'
  }
];

// Штаб (HQ) - 20 предметов enemy_origins
export const HQ_ENEMY_ORIGINS_ITEMS: SidequestItem[] = [
  {
    id: 'hq_enemy_001',
    name: 'Отчет о первых мутантах',
    description: 'Документ о первых зафиксированных мутациях',
    fullDescription: 'Отчет о первых зафиксированных случаях мутаций у людей и животных. Содержит описания странных изменений в поведении, физиологии и внешнем виде. Первые свидетельства того, что катастрофа затронула не только инфраструктуру, но и живые организмы.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_002',
    name: 'Фото зомби',
    description: 'Снимки первых зараженных',
    fullDescription: 'Фотографии первых людей, превратившихся в зомби. Показывают, как выглядели зараженные в начальной стадии - еще сохраняющие человеческий облик, но с явными признаками деградации. Ужасающие свидетельства начала эпидемии.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_003',
    name: 'Дневник биолога',
    description: 'Записи ученого о природе заражения',
    fullDescription: 'Дневник биолога, изучавшего природу заражения. Содержит гипотезы о том, что могло вызвать превращение людей в зомби, как распространяется инфекция и можно ли найти способ лечения. Научный подход к пониманию катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_004',
    name: 'Записи о поведении зомби',
    description: 'Документ с наблюдениями за зараженными',
    fullDescription: 'Записи с подробными наблюдениями за поведением зомби. Описывают, как они двигаются, охотятся, общаются между собой. Содержат информацию о том, сохраняют ли зараженные какие-то остатки человеческого разума.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_005',
    name: 'Фото мутанта',
    description: 'Снимки мутировавших существ',
    fullDescription: 'Фотографии мутировавших существ - животных и людей, которые изменились под воздействием катастрофы. Показывают различные типы мутаций: увеличенные размеры, дополнительные конечности, изменения в строении тела.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_006',
    name: 'Отчет о разведке',
    description: 'Документ о разведывательных операциях',
    fullDescription: 'Отчет о разведывательных операциях, проведенных для изучения зараженных территорий. Содержит информацию о том, где концентрируются зомби, как они организуются и какие угрозы представляют для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_007',
    name: 'Записи о заражении',
    description: 'Документ о способах передачи инфекции',
    fullDescription: 'Записи о том, как передается инфекция, превращающая людей в зомби. Содержат информацию о том, можно ли заразиться через укус, контакт с кровью или другими способами. Важные данные для выживания.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_008',
    name: 'Фото стаи зомби',
    description: 'Снимки группировок зараженных',
    fullDescription: 'Фотографии стай зомби, движущихся по городу. Показывают, как зараженные организуются в группы, координируют свои действия и охотятся на выживших. Свидетельства того, что у них есть некая форма коллективного разума.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'hq_enemy_009',
    name: 'Дневник выжившего',
    description: 'Записи о встречах с зараженными',
    fullDescription: 'Дневник выжившего, который описывает свои встречи с зомби и мутантами. Содержит личные наблюдения о том, как ведут себя зараженные, что их привлекает и как от них можно защититься.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'hq_enemy_010',
    name: 'Записи о слабостях',
    description: 'Документ о уязвимостях зараженных',
    fullDescription: 'Записи о слабостях и уязвимостях зомби и мутантов. Содержат информацию о том, как их можно уничтожить, что их отпугивает и какие методы борьбы наиболее эффективны.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_011',
    name: 'Фото лаборатории',
    description: 'Снимки исследовательского центра',
    fullDescription: 'Фотографии лаборатории, где изучали зараженных. Показывают оборудование, клетки с пленными зомби, образцы тканей. Свидетельства того, что кто-то пытался понять природу заражения научными методами.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_012',
    name: 'Отчет о мутациях',
    description: 'Документ о различных типах мутаций',
    fullDescription: 'Отчет о различных типах мутаций, наблюдаемых у зараженных. Описывает разные виды зомби и мутантов, их особенности, способности и поведение. Классификация угроз для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_013',
    name: 'Записи о разуме',
    description: 'Документ о интеллекте зараженных',
    fullDescription: 'Записи о том, сохраняют ли зомби и мутанты остатки человеческого разума. Содержат наблюдения о том, могут ли они планировать, общаться и использовать инструменты. Вопрос о том, что делает человека человеком.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_014',
    name: 'Фото зараженного ребенка',
    description: 'Снимки зараженных детей',
    fullDescription: 'Фотографии зараженных детей - одни из самых ужасающих свидетельств катастрофы. Показывают, что инфекция не щадит никого, и даже самые беззащитные становятся угрозой для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_015',
    name: 'Дневник медика',
    description: 'Записи врача о лечении зараженных',
    fullDescription: 'Дневник врача, который пытался лечить зараженных. Описывает попытки найти способ остановить превращение, различные методы лечения и их результаты. Трагическая история борьбы за спасение человечества.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_016',
    name: 'Записи о происхождении',
    description: 'Документ о возможных причинах заражения',
    fullDescription: 'Записи о возможных причинах возникновения заражения. Содержат гипотезы о том, что могло вызвать превращение людей в зомби - вирус, радиация, химическое оружие или что-то еще. Попытки понять корни катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_017',
    name: 'Фото зараженного животного',
    description: 'Снимки мутировавших животных',
    fullDescription: 'Фотографии животных, зараженных и мутировавших под воздействием катастрофы. Показывают, что инфекция затронула не только людей, но и всю экосистему. Собаки, кошки, птицы - все стали угрозой.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'hq_enemy_018',
    name: 'Отчет о эволюции',
    description: 'Документ о развитии заражения',
    fullDescription: 'Отчет о том, как развивается заражение со временем. Содержит информацию о том, становятся ли зомби и мутанты сильнее, умнее или опаснее с течением времени. Вопрос о том, эволюционируют ли угрозы.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'hq_enemy_019',
    name: 'Записи о контроле',
    description: 'Документ о попытках управления зараженными',
    fullDescription: 'Записи о попытках контролировать или управлять зараженными. Содержат информацию о том, можно ли их приручить, направить против других угроз или использовать в своих целях. Этические вопросы выживания.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'hq_enemy_020',
    name: 'Последние записи',
    description: 'Финальные документы о заражении',
    fullDescription: 'Последние записи исследователей, изучавших заражение. Содержат финальные выводы о природе угрозы, рекомендации по выживанию и предупреждения о том, что ждет человечество в будущем. Последние слова науки перед крахом.',
    theme: 'enemy_origins',
    targetFaction: 'hq',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  }
];

// Повстанцы (Rebels) - 20 предметов faction_lies
export const REBELS_FACTION_LIES_ITEMS: SidequestItem[] = [
  {
    id: 'rebels_lies_001',
    name: 'Секретный план "Освобождение"',
    description: 'Документ с планами насильственного захвата власти',
    fullDescription: 'Секретный план повстанцев под кодовым названием "Освобождение", который описывает насильственный захват власти и установление диктатуры. Показывает, что повстанцы не борются за свободу, а хотят заменить одну тиранию другой.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'rebels_lies_002',
    name: 'Письмо от перебежчика',
    description: 'Исповедь бывшего повстанца',
    fullDescription: 'Письмо бывшего повстанца, который сбежал из их рядов. Он описывает, как лидеры движения манипулируют людьми, используют религиозные лозунги для оправдания насилия и готовы пожертвовать жизнями невинных ради своих целей.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_003',
    name: 'Список жертв',
    description: 'Документ с именами убитых повстанцами',
    fullDescription: 'Список людей, убитых повстанцами в ходе их "освободительной борьбы". Включает женщин, детей и мирных жителей. Показывает, что повстанцы не щадят никого в своих атаках на бункеры и поселения.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_004',
    name: 'Фальшивая пропаганда',
    description: 'Листовки с ложными обещаниями',
    fullDescription: 'Пропагандистские листовки повстанцев с обещаниями свободы и справедливости. Но на обороте видны пометки о том, что эти обещания - ложь, и реальная цель - захват власти любой ценой.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'rebels_lies_005',
    name: 'Записи радиоперехвата',
    description: 'Перехваченные переговоры повстанцев',
    fullDescription: 'Записи радиопереговоров между лидерами повстанцев, где они обсуждают необходимость "устранения свидетелей" и "очистки территории". Показывает, что повстанцы готовы убивать даже своих сторонников ради сохранения секретов.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_006',
    name: 'Дневник бывшего лидера',
    description: 'Записи о реальных мотивах движения',
    fullDescription: 'Дневник бывшего лидера повстанцев, который описывает, как движение было создано не для борьбы за свободу, а для захвата власти и установления контроля над ресурсами. Показывает истинные мотивы руководства.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_007',
    name: 'Секретный приказ №12',
    description: 'Приказ о террористических актах',
    fullDescription: 'Секретный приказ повстанцев о проведении террористических актов против мирного населения. В документе прямо указано: "Любые средства оправданы для достижения цели". Показывает, что повстанцы готовы на все ради власти.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 85,
    rarity: 'legendary'
  },
  {
    id: 'rebels_lies_008',
    name: 'Фото с места атаки',
    description: 'Снимки последствий нападения повстанцев',
    fullDescription: 'Фотографии с места атаки повстанцев на мирное поселение. Показывают разрушения, трупы женщин и детей. Свидетельства того, что повстанцы не борются за свободу, а терроризируют население.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_009',
    name: 'Список "предателей"',
    description: 'Документ с именами казненных',
    fullDescription: 'Список людей, казненных повстанцами за "предательство". Многие из них просто сомневались в методах движения или задавали неудобные вопросы. Показывает, что повстанцы не терпят инакомыслия.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_010',
    name: 'Записка от информатора',
    description: 'Сообщение о готовящихся атаках',
    fullDescription: 'Записка от информатора внутри повстанческого движения, который предупреждает о готовящихся атаках на мирные поселения. Показывает, что повстанцы планируют новые террористические акты против невинных людей.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_011',
    name: 'Отчет о "успешных операциях"',
    description: 'Документ с приукрашенными результатами',
    fullDescription: 'Отчет о "успешных операциях" повстанцев, где реальные результаты приукрашены. В документе видны следы правки - количество убитых занижено, а разрушения преуменьшены. Попытка скрыть масштабы насилия.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_012',
    name: 'Секретные протоколы',
    description: 'Протоколы заседаний с реальными планами',
    fullDescription: 'Секретные протоколы заседаний руководства повстанцев, где обсуждаются планы по установлению диктатуры и подавлению инакомыслия. Показывает, что повстанцы хотят заменить одну тиранию другой.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'rebels_lies_013',
    name: 'Письмо родственникам',
    description: 'Личное письмо с правдой о движении',
    fullDescription: 'Письмо повстанца родственникам, где он описывает реальную ситуацию в движении - насилие, принуждение, ложь руководства. Письмо было перехвачено цензурой, но копия сохранилась.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_014',
    name: 'Список "запрещенных тем"',
    description: 'Документ с темами, о которых нельзя говорить',
    fullDescription: 'Список тем, которые запрещено обсуждать в рядах повстанцев. Включает вопросы о методах борьбы, жертвах среди мирного населения и реальных целях движения. Показывает, что повстанцы скрывают правду.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_015',
    name: 'Записи разговоров',
    description: 'Стенограммы частных разговоров лидеров',
    fullDescription: 'Стенограммы частных разговоров лидеров повстанцев, где они откровенно обсуждают необходимость насилия и обмана для достижения власти. Показывает истинные мотивы руководства движения.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_lies_016',
    name: 'Фальшивые документы',
    description: 'Поддельные документы для сокрытия правды',
    fullDescription: 'Набор поддельных документов, созданных повстанцами для сокрытия правды о своих действиях. Включает фальшивые отчеты, справки и свидетельства. Попытка скрыть масштабы насилия и разрушений.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_017',
    name: 'Секретный план "Чистота"',
    description: 'План по устранению неугодных',
    fullDescription: 'Секретный план повстанцев под кодовым названием "Чистота", который описывает стратегию по устранению всех, кто не поддерживает движение. План геноцида против инакомыслящих.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'rebels_lies_018',
    name: 'Письмо от цензора',
    description: 'Исповедь человека, скрывающего правду',
    fullDescription: 'Письмо от цензора повстанческого движения, который признается, что его работа заключается в сокрытии правды о насилии и разрушениях. Он описывает, как ежедневно искажает информацию для поддержания мифа о "освободительной борьбе".',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_019',
    name: 'Список "лживых сводок"',
    description: 'Документ с примерами искаженной информации',
    fullDescription: 'Список официальных сводок повстанцев с пометками о том, какая информация была искажена или скрыта. Показывает систематический характер дезинформации в движении.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_lies_020',
    name: 'Приказ о "позитивной информации"',
    description: 'Директива о подаче только хороших новостей',
    fullDescription: 'Директива руководства повстанцев о том, что населению должна подаваться только "позитивная информация" о движении, а любые негативные факты должны скрываться. Показывает, что повстанцы используют те же методы, что и их враги.',
    theme: 'faction_lies',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 65,
    rarity: 'rare'
  }
];

// Повстанцы (Rebels) - 20 предметов faction_truth
export const REBELS_FACTION_TRUTH_ITEMS: SidequestItem[] = [
  {
    id: 'rebels_truth_001',
    name: 'Честный манифест',
    description: 'Документ с истинными целями движения',
    fullDescription: 'Честный манифест повстанцев, где они открыто заявляют о своих целях - борьбе за свободу и справедливость. Документ показывает, что движение действительно создано для защиты прав людей от тирании.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_002',
    name: 'Письмо лидера',
    description: 'Личное обращение с правдивой оценкой',
    fullDescription: 'Письмо лидера повстанцев своим соратникам, где он честно признает ошибки и призывает к гуманным методам борьбы. Показывает, что не все в движении поддерживают насилие ради насилия.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_003',
    name: 'Список спасенных',
    description: 'Документ с именами освобожденных людей',
    fullDescription: 'Список людей, спасенных повстанцами из рабства и тирании. Показывает, что движение действительно помогает невинным и борется за их освобождение, а не за захват власти.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_004',
    name: 'Дневник честного бойца',
    description: 'Записи повстанца, борющегося по совести',
    fullDescription: 'Дневник повстанца, который ведет честную борьбу и защищает гражданских, несмотря на давление радикалов. Показывает, что в движении есть порядочные люди, которые действительно борются за идеалы.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_005',
    name: 'Отчет о гуманитарных операциях',
    description: 'Документ о помощи мирному населению',
    fullDescription: 'Отчет о гуманитарных операциях повстанцев по оказанию помощи мирному населению. Показывает, что движение действительно заботится о людях и помогает им в трудные времена.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_006',
    name: 'Письмо благодарности',
    description: 'Благодарность от освобожденных людей',
    fullDescription: 'Письмо благодарности от группы людей, освобожденных повстанцами от тирании. Показывает, что действия движения действительно помогают людям и приносят им свободу.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_007',
    name: 'Секретный приказ о защите',
    description: 'Приказ о приоритете защиты гражданских',
    fullDescription: 'Секретный приказ руководства повстанцев, где четко указано, что защита гражданских является приоритетом номер один, даже если это противоречит военным задачам.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 80,
    rarity: 'legendary'
  },
  {
    id: 'rebels_truth_008',
    name: 'Фото освобожденной семьи',
    description: 'Снимки спасенных людей',
    fullDescription: 'Фотографии семьи, освобожденной повстанцами от тирании. На снимках видно, что люди действительно благодарны и что операция была успешной.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_009',
    name: 'Список добровольцев',
    description: 'Документ с именами добровольцев движения',
    fullDescription: 'Список людей, добровольно вступивших в ряды повстанцев для борьбы за свободу. Показывает, что движение привлекает людей, готовых жертвовать собой ради идеалов справедливости.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_010',
    name: 'Записка от разведчика',
    description: 'Сообщение о реальной ситуации',
    fullDescription: 'Записка от разведчика повстанцев, который честно докладывает о ситуации на местах. Показывает, что движение получает правдивую информацию и действует на ее основе.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_011',
    name: 'Отчет о восстановлении',
    description: 'Документ с результатами восстановительных работ',
    fullDescription: 'Отчет о результатах восстановительных работ, проведенных повстанцами в освобожденных районах. Показывает конкретные достижения в восстановлении инфраструктуры и помощи населению.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_012',
    name: 'Секретные протоколы помощи',
    description: 'Протоколы заседаний о помощи населению',
    fullDescription: 'Секретные протоколы заседаний руководства повстанцев, где обсуждаются планы по оказанию помощи населению. Показывает, что руководство действительно заботится о людях.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_013',
    name: 'Письмо от медика',
    description: 'Сообщение о медицинской помощи',
    fullDescription: 'Письмо от медика повстанцев, который описывает работу по оказанию медицинской помощи гражданским. Показывает, что движение действительно заботится о здоровье людей.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_014',
    name: 'Список "честных командиров"',
    description: 'Документ с именами порядочных лидеров',
    fullDescription: 'Список командиров повстанцев, известных своей честностью и преданностью делу освобождения. Показывает, что в движении есть люди, которым можно доверять.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_015',
    name: 'Записи честных переговоров',
    description: 'Стенограммы переговоров с правдивой информацией',
    fullDescription: 'Стенограммы переговоров между лидерами повстанцев, где они честно обсуждают проблемы и ищут решения. Показывает, что не все в движении поддерживают радикальные методы.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_truth_016',
    name: 'Документы о справедливом распределении',
    description: 'Честные отчеты о распределении ресурсов',
    fullDescription: 'Документы с честной оценкой доступных ресурсов и их справедливого распределения. Показывает, что повстанцы действительно стараются помочь всем нуждающимся.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_017',
    name: 'Секретный план "Справедливость"',
    description: 'План по установлению справедливого порядка',
    fullDescription: 'Секретный план повстанцев под кодовым названием "Справедливость", который описывает стратегию по установлению справедливого и демократического порядка после победы.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 85,
    rarity: 'legendary'
  },
  {
    id: 'rebels_truth_018',
    name: 'Письмо от информатора',
    description: 'Сообщение о положительных изменениях',
    fullDescription: 'Письмо от информатора внутри повстанческого движения, который сообщает о положительных изменениях в политике и о том, что руководство начинает понимать важность гуманности.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_019',
    name: 'Список "честных сводок"',
    description: 'Документ с примерами правдивой информации',
    fullDescription: 'Список официальных сводок повстанцев, которые содержат правдивую информацию. Показывает, что в движении есть тенденция к большей честности в некоторых вопросах.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_truth_020',
    name: 'Приказ о "честной информации"',
    description: 'Директива о правдивых сообщениях',
    fullDescription: 'Директива руководства повстанцев о том, что населению должна подаваться честная информация о движении, даже если она неприятна. Показывает эволюцию взглядов руководства.',
    theme: 'faction_truth',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 75,
    rarity: 'rare'
  }
];

// Повстанцы (Rebels) - 20 предметов faction_neutral
export const REBELS_FACTION_NEUTRAL_ITEMS: SidequestItem[] = [
  {
    id: 'rebels_neutral_001',
    name: 'Официальный устав движения',
    description: 'Документ с основными принципами повстанцев',
    fullDescription: 'Официальный устав повстанческого движения, описывающий структуру организации, ее цели и методы работы. Документ нейтрален и не содержит явных признаков обмана или особой честности.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_002',
    name: 'Список подразделений',
    description: 'Документ с организационной структурой',
    fullDescription: 'Список подразделений повстанческого движения и их функций. Показывает, как организована структура командования и распределение обязанностей между различными отрядами.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_003',
    name: 'Техническое руководство',
    description: 'Инструкция по использованию оружия',
    fullDescription: 'Техническое руководство по использованию оружия и оборудования повстанцев. Содержит нейтральную информацию о том, как работает различная техника и системы связи.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_004',
    name: 'Список баз и лагерей',
    description: 'Документ с расположением объектов',
    fullDescription: 'Список баз и лагерей повстанцев с их расположением и назначением. Содержит фактологическую информацию без оценки эффективности или проблем.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_005',
    name: 'Протокол заседания',
    description: 'Обычный протокол рабочего заседания',
    fullDescription: 'Протокол обычного рабочего заседания руководства повстанцев. Содержит стандартную информацию о принятых решениях и планах без особых подробностей.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_006',
    name: 'Справочник по процедурам',
    description: 'Руководство по стандартным процедурам',
    fullDescription: 'Справочник по стандартным процедурам повстанческого движения. Описывает, как должны выполняться различные операции и какие правила необходимо соблюдать.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.book2,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_007',
    name: 'Список контактов',
    description: 'Документ с контактной информацией',
    fullDescription: 'Список контактной информации различных подразделений повстанцев. Содержит номера телефонов, адреса и другие способы связи без личных оценок.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_008',
    name: 'Фото лагеря',
    description: 'Снимки повстанческого лагеря',
    fullDescription: 'Фотографии повстанческого лагеря и окружающей территории. Показывают внешний вид зданий и инфраструктуры без особых комментариев.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_009',
    name: 'Расписание дежурств',
    description: 'Документ с графиком работы',
    fullDescription: 'Расписание дежурств и график работы различных подразделений повстанцев. Содержит информацию о том, кто и когда должен быть на посту.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 20,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_010',
    name: 'Список оборудования',
    description: 'Инвентарный список техники',
    fullDescription: 'Инвентарный список оборудования и техники, имеющейся в распоряжении повстанцев. Содержит технические характеристики без оценки состояния.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_011',
    name: 'Отчет о численности',
    description: 'Документ с данными о количестве людей',
    fullDescription: 'Отчет о численности личного состава повстанцев по подразделениям. Содержит статистические данные без анализа эффективности или проблем.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_012',
    name: 'Схема связи',
    description: 'Диаграмма системы коммуникаций',
    fullDescription: 'Схема системы связи и коммуникаций повстанцев. Показывает, как организована передача информации между различными подразделениями.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_013',
    name: 'Список званий',
    description: 'Документ с иерархией званий',
    fullDescription: 'Список военных званий и должностей в структуре повстанцев. Описывает иерархию командования и подчинения без личных характеристик.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_014',
    name: 'Техническая схема',
    description: 'Чертеж системы жизнеобеспечения',
    fullDescription: 'Техническая схема системы жизнеобеспечения одного из лагерей повстанцев. Показывает, как организованы системы вентиляции, отопления и электроснабжения.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_015',
    name: 'Список частот',
    description: 'Документ с радиотехническими данными',
    fullDescription: 'Список рабочих частот и радиотехнических данных, используемых повстанцами для связи. Содержит техническую информацию без оценки качества связи.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_016',
    name: 'Форма одежды',
    description: 'Описание униформы и снаряжения',
    fullDescription: 'Описание униформы и снаряжения, используемого личным составом повстанцев. Содержит информацию о том, как должны выглядеть бойцы.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 25,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_017',
    name: 'Список знаков различия',
    description: 'Документ с описанием нашивок и значков',
    fullDescription: 'Список знаков различия, нашивок и значков, используемых в повстанческом движении. Описывает, какие символы и цвета означают различные подразделения.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.badge,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'rebels_neutral_018',
    name: 'Схема лагеря',
    description: 'План расположения объектов в лагере',
    fullDescription: 'Схема расположения объектов в одном из лагерей повстанцев. Показывает, где находятся различные здания, склады и технические сооружения.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_019',
    name: 'Список кодов',
    description: 'Документ с кодовыми обозначениями',
    fullDescription: 'Список кодовых обозначений и сокращений, используемых в документах повстанцев. Помогает понять, что означают различные аббревиатуры и коды.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_neutral_020',
    name: 'Техническое описание',
    description: 'Описание систем безопасности',
    fullDescription: 'Техническое описание систем безопасности, используемых в лагерях повстанцев. Содержит информацию о том, как организована защита баз и объектов.',
    theme: 'faction_neutral',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 60,
    rarity: 'uncommon'
  }
];

// Повстанцы (Rebels) - 20 предметов world_history
export const REBELS_WORLD_HISTORY_ITEMS: SidequestItem[] = [
  {
    id: 'rebels_world_001',
    name: 'Документы о начале восстания',
    description: 'Архивные материалы о первых днях повстанческого движения',
    fullDescription: 'Архивные документы, описывающие первые дни повстанческого движения. Содержат информацию о том, как началось восстание, какие события привели к его возникновению и как люди объединялись для борьбы с тиранией.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_002',
    name: 'Фото первых бойцов',
    description: 'Снимки основателей движения',
    fullDescription: 'Фотографии первых бойцов повстанческого движения, сделанные в начале восстания. Показывают обычных людей, которые решили бороться за свободу и справедливость, несмотря на опасность.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_003',
    name: 'Дневник основателя',
    description: 'Личные записи о создании движения',
    fullDescription: 'Дневник одного из основателей повстанческого движения, который описывает, как зарождалась идея восстания, как находились единомышленники и как создавалась первая ячейка сопротивления.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_004',
    name: 'Газета "Первый призыв"',
    description: 'Первый выпуск подпольной газеты',
    fullDescription: 'Первый выпуск подпольной газеты повстанцев, напечатанный в тайной типографии. Содержит призыв к сопротивлению и первые идеи о том, как должна быть организована борьба за свободу.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_005',
    name: 'Карта первых операций',
    description: 'Старая карта с местами первых атак',
    fullDescription: 'Карта с отмеченными местами первых операций повстанцев. Показывает, где происходили первые атаки на объекты тирании, где создавались первые лагеря и где скрывались бойцы.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_006',
    name: 'Записи о первых победах',
    description: 'Научные заметки о первых успехах',
    fullDescription: 'Записи о первых победах повстанческого движения над силами тирании. Содержат анализ того, что привело к успеху, какие методы оказались эффективными и как развивалось движение.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_007',
    name: 'Письмо из прошлого',
    description: 'Последнее письмо перед началом восстания',
    fullDescription: 'Письмо, написанное за несколько дней до начала восстания. Автор рассказывает о планах на будущее, мечтах о свободе и надеждах на победу. Трогательное напоминание о том, что двигало первыми бойцами.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_008',
    name: 'Фото семьи бойца',
    description: 'Семейное фото из эпохи до восстания',
    fullDescription: 'Семейная фотография одного из первых бойцов, сделанная до начала восстания. На снимке счастливые люди, дети, домашние животные - все то, что было обычным в прежнем мире. Теперь это напоминание о том, за что борются повстанцы.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_009',
    name: 'Техническая документация',
    description: 'Документы о технологиях прошлого',
    fullDescription: 'Техническая документация, описывающая технологии, которые использовались до восстания. Содержит схемы, инструкции и спецификации устройств, многие из которых теперь недоступны или не работают.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_010',
    name: 'Список первых лагерей',
    description: 'Документ с названиями первых баз',
    fullDescription: 'Список первых лагерей и баз повстанцев, созданных в начале восстания. Многие из этих мест теперь заброшены, разрушены или стали легендарными. Документ показывает, как развивалось движение.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'rebels_world_011',
    name: 'Записи о погоде',
    description: 'Метеорологические данные до восстания',
    fullDescription: 'Метеорологические записи, сделанные до начала восстания. Показывают, какой была погода в последние дни нормальной жизни. Сравнение с нынешними условиями показывает, как изменился климат.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_012',
    name: 'Документы о правительстве',
    description: 'Архивные материалы о власти до восстания',
    fullDescription: 'Архивные документы о правительстве и государственных структурах, существовавших до восстания. Показывают, как была организована власть в прежнем мире и как она пыталась подавить сопротивление.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_013',
    name: 'Фото школы',
    description: 'Снимки образовательных учреждений',
    fullDescription: 'Фотографии школ и университетов, сделанные до восстания. Показывают, как выглядели образовательные учреждения, где учились дети и студенты. Теперь эти здания либо разрушены, либо используются для других целей.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_014',
    name: 'Записи о транспорте',
    description: 'Документы о транспортной системе',
    fullDescription: 'Документы о транспортной системе, существовавшей до восстания. Описывают автобусы, поезда, самолеты и другие виды транспорта. Многие из этих систем теперь не функционируют.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_015',
    name: 'Дневник врача',
    description: 'Записи медика о первых раненых',
    fullDescription: 'Дневник врача, работавшего в первые дни восстания. Описывает первых раненых бойцов, попытки оказать медицинскую помощь в условиях подполья и трудности работы без нормального оборудования.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_016',
    name: 'Фото больницы',
    description: 'Снимки медицинских учреждений',
    fullDescription: 'Фотографии больниц и клиник, сделанные до восстания. Показывают, как выглядели медицинские учреждения в эпоху цивилизации. Теперь многие из них заброшены или используются как убежища.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_017',
    name: 'Записи о еде',
    description: 'Документы о пищевой промышленности',
    fullDescription: 'Документы о пищевой промышленности и сельском хозяйстве до восстания. Описывают, как производилась еда, какие продукты были доступны. Сравнение с нынешним дефицитом показывает масштабы потерь.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_world_018',
    name: 'Фото магазина',
    description: 'Снимки торговых центров',
    fullDescription: 'Фотографии магазинов и торговых центров, сделанные до восстания. Показывают изобилие товаров, которые были доступны людям. Теперь эти места либо разграблены, либо заброшены.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'rebels_world_019',
    name: 'Записи о связи',
    description: 'Документы о коммуникационных системах',
    fullDescription: 'Документы о системах связи, существовавших до восстания. Описывают интернет, телефонию, телевидение и радио. Показывают, как люди общались и получали информацию в прежнем мире.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'rebels_world_020',
    name: 'Последние новости',
    description: 'Записи последних новостей перед восстанием',
    fullDescription: 'Записи последних новостей, транслировавшихся перед началом восстания. Содержат информацию о событиях, которые происходили в мире в последние дни нормальной жизни. Последние свидетельства цивилизации.',
    theme: 'world_history',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 85,
    rarity: 'legendary'
  }
];

// Повстанцы (Rebels) - 20 предметов enemy_origins
export const REBELS_ENEMY_ORIGINS_ITEMS: SidequestItem[] = [
  {
    id: 'rebels_enemy_001',
    name: 'Отчет о первых мутантах',
    description: 'Документ о первых зафиксированных мутациях',
    fullDescription: 'Отчет повстанцев о первых зафиксированных случаях мутаций у людей и животных. Содержит описания странных изменений в поведении, физиологии и внешнем виде. Первые свидетельства того, что катастрофа затронула не только инфраструктуру, но и живые организмы.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_002',
    name: 'Фото зомби',
    description: 'Снимки первых зараженных',
    fullDescription: 'Фотографии первых людей, превратившихся в зомби, сделанные повстанцами. Показывают, как выглядели зараженные в начальной стадии - еще сохраняющие человеческий облик, но с явными признаками деградации. Ужасающие свидетельства начала эпидемии.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_003',
    name: 'Дневник биолога',
    description: 'Записи ученого о природе заражения',
    fullDescription: 'Дневник биолога-повстанца, изучавшего природу заражения. Содержит гипотезы о том, что могло вызвать превращение людей в зомби, как распространяется инфекция и можно ли найти способ лечения. Научный подход к пониманию катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_004',
    name: 'Записи о поведении зомби',
    description: 'Документ с наблюдениями за зараженными',
    fullDescription: 'Записи повстанцев с подробными наблюдениями за поведением зомби. Описывают, как они двигаются, охотятся, общаются между собой. Содержат информацию о том, сохраняют ли зараженные какие-то остатки человеческого разума.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_005',
    name: 'Фото мутанта',
    description: 'Снимки мутировавших существ',
    fullDescription: 'Фотографии мутировавших существ - животных и людей, которые изменились под воздействием катастрофы. Сделаны повстанцами во время разведывательных операций. Показывают различные типы мутаций: увеличенные размеры, дополнительные конечности, изменения в строении тела.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_006',
    name: 'Отчет о разведке',
    description: 'Документ о разведывательных операциях',
    fullDescription: 'Отчет повстанцев о разведывательных операциях, проведенных для изучения зараженных территорий. Содержит информацию о том, где концентрируются зомби, как они организуются и какие угрозы представляют для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_007',
    name: 'Записи о заражении',
    description: 'Документ о способах передачи инфекции',
    fullDescription: 'Записи повстанцев о том, как передается инфекция, превращающая людей в зомби. Содержат информацию о том, можно ли заразиться через укус, контакт с кровью или другими способами. Важные данные для выживания.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_008',
    name: 'Фото стаи зомби',
    description: 'Снимки группировок зараженных',
    fullDescription: 'Фотографии стай зомби, движущихся по городу. Сделаны повстанцами во время разведывательных операций. Показывают, как зараженные организуются в группы, координируют свои действия и охотятся на выживших. Свидетельства того, что у них есть некая форма коллективного разума.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_enemy_009',
    name: 'Дневник выжившего',
    description: 'Записи о встречах с зараженными',
    fullDescription: 'Дневник выжившего-повстанца, который описывает свои встречи с зомби и мутантами. Содержит личные наблюдения о том, как ведут себя зараженные, что их привлекает и как от них можно защититься.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_enemy_010',
    name: 'Записи о слабостях',
    description: 'Документ о уязвимостях зараженных',
    fullDescription: 'Записи повстанцев о слабостях и уязвимостях зомби и мутантов. Содержат информацию о том, как их можно уничтожить, что их отпугивает и какие методы борьбы наиболее эффективны.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_011',
    name: 'Фото лаборатории',
    description: 'Снимки исследовательского центра',
    fullDescription: 'Фотографии лаборатории, где изучали зараженных. Сделаны повстанцами во время рейда. Показывают оборудование, клетки с пленными зомби, образцы тканей. Свидетельства того, что кто-то пытался понять природу заражения научными методами.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_012',
    name: 'Отчет о мутациях',
    description: 'Документ о различных типах мутаций',
    fullDescription: 'Отчет повстанцев о различных типах мутаций, наблюдаемых у зараженных. Описывает разные виды зомби и мутантов, их особенности, способности и поведение. Классификация угроз для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_013',
    name: 'Записи о разуме',
    description: 'Документ о интеллекте зараженных',
    fullDescription: 'Записи повстанцев о том, сохраняют ли зомби и мутанты остатки человеческого разума. Содержат наблюдения о том, могут ли они планировать, общаться и использовать инструменты. Вопрос о том, что делает человека человеком.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_014',
    name: 'Фото зараженного ребенка',
    description: 'Снимки зараженных детей',
    fullDescription: 'Фотографии зараженных детей - одни из самых ужасающих свидетельств катастрофы. Сделаны повстанцами во время разведывательных операций. Показывают, что инфекция не щадит никого, и даже самые беззащитные становятся угрозой для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_015',
    name: 'Дневник медика',
    description: 'Записи врача о лечении зараженных',
    fullDescription: 'Дневник врача-повстанца, который пытался лечить зараженных. Описывает попытки найти способ остановить превращение, различные методы лечения и их результаты. Трагическая история борьбы за спасение человечества.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_016',
    name: 'Записи о происхождении',
    description: 'Документ о возможных причинах заражения',
    fullDescription: 'Записи повстанцев о возможных причинах возникновения заражения. Содержат гипотезы о том, что могло вызвать превращение людей в зомби - вирус, радиация, химическое оружие или что-то еще. Попытки понять корни катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_017',
    name: 'Фото зараженного животного',
    description: 'Снимки мутировавших животных',
    fullDescription: 'Фотографии животных, зараженных и мутировавших под воздействием катастрофы. Сделаны повстанцами во время разведывательных операций. Показывают, что инфекция затронула не только людей, но и всю экосистему. Собаки, кошки, птицы - все стали угрозой.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'rebels_enemy_018',
    name: 'Отчет о эволюции',
    description: 'Документ о развитии заражения',
    fullDescription: 'Отчет повстанцев о том, как развивается заражение со временем. Содержит информацию о том, становятся ли зомби и мутанты сильнее, умнее или опаснее с течением времени. Вопрос о том, эволюционируют ли угрозы.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'rebels_enemy_019',
    name: 'Записи о контроле',
    description: 'Документ о попытках управления зараженными',
    fullDescription: 'Записи повстанцев о попытках контролировать или управлять зараженными. Содержат информацию о том, можно ли их приручить, направить против других угроз или использовать в своих целях. Этические вопросы выживания.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'rebels_enemy_020',
    name: 'Последние записи',
    description: 'Финальные документы о заражении',
    fullDescription: 'Последние записи исследователей-повстанцев, изучавших заражение. Содержат финальные выводы о природе угрозы, рекомендации по выживанию и предупреждения о том, что ждет человечество в будущем. Последние слова науки перед крахом.',
    theme: 'enemy_origins',
    targetFaction: 'rebels',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 105,
    rarity: 'legendary'
  }
];

// Мародеры (Marauders) - 20 предметов faction_lies
export const MARAUDERS_FACTION_LIES_ITEMS: SidequestItem[] = [
  {
    id: 'marauders_lies_001',
    name: 'Секретный план "Разграбление"',
    description: 'Документ о планах нападения на бункеры',
    fullDescription: 'Секретный документ мародеров, описывающий планы нападения на мирные бункеры. Содержит информацию о том, как они планируют захватывать ресурсы, брать заложников и уничтожать сопротивление. Показывает мародеров как жестоких захватчиков.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_002',
    name: 'Письмо от перебежчика',
    description: 'Сообщение от бывшего мародера',
    fullDescription: 'Письмо от бывшего мародера, который сбежал из банды. Описывает ужасы жизни в группе мародеров - жестокость, насилие, отсутствие морали. Предупреждает о планах банды и призывает к осторожности.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_003',
    name: 'Фото жертв',
    description: 'Снимки разрушенных бункеров',
    fullDescription: 'Фотографии разрушенных бункеров и их обитателей, сделанные мародерами как трофеи. Показывают последствия нападений - сожженные здания, разграбленные склады, следы насилия. Ужасающие свидетельства жестокости мародеров.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'marauders_lies_004',
    name: 'Дневник лидера банды',
    description: 'Записи главаря мародеров',
    fullDescription: 'Дневник лидера банды мародеров, в котором он описывает свои планы по захвату территории, уничтожению конкурентов и установлению контроля над ресурсами. Показывает мародеров как безжалостных завоевателей.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_005',
    name: 'Список целей',
    description: 'Документ с бункерами для атаки',
    fullDescription: 'Список бункеров и поселений, намеченных мародерами для атаки. Содержит информацию о защите целей, их ресурсах и слабых местах. Показывает, что мародеры тщательно планируют свои нападения.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_006',
    name: 'Записи о пытках',
    description: 'Документ с методами допроса',
    fullDescription: 'Записи мародеров о методах допроса пленных и получения информации. Содержит описания жестоких пыток, психологического давления и других способов принуждения. Показывает мародеров как садистов.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'marauders_lies_007',
    name: 'Фото оружия',
    description: 'Снимки арсенала мародеров',
    fullDescription: 'Фотографии арсенала мародеров - оружие, взрывчатка, боеприпасы. Показывают, что у них есть доступ к военной технике и они готовы к серьезным боевым действиям. Демонстрируют военную мощь банды.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_lies_008',
    name: 'Карта нападений',
    description: 'Карта с отмеченными атаками',
    fullDescription: 'Карта с отмеченными местами нападений мародеров на мирные поселения. Показывает масштабы их деятельности и то, как они расширяют свою территорию. Свидетельства систематических атак.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_009',
    name: 'Записи о рабстве',
    description: 'Документ о торговле людьми',
    fullDescription: 'Записи мародеров о торговле пленными и использовании рабского труда. Содержат информацию о том, как они обращаются с захваченными людьми, продают их или заставляют работать. Показывает мародеров как работорговцев.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'marauders_lies_010',
    name: 'Фото лагеря',
    description: 'Снимки базы мародеров',
    fullDescription: 'Фотографии лагеря мародеров, показывающие их организацию и дисциплину. Видны укрепления, оружие, пленные в клетках. Показывает, что мародеры создали хорошо организованную военную структуру.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_lies_011',
    name: 'Дневник наемника',
    description: 'Записи бойца банды',
    fullDescription: 'Дневник бойца банды мародеров, в котором он описывает свои "подвиги" - нападения на мирных жителей, грабежи, убийства. Показывает, как мародеры гордятся своей жестокостью и считают насилие нормой.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_012',
    name: 'Записи о наркотиках',
    description: 'Документ о производстве стимуляторов',
    fullDescription: 'Записи мародеров о производстве и распространении наркотиков и стимуляторов. Содержат информацию о том, как они используют химические вещества для контроля над людьми и получения прибыли.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_013',
    name: 'Фото пленных',
    description: 'Снимки захваченных людей',
    fullDescription: 'Фотографии пленных, захваченных мародерами во время нападений. Показывают людей в клетках, связанных, избитых. Свидетельства того, что мародеры берут заложников и обращаются с ними жестоко.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_014',
    name: 'Список предателей',
    description: 'Документ с именами перебежчиков',
    fullDescription: 'Список людей, которые предали мародеров или пытались сбежать из банды. Содержит информацию о том, как с ними поступили - казнили, пытали или продали. Показывает, что мародеры жестоко расправляются с предателями.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_lies_015',
    name: 'Записи о вымогательстве',
    description: 'Документ о системе "защиты"',
    fullDescription: 'Записи мародеров о системе вымогательства "защиты" с мирных поселений. Содержат информацию о том, как они заставляют людей платить дань под угрозой нападения. Показывает мародеров как вымогателей.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_016',
    name: 'Фото трофеев',
    description: 'Снимки награбленного имущества',
    fullDescription: 'Фотографии трофеев, захваченных мародерами во время нападений - еда, оружие, ценности. Показывают, что мародеры грабят все подряд и не оставляют ничего выжившим. Демонстрируют их жадность.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_lies_017',
    name: 'Дневник садиста',
    description: 'Записи о жестоких развлечениях',
    fullDescription: 'Дневник одного из мародеров, в котором он описывает жестокие "развлечения" банды - пытки пленных, убийства ради забавы, разрушение всего подряд. Показывает мародеров как психопатов.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'marauders_lies_018',
    name: 'Записи о каннибализме',
    description: 'Документ о поедании людей',
    fullDescription: 'Записи мародеров о случаях каннибализма в банде. Содержат информацию о том, как они поедают пленных или мертвых врагов. Показывает мародеров как людоедов, потерявших человечность.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'marauders_lies_019',
    name: 'Фото ритуалов',
    description: 'Снимки жестоких церемоний',
    fullDescription: 'Фотографии ритуалов мародеров - жестокие церемонии посвящения, казни пленных, сожжение тел. Показывают, что мародеры создали свою извращенную "культуру" насилия и смерти.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_lies_020',
    name: 'Последние приказы',
    description: 'Финальные распоряжения лидера',
    fullDescription: 'Последние приказы лидера банды мародеров перед крупной операцией. Содержат инструкции по уничтожению всех свидетелей, сожжению поселений и убийству детей. Показывает мародеров как абсолютное зло.',
    theme: 'faction_lies',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  }
];

// Мародеры (Marauders) - 20 предметов faction_truth
export const MARAUDERS_FACTION_TRUTH_ITEMS: SidequestItem[] = [
  {
    id: 'marauders_truth_001',
    name: 'Честный манифест',
    description: 'Истинные цели и принципы мародеров',
    fullDescription: 'Честный манифест мародеров, в котором они объясняют свои истинные цели - не грабеж, а создание сильного сообщества выживших. Описывают, как они защищают своих людей и обеспечивают порядок в хаосе.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_002',
    name: 'Письмо лидера',
    description: 'Личное послание главаря банды',
    fullDescription: 'Личное письмо лидера мародеров, в котором он объясняет, как стал главой банды. Рассказывает о том, как он собрал вокруг себя людей, потерявших все, и дал им цель и защиту в жестоком мире.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_003',
    name: 'Фото семьи',
    description: 'Семейные фотографии мародеров',
    fullDescription: 'Семейные фотографии мародеров, показывающие их как обычных людей с детьми, родителями, любимыми. Доказывают, что мародеры - не монстры, а люди, которые потеряли свои семьи и пытаются выжить.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_004',
    name: 'Дневник защитника',
    description: 'Записи о защите слабых',
    fullDescription: 'Дневник мародера, в котором он описывает, как их банда защищает слабых и беззащитных. Рассказывает о спасении детей, стариков и раненых. Показывает мародеров как защитников, а не захватчиков.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_005',
    name: 'Список спасенных',
    description: 'Документ с именами спасенных людей',
    fullDescription: 'Список людей, спасенных мародерами от зомби, голода и других угроз. Содержит имена, даты спасения и судьбы людей. Показывает, что мародеры не только берут, но и спасают жизни.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_006',
    name: 'Записи о торговле',
    description: 'Документ о честной торговле',
    fullDescription: 'Записи мародеров о честной торговле с другими группами выживших. Содержат информацию о том, как они обменивают ресурсы, помогают соседям и строят торговые отношения. Показывает мародеров как торговцев, а не грабителей.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_007',
    name: 'Фото школы',
    description: 'Снимки образовательного центра',
    fullDescription: 'Фотографии школы, созданной мародерами для детей. Показывают, как они обучают детей чтению, письму и выживанию. Доказывают, что мародеры заботятся о будущем и образовании.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_008',
    name: 'Карта союзов',
    description: 'Карта с союзными группами',
    fullDescription: 'Карта с отмеченными группами выживших, с которыми мародеры заключили союзы. Показывает, что они строят мирные отношения и сотрудничество, а не ведут войны.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_009',
    name: 'Записи о медицине',
    description: 'Документ о медицинской помощи',
    fullDescription: 'Записи мародеров о медицинской помощи, которую они оказывают своим людям и соседям. Содержат информацию о лечении раненых, борьбе с болезнями и спасении жизней. Показывает мародеров как целителей.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_010',
    name: 'Фото фермы',
    description: 'Снимки сельскохозяйственных угодий',
    fullDescription: 'Фотографии фермы, созданной мародерами для производства еды. Показывают, как они выращивают овощи, разводят животных и обеспечивают продовольственную безопасность. Доказывают, что мародеры не только берут, но и производят.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_011',
    name: 'Дневник строителя',
    description: 'Записи о строительстве убежищ',
    fullDescription: 'Дневник мародера, в котором он описывает, как их банда строит убежища для выживших. Рассказывает о создании безопасных мест, укреплений и инфраструктуры. Показывает мародеров как строителей, а не разрушителей.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_012',
    name: 'Записи о справедливости',
    description: 'Документ о системе правосудия',
    fullDescription: 'Записи мародеров о системе правосудия, которую они создали в своем сообществе. Содержат информацию о том, как они решают споры, наказывают преступников и защищают права людей. Показывает мародеров как создателей порядка.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_013',
    name: 'Фото праздника',
    description: 'Снимки празднования в лагере',
    fullDescription: 'Фотографии праздника в лагере мародеров - люди танцуют, поют, едят вместе. Показывают, что мародеры умеют радоваться жизни и создавать радостные моменты даже в тяжелые времена.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'marauders_truth_014',
    name: 'Список благотворительности',
    description: 'Документ о помощи нуждающимся',
    fullDescription: 'Список людей и групп, которым мародеры оказали помощь - еда, лекарства, защита. Содержит информацию о том, как они помогают слабым и нуждающимся. Показывает мародеров как благотворителей.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_015',
    name: 'Записи о дипломатии',
    description: 'Документ о мирных переговорах',
    fullDescription: 'Записи мародеров о мирных переговорах с другими группами. Содержат информацию о том, как они решают конфликты дипломатическим путем, заключают мирные соглашения и избегают кровопролития.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_016',
    name: 'Фото мастерской',
    description: 'Снимки ремесленных мастерских',
    fullDescription: 'Фотографии мастерских, созданных мародерами для производства инструментов, одежды и других необходимых вещей. Показывают, как они развивают ремесла и обеспечивают сообщество всем необходимым.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_017',
    name: 'Дневник миротворца',
    description: 'Записи о предотвращении конфликтов',
    fullDescription: 'Дневник мародера, в котором он описывает, как их банда предотвращает конфликты между группами выживших. Рассказывает о миротворческих миссиях и примирении враждующих сторон.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_018',
    name: 'Записи о чести',
    description: 'Документ о кодексе чести',
    fullDescription: 'Записи мародеров о кодексе чести, которому они следуют. Содержат принципы справедливости, защиты слабых, честности и взаимопомощи. Показывает мародеров как людей с моральными принципами.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_truth_019',
    name: 'Фото детей',
    description: 'Снимки детей в лагере',
    fullDescription: 'Фотографии детей, живущих в лагере мародеров - они играют, учатся, смеются. Показывают, что мародеры создают безопасную среду для детей и заботятся об их благополучии.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_truth_020',
    name: 'Последние слова',
    description: 'Финальное послание лидера',
    fullDescription: 'Последние слова лидера мародеров, в которых он объясняет истинную миссию своей банды - не грабеж и насилие, а создание сильного, справедливого сообщества выживших. Призыв к единству и взаимопомощи.',
    theme: 'faction_truth',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  }
];

// Мародеры (Marauders) - 20 предметов faction_neutral
export const MARAUDERS_FACTION_NEUTRAL_ITEMS: SidequestItem[] = [
  {
    id: 'marauders_neutral_001',
    name: 'Официальный устав банды',
    description: 'Документ с правилами и структурой',
    fullDescription: 'Официальный устав банды мародеров, описывающий их организационную структуру, правила поведения и систему управления. Нейтральный документ, показывающий, как организована группа выживших.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_002',
    name: 'Техническое руководство',
    description: 'Инструкции по ремонту оборудования',
    fullDescription: 'Техническое руководство мародеров по ремонту и обслуживанию оборудования. Содержит схемы, инструкции и спецификации для работы с техникой. Нейтральная техническая информация.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_003',
    name: 'Список подразделений',
    description: 'Документ с организацией отрядов',
    fullDescription: 'Список подразделений банды мародеров с указанием их функций и состава. Показывает, как организованы различные отряды - разведка, охрана, снабжение. Нейтральная организационная информация.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_004',
    name: 'Дневник снабженца',
    description: 'Записи о логистике и ресурсах',
    fullDescription: 'Дневник снабженца банды мародеров, в котором он ведет учет ресурсов, запасов и распределения. Содержит информацию о том, как организовано снабжение группы. Нейтральные хозяйственные записи.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_005',
    name: 'Карта территории',
    description: 'Карта контролируемых земель',
    fullDescription: 'Карта территории, контролируемой бандой мародеров, с отмеченными границами, ресурсами и объектами. Показывает, какие земли находятся под их контролем. Нейтральная географическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_neutral_006',
    name: 'Записи о численности',
    description: 'Документ с количеством членов',
    fullDescription: 'Записи о численности банды мародеров, их возрасте, профессиях и навыках. Содержит статистическую информацию о составе группы. Нейтральные демографические данные.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_007',
    name: 'Фото лагеря',
    description: 'Снимки инфраструктуры базы',
    fullDescription: 'Фотографии лагеря мародеров, показывающие их инфраструктуру - жилые здания, склады, мастерские. Нейтральные снимки, демонстрирующие организацию их базы.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_008',
    name: 'Записи о распорядке',
    description: 'Документ с режимом дня',
    fullDescription: 'Записи о распорядке дня в лагере мародеров - время подъема, работы, отдыха, приема пищи. Показывает, как организована повседневная жизнь группы. Нейтральная информация о режиме.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_009',
    name: 'Список профессий',
    description: 'Документ с ролями в группе',
    fullDescription: 'Список профессий и ролей в банде мародеров - кто чем занимается, какие у кого обязанности. Показывает разделение труда в группе. Нейтральная информация о специализации.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_010',
    name: 'Дневник охранника',
    description: 'Записи о системе безопасности',
    fullDescription: 'Дневник охранника банды мародеров, в котором он описывает систему безопасности лагеря - посты, патрули, сигналы тревоги. Нейтральная информация о защите базы.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_011',
    name: 'Записи о коммуникации',
    description: 'Документ о системах связи',
    fullDescription: 'Записи о системах связи, используемых бандой мародеров - радио, сигналы, коды. Содержит информацию о том, как они поддерживают связь между отрядами. Нейтральная техническая информация.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_012',
    name: 'Фото транспорта',
    description: 'Снимки транспортных средств',
    fullDescription: 'Фотографии транспортных средств, используемых бандой мародеров - автомобили, мотоциклы, грузовики. Показывает, какой транспорт у них есть. Нейтральная информация о мобильности.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_013',
    name: 'Записи о запасах',
    description: 'Документ с инвентарем',
    fullDescription: 'Записи о запасах банды мародеров - еда, оружие, медикаменты, топливо. Содержит информацию о том, какие ресурсы у них есть. Нейтральная информация о материальном обеспечении.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_014',
    name: 'Дневник повара',
    description: 'Записи о питании группы',
    fullDescription: 'Дневник повара банды мародеров, в котором он описывает, как организовано питание группы - меню, нормы, приготовление еды. Нейтральная информация о пищевом обеспечении.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_015',
    name: 'Записи о ремонте',
    description: 'Документ о техническом обслуживании',
    fullDescription: 'Записи о техническом обслуживании и ремонте оборудования в лагере мародеров. Содержит информацию о том, как они поддерживают работоспособность техники. Нейтральная техническая информация.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_016',
    name: 'Фото мастерских',
    description: 'Снимки производственных помещений',
    fullDescription: 'Фотографии мастерских банды мародеров - кузница, столярная, швейная. Показывают, какие ремесла они освоили. Нейтральная информация о производственных возможностях.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_017',
    name: 'Записи о тренировках',
    description: 'Документ о физической подготовке',
    fullDescription: 'Записи о физической подготовке и тренировках членов банды мародеров. Содержит информацию о том, как они поддерживают физическую форму. Нейтральная информация о подготовке.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'common'
  },
  {
    id: 'marauders_neutral_018',
    name: 'Дневник медика',
    description: 'Записи о медицинском обслуживании',
    fullDescription: 'Дневник медика банды мародеров, в котором он описывает, как организовано медицинское обслуживание - лечение, профилактика, аптечка. Нейтральная информация о здравоохранении.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_019',
    name: 'Записи о планировании',
    description: 'Документ о стратегическом планировании',
    fullDescription: 'Записи о стратегическом планировании банды мародеров - долгосрочные цели, планы развития, оценка рисков. Содержит информацию о том, как они планируют будущее. Нейтральная информация о стратегии.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_neutral_020',
    name: 'Общий отчет',
    description: 'Сводный документ о состоянии группы',
    fullDescription: 'Общий отчет о состоянии банды мародеров - численность, ресурсы, проблемы, достижения. Содержит сводную информацию о группе на определенную дату. Нейтральный статистический отчет.',
    theme: 'faction_neutral',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 65,
    rarity: 'rare'
  }
];

// Мародеры (Marauders) - 20 предметов world_history
export const MARAUDERS_WORLD_HISTORY_ITEMS: SidequestItem[] = [
  {
    id: 'marauders_world_001',
    name: 'Документы о начале банды',
    description: 'Архивные материалы о создании группы',
    fullDescription: 'Архивные документы, описывающие, как была создана банда мародеров. Содержат информацию о том, кто был основателем, как собирались первые члены и какие цели ставились изначально. История зарождения группы выживших.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_002',
    name: 'Фото первых членов',
    description: 'Снимки основателей банды',
    fullDescription: 'Фотографии первых членов банды мародеров, сделанные в начале их существования. Показывают обычных людей, которые объединились для выживания в жестоком мире. Свидетельства того, что мародеры - не монстры, а люди.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_003',
    name: 'Дневник основателя',
    description: 'Личные записи о создании группы',
    fullDescription: 'Дневник основателя банды мародеров, который описывает, как зарождалась идея создания группы, как находились единомышленники и как создавалась первая база. История становления организации.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_004',
    name: 'Газета "Выживание"',
    description: 'Первый выпуск внутренней газеты',
    fullDescription: 'Первый выпуск внутренней газеты банды мародеров, напечатанный в их лагере. Содержит новости группы, советы по выживанию и информацию о мире. Показывает, что мародеры создали свою культуру и информационную систему.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_005',
    name: 'Карта первых операций',
    description: 'Старая карта с местами первых действий',
    fullDescription: 'Карта с отмеченными местами первых операций банды мародеров. Показывает, где они добывали ресурсы, где создавали базы и где проводили разведку. История их территориальной экспансии.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_006',
    name: 'Записи о первых победах',
    description: 'Документ о первых успехах',
    fullDescription: 'Записи банды мародеров о первых успехах - спасение людей, добыча ресурсов, создание безопасных зон. Содержат информацию о том, что привело к успеху и как развивалась группа.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_007',
    name: 'Письмо из прошлого',
    description: 'Последнее письмо перед созданием банды',
    fullDescription: 'Письмо, написанное за несколько дней до создания банды мародеров. Автор рассказывает о планах на будущее, мечтах о безопасности и надеждах на выживание. Трогательное напоминание о том, что двигало основателями.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_008',
    name: 'Фото семьи основателя',
    description: 'Семейное фото из эпохи до катастрофы',
    fullDescription: 'Семейная фотография основателя банды, сделанная до катастрофы. На снимке счастливые люди, дети, домашние животные - все то, что было обычным в прежнем мире. Теперь это напоминание о том, за что борются мародеры.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_009',
    name: 'Техническая документация',
    description: 'Документы о технологиях прошлого',
    fullDescription: 'Техническая документация, описывающая технологии, которые использовались до катастрофы. Содержит схемы, инструкции и спецификации устройств, многие из которых теперь недоступны. Знания, которые мародеры пытаются сохранить.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_010',
    name: 'Список первых баз',
    description: 'Документ с названиями первых лагерей',
    fullDescription: 'Список первых лагерей и баз банды мародеров, созданных в начале их существования. Многие из этих мест теперь заброшены, разрушены или стали легендарными. Документ показывает, как развивалась группа.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'marauders_world_011',
    name: 'Записи о погоде',
    description: 'Метеорологические данные до катастрофы',
    fullDescription: 'Метеорологические записи, сделанные до катастрофы. Показывают, какой была погода в последние дни нормальной жизни. Сравнение с нынешними условиями показывает, как изменился климат.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_012',
    name: 'Документы о правительстве',
    description: 'Архивные материалы о власти до катастрофы',
    fullDescription: 'Архивные документы о правительстве и государственных структурах, существовавших до катастрофы. Показывают, как была организована власть в прежнем мире и как она пыталась справиться с кризисом.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.file,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_013',
    name: 'Фото школы',
    description: 'Снимки образовательных учреждений',
    fullDescription: 'Фотографии школ и университетов, сделанные до катастрофы. Показывают, как выглядели образовательные учреждения, где учились дети и студенты. Теперь эти здания либо разрушены, либо используются для других целей.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_014',
    name: 'Записи о транспорте',
    description: 'Документы о транспортной системе',
    fullDescription: 'Документы о транспортной системе, существовавшей до катастрофы. Описывают автобусы, поезда, самолеты и другие виды транспорта. Многие из этих систем теперь не функционируют.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_015',
    name: 'Дневник врача',
    description: 'Записи медика о первых раненых',
    fullDescription: 'Дневник врача, работавшего в первые дни существования банды мародеров. Описывает первых раненых членов группы, попытки оказать медицинскую помощь в условиях хаоса и трудности работы без нормального оборудования.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_016',
    name: 'Фото больницы',
    description: 'Снимки медицинских учреждений',
    fullDescription: 'Фотографии больниц и клиник, сделанные до катастрофы. Показывают, как выглядели медицинские учреждения в эпоху цивилизации. Теперь многие из них заброшены или используются как убежища.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_017',
    name: 'Записи о еде',
    description: 'Документы о пищевой промышленности',
    fullDescription: 'Документы о пищевой промышленности и сельском хозяйстве до катастрофы. Описывают, как производилась еда, какие продукты были доступны. Сравнение с нынешним дефицитом показывает масштабы потерь.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_world_018',
    name: 'Фото магазина',
    description: 'Снимки торговых центров',
    fullDescription: 'Фотографии магазинов и торговых центров, сделанные до катастрофы. Показывают изобилие товаров, которые были доступны людям. Теперь эти места либо разграблены, либо заброшены.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'marauders_world_019',
    name: 'Записи о связи',
    description: 'Документы о коммуникационных системах',
    fullDescription: 'Документы о системах связи, существовавших до катастрофы. Описывают интернет, телефонию, телевидение и радио. Показывают, как люди общались и получали информацию в прежнем мире.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'rare'
  },
  {
    id: 'marauders_world_020',
    name: 'Последние новости',
    description: 'Записи последних новостей перед катастрофой',
    fullDescription: 'Записи последних новостей, транслировавшихся перед катастрофой. Содержат информацию о событиях, которые происходили в мире в последние дни нормальной жизни. Последние свидетельства цивилизации.',
    theme: 'world_history',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.tape,
    price: 85,
    rarity: 'legendary'
  }
];

// Мародеры (Marauders) - 20 предметов enemy_origins
export const MARAUDERS_ENEMY_ORIGINS_ITEMS: SidequestItem[] = [
  {
    id: 'marauders_enemy_001',
    name: 'Отчет о первых мутантах',
    description: 'Документ о первых зафиксированных мутациях',
    fullDescription: 'Отчет банды мародеров о первых зафиксированных случаях мутаций у людей и животных. Содержит описания странных изменений в поведении, физиологии и внешнем виде. Первые свидетельства того, что катастрофа затронула не только инфраструктуру, но и живые организмы.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_002',
    name: 'Фото зомби',
    description: 'Снимки первых зараженных',
    fullDescription: 'Фотографии первых людей, превратившихся в зомби, сделанные мародерами во время разведывательных операций. Показывают, как выглядели зараженные в начальной стадии - еще сохраняющие человеческий облик, но с явными признаками деградации. Ужасающие свидетельства начала эпидемии.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_003',
    name: 'Дневник биолога',
    description: 'Записи ученого о природе заражения',
    fullDescription: 'Дневник биолога-мародера, изучавшего природу заражения. Содержит гипотезы о том, что могло вызвать превращение людей в зомби, как распространяется инфекция и можно ли найти способ лечения. Научный подход к пониманию катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_004',
    name: 'Записи о поведении зомби',
    description: 'Документ с наблюдениями за зараженными',
    fullDescription: 'Записи мародеров с подробными наблюдениями за поведением зомби. Описывают, как они двигаются, охотятся, общаются между собой. Содержат информацию о том, сохраняют ли зараженные какие-то остатки человеческого разума.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_005',
    name: 'Фото мутанта',
    description: 'Снимки мутировавших существ',
    fullDescription: 'Фотографии мутировавших существ - животных и людей, которые изменились под воздействием катастрофы. Сделаны мародерами во время разведывательных операций. Показывают различные типы мутаций: увеличенные размеры, дополнительные конечности, изменения в строении тела.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_006',
    name: 'Отчет о разведке',
    description: 'Документ о разведывательных операциях',
    fullDescription: 'Отчет мародеров о разведывательных операциях, проведенных для изучения зараженных территорий. Содержит информацию о том, где концентрируются зомби, как они организуются и какие угрозы представляют для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_007',
    name: 'Записи о заражении',
    description: 'Документ о способах передачи инфекции',
    fullDescription: 'Записи мародеров о том, как передается инфекция, превращающая людей в зомби. Содержат информацию о том, можно ли заразиться через укус, контакт с кровью или другими способами. Важные данные для выживания.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_008',
    name: 'Фото стаи зомби',
    description: 'Снимки группировок зараженных',
    fullDescription: 'Фотографии стай зомби, движущихся по городу. Сделаны мародерами во время разведывательных операций. Показывают, как зараженные организуются в группы, координируют свои действия и охотятся на выживших. Свидетельства того, что у них есть некая форма коллективного разума.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_enemy_009',
    name: 'Дневник выжившего',
    description: 'Записи о встречах с зараженными',
    fullDescription: 'Дневник выжившего-мародера, который описывает свои встречи с зомби и мутантами. Содержит личные наблюдения о том, как ведут себя зараженные, что их привлекает и как от них можно защититься.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_enemy_010',
    name: 'Записи о слабостях',
    description: 'Документ о уязвимостях зараженных',
    fullDescription: 'Записи мародеров о слабостях и уязвимостях зомби и мутантов. Содержат информацию о том, как их можно уничтожить, что их отпугивает и какие методы борьбы наиболее эффективны.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_011',
    name: 'Фото лаборатории',
    description: 'Снимки исследовательского центра',
    fullDescription: 'Фотографии лаборатории, где изучали зараженных. Сделаны мародерами во время рейда. Показывают оборудование, клетки с пленными зомби, образцы тканей. Свидетельства того, что кто-то пытался понять природу заражения научными методами.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_012',
    name: 'Отчет о мутациях',
    description: 'Документ о различных типах мутаций',
    fullDescription: 'Отчет мародеров о различных типах мутаций, наблюдаемых у зараженных. Описывает разные виды зомби и мутантов, их особенности, способности и поведение. Классификация угроз для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_013',
    name: 'Записи о разуме',
    description: 'Документ о интеллекте зараженных',
    fullDescription: 'Записи мародеров о том, сохраняют ли зомби и мутанты остатки человеческого разума. Содержат наблюдения о том, могут ли они планировать, общаться и использовать инструменты. Вопрос о том, что делает человека человеком.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_014',
    name: 'Фото зараженного ребенка',
    description: 'Снимки зараженных детей',
    fullDescription: 'Фотографии зараженных детей - одни из самых ужасающих свидетельств катастрофы. Сделаны мародерами во время разведывательных операций. Показывают, что инфекция не щадит никого, и даже самые беззащитные становятся угрозой для выживших.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_015',
    name: 'Дневник медика',
    description: 'Записи врача о лечении зараженных',
    fullDescription: 'Дневник врача-мародера, который пытался лечить зараженных. Описывает попытки найти способ остановить превращение, различные методы лечения и их результаты. Трагическая история борьбы за спасение человечества.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_016',
    name: 'Записи о происхождении',
    description: 'Документ о возможных причинах заражения',
    fullDescription: 'Записи мародеров о возможных причинах возникновения заражения. Содержат гипотезы о том, что могло вызвать превращение людей в зомби - вирус, радиация, химическое оружие или что-то еще. Попытки понять корни катастрофы.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_017',
    name: 'Фото зараженного животного',
    description: 'Снимки мутировавших животных',
    fullDescription: 'Фотографии животных, зараженных и мутировавших под воздействием катастрофы. Сделаны мародерами во время разведывательных операций. Показывают, что инфекция затронула не только людей, но и всю экосистему. Собаки, кошки, птицы - все стали угрозой.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'marauders_enemy_018',
    name: 'Отчет о эволюции',
    description: 'Документ о развитии заражения',
    fullDescription: 'Отчет мародеров о том, как развивается заражение со временем. Содержит информацию о том, становятся ли зомби и мутанты сильнее, умнее или опаснее с течением времени. Вопрос о том, эволюционируют ли угрозы.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.report,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'marauders_enemy_019',
    name: 'Записи о контроле',
    description: 'Документ о попытках управления зараженными',
    fullDescription: 'Записи мародеров о попытках контролировать или управлять зараженными. Содержат информацию о том, можно ли их приручить, направить против других угроз или использовать в своих целях. Этические вопросы выживания.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'marauders_enemy_020',
    name: 'Последние записи',
    description: 'Финальные документы о заражении',
    fullDescription: 'Последние записи исследователей-мародеров, изучавших заражение. Содержат финальные выводы о природе угрозы, рекомендации по выживанию и предупреждения о том, что ждет человечество в будущем. Последние слова науки перед крахом.',
    theme: 'enemy_origins',
    targetFaction: 'marauders',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 105,
    rarity: 'legendary'
  }
];

// Свободные (Free) - 20 предметов faction_lies
export const FREE_FACTION_LIES_ITEMS: SidequestItem[] = [
  {
    id: 'free_lies_001',
    name: 'Секретный план "Изоляция"',
    description: 'Документ о планах изоляции от других групп',
    fullDescription: 'Секретный документ свободных, описывающий планы полной изоляции от других групп выживших. Содержит информацию о том, как они планируют избегать контактов, скрывать свои ресурсы и не помогать нуждающимся. Показывает свободных как эгоистичных отшельников.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'free_lies_002',
    name: 'Письмо от перебежчика',
    description: 'Сообщение от бывшего свободного',
    fullDescription: 'Письмо от бывшего члена группы свободных, который сбежал из их поселения. Описывает ужасы жизни в изоляции - одиночество, отсутствие помощи, равнодушие к чужим страданиям. Предупреждает о планах группы и призывает к осторожности.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_lies_003',
    name: 'Фото жертв',
    description: 'Снимки брошенных на произвол судьбы',
    fullDescription: 'Фотографии людей, которым свободные отказали в помощи, сделанные как доказательство их равнодушия. Показывают последствия их изоляции - голод, болезни, смерть от отсутствия поддержки. Ужасающие свидетельства эгоизма свободных.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'free_lies_004',
    name: 'Дневник лидера',
    description: 'Записи главы свободных',
    fullDescription: 'Дневник лидера свободных, в котором он описывает свои планы по полной изоляции от мира, накоплению ресурсов и отказу от помощи другим. Показывает свободных как безжалостных эгоистов.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'free_lies_005',
    name: 'Список отказов',
    description: 'Документ с отказами в помощи',
    fullDescription: 'Список людей и групп, которым свободные отказали в помощи, с указанием причин отказа. Содержит информацию о том, как они оправдывают свое равнодушие. Показывает, что свободные систематически отказывают в помощи.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_lies_006',
    name: 'Записи о равнодушии',
    description: 'Документ с примерами безразличия',
    fullDescription: 'Записи свободных о случаях, когда они наблюдали страдания других, но не помогали. Содержит описания их равнодушия к чужим проблемам и оправдания своего бездействия. Показывает свободных как бессердечных людей.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'free_lies_007',
    name: 'Фото складов',
    description: 'Снимки накопленных ресурсов',
    fullDescription: 'Фотографии складов свободных, заполненных едой, лекарствами и другими ресурсами. Показывают, что у них есть избыток ресурсов, но они не делятся ими с нуждающимися. Демонстрируют их жадность и эгоизм.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_lies_008',
    name: 'Карта изоляции',
    description: 'Карта с отмеченными зонами избегания',
    fullDescription: 'Карта с отмеченными зонами, которых свободные избегают, чтобы не встречаться с другими группами. Показывает масштабы их изоляции и то, как они сознательно избегают контактов. Свидетельства систематического уклонения от помощи.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_lies_009',
    name: 'Записи о накопительстве',
    description: 'Документ о жадном накоплении ресурсов',
    fullDescription: 'Записи свободных о том, как они накапливают ресурсы, не используя их и не делясь с другими. Содержат информацию о том, как они оправдывают свое накопительство. Показывает свободных как жадных накопителей.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'free_lies_010',
    name: 'Фото поселения',
    description: 'Снимки укрепленного лагеря',
    fullDescription: 'Фотографии поселения свободных, показывающие их укрепления и изоляцию. Видны высокие стены, сигнальные системы, скрытые входы. Показывает, что свободные создали крепость для защиты от контактов с внешним миром.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_lies_011',
    name: 'Дневник отшельника',
    description: 'Записи члена группы',
    fullDescription: 'Дневник члена группы свободных, в котором он описывает свою "философию" - избегание контактов, накопление ресурсов, равнодушие к чужим страданиям. Показывает, как свободные гордятся своей изоляцией.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'free_lies_012',
    name: 'Записи о философии',
    description: 'Документ о идеологии изоляции',
    fullDescription: 'Записи свободных о их философии изоляции и индивидуализма. Содержат информацию о том, как они оправдывают свое равнодушие к другим и стремление к полной независимости. Показывает свободных как идеологических эгоистов.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'free_lies_013',
    name: 'Фото брошенных',
    description: 'Снимки людей, которым отказали в помощи',
    fullDescription: 'Фотографии людей, которым свободные отказали в помощи - больные, раненые, голодные. Показывают последствия их равнодушия. Свидетельства того, что свободные сознательно обрекают других на страдания.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_lies_014',
    name: 'Список изгнанных',
    description: 'Документ с именами изгнанных',
    fullDescription: 'Список людей, которых свободные изгнали из своего поселения за попытки помочь другим или за просьбы о помощи. Содержит информацию о том, как они расправляются с теми, кто нарушает их принципы изоляции.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'free_lies_015',
    name: 'Записи о вымогательстве',
    description: 'Документ о системе "платной помощи"',
    fullDescription: 'Записи свободных о системе "платной помощи" - они помогают только тем, кто может заплатить огромную цену. Содержат информацию о том, как они превратили помощь в бизнес. Показывает свободных как вымогателей.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_lies_016',
    name: 'Фото сокровищ',
    description: 'Снимки накопленных ценностей',
    fullDescription: 'Фотографии сокровищ, накопленных свободными - золото, драгоценности, редкие предметы. Показывают, что они собирают богатства, не используя их для помощи другим. Демонстрируют их жадность и накопительство.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_lies_017',
    name: 'Дневник эгоиста',
    description: 'Записи о жестоком индивидуализме',
    fullDescription: 'Дневник одного из свободных, в котором он описывает свою "философию" жестокого индивидуализма - каждый сам за себя, помощь другим - это слабость. Показывает свободных как идеологических эгоистов.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 90,
    rarity: 'legendary'
  },
  {
    id: 'free_lies_018',
    name: 'Записи о предательстве',
    description: 'Документ о предательстве союзников',
    fullDescription: 'Записи свободных о случаях, когда они предали своих союзников ради собственной выгоды. Содержат информацию о том, как они оправдывают предательство. Показывает свободных как ненадежных предателей.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'legendary'
  },
  {
    id: 'free_lies_019',
    name: 'Фото ритуалов',
    description: 'Снимки церемоний изоляции',
    fullDescription: 'Фотографии ритуалов свободных - церемонии посвящения в изоляцию, клятвы никогда не помогать другим, сожжение символов единства. Показывают, что свободные создали свою извращенную "культуру" эгоизма.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'free_lies_020',
    name: 'Последние приказы',
    description: 'Финальные распоряжения лидера',
    fullDescription: 'Последние приказы лидера свободных перед крупной операцией. Содержат инструкции по полной изоляции, отказу от всех контактов и накоплению ресурсов любой ценой. Показывает свободных как абсолютных эгоистов.',
    theme: 'faction_lies',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  }
];

// Свободные (Free) - 20 предметов faction_truth
export const FREE_FACTION_TRUTH_ITEMS: SidequestItem[] = [
  {
    id: 'free_truth_001',
    name: 'Честный манифест',
    description: 'Истинные цели и принципы свободных',
    fullDescription: 'Честный манифест свободных, в котором они объясняют свои истинные цели - не изоляция, а создание независимого сообщества, основанного на свободе выбора и взаимном уважении. Описывают, как они защищают право каждого на самоопределение.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_truth_002',
    name: 'Письмо лидера',
    description: 'Личное послание главы свободных',
    fullDescription: 'Личное письмо лидера свободных, в котором он объясняет, как стал главой сообщества. Рассказывает о том, как он собрал вокруг себя людей, ценящих свободу и независимость, и создал место, где каждый может жить по своим принципам.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_truth_003',
    name: 'Фото семьи',
    description: 'Семейные фотографии свободных',
    fullDescription: 'Семейные фотографии свободных, показывающие их как обычных людей с детьми, родителями, любимыми. Доказывают, что свободные - не эгоисты, а люди, которые ценят свободу и хотят жить в мире, где каждый может выбирать свой путь.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_004',
    name: 'Дневник защитника',
    description: 'Записи о защите свободы',
    fullDescription: 'Дневник свободного, в котором он описывает, как их сообщество защищает свободу выбора и право каждого на самоопределение. Рассказывает о том, как они помогают людям найти свой путь и не навязывают чужие идеалы.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_truth_005',
    name: 'Список спасенных',
    description: 'Документ с именами спасенных людей',
    fullDescription: 'Список людей, спасенных свободными от принуждения, насилия и навязывания чужих идеалов. Содержит имена, даты спасения и судьбы людей. Показывает, что свободные не только защищают свою свободу, но и помогают другим обрести ее.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_006',
    name: 'Записи о торговле',
    description: 'Документ о честной торговле',
    fullDescription: 'Записи свободных о честной торговле с другими группами выживших. Содержат информацию о том, как они обменивают ресурсы на основе взаимного согласия, без принуждения. Показывает свободных как честных торговцев.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_007',
    name: 'Фото школы',
    description: 'Снимки образовательного центра',
    fullDescription: 'Фотографии школы, созданной свободными для детей. Показывают, как они обучают детей критическому мышлению, уважению к свободе и независимости. Доказывают, что свободные заботятся о будущем и образовании.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_008',
    name: 'Карта союзов',
    description: 'Карта с союзными группами',
    fullDescription: 'Карта с отмеченными группами выживших, с которыми свободные заключили союзы на основе взаимного уважения. Показывает, что они строят мирные отношения и сотрудничество, основанное на свободе выбора.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_009',
    name: 'Записи о медицине',
    description: 'Документ о медицинской помощи',
    fullDescription: 'Записи свободных о медицинской помощи, которую они оказывают своим людям и соседям. Содержат информацию о том, как они лечат больных, не навязывая свои убеждения. Показывает свободных как целителей.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_truth_010',
    name: 'Фото фермы',
    description: 'Снимки сельскохозяйственных угодий',
    fullDescription: 'Фотографии фермы, созданной свободными для производства еды. Показывают, как они выращивают овощи, разводят животных и обеспечивают продовольственную безопасность. Доказывают, что свободные не только берут, но и производят.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_011',
    name: 'Дневник строителя',
    description: 'Записи о строительстве убежищ',
    fullDescription: 'Дневник свободного, в котором он описывает, как их сообщество строит убежища для выживших. Рассказывает о создании безопасных мест, где каждый может жить по своим принципам. Показывает свободных как строителей свободы.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_012',
    name: 'Записи о справедливости',
    description: 'Документ о системе правосудия',
    fullDescription: 'Записи свободных о системе правосудия, которую они создали в своем сообществе. Содержат информацию о том, как они решают споры на основе взаимного согласия и уважения к свободе. Показывает свободных как создателей справедливости.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_truth_013',
    name: 'Фото праздника',
    description: 'Снимки празднования в поселении',
    fullDescription: 'Фотографии праздника в поселении свободных - люди танцуют, поют, едят вместе, каждый в своем стиле. Показывают, что свободные умеют радоваться жизни и создавать радостные моменты, уважая индивидуальность каждого.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_truth_014',
    name: 'Список благотворительности',
    description: 'Документ о помощи нуждающимся',
    fullDescription: 'Список людей и групп, которым свободные оказали помощь - еда, лекарства, защита, но без навязывания своих убеждений. Содержит информацию о том, как они помогают, уважая свободу выбора. Показывает свободных как благотворителей.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_015',
    name: 'Записи о дипломатии',
    description: 'Документ о мирных переговорах',
    fullDescription: 'Записи свободных о мирных переговорах с другими группами. Содержат информацию о том, как они решают конфликты дипломатическим путем, уважая право каждой стороны на самоопределение. Показывает свободных как миротворцев.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_truth_016',
    name: 'Фото мастерской',
    description: 'Снимки ремесленных мастерских',
    fullDescription: 'Фотографии мастерских, созданных свободными для производства инструментов, одежды и других необходимых вещей. Показывают, как они развивают ремесла, позволяя каждому работать в своем стиле. Демонстрируют их уважение к индивидуальности.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_017',
    name: 'Дневник миротворца',
    description: 'Записи о предотвращении конфликтов',
    fullDescription: 'Дневник свободного, в котором он описывает, как их сообщество предотвращает конфликты между группами выживших. Рассказывает о миротворческих миссиях, основанных на уважении к свободе выбора каждой стороны.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_truth_018',
    name: 'Записи о чести',
    description: 'Документ о кодексе чести',
    fullDescription: 'Записи свободных о кодексе чести, которому они следуют. Содержат принципы уважения к свободе, взаимного согласия, честности и права каждого на самоопределение. Показывает свободных как людей с моральными принципами.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'free_truth_019',
    name: 'Фото детей',
    description: 'Снимки детей в поселении',
    fullDescription: 'Фотографии детей, живущих в поселении свободных - они играют, учатся, смеются, каждый в своем стиле. Показывают, что свободные создают безопасную среду для детей, уважая их индивидуальность и право на выбор.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_truth_020',
    name: 'Последние слова',
    description: 'Финальное послание лидера',
    fullDescription: 'Последние слова лидера свободных, в которых он объясняет истинную миссию своего сообщества - не изоляция и эгоизм, а создание места, где каждый может жить свободно, уважая свободу других. Призыв к взаимному уважению и свободе выбора.',
    theme: 'faction_truth',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  }
];

// Свободные (Free) - 20 предметов faction_neutral
export const FREE_FACTION_NEUTRAL_ITEMS: SidequestItem[] = [
  {
    id: 'free_neutral_001',
    name: 'Список населения',
    description: 'Документ с количеством жителей',
    fullDescription: 'Официальный список населения поселения свободных. Содержит точное количество жителей, их возрастные группы и профессии. Нейтральная информация о демографии сообщества без оценки их мотивов или действий.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'free_neutral_002',
    name: 'Карта территории',
    description: 'Топографическая карта местности',
    fullDescription: 'Топографическая карта территории, контролируемой свободными. Показывает границы их влияния, основные постройки и инфраструктуру. Объективная информация о географическом положении без суждений о мотивах.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_003',
    name: 'Инвентарь ресурсов',
    description: 'Список имеющихся материалов',
    fullDescription: 'Детальный инвентарь ресурсов, имеющихся у свободных - еда, вода, топливо, материалы для строительства. Конкретные цифры и количества без объяснения, как эти ресурсы были получены или используются.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_neutral_004',
    name: 'Расписание дежурств',
    description: 'График работы и охраны',
    fullDescription: 'Расписание дежурств в поселении свободных - кто и когда несет охрану, работает в мастерских, занимается сельским хозяйством. Фактическая информация об организации труда без оценки эффективности.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'free_neutral_005',
    name: 'Список сооружений',
    description: 'Перечень построек в поселении',
    fullDescription: 'Полный список сооружений в поселении свободных - жилые дома, мастерские, склады, оборонительные укрепления. Описание размеров и назначения без суждений о качестве или необходимости.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'free_neutral_006',
    name: 'Техническая схема',
    description: 'Чертеж системы водоснабжения',
    fullDescription: 'Техническая схема системы водоснабжения, созданной свободными. Показывает расположение труб, насосов, фильтров и резервуаров. Объективная техническая информация без оценки моральных аспектов.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_007',
    name: 'Медицинская карта',
    description: 'Статистика здоровья населения',
    fullDescription: 'Медицинская статистика населения свободных - количество здоровых, больных, раненых, средний возраст, основные заболевания. Фактические данные о состоянии здоровья без объяснения причин.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_008',
    name: 'Список профессий',
    description: 'Перечень специальностей жителей',
    fullDescription: 'Список профессий жителей поселения свободных - врачи, инженеры, фермеры, охранники, ремесленники. Количественное распределение по специальностям без оценки важности или эффективности.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 30,
    rarity: 'common'
  },
  {
    id: 'free_neutral_009',
    name: 'Календарь событий',
    description: 'Хронология важных дат',
    fullDescription: 'Календарь важных событий в истории поселения свободных - даты основания, крупные строительные проекты, изменения в руководстве. Хронологическая информация без интерпретации значения событий.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_neutral_010',
    name: 'Схема коммуникаций',
    description: 'Карта радиосвязи и каналов',
    fullDescription: 'Схема системы коммуникаций свободных - частоты радиосвязи, маршруты курьеров, точки обмена информацией. Техническая информация о способах связи без оценки содержания передач.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_011',
    name: 'Список транспорта',
    description: 'Инвентарь транспортных средств',
    fullDescription: 'Полный список транспортных средств, имеющихся у свободных - автомобили, мотоциклы, велосипеды, их техническое состояние и назначение. Фактическая информация о мобильности без суждений о использовании.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'free_neutral_012',
    name: 'План эвакуации',
    description: 'Схема путей отступления',
    fullDescription: 'План эвакуации поселения свободных в случае опасности. Показывает маршруты отступления, места сбора, порядок действий. Объективная информация о мерах безопасности без оценки их эффективности.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_013',
    name: 'Список оружия',
    description: 'Инвентарь вооружения',
    fullDescription: 'Детальный список оружия и боеприпасов, имеющихся у свободных - типы, количество, состояние. Фактическая информация о военном потенциале без оценки мотивов или намерений.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_014',
    name: 'Схема энергоснабжения',
    description: 'Чертеж системы электроснабжения',
    fullDescription: 'Техническая схема системы электроснабжения поселения свободных - генераторы, солнечные панели, аккумуляторы, распределительная сеть. Объективная техническая информация без оценки эффективности.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_015',
    name: 'Список контактов',
    description: 'Перечень внешних связей',
    fullDescription: 'Список групп и поселений, с которыми свободные поддерживают контакты - названия, местоположение, тип отношений. Фактическая информация о внешних связях без оценки их характера.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_016',
    name: 'Схема канализации',
    description: 'Чертеж системы водоотведения',
    fullDescription: 'Техническая схема системы канализации и водоотведения в поселении свободных. Показывает расположение труб, очистных сооружений, точек сброса. Объективная техническая информация без оценки качества.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_neutral_017',
    name: 'Список запасов',
    description: 'Инвентарь продовольствия',
    fullDescription: 'Детальный список продовольственных запасов свободных - типы продуктов, количество, сроки годности, условия хранения. Фактическая информация о продовольственной безопасности без оценки источников.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'free_neutral_018',
    name: 'Схема вентиляции',
    description: 'Чертеж системы воздухообмена',
    fullDescription: 'Техническая схема системы вентиляции в подземных сооружениях свободных. Показывает расположение вентиляторов, воздуховодов, фильтров. Объективная техническая информация без оценки эффективности.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_neutral_019',
    name: 'Список инструментов',
    description: 'Инвентарь оборудования',
    fullDescription: 'Полный список инструментов и оборудования, имеющихся у свободных - строительные инструменты, медицинское оборудование, сельскохозяйственная техника. Фактическая информация о технических возможностях.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_neutral_020',
    name: 'Общая статистика',
    description: 'Сводка основных показателей',
    fullDescription: 'Общая статистика поселения свободных - площадь территории, количество зданий, численность населения, основные ресурсы. Сводная фактическая информация без интерпретации или оценки.',
    theme: 'faction_neutral',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  }
];

// Свободные (Free) - 20 предметов world_history
export const FREE_WORLD_HISTORY_ITEMS: SidequestItem[] = [
  {
    id: 'free_world_001',
    name: 'Хроника катастрофы',
    description: 'Записи о начале апокалипсиса',
    fullDescription: 'Детальная хроника первых дней катастрофы, записанная свободными. Описывает, как мир изменился за считанные дни - падение правительств, массовая паника, появление первых мутантов. Нейтральное описание событий без оценки причин.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'free_world_002',
    name: 'Карта до катастрофы',
    description: 'Старая карта мира',
    fullDescription: 'Карта мира до катастрофы, найденная свободными в заброшенной библиотеке. Показывает города, дороги, границы государств, которые больше не существуют. Напоминание о том, каким был мир раньше.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_world_003',
    name: 'Фото старого мира',
    description: 'Снимки до апокалипсиса',
    fullDescription: 'Коллекция фотографий старого мира - города с небоскребами, люди в офисах, дети в школах, парки и музеи. Показывает, как выглядела цивилизация до катастрофы. Нейтральная документация прошлого.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_004',
    name: 'Газета последних дней',
    description: 'Печатное издание перед катастрофой',
    fullDescription: 'Последний выпуск газеты перед катастрофой. Содержит обычные новости - политика, спорт, погода, реклама. Показывает, как люди жили, не подозревая о надвигающейся катастрофе. Документ эпохи.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_005',
    name: 'Дневник выжившего',
    description: 'Записи первых месяцев после катастрофы',
    fullDescription: 'Дневник человека, пережившего первые месяцы после катастрофы. Описывает, как он искал других выживших, находил еду, прятался от мутантов. Личная история выживания без политических оценок.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_006',
    name: 'Список городов',
    description: 'Перечень уничтоженных населенных пунктов',
    fullDescription: 'Список городов и поселков, которые были уничтожены или заброшены после катастрофы. Содержит названия, примерное количество жителей, даты последних сообщений. Нейтральная статистика потерь.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_007',
    name: 'Техническая схема',
    description: 'Чертеж старой инфраструктуры',
    fullDescription: 'Техническая схема системы электроснабжения или водоснабжения старого города. Показывает, как была организована инфраструктура до катастрофы. Объективная техническая информация о прошлом.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_008',
    name: 'Фото семьи',
    description: 'Семейные снимки до катастрофы',
    fullDescription: 'Семейные фотографии, найденные в заброшенных домах. Показывают обычные семьи - родители с детьми, праздники, поездки. Напоминание о том, что до катастрофы люди жили обычной жизнью.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_world_009',
    name: 'Книга истории',
    description: 'Учебник по мировой истории',
    fullDescription: 'Учебник по мировой истории, найденный в заброшенной школе. Содержит информацию о древних цивилизациях, войнах, открытиях. Показывает, что люди изучали историю, не зная, что сами станут частью истории.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'free_world_010',
    name: 'Карта эвакуации',
    description: 'План массовой эвакуации',
    fullDescription: 'Официальный план массовой эвакуации населения, разработанный правительством перед катастрофой. Показывает маршруты, места сбора, порядок действий. Документ о попытках спасти людей.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_011',
    name: 'Записи ученых',
    description: 'Научные исследования до катастрофы',
    fullDescription: 'Записи ученых, изучавших аномалии и изменения в мире перед катастрофой. Содержат данные о странных явлениях, мутациях животных, изменениях климата. Научная документация предвестников катастрофы.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_world_012',
    name: 'Фото военных',
    description: 'Снимки последних операций',
    fullDescription: 'Фотографии военных операций в последние дни перед катастрофой. Показывают солдат, технику, попытки навести порядок. Документация последних попыток военных спасти ситуацию.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_013',
    name: 'Список беженцев',
    description: 'Реестр перемещенных лиц',
    fullDescription: 'Список людей, которые стали беженцами в первые дни катастрофы. Содержит имена, места происхождения, даты регистрации. Документ о массовом переселении людей.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_014',
    name: 'Дневник врача',
    description: 'Записи о первых жертвах',
    fullDescription: 'Дневник врача, который лечил первых жертв катастрофы. Описывает симптомы, попытки лечения, смерть пациентов. Медицинская документация начала эпидемии или мутаций.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_world_015',
    name: 'Карта бункеров',
    description: 'Схема правительственных убежищ',
    fullDescription: 'Карта с расположением правительственных бункеров и убежищ, построенных перед катастрофой. Показывает, где власти планировали укрыться. Документ о подготовке к катастрофе.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_world_016',
    name: 'Фото разрушений',
    description: 'Снимки последствий катастрофы',
    fullDescription: 'Фотографии разрушенных городов, заброшенных домов, пустых улиц. Показывают масштаб разрушений в первые месяцы после катастрофы. Документация последствий без оценки причин.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_017',
    name: 'Записи связиста',
    description: 'Радиопереговоры последних дней',
    fullDescription: 'Записи радиопереговоров между различными группами в последние дни перед катастрофой. Содержат попытки координировать действия, просьбы о помощи, последние сообщения. Документ о попытках сохранить связь.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_018',
    name: 'Список пропавших',
    description: 'Реестр без вести пропавших',
    fullDescription: 'Список людей, которые пропали без вести в первые дни катастрофы. Содержит имена, последние места пребывания, даты исчезновения. Документ о человеческих потерях.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'free_world_019',
    name: 'Фото природы',
    description: 'Снимки изменений в природе',
    fullDescription: 'Фотографии изменений в природе после катастрофы - мутировавшие растения, странные животные, измененные ландшафты. Документация того, как катастрофа повлияла на природу.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_world_020',
    name: 'Последние слова',
    description: 'Финальные записи выживших',
    fullDescription: 'Последние записи людей, которые не смогли выжить после катастрофы. Содержат их мысли, надежды, прощания с близкими. Документ о человеческих страданиях и потерях в первые дни апокалипсиса.',
    theme: 'world_history',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'rare'
  }
];

// Свободные (Free) - 20 предметов enemy_origins
export const FREE_ENEMY_ORIGINS_ITEMS: SidequestItem[] = [
  {
    id: 'free_enemy_001',
    name: 'Дневник очевидца',
    description: 'Записи о первых мутантах',
    fullDescription: 'Дневник человека, который стал свидетелем появления первых мутантов. Описывает, как обычные люди начали меняться - сначала странное поведение, потом физические изменения. Нейтральное описание без объяснения причин.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_002',
    name: 'Фото мутации',
    description: 'Снимки процесса превращения',
    fullDescription: 'Фотографии, показывающие процесс превращения человека в мутанта. Запечатлены различные стадии изменения - от первых симптомов до полного превращения. Документация процесса без оценки моральных аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_003',
    name: 'Записи ученого',
    description: 'Научные наблюдения за зомби',
    fullDescription: 'Записи ученого, изучавшего поведение зомби в первые дни после их появления. Содержат данные о скорости передвижения, реакции на звуки, способах атаки. Объективные научные наблюдения без эмоциональной окраски.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_004',
    name: 'Карта заражения',
    description: 'Схема распространения эпидемии',
    fullDescription: 'Карта, показывающая, как распространялась эпидемия или мутация по территории. Отмечены первые очаги, направления распространения, скорость заражения. Объективная информация о распространении без оценки причин.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_005',
    name: 'Список жертв',
    description: 'Реестр первых зараженных',
    fullDescription: 'Список людей, которые стали первыми жертвами заражения или мутации. Содержит имена, даты заражения, симптомы, исход. Документация первых случаев без объяснения механизма заражения.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_006',
    name: 'Дневник врача',
    description: 'Медицинские записи о заражении',
    fullDescription: 'Дневник врача, который лечил первых зараженных. Описывает симптомы, попытки лечения, реакцию на лекарства, процесс превращения. Медицинская документация без оценки этических аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_007',
    name: 'Фото лаборатории',
    description: 'Снимки исследовательского центра',
    fullDescription: 'Фотографии лаборатории или исследовательского центра, где могли проводиться эксперименты. Показывают оборудование, образцы, записи. Документация возможного места происхождения без обвинений.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_008',
    name: 'Записи военного',
    description: 'Отчет о первых столкновениях',
    fullDescription: 'Отчет военного о первых столкновениях с мутантами или зомби. Содержит тактическую информацию, эффективность оружия, поведение врагов. Объективная военная документация без эмоциональных оценок.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_009',
    name: 'Схема поведения',
    description: 'Диаграмма паттернов врагов',
    fullDescription: 'Схема, показывающая поведенческие паттерны различных типов врагов - зомби, мутантов, других существ. Отмечены зоны активности, время активности, способы передвижения. Объективная информация о поведении.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_010',
    name: 'Фото аномалии',
    description: 'Снимки странных явлений',
    fullDescription: 'Фотографии аномальных явлений, связанных с появлением врагов - странные туманы, искажения пространства, необычные звуки. Документация сопутствующих явлений без объяснения их природы.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_011',
    name: 'Дневник выжившего',
    description: 'Записи о контакте с врагами',
    fullDescription: 'Дневник человека, который выжил после контакта с врагами. Описывает их поведение, способы атаки, слабые места. Личные наблюдения без обобщений или теорий о происхождении.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_012',
    name: 'Список типов',
    description: 'Классификация врагов',
    fullDescription: 'Список различных типов врагов с их характеристиками - размер, скорость, способности, уязвимости. Объективная классификация без объяснения причин появления различных типов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_013',
    name: 'Карта гнезд',
    description: 'Схема мест скопления врагов',
    fullDescription: 'Карта с отмеченными местами скопления врагов - заброшенные здания, подземные туннели, леса. Показывает, где они предпочитают прятаться и размножаться. Тактическая информация без оценки мотивов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_014',
    name: 'Записи биолога',
    description: 'Научные наблюдения за мутантами',
    fullDescription: 'Записи биолога, изучавшего мутантов. Содержат данные о физиологии, способах размножения, жизненном цикле. Объективные научные наблюдения без этических оценок.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_015',
    name: 'Фото эволюции',
    description: 'Снимки развития врагов',
    fullDescription: 'Фотографии, показывающие, как враги развиваются и изменяются со временем. Запечатлены различные стадии их эволюции, появление новых способностей. Документация изменений без объяснения механизмов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'free_enemy_016',
    name: 'Дневник охотника',
    description: 'Записи о методах борьбы',
    fullDescription: 'Дневник охотника, который специализировался на борьбе с врагами. Описывает эффективные методы, используемое оружие, тактики выживания. Практическая информация без моральных оценок.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_017',
    name: 'Схема заражения',
    description: 'Диаграмма процесса инфицирования',
    fullDescription: 'Схема, показывающая, как происходит процесс заражения или мутации. Отмечены стадии, симптомы, время развития. Объективная медицинская информация без оценки этических аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_018',
    name: 'Фото жертв',
    description: 'Снимки последствий атак',
    fullDescription: 'Фотографии последствий атак врагов - разрушения, следы борьбы, останки жертв. Документация ущерба без эмоциональной окраски или обвинений в адрес конкретных групп.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_019',
    name: 'Список выживших',
    description: 'Реестр людей с иммунитетом',
    fullDescription: 'Список людей, которые оказались невосприимчивы к заражению или мутации. Содержит их характеристики, возможные причины иммунитета. Медицинская документация без объяснения механизмов защиты.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'free_enemy_020',
    name: 'Финальный отчет',
    description: 'Сводка всех наблюдений',
    fullDescription: 'Финальный отчет, объединяющий все наблюдения о врагах - их происхождение, поведение, способы борьбы. Сводная информация без окончательных выводов о причинах появления или способах полного уничтожения.',
    theme: 'enemy_origins',
    targetFaction: 'free',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  }
];

// Тайна (Mystery) - 20 предметов faction_lies
export const MYSTERY_FACTION_LIES_ITEMS: SidequestItem[] = [
  {
    id: 'mystery_lies_001',
    name: 'Фальшивый дневник',
    description: 'Поддельные записи о зомби',
    fullDescription: 'Фальшивый дневник, якобы написанный зомби, но на самом деле созданный людьми для дезинформации. Содержит ложные утверждения о том, что зомби - это просто больные люди, которых можно вылечить. Попытка скрыть истинную природу угрозы.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_002',
    name: 'Поддельное фото',
    description: 'Фальшивые снимки мутантов',
    fullDescription: 'Поддельные фотографии, показывающие мутантов как мирных существ, которые просто выглядят странно. На самом деле это фотомонтаж, созданный для того, чтобы убедить людей, что мутанты не опасны. Ложная пропаганда.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_003',
    name: 'Ложный отчет',
    description: 'Фальшивые научные данные',
    fullDescription: 'Ложный научный отчет, утверждающий, что зомби и мутанты - это результат естественной эволюции, а не искусственного создания. Содержит поддельные данные и ложные выводы, чтобы скрыть истинное происхождение врагов.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_004',
    name: 'Фальшивая карта',
    description: 'Поддельная схема распространения',
    fullDescription: 'Фальшивая карта, показывающая, что зомби и мутанты появились случайно в разных местах одновременно. На самом деле это попытка скрыть, что они были созданы в определенных лабораториях и выпущены намеренно.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_005',
    name: 'Ложное письмо',
    description: 'Фальшивое послание от мутанта',
    fullDescription: 'Фальшивое письмо, якобы написанное мутантом, в котором он просит о помощи и понимании. На самом деле это подделка, созданная для того, чтобы убедить людей, что мутанты - это жертвы, а не угроза.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_006',
    name: 'Поддельный дневник',
    description: 'Фальшивые записи очевидца',
    fullDescription: 'Поддельный дневник очевидца, в котором описывается, как зомби и мутанты появились из-за природной катастрофы. Содержит ложные детали и выдуманные события, чтобы скрыть истинные причины появления врагов.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_007',
    name: 'Ложная газета',
    description: 'Фальшивое издание о врагах',
    fullDescription: 'Фальшивая газета, в которой зомби и мутанты представлены как результат экологической катастрофы. Содержит ложные интервью с "учеными" и поддельные фотографии, чтобы убедить людей в естественном происхождении угрозы.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 70,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_lies_008',
    name: 'Поддельная схема',
    description: 'Фальшивый чертеж лаборатории',
    fullDescription: 'Поддельная схема лаборатории, в которой якобы изучали зомби и мутантов после их появления. На самом деле это попытка скрыть, что лаборатория была создана для их производства, а не для изучения.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_009',
    name: 'Ложный список',
    description: 'Фальшивый реестр жертв',
    fullDescription: 'Ложный список жертв, в котором зомби и мутанты представлены как случайные жертвы природной катастрофы. Содержит поддельные имена и даты, чтобы скрыть, что они были созданы намеренно.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_010',
    name: 'Фальшивое фото',
    description: 'Поддельные снимки лаборатории',
    fullDescription: 'Поддельные фотографии лаборатории, в которой якобы пытались лечить зомби и мутантов. На самом деле это попытка скрыть, что лаборатория была создана для их производства и выпуска.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_011',
    name: 'Ложный дневник',
    description: 'Фальшивые записи ученого',
    fullDescription: 'Ложный дневник ученого, в котором описывается, как он пытался помочь зомби и мутантам. Содержит поддельные записи о попытках лечения и ложные выводы о их природе.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_012',
    name: 'Поддельный отчет',
    description: 'Фальшивые данные о поведении',
    fullDescription: 'Поддельный отчет о поведении зомби и мутантов, в котором они представлены как мирные существа, которые просто выглядят странно. Содержит ложные данные и выдуманные наблюдения.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_013',
    name: 'Ложная карта',
    description: 'Фальшивая схема распространения',
    fullDescription: 'Фальшивая карта, показывающая, что зомби и мутанты распространились случайно из-за природных факторов. На самом деле это попытка скрыть, что они были выпущены намеренно в определенных местах.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_014',
    name: 'Поддельное письмо',
    description: 'Фальшивое послание от зомби',
    fullDescription: 'Поддельное письмо, якобы написанное зомби, в котором он просит о помощи и понимании. На самом деле это попытка убедить людей, что зомби - это просто больные люди, которых можно вылечить.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_015',
    name: 'Ложный дневник',
    description: 'Фальшивые записи врача',
    fullDescription: 'Ложный дневник врача, в котором описывается, как он пытался лечить зомби и мутантов. Содержит поддельные записи о попытках лечения и ложные выводы о их природе.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_016',
    name: 'Поддельная схема',
    description: 'Фальшивый чертеж лечения',
    fullDescription: 'Поддельная схема лечения зомби и мутантов, в которой они представлены как больные люди, которых можно вылечить. На самом деле это попытка скрыть, что они были созданы намеренно.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_017',
    name: 'Ложное фото',
    description: 'Фальшивые снимки лечения',
    fullDescription: 'Поддельные фотографии, показывающие, как зомби и мутанты якобы лечатся и возвращаются к нормальной жизни. На самом деле это фотомонтаж, созданный для дезинформации.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_018',
    name: 'Поддельный список',
    description: 'Фальшивый реестр выздоровевших',
    fullDescription: 'Ложный список людей, которые якобы выздоровели от зомби-вируса или мутации. Содержит поддельные имена и даты, чтобы убедить людей, что враги не опасны.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_019',
    name: 'Ложный отчет',
    description: 'Фальшивые данные о лечении',
    fullDescription: 'Поддельный отчет о лечении зомби и мутантов, в котором они представлены как больные люди, которых можно вылечить. Содержит ложные данные и выдуманные результаты лечения.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_lies_020',
    name: 'Фальшивый манифест',
    description: 'Поддельное заявление о врагах',
    fullDescription: 'Фальшивый манифест, в котором зомби и мутанты представлены как жертвы природной катастрофы, которых нужно защищать и лечить. На самом деле это попытка скрыть, что они были созданы намеренно как оружие.',
    theme: 'faction_lies',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  }
];

// Тайна (Mystery) - 20 предметов faction_truth
export const MYSTERY_FACTION_TRUTH_ITEMS: SidequestItem[] = [
  {
    id: 'mystery_truth_001',
    name: 'Секретный протокол',
    description: 'Документ о создании биологического оружия',
    fullDescription: 'Секретный протокол правительственной лаборатории о создании биологического оружия. Содержит детали проекта по созданию зомби и мутантов как оружия массового поражения. Доказывает, что враги были созданы искусственно.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.classified_document,
    price: 120,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_002',
    name: 'Дневник ученого',
    description: 'Записи создателя биологического оружия',
    fullDescription: 'Дневник ученого, который участвовал в создании биологического оружия. Описывает процесс разработки вируса, эксперименты на людях, моральные дилеммы. Раскрывает истинное происхождение зомби и мутантов.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 110,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_003',
    name: 'Фото лаборатории',
    description: 'Снимки секретного исследовательского центра',
    fullDescription: 'Фотографии секретной лаборатории, где создавали биологическое оружие. Показывают оборудование, клетки с испытуемыми, процесс создания зомби и мутантов. Документация преступления против человечества.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 105,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_004',
    name: 'Карта выпуска',
    description: 'Схема намеренного распространения вируса',
    fullDescription: 'Карта с отмеченными местами, где намеренно выпустили биологическое оружие. Показывает, что зомби и мутанты были выпущены в определенных городах для тестирования эффективности. Доказывает намеренность катастрофы.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 100,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_005',
    name: 'Письмо предателя',
    description: 'Послание от перебежчика',
    fullDescription: 'Письмо от ученого, который сбежал из секретной лаборатории. Раскрывает детали проекта по созданию биологического оружия, имена участников, цели операции. Призыв к разоблачению преступления.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 95,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_006',
    name: 'Отчет о результатах',
    description: 'Документ об эффективности биологического оружия',
    fullDescription: 'Отчет о результатах тестирования биологического оружия. Содержит данные о количестве жертв, скорости распространения, эффективности против различных типов целей. Холодные цифры преступления.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_007',
    name: 'Список жертв',
    description: 'Реестр людей, использованных в экспериментах',
    fullDescription: 'Список людей, которые были использованы в экспериментах по созданию биологического оружия. Содержит имена, даты, результаты экспериментов. Документ о преступлениях против человечности.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_008',
    name: 'Схема вируса',
    description: 'Чертеж биологического оружия',
    fullDescription: 'Техническая схема вируса, созданного в лаборатории. Показывает структуру, способ действия, методы распространения. Документация оружия массового поражения, созданного искусственно.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_009',
    name: 'Дневник охранника',
    description: 'Записи о секретной лаборатории',
    fullDescription: 'Дневник охранника секретной лаборатории. Описывает, что происходило внутри, как обращались с испытуемыми, попытки скрыть преступления. Взгляд изнутри на создание биологического оружия.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_010',
    name: 'Фото испытуемых',
    description: 'Снимки людей до и после экспериментов',
    fullDescription: 'Фотографии людей до и после экспериментов по созданию биологического оружия. Показывают процесс превращения в зомби и мутантов. Документация преступления против человечности.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_011',
    name: 'Приказ о выпуске',
    description: 'Документ с разрешением на распространение',
    fullDescription: 'Официальный приказ о выпуске биологического оружия в населенные пункты. Содержит подписи ответственных лиц, даты, цели операции. Документ, доказывающий намеренность катастрофы.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 110,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_012',
    name: 'Отчет о сокрытии',
    description: 'Документ о попытках скрыть правду',
    fullDescription: 'Отчет о мерах по сокрытию истины о происхождении биологического оружия. Содержит планы по дезинформации, созданию ложных документов, устранению свидетелей. Документ о сокрытии преступления.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_013',
    name: 'Карта лабораторий',
    description: 'Схема сети секретных центров',
    fullDescription: 'Карта с расположением всех секретных лабораторий, где создавали биологическое оружие. Показывает масштаб операции, количество центров, их специализацию. Документ о сети преступлений.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_014',
    name: 'Письмо семьи',
    description: 'Послание родственников жертвы',
    fullDescription: 'Письмо от семьи человека, который исчез и стал жертвой экспериментов. Содержит их подозрения, попытки найти правду, обвинения в адрес властей. Человеческая сторона преступления.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.letter,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_015',
    name: 'Дневник жертвы',
    description: 'Записи человека, ставшего зомби',
    fullDescription: 'Дневник человека, который был похищен и использован в экспериментах. Описывает процесс превращения, боль, страх, последние мысли перед потерей человечности. Документ о страданиях жертв.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 95,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_016',
    name: 'Схема контроля',
    description: 'Чертеж системы управления зомби',
    fullDescription: 'Техническая схема системы управления зомби и мутантами. Показывает, как их можно контролировать, направлять, использовать как оружие. Документация оружия массового поражения.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 100,
    rarity: 'legendary'
  },
  {
    id: 'mystery_truth_017',
    name: 'Фото команды',
    description: 'Снимки создателей биологического оружия',
    fullDescription: 'Фотографии команды ученых и военных, которые создавали биологическое оружие. Показывают лица преступников, их рабочие места, процесс создания оружия. Документация преступников.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 90,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_018',
    name: 'Список целей',
    description: 'Реестр городов для тестирования',
    fullDescription: 'Список городов и населенных пунктов, выбранных для тестирования биологического оружия. Содержит критерии отбора, количество жителей, ожидаемые результаты. Документ о планировании преступления.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_019',
    name: 'Отчет о результатах',
    description: 'Документ об эффективности оружия',
    fullDescription: 'Отчет об эффективности биологического оружия против различных типов целей. Содержит данные о скорости заражения, количестве жертв, способах улучшения. Холодные расчеты преступников.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 95,
    rarity: 'rare'
  },
  {
    id: 'mystery_truth_020',
    name: 'Финальное признание',
    description: 'Последние слова создателя оружия',
    fullDescription: 'Последние слова одного из создателей биологического оружия перед смертью. Содержит признание в преступлениях, раскаяние, призыв к разоблачению остальных участников. Финальная правда о катастрофе.',
    theme: 'faction_truth',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 120,
    rarity: 'legendary'
  }
];

// Тайна (Mystery) - 20 предметов faction_neutral
export const MYSTERY_FACTION_NEUTRAL_ITEMS: SidequestItem[] = [
  {
    id: 'mystery_neutral_001',
    name: 'Статистика заражения',
    description: 'Данные о распространении вируса',
    fullDescription: 'Объективная статистика о распространении вируса по территории. Содержит данные о количестве зараженных, скорости распространения, географическом распределении. Нейтральная информация без объяснения причин.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_002',
    name: 'Карта зон заражения',
    description: 'Схема распространения по территории',
    fullDescription: 'Карта с отмеченными зонами заражения, показывающая, где появились первые случаи, как распространялся вирус, текущее состояние территорий. Объективная географическая информация без оценки причин.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_003',
    name: 'Список симптомов',
    description: 'Перечень признаков заражения',
    fullDescription: 'Медицинский список симптомов заражения вирусом - физические изменения, поведенческие отклонения, стадии развития. Объективная медицинская информация без объяснения происхождения вируса.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_004',
    name: 'Хронология событий',
    description: 'Временная линия появления врагов',
    fullDescription: 'Хронологическая таблица появления зомби и мутантов - даты, места, количество случаев. Объективная временная информация без объяснения причин появления.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_005',
    name: 'Классификация врагов',
    description: 'Систематизация типов зомби и мутантов',
    fullDescription: 'Научная классификация различных типов зомби и мутантов - размеры, способности, поведение, уязвимости. Объективная таксономическая информация без объяснения происхождения.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_006',
    name: 'Схема поведения',
    description: 'Диаграмма паттернов активности',
    fullDescription: 'Схема, показывающая поведенческие паттерны зомби и мутантов - время активности, способы передвижения, реакции на раздражители. Объективная этологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_007',
    name: 'Данные о размножении',
    description: 'Информация о воспроизводстве врагов',
    fullDescription: 'Научные данные о способах размножения зомби и мутантов - методы, скорость, условия. Объективная биологическая информация без оценки этических аспектов.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_008',
    name: 'Карта миграции',
    description: 'Схема перемещений врагов',
    fullDescription: 'Карта, показывающая маршруты миграции зомби и мутантов, их предпочтительные места обитания, сезонные перемещения. Объективная географическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_009',
    name: 'Список уязвимостей',
    description: 'Перечень слабых мест врагов',
    fullDescription: 'Список уязвимостей различных типов зомби и мутантов - эффективные виды оружия, способы уничтожения, тактические рекомендации. Объективная боевая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_010',
    name: 'Данные о питании',
    description: 'Информация о пищевых потребностях',
    fullDescription: 'Научные данные о пищевых потребностях зомби и мутантов - что они едят, как часто, сколько нужно для выживания. Объективная биологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_011',
    name: 'Схема жизненного цикла',
    description: 'Диаграмма развития врагов',
    fullDescription: 'Схема жизненного цикла зомби и мутантов - стадии развития, продолжительность жизни, изменения с возрастом. Объективная биологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_012',
    name: 'Карта гнезд',
    description: 'Схема мест скопления врагов',
    fullDescription: 'Карта с отмеченными местами скопления зомби и мутантов - заброшенные здания, подземные туннели, леса. Объективная географическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_013',
    name: 'Данные о коммуникации',
    description: 'Информация о способах общения',
    fullDescription: 'Научные данные о способах коммуникации зомби и мутантов - звуки, жесты, химические сигналы. Объективная этологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_014',
    name: 'Список адаптаций',
    description: 'Перечень приспособлений врагов',
    fullDescription: 'Список адаптаций зомби и мутантов к окружающей среде - физические изменения, поведенческие модификации, способности. Объективная биологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_015',
    name: 'Данные о численности',
    description: 'Статистика популяции врагов',
    fullDescription: 'Статистические данные о численности популяции зомби и мутантов - общее количество, плотность по регионам, динамика изменения. Объективная демографическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_016',
    name: 'Схема иерархии',
    description: 'Диаграмма социальной структуры',
    fullDescription: 'Схема социальной структуры зомби и мутантов - иерархия, роли, взаимодействие между особями. Объективная социобиологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_017',
    name: 'Карта ресурсов',
    description: 'Схема использования ресурсов врагами',
    fullDescription: 'Карта, показывающая, как зомби и мутанты используют ресурсы - источники пищи, воды, укрытия. Объективная экологическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_018',
    name: 'Данные о разведении',
    description: 'Информация о селекции врагов',
    fullDescription: 'Научные данные о селекционных процессах у зомби и мутантов - отбор признаков, наследование, мутации. Объективная генетическая информация.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_019',
    name: 'Список угроз',
    description: 'Перечень опасностей от врагов',
    fullDescription: 'Список угроз, исходящих от зомби и мутантов - способы атаки, токсичность, инфекционность. Объективная информация о рисках.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_neutral_020',
    name: 'Общая сводка',
    description: 'Комплексная информация о врагах',
    fullDescription: 'Общая сводка всех известных данных о зомби и мутантах - физиология, поведение, экология, тактика борьбы. Комплексная объективная информация без объяснения происхождения.',
    theme: 'faction_neutral',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  }
];

// Тайна (Mystery) - 20 предметов world_history
export const MYSTERY_WORLD_HISTORY_ITEMS: SidequestItem[] = [
  {
    id: 'mystery_world_001',
    name: 'Хроника катастрофы',
    description: 'Записи о начале апокалипсиса',
    fullDescription: 'Детальная хроника первых дней катастрофы, когда мир изменился навсегда. Описывает падение цивилизации, появление первых зомби и мутантов, массовую панику. Нейтральное описание событий без объяснения причин.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_world_002',
    name: 'Карта до катастрофы',
    description: 'Старая карта мира',
    fullDescription: 'Карта мира до катастрофы, показывающая города, дороги, границы государств, которые больше не существуют. Напоминание о том, каким был мир раньше, до появления зомби и мутантов.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'mystery_world_003',
    name: 'Фото старого мира',
    description: 'Снимки до апокалипсиса',
    fullDescription: 'Коллекция фотографий старого мира - города с небоскребами, люди в офисах, дети в школах, парки и музеи. Показывает, как выглядела цивилизация до катастрофы и появления врагов.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_004',
    name: 'Газета последних дней',
    description: 'Печатное издание перед катастрофой',
    fullDescription: 'Последний выпуск газеты перед катастрофой. Содержит обычные новости - политика, спорт, погода, реклама. Показывает, как люди жили, не подозревая о надвигающейся катастрофе.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.newspaper,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_005',
    name: 'Дневник выжившего',
    description: 'Записи первых месяцев после катастрофы',
    fullDescription: 'Дневник человека, пережившего первые месяцы после катастрофы. Описывает, как он искал других выживших, находил еду, прятался от зомби и мутантов. Личная история выживания.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 65,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_006',
    name: 'Список городов',
    description: 'Перечень уничтоженных населенных пунктов',
    fullDescription: 'Список городов и поселков, которые были уничтожены или заброшены после катастрофы. Содержит названия, примерное количество жителей, даты последних сообщений. Статистика потерь.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_007',
    name: 'Техническая схема',
    description: 'Чертеж старой инфраструктуры',
    fullDescription: 'Техническая схема системы электроснабжения или водоснабжения старого города. Показывает, как была организована инфраструктура до катастрофы. Объективная техническая информация о прошлом.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_008',
    name: 'Фото семьи',
    description: 'Семейные снимки до катастрофы',
    fullDescription: 'Семейные фотографии, найденные в заброшенных домах. Показывают обычные семьи - родители с детьми, праздники, поездки. Напоминание о том, что до катастрофы люди жили обычной жизнью.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'mystery_world_009',
    name: 'Книга истории',
    description: 'Учебник по мировой истории',
    fullDescription: 'Учебник по мировой истории, найденный в заброшенной школе. Содержит информацию о древних цивилизациях, войнах, открытиях. Показывает, что люди изучали историю, не зная, что сами станут частью истории.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.book1,
    price: 35,
    rarity: 'common'
  },
  {
    id: 'mystery_world_010',
    name: 'Карта эвакуации',
    description: 'План массовой эвакуации',
    fullDescription: 'Официальный план массовой эвакуации населения, разработанный правительством перед катастрофой. Показывает маршруты, места сбора, порядок действий. Документ о попытках спасти людей.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_011',
    name: 'Записи ученых',
    description: 'Научные исследования до катастрофы',
    fullDescription: 'Записи ученых, изучавших аномалии и изменения в мире перед катастрофой. Содержат данные о странных явлениях, мутациях животных, изменениях климата. Научная документация предвестников катастрофы.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_world_012',
    name: 'Фото военных',
    description: 'Снимки последних операций',
    fullDescription: 'Фотографии военных операций в последние дни перед катастрофой. Показывают солдат, технику, попытки навести порядок. Документация последних попыток военных спасти ситуацию.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_013',
    name: 'Список беженцев',
    description: 'Реестр перемещенных лиц',
    fullDescription: 'Список людей, которые стали беженцами в первые дни катастрофы. Содержит имена, места происхождения, даты регистрации. Документ о массовом переселении людей.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_014',
    name: 'Дневник врача',
    description: 'Записи о первых жертвах',
    fullDescription: 'Дневник врача, который лечил первых жертв катастрофы. Описывает симптомы, попытки лечения, смерть пациентов. Медицинская документация начала эпидемии или мутаций.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'mystery_world_015',
    name: 'Карта бункеров',
    description: 'Схема правительственных убежищ',
    fullDescription: 'Карта с расположением правительственных бункеров и убежищ, построенных перед катастрофой. Показывает, где власти планировали укрыться. Документ о подготовке к катастрофе.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'mystery_world_016',
    name: 'Фото разрушений',
    description: 'Снимки последствий катастрофы',
    fullDescription: 'Фотографии разрушенных городов, заброшенных домов, пустых улиц. Показывают масштаб разрушений в первые месяцы после катастрофы. Документация последствий.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_017',
    name: 'Записи связиста',
    description: 'Радиопереговоры последних дней',
    fullDescription: 'Записи радиопереговоров между различными группами в последние дни перед катастрофой. Содержат попытки координировать действия, просьбы о помощи, последние сообщения.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_018',
    name: 'Список пропавших',
    description: 'Реестр без вести пропавших',
    fullDescription: 'Список людей, которые пропали без вести в первые дни катастрофы. Содержит имена, последние места пребывания, даты исчезновения. Документ о человеческих потерях.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 40,
    rarity: 'common'
  },
  {
    id: 'mystery_world_019',
    name: 'Фото природы',
    description: 'Снимки изменений в природе',
    fullDescription: 'Фотографии изменений в природе после катастрофы - мутировавшие растения, странные животные, измененные ландшафты. Документация того, как катастрофа повлияла на природу.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_world_020',
    name: 'Последние слова',
    description: 'Финальные записи выживших',
    fullDescription: 'Последние записи людей, которые не смогли выжить после катастрофы. Содержат их мысли, надежды, прощания с близкими. Документ о человеческих страданиях и потерях в первые дни апокалипсиса.',
    theme: 'world_history',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 85,
    rarity: 'rare'
  }
];

// Тайна (Mystery) - 20 предметов enemy_origins
export const MYSTERY_ENEMY_ORIGINS_ITEMS: SidequestItem[] = [
  {
    id: 'mystery_enemy_001',
    name: 'Дневник очевидца',
    description: 'Записи о первых мутантах',
    fullDescription: 'Дневник человека, который стал свидетелем появления первых мутантов. Описывает, как обычные люди начали меняться - сначала странное поведение, потом физические изменения. Нейтральное описание без объяснения причин.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 75,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_002',
    name: 'Фото мутации',
    description: 'Снимки процесса превращения',
    fullDescription: 'Фотографии, показывающие процесс превращения человека в мутанта. Запечатлены различные стадии изменения - от первых симптомов до полного превращения. Документация процесса без оценки моральных аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 80,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_003',
    name: 'Записи ученого',
    description: 'Научные наблюдения за зомби',
    fullDescription: 'Записи ученого, изучавшего поведение зомби в первые дни после их появления. Содержат данные о скорости передвижения, реакции на звуки, способах атаки. Объективные научные наблюдения без эмоциональной окраски.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_004',
    name: 'Карта заражения',
    description: 'Схема распространения эпидемии',
    fullDescription: 'Карта, показывающая, как распространялась эпидемия или мутация по территории. Отмечены первые очаги, направления распространения, скорость заражения. Объективная информация о распространении без оценки причин.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_005',
    name: 'Список жертв',
    description: 'Реестр первых зараженных',
    fullDescription: 'Список людей, которые стали первыми жертвами заражения или мутации. Содержит имена, даты заражения, симптомы, исход. Документация первых случаев без объяснения механизма заражения.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_006',
    name: 'Дневник врача',
    description: 'Медицинские записи о заражении',
    fullDescription: 'Дневник врача, который лечил первых зараженных. Описывает симптомы, попытки лечения, реакцию на лекарства, процесс превращения. Медицинская документация без оценки этических аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_007',
    name: 'Фото лаборатории',
    description: 'Снимки исследовательского центра',
    fullDescription: 'Фотографии лаборатории или исследовательского центра, где могли проводиться эксперименты. Показывают оборудование, образцы, записи. Документация возможного места происхождения без обвинений.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_008',
    name: 'Записи военного',
    description: 'Отчет о первых столкновениях',
    fullDescription: 'Отчет военного о первых столкновениях с мутантами или зомби. Содержит тактическую информацию, эффективность оружия, поведение врагов. Объективная военная документация без эмоциональных оценок.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_009',
    name: 'Схема поведения',
    description: 'Диаграмма паттернов врагов',
    fullDescription: 'Схема, показывающая поведенческие паттерны различных типов врагов - зомби, мутантов, других существ. Отмечены зоны активности, время активности, способы передвижения. Объективная информация о поведении.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_010',
    name: 'Фото аномалии',
    description: 'Снимки странных явлений',
    fullDescription: 'Фотографии аномальных явлений, связанных с появлением врагов - странные туманы, искажения пространства, необычные звуки. Документация сопутствующих явлений без объяснения их природы.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_011',
    name: 'Дневник выжившего',
    description: 'Записи о контакте с врагами',
    fullDescription: 'Дневник человека, который выжил после контакта с врагами. Описывает их поведение, способы атаки, слабые места. Личные наблюдения без обобщений или теорий о происхождении.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_012',
    name: 'Список типов',
    description: 'Классификация врагов',
    fullDescription: 'Список различных типов врагов с их характеристиками - размер, скорость, способности, уязвимости. Объективная классификация без объяснения причин появления различных типов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_013',
    name: 'Карта гнезд',
    description: 'Схема мест скопления врагов',
    fullDescription: 'Карта с отмеченными местами скопления врагов - заброшенные здания, подземные туннели, леса. Показывает, где они предпочитают прятаться и размножаться. Тактическая информация без оценки мотивов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.map_fragment,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_014',
    name: 'Записи биолога',
    description: 'Научные наблюдения за мутантами',
    fullDescription: 'Записи биолога, изучавшего мутантов. Содержат данные о физиологии, способах размножения, жизненном цикле. Объективные научные наблюдения без этических оценок.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 70,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_015',
    name: 'Фото эволюции',
    description: 'Снимки развития врагов',
    fullDescription: 'Фотографии, показывающие, как враги развиваются и изменяются со временем. Запечатлены различные стадии их эволюции, появление новых способностей. Документация изменений без объяснения механизмов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 65,
    rarity: 'rare'
  },
  {
    id: 'mystery_enemy_016',
    name: 'Дневник охотника',
    description: 'Записи о методах борьбы',
    fullDescription: 'Дневник охотника, который специализировался на борьбе с врагами. Описывает эффективные методы, используемое оружие, тактики выживания. Практическая информация без моральных оценок.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.diary,
    price: 60,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_017',
    name: 'Схема заражения',
    description: 'Диаграмма процесса инфицирования',
    fullDescription: 'Схема, показывающая, как происходит процесс заражения или мутации. Отмечены стадии, симптомы, время развития. Объективная медицинская информация без оценки этических аспектов.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 55,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_018',
    name: 'Фото жертв',
    description: 'Снимки последствий атак',
    fullDescription: 'Фотографии последствий атак врагов - разрушения, следы борьбы, останки жертв. Документация ущерба без эмоциональной окраски или обвинений в адрес конкретных групп.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.photo,
    price: 45,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_019',
    name: 'Список выживших',
    description: 'Реестр людей с иммунитетом',
    fullDescription: 'Список людей, которые оказались невосприимчивы к заражению или мутации. Содержит их характеристики, возможные причины иммунитета. Медицинская документация без объяснения механизмов защиты.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 50,
    rarity: 'uncommon'
  },
  {
    id: 'mystery_enemy_020',
    name: 'Финальный отчет',
    description: 'Сводка всех наблюдений',
    fullDescription: 'Финальный отчет, объединяющий все наблюдения о врагах - их происхождение, поведение, способы борьбы. Сводная информация без окончательных выводов о причинах появления или способах полного уничтожения.',
    theme: 'enemy_origins',
    targetFaction: 'mystery',
    spritePath: SIDEQUEST_SPRITES.document,
    price: 85,
    rarity: 'rare'
  }
];

/**
 * Инициализация базы данных побочных предметов
 * Загружает все 500 предметов в менеджер
 */
export function initializeSidequestItemsDatabase(): void {
  const manager = SidequestItemManager.getInstance();
  
  // Очищаем существующие данные
  manager.reset();
  
  // Загружаем все предметы по фракциям и темам
  
  // HQ (Штаб) - 100 предметов
  manager.addItems(HQ_FACTION_LIES_ITEMS);
  manager.addItems(HQ_FACTION_TRUTH_ITEMS);
  manager.addItems(HQ_FACTION_NEUTRAL_ITEMS);
  manager.addItems(HQ_WORLD_HISTORY_ITEMS);
  manager.addItems(HQ_ENEMY_ORIGINS_ITEMS);
  
  // Rebels (Повстанцы) - 100 предметов
  manager.addItems(REBELS_FACTION_LIES_ITEMS);
  manager.addItems(REBELS_FACTION_TRUTH_ITEMS);
  manager.addItems(REBELS_FACTION_NEUTRAL_ITEMS);
  manager.addItems(REBELS_WORLD_HISTORY_ITEMS);
  manager.addItems(REBELS_ENEMY_ORIGINS_ITEMS);
  
  // Marauders (Мародеры) - 100 предметов
  manager.addItems(MARAUDERS_FACTION_LIES_ITEMS);
  manager.addItems(MARAUDERS_FACTION_TRUTH_ITEMS);
  manager.addItems(MARAUDERS_FACTION_NEUTRAL_ITEMS);
  manager.addItems(MARAUDERS_WORLD_HISTORY_ITEMS);
  manager.addItems(MARAUDERS_ENEMY_ORIGINS_ITEMS);
  
  // Free (Свободные) - 100 предметов
  manager.addItems(FREE_FACTION_LIES_ITEMS);
  manager.addItems(FREE_FACTION_TRUTH_ITEMS);
  manager.addItems(FREE_FACTION_NEUTRAL_ITEMS);
  manager.addItems(FREE_WORLD_HISTORY_ITEMS);
  manager.addItems(FREE_ENEMY_ORIGINS_ITEMS);
  
  // Mystery (Тайна) - 100 предметов
  manager.addItems(MYSTERY_FACTION_LIES_ITEMS);
  manager.addItems(MYSTERY_FACTION_TRUTH_ITEMS);
  manager.addItems(MYSTERY_FACTION_NEUTRAL_ITEMS);
  manager.addItems(MYSTERY_WORLD_HISTORY_ITEMS);
  manager.addItems(MYSTERY_ENEMY_ORIGINS_ITEMS);
  
  console.log('[SidequestItems] База данных инициализирована: 500 предметов загружено');
}

/**
 * Получить менеджер побочных предметов с инициализированной базой данных
 */
export function getSidequestItemManager(seed?: number): SidequestItemManager {
  const manager = SidequestItemManager.getInstance(seed);
  
  // Проверяем, инициализирована ли база данных
  if (manager.getAllItems().length === 0) {
    initializeSidequestItemsDatabase();
  }
  
  return manager;
}
