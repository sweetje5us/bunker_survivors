/**
 * Справочник информационных сообщений фракций для Bunker Survivors
 * Содержит полезную и бесполезную информацию от разных фракций
 */

import { FactionId, FactionMessage, MessageType } from './factions';

/**
 * Категории сообщений для каждой фракции
 */
export const MESSAGE_CATEGORIES = {
  hq: [
    'announcements',      // Официальные объявления
    'orders',            // Приказы и распоряжения
    'reports',           // Доклады о ситуации
    'propaganda',        // Пропаганда дисциплины
    'surveillance',      // Сообщения о контроле
    'punishments'        // Информация о наказаниях
  ],
  rebels: [
    'coordinates',       // Координаты и места встреч
    'attacks',           // Планы нападений
    'ideology',          // Идеологические сообщения
    'recruitment',       // Призывы к присоединению
    'intelligence',      // Разведданные
    'prayers'            // Религиозные обращения
  ],
  free: [
    'news',              // Новости и информация
    'advertisements',    // Реклама и спам
    'freedom_calls',     // Призывы к свободе
    'diplomacy',         // Дипломатические предложения
    'anecdotes',         // Анекдоты и развлечения
    'advice'             // Советы по выживанию
  ],
  mystery: [
    'signals',           // Таинственные сигналы
    'thoughts',          // Мысли существ
    'warnings',          // Предупреждения
    'prophecies',        // Пророчества
    'visions',           // Видения
    'mutations'          // Информация о мутациях
  ],
  marauders: [
    'trade_offers',      // Предложения торговли
    'boasts',            // Хвастовство
    'threats',           // Угрозы
    'raid_plans',        // Планы набегов
    'loot_reports',      // Отчеты о добыче
    'insults'            // Оскорбления
  ]
} as const;

/**
 * База информационных сообщений фракций
 * Порционная загрузка: сначала структура, затем сообщения по 50 для каждой фракции
 */

// Сообщения для Штаба (HQ) - первая порция из 50 сообщений
const HQ_MESSAGES: FactionMessage[] = [
  // Официальные объявления (announcements) - 10 сообщений
  {
    id: 'hq_ann_001',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Внимание! Все граждане обязаны соблюдать комендантский час с 22:00 до 06:00. Нарушители будут наказаны.',
    importance: 'high',
    frequency: 'common',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_ann_002',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Объявляется набор добровольцев в патрульные отряды. Служба - это честь и долг каждого гражданина.',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_ann_003',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Распределение пайков будет производиться строго по спискам. Очереди и беспорядок недопустимы.',
    importance: 'high',
    frequency: 'common'
  },
  {
    id: 'hq_ann_004',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Все граждане в возрасте от 16 до 60 лет обязаны пройти медицинское обследование в указанные сроки.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'hq_ann_005',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Введен режим экономии электроэнергии. Использование приборов ограничено до минимума.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_ann_006',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Обнаружены случаи саботажа в секторе B-7. Все подозрительные лица будут допрошены.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'hq_ann_007',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Завершено строительство нового укрепления. Оборона бункера усилена.',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 2 }
  },
  {
    id: 'hq_ann_008',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Все граждане обязаны сдать имеющееся оружие для централизованного хранения.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_ann_009',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Установлен новый график смен работы. Нарушение графика приравнивается к саботажу.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'hq_ann_010',
    factionId: 'hq',
    type: 'useful',
    category: 'announcements',
    text: 'Граждане! Помните: дисциплина - это основа нашего выживания. Дисциплина - это победа.',
    importance: 'low',
    frequency: 'frequent'
  },

  // Приказы и распоряжения (orders) - 10 сообщений
  {
    id: 'hq_ord_001',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Приказ № 47: Все граждане обязаны явиться на перекличку в 14:00. Опоздавшие будут наказаны.',
    importance: 'high',
    frequency: 'common',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_ord_002',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Распоряжение: Немедленно прекратить все несанкционированные собрания. Любые групповые обсуждения запрещены.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_ord_003',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Приказ: Увеличить норму производства на 15%. Выполнение обязательно для всех.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'hq_ord_004',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Распоряжение: Все граждане в возрасте до 18 лет переводятся на усиленное питание.',
    importance: 'low',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_ord_005',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Приказ № 89: Запрещено хранение личных вещей сверх установленной нормы.',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_ord_006',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Распоряжение: Все больные и ослабленные граждане должны быть изолированы для карантина.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_ord_007',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Приказ: Усилить охрану всех стратегически важных объектов.',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'hq_ord_008',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Распоряжение: Все граждане обязаны пройти переподготовку по гражданской обороне.',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'hq_ord_009',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Приказ: Запрещено использование любых устройств связи кроме официальных каналов.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_ord_010',
    factionId: 'hq',
    type: 'useful',
    category: 'orders',
    text: 'Распоряжение: Все ресурсы должны быть сданы в общий фонд. Личные запасы запрещены.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },

  // Доклады о ситуации (reports) - 10 сообщений
  {
    id: 'hq_rep_001',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Доклад: Уровень запасов продовольствия - 67% от нормы. Необходима экономия.',
    importance: 'high',
    frequency: 'common'
  },
  {
    id: 'hq_rep_002',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Ситуационный доклад: Зафиксировано 3 случая инфекционных заболеваний в секторе C-12.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'hq_rep_003',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Отчет: Производительность труда выросла на 12% благодаря новой системе мотивации.',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_rep_004',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Доклад: Обнаружены следы вражеской активности в квадрате 7-9. Усилена охрана.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_rep_005',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Ситуация стабильна. Все системы функционируют в штатном режиме.',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'hq_rep_006',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Доклад: Потери среди гражданского населения составили 15 человек за неделю.',
    importance: 'high',
    frequency: 'common',
    effects: { moraleChange: -4 }
  },
  {
    id: 'hq_rep_007',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Отчет: Ремонтные работы в секторе D-3 завершены. Сектор возвращен в эксплуатацию.',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_rep_008',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Доклад: Уровень морали граждан находится на приемлемом уровне.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'hq_rep_009',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Ситуационный отчет: Фиксируются перебои в системе вентиляции. Приняты меры по устранению.',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'hq_rep_010',
    factionId: 'hq',
    type: 'useful',
    category: 'reports',
    text: 'Доклад: Разведка донесла о приближении группы мутантов. Готовность №1.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3, enemyWarning: 'Группа мутантов приближается' }
  },

  // Пропаганда дисциплины (propaganda) - 10 сообщений
  {
    id: 'hq_prp_001',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Дисциплина - это оружие победы! Только через порядок мы сможем выжить!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_prp_002',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Помните: каждый гражданин - это винтик в великой машине выживания!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'hq_prp_003',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Слабость - это преступление! Только сильные достойны выжить!',
    importance: 'low',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_prp_004',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Единство - наша сила! Разделение - путь к гибели!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_prp_005',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Штаб знает лучше! Доверие командованию - основа безопасности!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'hq_prp_006',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Работа - это честь! Лентяи и саботажники будут наказаны!',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_prp_007',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Контроль - это забота! Мы заботимся о каждом гражданине!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'hq_prp_008',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Порядок превыше всего! Хаос - это смерть!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 1 }
  },
  {
    id: 'hq_prp_009',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Дисциплина спасает жизни! Послушание - это мудрость!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'hq_prp_010',
    factionId: 'hq',
    type: 'propaganda',
    category: 'propaganda',
    text: 'Штаб - это разум! Индивидуализм - это безумие!',
    importance: 'medium',
    frequency: 'common'
  },

  // Сообщения о контроле (surveillance) - 10 сообщений
  {
    id: 'hq_srv_001',
    factionId: 'hq',
    type: 'warning',
    category: 'surveillance',
    text: 'Внимание: Зафиксирована подозрительная активность в секторе A-3. Все граждане обязаны оставаться на местах.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_srv_002',
    factionId: 'hq',
    type: 'useful',
    category: 'surveillance',
    text: 'Камеры наблюдения зафиксировали нарушение дисциплины в коридоре 7-B. Нарушитель будет найден и наказан.',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_srv_003',
    factionId: 'hq',
    type: 'warning',
    category: 'surveillance',
    text: 'Предупреждение: Обнаружены признаки саботажа в системе водоснабжения. Усилен контроль.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_srv_004',
    factionId: 'hq',
    type: 'useful',
    category: 'surveillance',
    text: 'Все разговоры записываются для обеспечения безопасности. Это в ваших интересах.',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'hq_srv_005',
    factionId: 'hq',
    type: 'warning',
    category: 'surveillance',
    text: 'Зафиксировано несанкционированное перемещение между секторами. Все проходы блокированы.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -1 }
  },
  {
    id: 'hq_srv_006',
    factionId: 'hq',
    type: 'useful',
    category: 'surveillance',
    text: 'Система мониторинга функционирует нормально. Безопасность гарантирована.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'hq_srv_007',
    factionId: 'hq',
    type: 'warning',
    category: 'surveillance',
    text: 'Обнаружен подозрительный предмет в секторе E-5. Эвакуация приостановлена до проверки.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'hq_srv_008',
    factionId: 'hq',
    type: 'useful',
    category: 'surveillance',
    text: 'Все двери и шлюзы находятся под постоянным контролем. Попытки несанкционированного доступа пресекаются.',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'hq_srv_009',
    factionId: 'hq',
    type: 'warning',
    category: 'surveillance',
    text: 'Зафиксировано повышение уровня радиации в секторе F-2. Ограничен доступ.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'hq_srv_010',
    factionId: 'hq',
    type: 'useful',
    category: 'surveillance',
    text: 'Мы видим все. Мы слышим все. Мы защищаем всех.',
    importance: 'low',
    frequency: 'frequent'
  }
];

