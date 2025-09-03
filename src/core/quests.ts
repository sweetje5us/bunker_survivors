/**
 * Справочник заданий для фракций в игре Bunker Survivors
 * Система заданий с разделением по грейдам сложности и различными типами наград
 */

export type FactionId = 'hq' | 'rebels' | 'marauders' | 'free' | 'mystery';

export type QuestGrade = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type QuestType =
  | 'recruit'        // Прием жителей
  | 'exile'          // Изгнание жителей
  | 'kill_enemy'     // Убийство врагов
  | 'get_item'       // Получение предмета
  | 'collect_resource' // Сбор ресурсов
  | 'build_room'     // Постройка комнаты
  | 'destroy_room'   // Разрушение комнаты
  | 'sacrifice'      // Жертвоприношение
  | 'insanity'       // Доведение до безумия
  | 'produce_resource' // Производство ресурсов
  | 'trade'          // Торговля
  | 'refuse_profession' // Отказ профессии
  | 'refuse_gender'  // Отказ по полу
  | 'refuse_skill'   // Отказ по навыку
  | 'accept_profession' // Прием профессии
  | 'accept_gender'  // Прием по полу
  | 'accept_skill'   // Прием по навыку
  | 'find_sidequest' // Поиск побочного предмета
  | 'attack_bunker'  // Нападение на бункер
  | 'let_enemy_in';  // Впустить врага

export type RewardType = 'experience' | 'reputation' | 'item' | 'resource';

export type PenaltyType = 'none' | 'money' | 'reputation';

export interface QuestReward {
  type: RewardType;
  value: number | string; // число для опыта/репутации, string для ID предмета/ресурса
  amount?: number; // количество для предметов/ресурсов
}

export interface QuestPenalty {
  type: PenaltyType;
  value: number;
}

export interface Quest {
  id: string;
  faction: FactionId;
  title: string;
  description: string;
  type: QuestType;
  grade: QuestGrade;
  rarity: number; // 1-100, шанс генерации
  target: number; // цель выполнения
  reward: QuestReward;
  penalty: QuestPenalty;
  timeLimit?: number; // дни на выполнение (опционально)
}

// Профессии жителей
export const PROFESSIONS = [
  'врач', 'повар', 'сантехник', 'фермер', 'охотник', 'разведчик',
  'инженер', 'ученый', 'торговец', 'солдат', 'безработный'
];

// Навыки жителей
export const SKILLS = [
  'сила', 'выносливость', 'интеллект', 'ловкость', 'харизма',
  'медицина', 'кулинария', 'ремонт', 'фермерство', 'охота'
];

// Враги
export const ENEMIES = [
  'зомби', 'мутант', 'мародер', 'солдат', 'повстанец'
];

// Ресурсы
export const RESOURCES = [
  'ammo', 'food', 'water', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass'
];

// Предметы для заданий
export const QUEST_ITEMS = [
  'medicine', 'backpack', 'battery', 'multi_tool', 'flashlight',
  'lighter', 'matches', 'rope', 'tape', 'book1', 'book2'
];

// Типы комнат
export const ROOM_TYPES = [
  'Спальня', 'Столовая', 'Туалет', 'Госпиталь', 'Склад',
  'Лифт', 'Оружейная', 'Серверная', 'Рынок', 'Лаборатория'
];

// Побочные предметы
export const SIDEQUEST_ITEMS = [
  'book1', 'book2', 'truth', 'neutrality', 'lie'
];

/**
 * База заданий для Штаба (HQ)
 */