// Сообщения для Повстанцев (Rebels) - вторая порция из 50 сообщений
const REBELS_MESSAGES: FactionMessage[] = [
  // Координаты и места встреч (coordinates) - 8 сообщений
  {
    id: 'rebels_coord_001',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Встречаемся в квадрате 7-9 у старого склада. Приходите с оружием. Пароль: "Свобода или смерть".',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_coord_002',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Новый пункт сбора: развалины завода в квадрате 12-15. Приносите припасы и боеприпасы.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_coord_003',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Экстренная эвакуация в точку 8-12. Штаб начал крупную операцию. Все группы уходят на запасные позиции.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2, enemyWarning: 'Штаб начал крупную операцию' }
  },
  {
    id: 'rebels_coord_004',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Координаты безопасного пути: 5-7 через старый туннель. Избегайте патрулей.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'rebels_coord_005',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Новый лагерь в квадрате 14-8. У нас есть еда и медикаменты. Добро пожаловать братья по борьбе.',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_coord_006',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Точка сбора для рейда: перекресток 9-11. Собираемся в полночь. Цель - склад боеприпасов.',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Рейд на склад боеприпасов' }
  },
  {
    id: 'rebels_coord_007',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Аварийный маяк активирован в квадрате 6-13. Если вы в беде - двигайтесь туда.',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'rebels_coord_008',
    factionId: 'rebels',
    type: 'useful',
    category: 'coordinates',
    text: 'Тайная тропа в квадрате 11-6. Используйте ее для обхода патрулей Штаба.',
    importance: 'low',
    frequency: 'common'
  },

  // Планы нападений (attacks) - 8 сообщений
  {
    id: 'rebels_att_001',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Операция "Молот" начата! Мы атакуем конвой Штаба в квадрате 8-10. Поддержите нас!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2, enemyWarning: 'Атака на конвой Штаба' }
  },
  {
    id: 'rebels_att_002',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'План диверсии: завтра взрываем мост в квадрате 7-12. Это нарушит снабжение Штаба.',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Диверсия на мосту' }
  },
  {
    id: 'rebels_att_003',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Готовим засаду на патруль. Они идут по маршруту 5-9. Все готовы к бою?',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_att_004',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Большая операция: штурм укрепления Штаба в квадрате 10-7. Нужны все силы!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2, enemyWarning: 'Штурм укрепления Штаба' }
  },
  {
    id: 'rebels_att_005',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Рейд на склад: завтра ночью берем продовольствие в квадрате 6-8. Голод - наше оружие!',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Рейд на склад продовольствия' }
  },
  {
    id: 'rebels_att_006',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Партизанская война: минируем дороги в секторах 8-11 и 9-12. Пусть Штаб ползет!',
    importance: 'medium',
    frequency: 'rare',
    effects: { enemyWarning: 'Минирование дорог' }
  },
  {
    id: 'rebels_att_007',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Снайперская охота: берем на прицел офицеров Штаба. Каждый выстрел приближает победу!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_att_008',
    factionId: 'rebels',
    type: 'warning',
    category: 'attacks',
    text: 'Операция "Призрак": проникаем в тыл врага через туннели. Цель - командный центр.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2, enemyWarning: 'Проникновение в тыл' }
  },

  // Идеологические сообщения (ideology) - 9 сообщений
  {
    id: 'rebels_ideo_001',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Штаб - это тюрьма для душ! Мы боремся не за выживание, а за настоящую свободу!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 2 }
  },
  {
    id: 'rebels_ideo_002',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Каждый день под гнетом Штаба - это предательство своих детей! Встаньте и сражайтесь!',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_ideo_003',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Свобода не дается даром! Мы платим кровью за право жить по-человечески!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_ideo_004',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Штаб обещает безопасность, но дает только цепи! Мы выбираем свободу и риск!',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_ideo_005',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Наша борьба - это священная война! Бог на стороне угнетенных!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_ideo_006',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Жизнь под Штабом - это медленная смерть! Лучше умереть стоя, чем жить на коленях!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 3 }
  },
  {
    id: 'rebels_ideo_007',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Мы не просто выживаем - мы строим новый мир! Мир без тиранов и цепей!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_ideo_008',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Штаб крадет у нас будущее! Мы вернем его силой нашего оружия!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_ideo_009',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'ideology',
    text: 'Каждый убитый солдат Штаба - это шаг к свободе! Каждый разрушенный пост - победа!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 2 }
  },

  // Призывы к присоединению (recruitment) - 8 сообщений
  {
    id: 'rebels_rec_001',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Братья и сестры! Присоединяйтесь к сопротивлению! У нас есть оружие и цель!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_rec_002',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Если вы устали от лжи Штаба - приходите к нам! Мы даем настоящую свободу!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_rec_003',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Нужны бойцы для отряда специального назначения. Опыт не требуется - нужна лишь ненависть к тирании!',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'rebels_rec_004',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Женщины и мужчины! Ваше место в рядах повстанцев! Не прячьтесь - сражайтесь!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'rebels_rec_005',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Ищут медиков и инженеров! Присоединяйтесь - ваша помощь спасет сотни жизней!',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'rebels_rec_006',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Молодежь! Не верьте пропаганде Штаба! Ваше будущее - в борьбе за свободу!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_rec_007',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Ветераны! Ваш опыт бесценен! Присоединяйтесь к командованию отрядами!',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'rebels_rec_008',
    factionId: 'rebels',
    type: 'useful',
    category: 'recruitment',
    text: 'Каждый новый боец - это удар по Штабу! Приходите и станьте легендой сопротивления!',
    importance: 'low',
    frequency: 'common'
  },

  // Разведданные (intelligence) - 9 сообщений
  {
    id: 'rebels_int_001',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Разведка сообщает: Штаб усилил охрану в квадратах 7-9 и 8-10. Избегайте этих районов.',
    importance: 'high',
    frequency: 'common',
    effects: { enemyWarning: 'Усиление охраны Штаба' }
  },
  {
    id: 'rebels_int_002',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Информация: Конвой с припасами движется по маршруту 6-11. Отличная цель для засады.',
    importance: 'high',
    frequency: 'rare',
    effects: { resourceHint: 'Конвой с припасами' }
  },
  {
    id: 'rebels_int_003',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Агент в Штабе сообщает: завтра смена караула в 02:00. Идеальное время для проникновения.',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'rebels_int_004',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Разведданные: Слабые места в обороне Штаба - северная стена и восточные ворота.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_int_005',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Сообщение от информатора: Штаб планирует операцию в квадрате 9-12 послезавтра.',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Операция Штаба' }
  },
  {
    id: 'rebels_int_006',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Карта патрулей Штаба: маршруты 1-3 и 2-4 проверены. Можно безопасно пройти между ними.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'rebels_int_007',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Агент сообщает: В квадрате 11-7 находится тайный склад боеприпасов Штаба.',
    importance: 'high',
    frequency: 'rare',
    effects: { resourceHint: 'Тайный склад боеприпасов' }
  },
  {
    id: 'rebels_int_008',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Наблюдение: Активность мутантов выросла в квадратах 13-15. Будьте осторожны.',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Повышенная активность мутантов' }
  },
  {
    id: 'rebels_int_009',
    factionId: 'rebels',
    type: 'useful',
    category: 'intelligence',
    text: 'Разведка: Штаб теряет контроль над окраинами. Это наш шанс расширить зоны влияния.',
    importance: 'low',
    frequency: 'rare'
  },

  // Религиозные обращения (prayers) - 8 сообщений
  {
    id: 'rebels_pray_001',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Братья! Да пребудет с нами сила истинной веры! Бог ведет нас к победе над тиранами!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_pray_002',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Молитва воина: "Господи, дай нам силу сокрушить цепи угнетения и обрести свободу!"',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_pray_003',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'В священной борьбе мы черпаем силу! Наша вера - наше оружие против безбожного Штаба!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_pray_004',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Святые мученики! Ваша кровь не пролилась даром! Мы продолжим вашу священную миссию!',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 2 }
  },
  {
    id: 'rebels_pray_005',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Да благословит нас Всевышний в этой справедливой войне! Правда на нашей стороне!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'rebels_pray_006',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'В час испытаний мы вспоминаем: "Блаженны гонимые за правду, ибо их есть Царство Небесное!"',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'rebels_pray_007',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Молитва перед боем: "Господи, укрепи наши сердца и направь наши руки на врагов свободы!"',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'rebels_pray_008',
    factionId: 'rebels',
    type: 'propaganda',
    category: 'prayers',
    text: 'Братья по вере! Пусть наша борьба станет священным примером для будущих поколений!',
    importance: 'low',
    frequency: 'frequent'
  }
];

// Сообщения для Свободных (Free) - третья порция из 50 сообщений
const FREE_MESSAGES: FactionMessage[] = [
  // Новости и информация (news) - 8 сообщений
  {
    id: 'free_news_001',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Новости: В квадрате 12-8 найден новый источник воды. Все фракции приглашаются для мирного сотрудничества.',
    importance: 'medium',
    frequency: 'common',
    effects: { resourceHint: 'Источник воды в квадрате 12-8' }
  },
  {
    id: 'free_news_002',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Обновление погоды: Завтра ожидается солнечная погода. Идеальное время для разведки и сбора ресурсов.',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_news_003',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Важно: Обнаружена новая группа выживших в квадрате 15-6. Они ищут союзников, не врагов.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_news_004',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Экономические новости: Цены на ресурсы стабилизировались. Открыт свободный рынок в квадрате 9-11.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'free_news_005',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Научное открытие: Найден способ очистки загрязненной воды с помощью простых фильтров.',
    importance: 'high',
    frequency: 'rare',
    effects: { resourceHint: 'Способ очистки воды' }
  },
  {
    id: 'free_news_006',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Спорт: Сегодня состоялись мирные соревнования по бегу. Участники из всех фракций показали отличные результаты.',
    importance: 'low',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_news_007',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Здравоохранение: Новая вакцина против инфекций готова к распределению. Свяжитесь с нами для получения.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2 }
  },
  {
    id: 'free_news_008',
    factionId: 'free',
    type: 'useful',
    category: 'news',
    text: 'Культура: Открыта библиотека свободного доступа в квадрате 7-14. Книги по выживанию и развлечениям.',
    importance: 'low',
    frequency: 'common'
  },

  // Реклама и спам (advertisements) - 8 сообщений
  {
    id: 'free_ad_001',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ! Купите наши замечательные фильтры для воды всего за 5 патронов! Лучшее качество!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ad_002',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'Хотите заработать? Присоединяйтесь к нашей торговой сети! Быстрые деньги гарантированы!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_ad_003',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'НОВИНКА! Солнечные панели нового поколения! Осветите свой бункер ярче солнца!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ad_004',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'Лотерея! Купите билет за 1 патрон - выиграйте 100! Джекпот ждет вас!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ad_005',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'Курс "Как стать богатым в постапокалипсисе"! Только у нас! Записывайтесь сейчас!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_ad_006',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'Антивирусная программа для ваших устройств! Защитите свой компьютер от киберзомби!',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'free_ad_007',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'СКИДКА 50%! Медицинские препараты! Лечите все болезни одним чудо-средством!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ad_008',
    factionId: 'free',
    type: 'useless',
    category: 'advertisements',
    text: 'Казино открыто 24/7! Играйте в рулетку, покер, блэкджек! Выигрывайте ресурсы!',
    importance: 'low',
    frequency: 'common'
  },

  // Призывы к свободе (freedom_calls) - 9 сообщений
  {
    id: 'free_free_001',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Свобода - это не хаос, а гармония! Выбирайте свой путь, стройте свою жизнь!',
    importance: 'low',
    frequency: 'frequent',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_free_002',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Никто не имеет права диктовать вам, как жить! Свобода выбора - основное право человека!',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_free_003',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Разорвите цепи тоталитаризма! Свобода ждет тех, кто готов за нее бороться!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'free_free_004',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Мир без границ! Торгуйте, общайтесь, сотрудничайте свободно!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_free_005',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Не верьте лозунгам о "порядке"! Истинная безопасность - в свободе и доверии!',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_free_006',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Свобода - это ответственность! Но лучше быть свободным и ответственным, чем рабом!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_free_007',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Мы строим новый мир - мир равных возможностей и свободного выбора!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_free_008',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Откажитесь от страха! Свобода дает силу, которую не остановить!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2 }
  },
  {
    id: 'free_free_009',
    factionId: 'free',
    type: 'propaganda',
    category: 'freedom_calls',
    text: 'Каждый человек - архитектор своей судьбы! Не позволяйте другим строить ее за вас!',
    importance: 'low',
    frequency: 'frequent'
  },

  // Дипломатические предложения (diplomacy) - 8 сообщений
  {
    id: 'free_dip_001',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Предложение мира: Мы готовы обсудить торговое соглашение со всеми фракциями. Встреча в нейтральной зоне.',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'free_dip_002',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Гуманитарная помощь: Мы предлагаем медицинскую помощь всем нуждающимся независимо от фракции.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 2 }
  },
  {
    id: 'free_dip_003',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Совместная экспедиция: Предлагаем объединить усилия для исследования квадрата 13-9.',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'free_dip_004',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Мирный договор: Мы подписали соглашение о ненападении со всеми нейтральными группами.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_dip_005',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Посреднические услуги: Готовы помочь в разрешении конфликтов между фракциями.',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'free_dip_006',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Культурный обмен: Приглашаем представителей всех фракций на фестиваль мира и искусства.',
    importance: 'low',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_dip_007',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Совместная оборона: Предлагаем создать союз для защиты от общих угроз.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_dip_008',
    factionId: 'free',
    type: 'useful',
    category: 'diplomacy',
    text: 'Торговый альянс: Открыты к сотрудничеству со всеми фракциями для взаимной выгоды.',
    importance: 'medium',
    frequency: 'common'
  },

  // Анекдоты и развлечения (anecdotes) - 9 сообщений
  {
    id: 'free_ane_001',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Анекдот дня: Почему мутант не пошел в бар? Потому что у него не было рук для стакана! 😄',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ane_002',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Шутка: Встречаются два выживших. Один говорит: "Я нашел консервную банку!" Другой: "И что в ней?" "Сплошная радиация!"',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ane_003',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Рассказ: Жил-был зомби, который решил похудеть. Стал бегать за людьми медленнее...',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_ane_004',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Загадка: Что общего между бункером и консервной банкой? И то, и другое открывается изнутри!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ane_005',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'История: Один выживший нашел радио. Включает - а там играет "Последний герой"! Кошмар какой-то...',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_ane_006',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Смешная новость: Мутант пошел в магазин. Продавец спрашивает: "Что вам?" Мутант: "Мозги!"',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ane_007',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Анекдот: Почему зомби не пользуется компьютером? Потому что у него нет Windows, только bites!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_ane_008',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Рассказ: Выживший нашел бутылку. Открывает - а там джинн! "Исполню три желания!" Выживший: "Хочу воды, еды и чтобы все это закончилось!"',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_ane_009',
    factionId: 'free',
    type: 'useless',
    category: 'anecdotes',
    text: 'Шутка дня: Встречаются два мародера. Один: "У меня есть план!" Другой: "Какой?" "План Б - бежать!"',
    importance: 'low',
    frequency: 'common'
  },

  // Советы по выживанию (advice) - 8 сообщений
  {
    id: 'free_adv_001',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Совет: Всегда имейте запасной план. В нашем мире ничего нельзя предсказать.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'free_adv_002',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Полезный совет: Собирайте не только еду, но и семена. Будущее - в выращивании собственной пищи.',
    importance: 'high',
    frequency: 'rare',
    effects: { resourceHint: 'Собирайте семена для выращивания' }
  },
  {
    id: 'free_adv_003',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Выживание: Помните о важности гигиены. Чистота - залог здоровья в замкнутом пространстве.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'free_adv_004',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Совет: Общайтесь с другими группами. Знания и ресурсы - ключ к успеху.',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'free_adv_005',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Важно: Регулярно проверяйте системы жизнеобеспечения. Профилактика лучше ремонта.',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'free_adv_006',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Психология выживания: Поддерживайте моральный дух команды. Надежда - наше главное оружие.',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: 1 }
  },
  {
    id: 'free_adv_007',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Экономия: Используйте солнечную энергию днем. Электричество - ценный ресурс.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'free_adv_008',
    factionId: 'free',
    type: 'useful',
    category: 'advice',
    text: 'Безопасность: Никогда не выходите в одиночку. Группа - гарантия возвращения.',
    importance: 'high',
    frequency: 'common'
  }
];