const HQ_QUESTS: Quest[] = [
  // Common grade (1-25)
  {
    id: 'hq_recruit_1',
    faction: 'hq',
    title: 'Прием новобранцев',
    description: 'Принять 3 новых жителей в бункер',
    type: 'recruit',
    grade: 'common',
    rarity: 20,
    target: 3,
    reward: { type: 'experience', value: 50 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_ammo_1',
    faction: 'hq',
    title: 'Боеприпасы для защиты',
    description: 'Собрать 10 патронов для обороны',
    type: 'collect_resource',
    grade: 'common',
    rarity: 15,
    target: 10,
    reward: { type: 'resource', value: 'ammo', amount: 5 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_food_1',
    faction: 'hq',
    title: 'Продовольственный запас',
    description: 'Накопить 20 единиц еды',
    type: 'collect_resource',
    grade: 'common',
    rarity: 18,
    target: 20,
    reward: { type: 'resource', value: 'food', amount: 10 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_bedroom_1',
    faction: 'hq',
    title: 'Расширение жилплощади',
    description: 'Построить 2 спальни',
    type: 'build_room',
    grade: 'common',
    rarity: 12,
    target: 2,
    reward: { type: 'reputation', value: 25 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_engineer_1',
    faction: 'hq',
    title: 'Найм специалистов',
    description: 'Принять 2 инженеров',
    type: 'accept_profession',
    grade: 'common',
    rarity: 10,
    target: 2,
    reward: { type: 'experience', value: 75 },
    penalty: { type: 'none', value: 0 }
  },

  // Uncommon grade (26-50)
  {
    id: 'hq_kill_zombies_1',
    faction: 'hq',
    title: 'Очистка от нежити',
    description: 'Уничтожить 5 зомби',
    type: 'kill_enemy',
    grade: 'uncommon',
    rarity: 8,
    target: 5,
    reward: { type: 'reputation', value: 40 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_defense_1',
    faction: 'hq',
    title: 'Укрепление позиций',
    description: 'Повысить защиту бункера до 75%',
    type: 'collect_resource',
    grade: 'uncommon',
    rarity: 6,
    target: 75,
    reward: { type: 'item', value: 'backpack' },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_refuse_unemployed_1',
    faction: 'hq',
    title: 'Отсев неэффективных',
    description: 'Отказать 3 безработным',
    type: 'refuse_profession',
    grade: 'uncommon',
    rarity: 5,
    target: 3,
    reward: { type: 'experience', value: 60 },
    penalty: { type: 'reputation', value: -10 }
  },
  {
    id: 'hq_male_only_1',
    faction: 'hq',
    title: 'Строгий отбор',
    description: 'Принять только мужчин (отказать 5 женщинам)',
    type: 'refuse_gender',
    grade: 'uncommon',
    rarity: 4,
    target: 5,
    reward: { type: 'reputation', value: 35 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_metal_1',
    faction: 'hq',
    title: 'Металлический запас',
    description: 'Накопить 15 единиц металла',
    type: 'collect_resource',
    grade: 'uncommon',
    rarity: 7,
    target: 15,
    reward: { type: 'resource', value: 'metal', amount: 8 },
    penalty: { type: 'none', value: 0 }
  },

  // Rare grade (51-75)
  {
    id: 'hq_elite_soldiers_1',
    faction: 'hq',
    title: 'Элитные солдаты',
    description: 'Принять 3 солдат с навыком "сила"',
    type: 'accept_skill',
    grade: 'rare',
    rarity: 3,
    target: 3,
    reward: { type: 'experience', value: 150 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_weapon_cache_1',
    faction: 'hq',
    title: 'Оружейный склад',
    description: 'Собрать 25 патронов',
    type: 'collect_resource',
    grade: 'rare',
    rarity: 2,
    target: 25,
    reward: { type: 'item', value: 'ammo' },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_armory_1',
    faction: 'hq',
    title: 'Строительство арсенала',
    description: 'Построить оружейную',
    type: 'build_room',
    grade: 'rare',
    rarity: 1,
    target: 1,
    reward: { type: 'reputation', value: 100 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_exile_weak_1',
    faction: 'hq',
    title: 'Чистка рядов',
    description: 'Изгнать 2 жителей с низким здоровьем',
    type: 'exile',
    grade: 'rare',
    rarity: 2,
    target: 2,
    reward: { type: 'experience', value: 120 },
    penalty: { type: 'reputation', value: -25 }
  },
  {
    id: 'hq_kill_marauders_1',
    faction: 'hq',
    title: 'Уничтожение мародеров',
    description: 'Уничтожить 3 мародера',
    type: 'kill_enemy',
    grade: 'rare',
    rarity: 2,
    target: 3,
    reward: { type: 'resource', value: 'ammo', amount: 15 },
    penalty: { type: 'none', value: 0 }
  },

  // Epic grade (76-90)
  {
    id: 'hq_max_defense_1',
    faction: 'hq',
    title: 'Непроницаемая крепость',
    description: 'Достичь максимальной защиты (100%)',
    type: 'collect_resource',
    grade: 'epic',
    rarity: 1,
    target: 100,
    reward: { type: 'experience', value: 300 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_sacrifice_1',
    faction: 'hq',
    title: 'Жертва ради порядка',
    description: 'Принести в жертву жителя с низким здоровьем',
    type: 'sacrifice',
    grade: 'epic',
    rarity: 0.5,
    target: 1,
    reward: { type: 'reputation', value: 150 },
    penalty: { type: 'reputation', value: -50 }
  },
  {
    id: 'hq_attack_rebels_1',
    faction: 'hq',
    title: 'Уничтожение повстанцев',
    description: 'Напасть на бункер повстанцев',
    type: 'attack_bunker',
    grade: 'epic',
    rarity: 0.5,
    target: 1,
    reward: { type: 'experience', value: 400 },
    penalty: { type: 'none', value: 0 }
  },

  // Legendary grade (91-100)
  {
    id: 'hq_elite_army_1',
    faction: 'hq',
    title: 'Элитная армия',
    description: 'Принять 5 солдат с навыками "сила" и "выносливость"',
    type: 'accept_skill',
    grade: 'legendary',
    rarity: 0.1,
    target: 5,
    reward: { type: 'reputation', value: 500 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'hq_complete_control_1',
    faction: 'hq',
    title: 'Полный контроль',
    description: 'Достичь максимального порядка (100% морали и счастья)',
    type: 'collect_resource',
    grade: 'legendary',
    rarity: 0.1,
    target: 100,
    reward: { type: 'experience', value: 1000 },
    penalty: { type: 'none', value: 0 }
  }
];

/**
 * Задания для Повстанцев (Rebels)
 */
const REBELS_QUESTS: Quest[] = [
  // Common
  {
    id: 'rebels_recruit_1',
    faction: 'rebels',
    title: 'Новые бойцы',
    description: 'Принять 4 новых жителя',
    type: 'recruit',
    grade: 'common',
    rarity: 20,
    target: 4,
    reward: { type: 'experience', value: 40 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'rebels_scout_1',
    faction: 'rebels',
    title: 'Разведка местности',
    description: 'Принять 2 разведчиков',
    type: 'accept_profession',
    grade: 'common',
    rarity: 15,
    target: 2,
    reward: { type: 'reputation', value: 30 },
    penalty: { type: 'none', value: 0 }
  },

  // Uncommon
  {
    id: 'rebels_attack_hq_1',
    faction: 'rebels',
    title: 'Нападение на Штаб',
    description: 'Напасть на бункер Штаба',
    type: 'attack_bunker',
    grade: 'uncommon',
    rarity: 8,
    target: 1,
    reward: { type: 'experience', value: 200 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'rebels_kill_soldiers_1',
    faction: 'rebels',
    title: 'Борьба с угнетателями',
    description: 'Уничтожить 4 солдат Штаба',
    type: 'kill_enemy',
    grade: 'uncommon',
    rarity: 6,
    target: 4,
    reward: { type: 'resource', value: 'ammo', amount: 12 },
    penalty: { type: 'none', value: 0 }
  },

  // Rare
  {
    id: 'rebels_sabotage_1',
    faction: 'rebels',
    title: 'Диверсионные действия',
    description: 'Ослабить оборону противника',
    type: 'kill_enemy',
    grade: 'rare',
    rarity: 3,
    target: 1,
    reward: { type: 'reputation', value: 80 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'rebels_recruit_warriors_1',
    faction: 'rebels',
    title: 'Набор воинов',
    description: 'Принять 3 жителей с навыком "сила"',
    type: 'accept_skill',
    grade: 'rare',
    rarity: 2,
    target: 3,
    reward: { type: 'item', value: 'backpack' },
    penalty: { type: 'none', value: 0 }
  },

  // Epic
  {
    id: 'rebels_destroy_hq_1',
    faction: 'rebels',
    title: 'Революция',
    description: 'Уничтожить бункер Штаба',
    type: 'attack_bunker',
    grade: 'epic',
    rarity: 1,
    target: 1,
    reward: { type: 'experience', value: 500 },
    penalty: { type: 'none', value: 0 }
  },

  // Legendary
  {
    id: 'rebels_free_world_1',
    faction: 'rebels',
    title: 'Свободный мир',
    description: 'Уничтожить все бункеры Штаба',
    type: 'attack_bunker',
    grade: 'legendary',
    rarity: 0.05,
    target: 5,
    reward: { type: 'reputation', value: 1000 },
    penalty: { type: 'none', value: 0 }
  }
];

/**
 * Задания для Мародеров (Marauders)
 */
const MARAUDERS_QUESTS: Quest[] = [
  // Common
  {
    id: 'marauders_loot_1',
    faction: 'marauders',
    title: 'Добыча ресурсов',
    description: 'Собрать 15 единиц металла',
    type: 'collect_resource',
    grade: 'common',
    rarity: 18,
    target: 15,
    reward: { type: 'resource', value: 'metal', amount: 8 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'marauders_attack_1',
    faction: 'marauders',
    title: 'Охота на слабых',
    description: 'Напасть на бункер Свободных',
    type: 'attack_bunker',
    grade: 'common',
    rarity: 12,
    target: 1,
    reward: { type: 'resource', value: 'money', amount: 50 },
    penalty: { type: 'none', value: 0 }
  },

  // Uncommon
  {
    id: 'marauders_kill_1',
    faction: 'marauders',
    title: 'Кровавая жатва',
    description: 'Уничтожить 6 жителей других бункеров',
    type: 'kill_enemy',
    grade: 'uncommon',
    rarity: 8,
    target: 6,
    reward: { type: 'experience', value: 100 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'marauders_steal_1',
    faction: 'marauders',
    title: 'Кража технологий',
    description: 'Украсть предмет из другого бункера',
    type: 'get_item',
    grade: 'uncommon',
    rarity: 5,
    target: 1,
    reward: { type: 'item', value: 'multi_tool' },
    penalty: { type: 'none', value: 0 }
  },

  // Rare
  {
    id: 'marauders_rampage_1',
    faction: 'marauders',
    title: 'Разгром',
    description: 'Уничтожить 10 жителей',
    type: 'kill_enemy',
    grade: 'rare',
    rarity: 3,
    target: 10,
    reward: { type: 'reputation', value: 120 },
    penalty: { type: 'none', value: 0 }
  },

  // Epic
  {
    id: 'marauders_empire_1',
    faction: 'marauders',
    title: 'Империя хаоса',
    description: 'Уничтожить 3 бункера',
    type: 'attack_bunker',
    grade: 'epic',
    rarity: 1,
    target: 3,
    reward: { type: 'experience', value: 600 },
    penalty: { type: 'none', value: 0 }
  },

  // Legendary
  {
    id: 'marauders_apocalypse_1',
    faction: 'marauders',
    title: 'Апокалипсис',
    description: 'Уничтожить все выжившие бункеры',
    type: 'attack_bunker',
    grade: 'legendary',
    rarity: 0.01,
    target: 10,
    reward: { type: 'reputation', value: 2000 },
    penalty: { type: 'none', value: 0 }
  }
];

/**
 * Задания для Свободных (Free)
 */
const FREE_QUESTS: Quest[] = [
  // Common
  {
    id: 'free_trade_1',
    faction: 'free',
    title: 'Свободная торговля',
    description: 'Организовать торговый обмен',
    type: 'trade',
    grade: 'common',
    rarity: 15,
    target: 1,
    reward: { type: 'resource', value: 'money', amount: 30 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'free_community_1',
    faction: 'free',
    title: 'Сообщество',
    description: 'Принять 5 новых жителей',
    type: 'recruit',
    grade: 'common',
    rarity: 18,
    target: 5,
    reward: { type: 'reputation', value: 40 },
    penalty: { type: 'none', value: 0 }
  },

  // Uncommon
  {
    id: 'free_neutrality_1',
    faction: 'free',
    title: 'Нейтралитет',
    description: 'Найти предмет "Нейтралитет"',
    type: 'find_sidequest',
    grade: 'uncommon',
    rarity: 7,
    target: 1,
    reward: { type: 'experience', value: 90 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'free_balance_1',
    faction: 'free',
    title: 'Баланс сил',
    description: 'Поддерживать нейтральные отношения со всеми фракциями',
    type: 'recruit',
    grade: 'uncommon',
    rarity: 5,
    target: 1,
    reward: { type: 'reputation', value: 60 },
    penalty: { type: 'none', value: 0 }
  },

  // Rare
  {
    id: 'free_alliance_1',
    faction: 'free',
    title: 'Альянс',
    description: 'Помочь другой фракции в кризисной ситуации',
    type: 'trade',
    grade: 'rare',
    rarity: 3,
    target: 1,
    reward: { type: 'experience', value: 180 },
    penalty: { type: 'none', value: 0 }
  },

  // Epic
  {
    id: 'free_peace_1',
    faction: 'free',
    title: 'Мир во всем мире',
    description: 'Достичь мирных отношений со всеми фракциями',
    type: 'recruit',
    grade: 'epic',
    rarity: 1,
    target: 1,
    reward: { type: 'reputation', value: 300 },
    penalty: { type: 'none', value: 0 }
  },

  // Legendary
  {
    id: 'free_utopia_1',
    faction: 'free',
    title: 'Утопия',
    description: 'Создать идеальное общество без конфликтов',
    type: 'recruit',
    grade: 'legendary',
    rarity: 0.02,
    target: 1,
    reward: { type: 'experience', value: 2000 },
    penalty: { type: 'none', value: 0 }
  }
];

/**
 * Задания для Тайны (Mystery)
 */
const MYSTERY_QUESTS: Quest[] = [
  // Common
  {
    id: 'mystery_explore_1',
    faction: 'mystery',
    title: 'Исследование',
    description: 'Найти предмет "Истина"',
    type: 'find_sidequest',
    grade: 'common',
    rarity: 12,
    target: 1,
    reward: { type: 'experience', value: 70 },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'mystery_zombie_1',
    faction: 'mystery',
    title: 'Изучение нежити',
    description: 'Уничтожить 3 зомби',
    type: 'kill_enemy',
    grade: 'common',
    rarity: 15,
    target: 3,
    reward: { type: 'reputation', value: 25 },
    penalty: { type: 'none', value: 0 }
  },

  // Uncommon
  {
    id: 'mystery_mutant_1',
    faction: 'mystery',
    title: 'Мутантная угроза',
    description: 'Уничтожить 2 мутанта',
    type: 'kill_enemy',
    grade: 'uncommon',
    rarity: 8,
    target: 2,
    reward: { type: 'item', value: 'medicine' },
    penalty: { type: 'none', value: 0 }
  },
  {
    id: 'mystery_lie_1',
    faction: 'mystery',
    title: 'Поиск обмана',
    description: 'Найти предмет "Ложь"',
    type: 'find_sidequest',
    grade: 'uncommon',
    rarity: 6,
    target: 1,
    reward: { type: 'experience', value: 110 },
    penalty: { type: 'none', value: 0 }
  },

  // Rare
  {
    id: 'mystery_insanity_1',
    faction: 'mystery',
    title: 'Безумие',
    description: 'Довести жителя до безумия',
    type: 'insanity',
    grade: 'rare',
    rarity: 3,
    target: 1,
    reward: { type: 'reputation', value: 90 },
    penalty: { type: 'reputation', value: -30 }
  },
  {
    id: 'mystery_enemy_in_1',
    faction: 'mystery',
    title: 'Эксперимент',
    description: 'Впустить врага в бункер',
    type: 'let_enemy_in',
    grade: 'rare',
    rarity: 2,
    target: 1,
    reward: { type: 'experience', value: 250 },
    penalty: { type: 'none', value: 0 }
  },

  // Epic
  {
    id: 'mystery_transformation_1',
    faction: 'mystery',
    title: 'Трансформация',
    description: 'Преобразовать 3 жителей в мутантов',
    type: 'insanity',
    grade: 'epic',
    rarity: 1,
    target: 3,
    reward: { type: 'reputation', value: 200 },
    penalty: { type: 'reputation', value: -100 }
  },

  // Legendary
  {
    id: 'mystery_apocalypse_1',
    faction: 'mystery',
    title: 'Истинный апокалипсис',
    description: 'Уничтожить все живое',
    type: 'kill_enemy',
    grade: 'legendary',
    rarity: 0.005,
    target: 100,
    reward: { type: 'experience', value: 5000 },
    penalty: { type: 'none', value: 0 }
  }
];

// Генерация дополнительных заданий для достижения 100 на фракцию
function generateAdditionalQuests(): Quest[] {
  const additionalQuests: Quest[] = [];

  // HQ дополнительные задания
  for (let i = 2; i <= 100; i++) {
    const baseQuest = HQ_QUESTS[Math.floor(Math.random() * HQ_QUESTS.length)];
    additionalQuests.push({
      ...baseQuest,
      id: `${baseQuest.id}_${i}`,
      target: Math.floor(baseQuest.target * (0.8 + Math.random() * 0.4)), // 80-120% от базовой цели
      reward: {
        ...baseQuest.reward,
        value: typeof baseQuest.reward.value === 'number'
          ? Math.floor(baseQuest.reward.value * (0.9 + Math.random() * 0.2))
          : baseQuest.reward.value
      }
    });
  }

  // Аналогично для других фракций...
  [REBELS_QUESTS, MARAUDERS_QUESTS, FREE_QUESTS, MYSTERY_QUESTS].forEach((factionQuests, factionIndex) => {
    const factions: FactionId[] = ['rebels', 'marauders', 'free', 'mystery'];
    const faction = factions[factionIndex];

    for (let i = factionQuests.length + 1; i <= 100; i++) {
      const baseQuest = factionQuests[Math.floor(Math.random() * factionQuests.length)];
      additionalQuests.push({
        ...baseQuest,
        id: `${baseQuest.id}_${i}`,
        faction: faction,
        target: Math.floor(baseQuest.target * (0.8 + Math.random() * 0.4)),
        reward: {
          ...baseQuest.reward,
          value: typeof baseQuest.reward.value === 'number'
            ? Math.floor(baseQuest.reward.value * (0.9 + Math.random() * 0.2))
            : baseQuest.reward.value
        }
      });
    }
  });

  return additionalQuests;
}

/**
 * Полная база заданий
 */
export const QUEST_DATABASE: Quest[] = [
  ...HQ_QUESTS,
  ...REBELS_QUESTS,
  ...MARAUDERS_QUESTS,
  ...FREE_QUESTS,
  ...MYSTERY_QUESTS,
  ...generateAdditionalQuests()
];

/**
 * Класс для управления заданиями
 */
export class QuestManager {
  private static instance: QuestManager;
  private gameSeed: number;

  private constructor(seed: number = Date.now()) {
    this.gameSeed = seed;
  }

  public static getInstance(seed?: number): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager(seed);
    }
    return QuestManager.instance;
  }

  /**
   * Получить случайное задание для фракции
   */
  public getRandomQuest(factionId: FactionId, grade?: QuestGrade): Quest {
    const factionQuests = QUEST_DATABASE.filter(q => q.faction === factionId);

    let filteredQuests = factionQuests;
    if (grade) {
      filteredQuests = factionQuests.filter(q => q.grade === grade);
    }

    if (filteredQuests.length === 0) {
      // Fallback to any quest from the faction
      filteredQuests = factionQuests;
    }

    const randomIndex = this.seededRandom(0, filteredQuests.length - 1);
    return filteredQuests[randomIndex];
  }

  /**
   * Получить задание по ID
   */
  public getQuestById(questId: string): Quest | undefined {
    return QUEST_DATABASE.find(q => q.id === questId);
  }

  /**
   * Получить задания по фракции
   */
  public getQuestsByFaction(factionId: FactionId): Quest[] {
    return QUEST_DATABASE.filter(q => q.faction === factionId);
  }

  /**
   * Получить задания по грейду
   */
  public getQuestsByGrade(grade: QuestGrade): Quest[] {
    return QUEST_DATABASE.filter(q => q.grade === grade);
  }

  /**
   * Получить задания по типу
   */
  public getQuestsByType(type: QuestType): Quest[] {
    return QUEST_DATABASE.filter(q => q.type === type);
  }

  /**
   * Генератор псевдослучайных чисел
   */
  private seededRandom(min: number, max: number): number {
    const x = Math.sin(this.gameSeed++) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  }

  /**
   * Сбросить менеджер
   */
  public reset(seed?: number): void {
    if (seed) {
      this.gameSeed = seed;
    }
  }
}

/**
 * Утилиты для работы с заданиями
 */
export const QuestUtils = {
  /**
   * Получить цвет для грейда задания
   */
  getGradeColor(grade: QuestGrade): string {
    const colors = {
      common: '#8B8B8B',     // Серый
      uncommon: '#4CAF50',   // Зеленый
      rare: '#2196F3',       // Синий
      epic: '#9C27B0',       // Фиолетовый
      legendary: '#FF9800'   // Оранжевый
    };
    return colors[grade];
  },

  /**
   * Получить текстовое описание грейда
   */
  getGradeLabel(grade: QuestGrade): string {
    const labels = {
      common: 'Обычное',
      uncommon: 'Необычное',
      rare: 'Редкое',
      epic: 'Эпическое',
      legendary: 'Легендарное'
    };
    return labels[grade];
  },

  /**
   * Получить текстовое описание типа задания
   */
  getTypeLabel(type: QuestType): string {
    const labels = {
      recruit: 'Прием жителей',
      exile: 'Изгнание жителей',
      kill_enemy: 'Убийство врагов',
      get_item: 'Получение предмета',
      collect_resource: 'Сбор ресурсов',
      build_room: 'Строительство',
      destroy_room: 'Разрушение',
      sacrifice: 'Жертвоприношение',
      insanity: 'Безумие',
      produce_resource: 'Производство',
      trade: 'Торговля',
      refuse_profession: 'Отказ профессии',
      refuse_gender: 'Отказ по полу',
      refuse_skill: 'Отказ по навыку',
      accept_profession: 'Прием профессии',
      accept_gender: 'Прием по полу',
      accept_skill: 'Прием по навыку',
      find_sidequest: 'Побочный предмет',
      attack_bunker: 'Нападение',
      let_enemy_in: 'Впуск врага'
    };
    return labels[type] || type;
  },

  /**
   * Получить шанс генерации для грейда
   */
  getGradeRarityWeight(grade: QuestGrade): number {
    const weights = {
      common: 40,      // 40%
      uncommon: 30,    // 30%
      rare: 20,        // 20%
      epic: 8,         // 8%
      legendary: 2     // 2%
    };
    return weights[grade];
  }
};