// Сообщения для Тайны (Mystery) - четвертая порция из 50 сообщений
const MYSTERY_MESSAGES: FactionMessage[] = [
  // Сигналы (signals) - 8 сообщений
  {
    id: 'mystery_sig_001',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: 'Шшшш... *статика* ...мы наблюдаем... *треск* ...ваши страхи становятся реальностью...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_sig_002',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: '*искаженный шепот* Они просыпаются... древние существа под землей... *вопль*',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4, enemyWarning: 'Древние существа просыпаются' }
  },
  {
    id: 'mystery_sig_003',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: 'Бип...бип...бип... *пауза* ...сигнал из другого измерения... *эхо* ...вы слышите нас?',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_sig_004',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: '*металлический скрежет* Мы - тени в вашем разуме... *шелест* ...мы всегда рядом...',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_sig_005',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: 'Ккккк... *помехи* ...запретное знание стучится в ваши двери... *вой*',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_sig_006',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: '*эфирное эхо* Забытые боги возвращаются... *гром* ...мир изменится...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_sig_007',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: 'Тсссс... *шепот ветра* ...секреты эволюции раскрываются... *шелест листьев*',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_sig_008',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'signals',
    text: '*космический шум* Звезды падают... *взрыв* ...реальность трескается...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4 }
  },

  // Мысли существ (thoughts) - 9 сообщений
  {
    id: 'mystery_tho_001',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: '*телепатический импульс* Голод... бесконечный голод... мы чувствуем вашу плоть...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_tho_002',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: 'Мы помним... огонь... боль... эволюция... *ментальный отклик*',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_tho_003',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: '*коллективное сознание* Вы - наше продолжение... мы - ваше будущее...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_tho_004',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: 'Боль... прекрасная боль... она ведет к совершенству... *экстаз мутации*',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_tho_005',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: '*первобытный инстинкт* Охотиться... убивать... эволюционировать...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_tho_006',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: 'Мы видим ваши сны... ваши кошмары становятся реальностью... *смешок*',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4 }
  },
  {
    id: 'mystery_tho_007',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: '*космическое понимание* Ваша форма... временная... мы поможем вам измениться...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_tho_008',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: 'Память предков... древние инстинкты... пробуждаются... *внутренний голос*',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_tho_009',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'thoughts',
    text: '*коллективный разум* Мы едины... вы станете нами... сопротивление бесполезно...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },

  // Предупреждения (warnings) - 8 сообщений
  {
    id: 'mystery_war_001',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: 'Осторожно... *шепот* ...луна в крови... мутации ускоряются... бегите...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3, enemyWarning: 'Ускорение мутаций' }
  },
  {
    id: 'mystery_war_002',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: '*зловещий шепот* Они идут... через тени... через сны... проснитесь!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4 }
  },
  {
    id: 'mystery_war_003',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: 'Заражение... *треск* ...воздух отравлен... маски... укрытия... немедленно!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2, enemyWarning: 'Воздух отравлен' }
  },
  {
    id: 'mystery_war_004',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: '*крик в темноте* Пробуждение... древний ужас... заприте двери...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4, enemyWarning: 'Древний ужас пробуждается' }
  },
  {
    id: 'mystery_war_005',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: 'Изменения... *стон* ...ваше тело предает вас... ищите противоядие...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_war_006',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: '*эхо из прошлого* Цикл повторяется... апокалипсис был... будет снова...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_war_007',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: 'Голоса... *шепот* ...в вашем разуме... они лгут... сопротивляйтесь...',
    importance: 'medium',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_war_008',
    factionId: 'mystery',
    type: 'warning',
    category: 'warnings',
    text: '*тени шевелятся* Они среди вас... предатели... чистка неизбежна...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },

  // Пророчества (prophecies) - 8 сообщений
  {
    id: 'mystery_pro_001',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: '*мистический голос* Когда луна станет красной, земля разверзнется... избранные выживут...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_002',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: 'Звезды предсказывают... *шелест* ...новый вид родится из пепла старого мира...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_003',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: '*древний шепот* Три знака придут: огонь, тьма, свет... выбирайте мудро...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_004',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: 'Пророчество гласит... *эхо* ...последний выживший станет первым из новых богов...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_005',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: '*космический шепот* Цикл завершается... хаос рождает порядок... порядок рождает хаос...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_006',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: 'Видения показывают... *видение* ...металл станет плотью, плоть станет металлом...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_007',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: '*пророческий голос* Семь печатей сломаются... семь ангелов падут... новый мир родится...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_pro_008',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'prophecies',
    text: 'Древнее предсказание... *шепот ветра* ...кровь станет водой, вода станет кровью...',
    importance: 'medium',
    frequency: 'rare'
  },

  // Видения (visions) - 9 сообщений
  {
    id: 'mystery_vis_001',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: '*психоделическое видение* Цвета... бесконечные цвета... реальность тает... формы меняются...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_vis_002',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: 'Вижу... *транс* ...города из плоти... реки из воспоминаний... небо из криков...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_vis_003',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: '*галлюцинация* Тени оживают... стены дышат... пол пульсирует... вы одиноки?',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_vis_004',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: 'Видение четвертого измерения... *искажение* ...время течет вспять... причины становятся следствиями...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_vis_005',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: '*экстатическое прозрение* Мы все связаны... паутина жизни... паутина смерти... один организм...',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'mystery_vis_006',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: 'Сон показывает... *кошмар* ...ваше отражение оживает... оно голодно... оно разумно...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_vis_007',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: '*мистическое озарение* Звезды поют... планеты танцуют... галактика дышит... мы - ее дети...',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'mystery_vis_008',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: 'Видение конца... *апокалипсис* ...огонь очищает... пепел рождает... цикл продолжается...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4 }
  },
  {
    id: 'mystery_vis_009',
    factionId: 'mystery',
    type: 'mysterious',
    category: 'visions',
    text: '*космическая медитация* Все формы иллюзорны... все сущее - энергия... мы - чистый свет...',
    importance: 'low',
    frequency: 'rare'
  },

  // Мутации (mutations) - 8 сообщений
  {
    id: 'mystery_mut_001',
    factionId: 'mystery',
    type: 'warning',
    category: 'mutations',
    text: '*биологический анализ* Ваши клетки эволюционируют... новые органы формируются... боль - это прогресс...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'mystery_mut_002',
    factionId: 'mystery',
    type: 'useful',
    category: 'mutations',
    text: 'Мутационная адаптация... *генетический код* ...радиация ускоряет эволюцию... некоторые выживают...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_mut_003',
    factionId: 'mystery',
    type: 'warning',
    category: 'mutations',
    text: '*вирусная трансформация* Кровь меняется... органы перестраиваются... разум расширяется...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_mut_004',
    factionId: 'mystery',
    type: 'useful',
    category: 'mutations',
    text: 'Эволюционная фаза... *ДНК спираль* ...новые способности проявляются... телепатия... регенерация...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_mut_005',
    factionId: 'mystery',
    type: 'warning',
    category: 'mutations',
    text: '*биохимический процесс* Кожа твердеет... мышцы растут... агрессия усиливается...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'mystery_mut_006',
    factionId: 'mystery',
    type: 'useful',
    category: 'mutations',
    text: 'Генетическая эволюция... *нейронные связи* ...интеллект повышается... инстинкты обостряются...',
    importance: 'medium',
    frequency: 'rare'
  },
  {
    id: 'mystery_mut_007',
    factionId: 'mystery',
    type: 'warning',
    category: 'mutations',
    text: '*клеточная трансформация* Органы сливаются... новые формы жизни рождаются... контроль теряется...',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -4 }
  },
  {
    id: 'mystery_mut_008',
    factionId: 'mystery',
    type: 'useful',
    category: 'mutations',
    text: 'Адаптационная мутация... *выживаемость* ...устойчивость к ядам... ночное зрение... быстрая регенерация...',
    importance: 'medium',
    frequency: 'rare'
  }
];

// Сообщения для Мародеров (Marauders) - пятая и последняя порция из 50 сообщений
const MARAUDERS_MESSAGES: FactionMessage[] = [
  // Предложения торговли (trade_offers) - 8 сообщений
  {
    id: 'marauders_trade_001',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Эй, слабаки! У меня есть отличные патроны за еду. 200 штук за 50 порций. Скидка для тех, кто быстро решит!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'marauders_trade_002',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Продаю оружие! Автомат за 300 патронов. Или меняю на вашего самого жирного жителя. Выбор за вами!',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'marauders_trade_003',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Нужны медикаменты? У меня есть антибиотики. 10 упаковок за оружие. Деньги не принимаем - только стволы!',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'marauders_trade_004',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Меняю бензин на воду. Литр за литр. Или двойная цена за ваши секреты о слабых местах бункера.',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_trade_005',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Специальная акция! Генератор за 500 патронов. Или меняю на вашу рацию - хочу послушать, что болтает Штаб.',
    importance: 'high',
    frequency: 'rare'
  },
  {
    id: 'marauders_trade_006',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'У меня куча консервов. 20 банок за инструменты. Или могу просто забрать их силой. Выбирайте.',
    importance: 'medium',
    frequency: 'common'
  },
  {
    id: 'marauders_trade_007',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Продаю информацию о патрулях Штаба. 50 патронов за точные координаты. Дешево как для ваших жизней!',
    importance: 'high',
    frequency: 'rare',
    effects: { resourceHint: 'Информация о патрулях Штаба' }
  },
  {
    id: 'marauders_trade_008',
    factionId: 'marauders',
    type: 'useful',
    category: 'trade_offers',
    text: 'Нужны запчасти? У меня есть все для ремонта. Цена: ваши старые батарейки. Или я сам их заберу.',
    importance: 'low',
    frequency: 'common'
  },

  // Хвастовство (boasts) - 9 сообщений
  {
    id: 'marauders_boast_001',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Ха! Мы только что ограбили караван Штаба! 500 патронов и куча еды! Кто следующий на очереди?',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_boast_002',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Видели бы вы рожи тех солдатиков, когда мы их окружили! Бегали как крысы! Мы - короли пустоши!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_boast_003',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Вчера взяли бункер повстанцев. Теперь у нас их оружие и их женщины! Мы непобедимы!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_boast_004',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Мой автомат сегодня убил 15 зомби! Личный рекорд! Кто хочет поспорить на мою новую коллекцию скальпов?',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_boast_005',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Мы самые богатые в пустоши! У нас золото, оружие, рабы! А у вас? Только ваши жалкие пайки!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_boast_006',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Взял сегодня новый грузовик! Теперь мы можем грабить быстрее и дальше! Завидно, крысы бункерные?',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'marauders_boast_007',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Мои ребята - лучшие бойцы! Один на одного берут трех ваших солдатиков! Хотите доказательств?',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_boast_008',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'У нас теперь своя крепость! Стены из бронированных машин, рвы с шипами! Приходите в гости!',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'marauders_boast_009',
    factionId: 'marauders',
    type: 'useless',
    category: 'boasts',
    text: 'Сегодня мы захватили целую деревню! Теперь у нас свои фермы и рабы! Мы богаты и сильны!',
    importance: 'low',
    frequency: 'common'
  },

  // Угрозы (threats) - 8 сообщений
  {
    id: 'marauders_threat_001',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Слушайте внимательно, крысы! Следующий караван, который увидим - наш! Не вздумайте сопротивляться!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2, enemyWarning: 'Угроза караванам' }
  },
  {
    id: 'marauders_threat_002',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Ваш бункер следующий в списке! Лучше сами отдайте припасы, чем мы их заберем силой!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3, enemyWarning: 'Угроза бункеру' }
  },
  {
    id: 'marauders_threat_003',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Не платите дань вовремя - и ваши жители станут нашими рабами! Выбор за вами, но он простой.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'marauders_threat_004',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Еще одна попытка вызвать подкрепление - и мы устроим вам настоящий ад! Лучше не злите нас.',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -2 }
  },
  {
    id: 'marauders_threat_005',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Ваши патрули слишком далеко заходят! Еще раз увидим - и они не вернутся! Понятно?',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: -1 }
  },
  {
    id: 'marauders_threat_006',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Не пытайтесь нас обмануть! Мы знаем, где ваши тайники! Лучше поделитесь сами.',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: -1 }
  },
  {
    id: 'marauders_threat_007',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Союз с Штабом вам не поможет! Мы доберемся до вас через любые стены! Запомните это!',
    importance: 'high',
    frequency: 'rare',
    effects: { moraleChange: -3 }
  },
  {
    id: 'marauders_threat_008',
    factionId: 'marauders',
    type: 'warning',
    category: 'threats',
    text: 'Ваши соседи уже платят нам дань! Следующие вы! Не заставляйте нас приходить лично.',
    importance: 'medium',
    frequency: 'common',
    effects: { moraleChange: -2 }
  },

  // Планы набегов (raid_plans) - 8 сообщений
  {
    id: 'marauders_raid_001',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Завтра утром берем деревню в квадрате 9-12. Там полно еды и оружия. Не мешайте нам!',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Набег на деревню 9-12' }
  },
  {
    id: 'marauders_raid_002',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Готовим большой рейд на склады Штаба. Через неделю там будет пусто. Убирайтесь с дороги!',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Большой рейд на склады Штаба' }
  },
  {
    id: 'marauders_raid_003',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Сегодня ночью грабим караван повстанцев. Их оружие станет нашим. Не лезьте!',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Грабеж каравана повстанцев' }
  },
  {
    id: 'marauders_raid_004',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Планируем захват фермы в квадрате 6-8. Там урожай и техника. Всем держаться подальше!',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Захват фермы 6-8' }
  },
  {
    id: 'marauders_raid_005',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Большая охота на мутантов! Убиваем всех и забираем их территорию. Не вмешивайтесь!',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Охота на мутантов' }
  },
  {
    id: 'marauders_raid_006',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Завтра штурмуем укрепление в квадрате 11-7. Их припасы будут нашими. Уходите оттуда!',
    importance: 'high',
    frequency: 'rare',
    effects: { enemyWarning: 'Штурм укрепления 11-7' }
  },
  {
    id: 'marauders_raid_007',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Рейд на руины города. Там полно техники и оружия. Не пытайтесь нас опередить!',
    importance: 'medium',
    frequency: 'common',
    effects: { enemyWarning: 'Рейд на руины города' }
  },
  {
    id: 'marauders_raid_008',
    factionId: 'marauders',
    type: 'warning',
    category: 'raid_plans',
    text: 'Ограбление банка данных в квадрате 8-9. Их информация стоит дорого. Не лезьте в наши дела!',
    importance: 'medium',
    frequency: 'rare',
    effects: { enemyWarning: 'Ограбление банка данных 8-9' }
  },

  // Отчеты о добыче (loot_reports) - 9 сообщений
  {
    id: 'marauders_loot_001',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Отличный улов сегодня! 300 патронов, 50 банок консервов и новый грузовик! Богатство растет!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_loot_002',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Взяли сегодня целую ферму! 200 мешков зерна, трактор и 5 рабов! Теперь мы едим как короли!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_loot_003',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Ограбили караван: золото, оружие, медикаменты! Ценность добычи - 2000 патронов! Мы богаты!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_loot_004',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Захватили склад боеприпасов! Теперь у нас ракеты, мины и пулеметы! Никто нас не остановит!',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'marauders_loot_005',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Сегодня взяли банк! 5000 патронов в золоте и куча документов! Теперь мы финансируем армию!',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'marauders_loot_006',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Рейд удался! 100 бутылок алкоголя, сигареты и женщины! Жизнь удалась!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_loot_007',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Взяли лабораторию! Химикаты, оборудование и секретные данные! Теперь мы можем делать свое оружие!',
    importance: 'low',
    frequency: 'rare'
  },
  {
    id: 'marauders_loot_008',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Ограбили деревню: еда, одежда, инструменты! Теперь у нас своя инфраструктура!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_loot_009',
    factionId: 'marauders',
    type: 'useless',
    category: 'loot_reports',
    text: 'Захватили конвой: оружие, топливо, документы! Теперь мы контролируем торговлю в этом районе!',
    importance: 'low',
    frequency: 'frequent'
  },

  // Оскорбления (insults) - 8 сообщений
  {
    id: 'marauders_insult_001',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Эй, трусливые крысы из бункера! Вы даже не стоите нашего времени! Сидите и дрожите!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_insult_002',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Штаб - это сборище слабаков! Их солдатики разбегаются при виде наших теней!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_insult_003',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Повстанцы - жалкие идеалисты! Их "революция" кончится, когда мы их перестреляем!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_insult_004',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Свободные - это просто нищие попрошайки! У них даже оружия нормального нет!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_insult_005',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Тайна? Это просто трусливые уроды, которые боятся показаться днем! Жалкие мутанты!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_insult_006',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Ваши стены вас не спасут! Мы пробьем их как консервную банку! И съедим вас на ужин!',
    importance: 'low',
    frequency: 'frequent'
  },
  {
    id: 'marauders_insult_007',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Вы все слабаки и трусы! Даже зомби сильнее вас! Приходите, докажите обратное!',
    importance: 'low',
    frequency: 'common'
  },
  {
    id: 'marauders_insult_008',
    factionId: 'marauders',
    type: 'useless',
    category: 'insults',
    text: 'Ваши предки, наверное, были трусами! От них вы унаследовали только слабость и глупость!',
    importance: 'low',
    frequency: 'frequent'
  }
];

export const FACTION_MESSAGES: Record<FactionId, FactionMessage[]> = {
  hq: HQ_MESSAGES,
  rebels: REBELS_MESSAGES,
  free: FREE_MESSAGES,
  mystery: MYSTERY_MESSAGES,
  marauders: MARAUDERS_MESSAGES
};

/**
 * Функция для получения случайного сообщения от фракции
 */
export function getRandomFactionMessage(factionId: FactionId, type?: MessageType): FactionMessage | null {
  const messages = FACTION_MESSAGES[factionId];

  if (!messages || messages.length === 0) {
    return null;
  }

  let filteredMessages = messages;
  if (type) {
    filteredMessages = messages.filter(msg => msg.type === type);
  }

  if (filteredMessages.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * filteredMessages.length);
  return filteredMessages[randomIndex];
}

/**
 * Функция для получения сообщений по категории
 */
export function getFactionMessagesByCategory(factionId: FactionId, category: string): FactionMessage[] {
  const messages = FACTION_MESSAGES[factionId];
  return messages ? messages.filter(msg => msg.category === category) : [];
}

/**
 * Функция для получения сообщений по типу
 */
export function getFactionMessagesByType(factionId: FactionId, type: MessageType): FactionMessage[] {
  const messages = FACTION_MESSAGES[factionId];
  return messages ? messages.filter(msg => msg.type === type) : [];
}

/**
 * Статистика сообщений по фракциям
 */
export function getFactionMessageStats() {
  const stats: Record<FactionId, {
    total: number;
    byType: Record<MessageType, number>;
    byCategory: Record<string, number>;
  }> = {
    hq: { total: 0, byType: {} as Record<MessageType, number>, byCategory: {} },
    rebels: { total: 0, byType: {} as Record<MessageType, number>, byCategory: {} },
    free: { total: 0, byType: {} as Record<MessageType, number>, byCategory: {} },
    mystery: { total: 0, byType: {} as Record<MessageType, number>, byCategory: {} },
    marauders: { total: 0, byType: {} as Record<MessageType, number>, byCategory: {} }
  };

  Object.entries(FACTION_MESSAGES).forEach(([factionId, messages]) => {
    const fid = factionId as FactionId;
    stats[fid].total = messages.length;

    messages.forEach(msg => {
      // Подсчет по типам
      stats[fid].byType[msg.type] = (stats[fid].byType[msg.type] || 0) + 1;

      // Подсчет по категориям
      stats[fid].byCategory[msg.category] = (stats[fid].byCategory[msg.category] || 0) + 1;
    });
  });

  return stats;
}
