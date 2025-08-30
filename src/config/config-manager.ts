import type { GameConfig, Difficulty, EnemyType, WeaponType, ResourceType, SkillEffectsConfig } from './game-config.types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: GameConfig | null = null;
  private currentDifficulty: Difficulty = 'normal';

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
      console.log('[ConfigManager] 🆕 Создан новый экземпляр ConfigManager');
    }
    return ConfigManager.instance;
  }

  /**
   * Загружает конфигурацию из JSON файла
   */
  public async loadConfig(): Promise<void> {
    try {
      console.log('[ConfigManager] 🔄 Начинаем загрузку конфигурации из JSON файла...');
      
      // Пытаемся загрузить из JSON файла для балансировки
      const response = await fetch('/src/config/game-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      
      this.config = await response.json();
      console.log('[ConfigManager] ✅ Конфигурация загружена из JSON файла для балансировки');
      console.log('[ConfigManager] 📝 Теперь вы можете редактировать game-config.json для изменения баланса');
      console.log(`[ConfigManager] 📊 Загружено разделов: ${Object.keys(this.config!).length}`);
      console.log(`[ConfigManager] 📊 Доступные сложности: ${Object.keys(this.config!.difficulty).join(', ')}`);
      
      // Проверяем конкретные значения для отладки
      if (this.config!.initialResources?.easy?.moral !== undefined) {
        console.log(`[ConfigManager] 🎯 Мораль для easy сложности: ${this.config!.initialResources.easy.moral}%`);
      }
      
    } catch (error) {
      console.error('[ConfigManager] ❌ Ошибка загрузки JSON, используем дефолтные значения:', error);
      console.log('[ConfigManager] 🔄 Загружаем fallback конфигурацию...');
      // Загружаем дефолтную конфигурацию только как fallback
      this.loadDefaultConfig();
    }
  }

  /**
   * Загружает дефолтную конфигурацию как fallback при ошибке загрузки JSON
   * ВАЖНО: Для балансировки игры используйте game-config.json файл!
   */
  private loadDefaultConfig(): void {
    this.config = {
      difficulty: {
        easy: { name: 'Легкий', description: 'Для новичков' },
        normal: { name: 'Обычный', description: 'Стандартная сложность' },
        hard: { name: 'Сложный', description: 'Для ветеранов' },
        nightmare: { name: 'Кошмар', description: 'Экстремальная сложность' }
      },
      experience: {
        baseLevelExperience: 100,
        enemyKillRewards: { 'МАРОДЕР': 1, 'ЗОМБИ': 3, 'МУТАНТ': 6, 'СОЛДАТ': 10 },
        dailyReward: 25,
        abilityPointsPerLevel: 3
      },
      resourceConsumption: {
        food: {
          easy: { intervalHours: 2, baseConsumption: 1, multiplier: 0.8 },
          normal: { intervalHours: 1, baseConsumption: 1, multiplier: 1.0 },
          hard: { intervalHours: 1, baseConsumption: 1, multiplier: 1.2 },
          nightmare: { intervalHours: 1, baseConsumption: 1, multiplier: 1.5 }
        },
        water: {
          easy: { intervalHours: 2, baseConsumption: 1, multiplier: 0.8 },
          normal: { intervalHours: 1, baseConsumption: 1, multiplier: 1.0 },
          hard: { intervalHours: 1, baseConsumption: 1, multiplier: 1.2 },
          nightmare: { intervalHours: 1, baseConsumption: 1, multiplier: 1.5 }
        }
      },
      initialResources: {
        easy: {
          happiness: 100, defense: 100, ammo: 200, comfort: 100, moral: 100,
          food: 150, water: 150, money: 500, wood: 100, metal: 100,
          coal: 100, nails: 100, paper: 100, glass: 100
        },
        normal: {
          happiness: 50, defense: 50, ammo: 100, comfort: 100, moral: 50,
          food: 100, water: 100, money: 200, wood: 50, metal: 25,
          coal: 10, nails: 20, paper: 15, glass: 5
        },
        hard: {
          happiness: 25, defense: 25, ammo: 50, comfort: 50, moral: 25,
          food: 50, water: 50, money: 100, wood: 25, metal: 12,
          coal: 5, nails: 10, paper: 8, glass: 3
        },
        nightmare: {
          happiness: 10, defense: 10, ammo: 25, comfort: 25, moral: 10,
          food: 25, water: 25, money: 50, wood: 12, metal: 6,
          coal: 2, nails: 5, paper: 4, glass: 1
        }
      },
      enemyDamage: {
        baseDamage: { 'МАРОДЕР': 1, 'ЗОМБИ': 2, 'МУТАНТ': 3, 'СОЛДАТ': 4 },
        defenseDamage: {
          easy: { multiplier: 0.5, intervalHours: 4 },
          normal: { multiplier: 1.0, intervalHours: 2 },
          hard: { multiplier: 1.5, intervalHours: 1 },
          nightmare: { multiplier: 2.0, intervalHours: 0.5 }
        },
        firstEnemyDelay: { easy: 8, normal: 6, hard: 4, nightmare: 2 },
        subsequentEnemyInterval: { easy: 4, normal: 3, hard: 2, nightmare: 1 }
      },
      enemyHealth: { 'МАРОДЕР': 2, 'ЗОМБИ': 3, 'МУТАНТ': 6, 'СОЛДАТ': 10 },
      weaponDamage: { melee: 1, pistol: 1, shotgun: 2, ar: 1, sniper: 3 },
      dayNightCycle: { dayDurationHours: 16, nightDurationHours: 8, dayStartHour: 6, nightStartHour: 22 },
      visitorSystem: { maxQueueSize: 10, initialVisitors: 3, arrivalInterval: { easy: '2-4', normal: '3-6', hard: '4-8', nightmare: '5-10' } },
      bunkerCapacity: { baseCapacity: 10, capacityPerRoom: { 'Спальня': 2, 'Столовая': 1, 'Туалет': 1, 'Госпиталь': 1 } },
      skillEffects: {
        cooking: { foodBonus: 1, maxLevel: 2 },
        plumbing: { waterBonus: 1, maxLevel: 2 },
        hunting: { foodBonusPercent: 5, maxLevel: 10 },
        scouting: { lootBonusPercent: 5, maxLevel: 10 }
      },
      combatSystem: { soldierShotsPerHour: { base: 2, skillBonus: 1, maxShots: 8 }, attackCooldown: { base: 1000, skillReduction: 200 } },
             moraleSystem: { 
         baseDecay: 1, 
         maxMorale: 100,
         positiveEvents: { visitorAccepted: 5, enemyKilled: 2, roomBuilt: 3 }, 
         negativeEvents: { visitorRejected: -3, residentDied: -10, resourceShortage: -5 },
         levelUpBonus: {
           high: { min: 80, bonus: 2 },
           medium: { min: 60, bonus: 1 },
           low: { min: 0, bonus: 0 }
         },
         tradingQuality: {
           high: { min: 80, discount: 50 },
           medium: { min: 60, discount: 25 },
           normal: { min: 40, discount: 0 },
           low: { min: 20, markup: 25 },
           critical: { min: 0, markup: 50 }
         },
         comfortRecovery: {
           enabled: true,
           high: { min: 80, recoveryPerHour: 0.5 },
           medium: { min: 60, recoveryPerHour: 0.2 },
           low: { min: 0, recoveryPerHour: 0 }
         }
       },
      insanitySystem: { baseChance: 0.01, triggers: { lowMorale: 0.05, resourceShortage: 0.03, enemyAttack: 0.02 }, recoveryChance: 0.005 },
      defenseRegeneration: { baseRegenerationPerHour: 1, enabledWhenNoEnemies: true, maxDefense: 100 },
      comfortSystem: {
        defenseDependency: {
          enabled: true,
          baseComfort: 100,
          defenseThresholds: {
            high: { min: 80, bonus: 10 },
            medium: { min: 50, bonus: 0 },
            low: { min: 20, penalty: -20 },
            critical: { min: 0, penalty: -40 }
          }
        },
        happinessDependency: {
          enabled: true,
          comfortThresholds: {
            high: { min: 80, bonus: 5 },
            medium: { min: 50, bonus: 0 },
            low: { min: 20, penalty: -10 },
            critical: { min: 0, penalty: -20 }
          }
        }
      }
    };
          console.log('[ConfigManager] ⚠️ Загружена дефолтная конфигурация (fallback)');
      console.log('[ConfigManager] 💡 Для изменения баланса отредактируйте src/config/game-config.json');
      console.log(`[ConfigManager] 📊 Fallback разделов: ${Object.keys(this.config!).length}`);
      console.log(`[ConfigManager] 📊 Fallback сложности: ${Object.keys(this.config!.difficulty).join(', ')}`);
  }

  /**
   * Устанавливает текущую сложность
   */
  public setDifficulty(difficulty: Difficulty): void {
    this.currentDifficulty = difficulty;
    console.log(`[ConfigManager] ✅ Сложность установлена: ${difficulty}`);
  }

  /**
   * Получает текущую сложность
   */
  public getCurrentDifficulty(): Difficulty {
    console.log(`[ConfigManager] 📊 Запрос текущей сложности: ${this.currentDifficulty}`);
    return this.currentDifficulty;
  }

  /**
   * Получает конфигурацию
   */
  public getConfig(): GameConfig {
    if (!this.config) {
      throw new Error('Конфигурация не загружена. Вызовите loadConfig() сначала.');
    }
    
    const source = this.getConfigSource();
    console.log(`[ConfigManager] 📊 Запрос конфигурации (источник: ${source})`);
    return this.config;
  }

  // ===== ОПЫТ =====
  
  /**
   * Получает базовый опыт для уровня
   */
  public getBaseLevelExperience(): number {
    const config = this.getConfig();
    const experience = config.experience.baseLevelExperience;
    
    console.log(`[ConfigManager] 📊 Запрос базового опыта для уровня: ${experience}`);
    
    return experience;
  }

  /**
   * Получает опыт за убийство врага
   */
  public getEnemyKillReward(enemyType: EnemyType): number {
    const config = this.getConfig();
    const reward = config.experience.enemyKillRewards[enemyType] || 1;
    
    console.log(`[ConfigManager] 📊 Запрос опыта за врага ${enemyType}: ${reward}`);
    
    return reward;
  }

  /**
   * Получает опыт за прожитый день
   */
  public getDailyReward(): number {
    const config = this.getConfig();
    const reward = config.experience.dailyReward;
    
    console.log(`[ConfigManager] 📊 Запрос опыта за день: ${reward}`);
    
    return reward;
  }

  /**
   * Получает количество очков способностей за уровень
   */
  public getAbilityPointsPerLevel(): number {
    const config = this.getConfig();
    const points = config.experience.abilityPointsPerLevel;
    
    console.log(`[ConfigManager] 📊 Запрос очков способностей за уровень: ${points}`);
    
    return points;
  }

  // ===== РЕСУРСЫ =====
  
  /**
   * Получает начальные ресурсы для текущей сложности
   */
  public getInitialResources(): any {
    const config = this.getConfig();
    const resources = config.initialResources[this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос ресурсов для сложности: ${this.currentDifficulty}`);
    console.log(`[ConfigManager] 📊 Доступные сложности: ${Object.keys(config.initialResources).join(', ')}`);
    console.log(`[ConfigManager] 📊 Полученные ресурсы:`, resources);
    
    return resources;
  }

  /**
   * Получает настройки потребления ресурса
   */
  public getResourceConsumption(resourceType: 'food' | 'water'): any {
    const config = this.getConfig();
    const consumption = config.resourceConsumption[resourceType][this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос потребления ${resourceType} для сложности: ${this.currentDifficulty}`);
    console.log(`[ConfigManager] 📊 Полученные настройки:`, consumption);
    
    return consumption;
  }

  /**
   * Получает интервал потребления ресурса в часах
   */
  public getResourceConsumptionInterval(resourceType: 'food' | 'water'): number {
    const interval = this.getResourceConsumption(resourceType).intervalHours;
    
    console.log(`[ConfigManager] 📊 Запрос интервала потребления ${resourceType}: ${interval}ч`);
    
    return interval;
  }

  /**
   * Получает множитель потребления ресурса
   */
  public getResourceConsumptionMultiplier(resourceType: 'food' | 'water'): number {
    const multiplier = this.getResourceConsumption(resourceType).multiplier;
    
    console.log(`[ConfigManager] 📊 Запрос множителя потребления ${resourceType}: ${multiplier}`);
    
    return multiplier;
  }

  // ===== ВРАГИ =====
  
  /**
   * Получает здоровье врага
   */
  public getEnemyHealth(enemyType: EnemyType): number {
    const config = this.getConfig();
    const health = config.enemyHealth[enemyType] || 2;
    
    console.log(`[ConfigManager] 📊 Запрос здоровья врага ${enemyType}: ${health}`);
    
    return health;
  }

  /**
   * Получает базовый урон врага
   */
  public getEnemyBaseDamage(enemyType: EnemyType): number {
    const config = this.getConfig();
    const damage = config.enemyDamage.baseDamage[enemyType] || 1;
    
    console.log(`[ConfigManager] 📊 Запрос базового урона врага ${enemyType}: ${damage}`);
    
    return damage;
  }

  /**
   * Получает настройки урона по защите
   */
  public getDefenseDamageConfig(): any {
    const config = this.getConfig();
    const damageConfig = config.enemyDamage.defenseDamage[this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос настроек урона по защите для сложности ${this.currentDifficulty}:`, damageConfig);
    
    return damageConfig;
  }

  /**
   * Получает множитель урона по защите
   */
  public getDefenseDamageMultiplier(): number {
    const multiplier = this.getDefenseDamageConfig().multiplier;
    
    console.log(`[ConfigManager] 📊 Запрос множителя урона по защите для сложности ${this.currentDifficulty}: ${multiplier}`);
    
    return multiplier;
  }

  /**
   * Получает интервал урона по защите в часах
   */
  public getDefenseDamageInterval(): number {
    const interval = this.getDefenseDamageConfig().intervalHours;
    
    console.log(`[ConfigManager] 📊 Запрос интервала урона по защите для сложности ${this.currentDifficulty}: ${interval}ч`);
    
    return interval;
  }

  /**
   * Получает задержку первого врага в часах
   */
  public getFirstEnemyDelay(): number {
    const config = this.getConfig();
    const delay = config.enemyDamage.firstEnemyDelay[this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос задержки первого врага для сложности ${this.currentDifficulty}: ${delay}ч`);
    
    return delay;
  }

  /**
   * Получает интервал между врагами в часах
   */
  public getSubsequentEnemyInterval(): number {
    const config = this.getConfig();
    const interval = config.enemyDamage.subsequentEnemyInterval[this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос интервала между врагами для сложности ${this.currentDifficulty}: ${interval}ч`);
    
    return interval;
  }

  // ===== ОРУЖИЕ =====
  
  /**
   * Получает урон оружия
   */
  public getWeaponDamage(weaponType: WeaponType): number {
    const config = this.getConfig();
    const damage = config.weaponDamage[weaponType] || 1;
    
    console.log(`[ConfigManager] 📊 Запрос урона оружия ${weaponType}: ${damage}`);
    
    return damage;
  }

  // ===== ЦИКЛ ДЕНЬ/НОЧЬ =====
  
  /**
   * Получает длительность дня в часах
   */
  public getDayDurationHours(): number {
    const config = this.getConfig();
    const duration = config.dayNightCycle.dayDurationHours;
    
    console.log(`[ConfigManager] 📊 Запрос длительности дня: ${duration}ч`);
    
    return duration;
  }

  /**
   * Получает длиномер ночи в часах
   */
  public getNightDurationHours(): number {
    const config = this.getConfig();
    const duration = config.dayNightCycle.nightDurationHours;
    
    console.log(`[ConfigManager] 📊 Запрос длительности ночи: ${duration}ч`);
    
    return duration;
  }

  /**
   * Получает час начала дня
   */
  public getDayStartHour(): number {
    const config = this.getConfig();
    const hour = config.dayNightCycle.dayStartHour;
    
    console.log(`[ConfigManager] 📊 Запрос часа начала дня: ${hour}ч`);
    
    return hour;
  }

  /**
   * Получает час начала ночи
   */
  public getNightStartHour(): number {
    const config = this.getConfig();
    const hour = config.dayNightCycle.nightStartHour;
    
    console.log(`[ConfigManager] 📊 Запрос часа начала ночи: ${hour}ч`);
    
    return hour;
  }

  // ===== ПОСЕТИТЕЛИ =====
  
  /**
   * Получает максимальный размер очереди посетителей
   */
  public getMaxQueueSize(): number {
    const config = this.getConfig();
    const size = config.visitorSystem.maxQueueSize;
    
    console.log(`[ConfigManager] 📊 Запрос максимального размера очереди: ${size}`);
    
    return size;
  }

  /**
   * Получает начальное количество посетителей
   */
  public getInitialVisitors(): number {
    const config = this.getConfig();
    const visitors = config.visitorSystem.initialVisitors;
    
    console.log(`[ConfigManager] 📊 Запрос начального количества посетителей: ${visitors}`);
    
    return visitors;
  }

  /**
   * Получает интервал прибытия посетителей
   */
  public getVisitorArrivalInterval(): string {
    const config = this.getConfig();
    const interval = config.visitorSystem.arrivalInterval[this.currentDifficulty];
    
    console.log(`[ConfigManager] 📊 Запрос интервала прибытия посетителей для сложности ${this.currentDifficulty}: ${interval}`);
    
    return interval;
  }

  // ===== ВМЕСТИМОСТЬ БУНКЕРА =====
  
  /**
   * Получает базовую вместимость бункера
   */
  public getBaseBunkerCapacity(): number {
    const config = this.getConfig();
    const capacity = config.bunkerCapacity.baseCapacity;
    
    console.log(`[ConfigManager] 📊 Запрос базовой вместимости бункера: ${capacity}`);
    
    return capacity;
  }

  /**
   * Получает вместимость комнаты
   */
  public getRoomCapacity(roomName: string): number {
    const config = this.getConfig();
    const capacity = config.bunkerCapacity.capacityPerRoom[roomName] || 0;
    
    console.log(`[ConfigManager] 📊 Запрос вместимости комнаты ${roomName}: ${capacity}`);
    
    return capacity;
  }

  // ===== НАВЫКИ =====
  
  /**
   * Получает эффект навыка
   */
  public getSkillEffect(skillName: string, effectName: string): number {
    const config = this.getConfig();
    const skill = config.skillEffects[skillName as keyof SkillEffectsConfig];
    const effect = skill ? skill[effectName] || 0 : 0;
    
    console.log(`[ConfigManager] 📊 Запрос эффекта навыка ${skillName}.${effectName}: ${effect}`);
    
    return effect;
  }

  // ===== БОЕВАЯ СИСТЕМА =====
  
  /**
   * Получает базовое количество выстрелов солдата в час
   */
  public getSoldierBaseShotsPerHour(): number {
    const config = this.getConfig();
    const shots = config.combatSystem.soldierShotsPerHour.base;
    
    console.log(`[ConfigManager] 📊 Запрос базовых выстрелов солдата в час: ${shots}`);
    
    return shots;
  }

  /**
   * Получает бонус к выстрелам от навыков
   */
  public getSoldierSkillBonus(): number {
    const config = this.getConfig();
    const bonus = config.combatSystem.soldierShotsPerHour.skillBonus;
    
    console.log(`[ConfigManager] 📊 Запрос бонуса к выстрелам от навыков: ${bonus}`);
    
    return bonus;
  }

  /**
   * Получает максимальное количество выстрелов
   */
  public getSoldierMaxShots(): number {
    const config = this.getConfig();
    const maxShots = config.combatSystem.soldierShotsPerHour.maxShots;
    
    console.log(`[ConfigManager] 📊 Запрос максимального количества выстрелов: ${maxShots}`);
    
    return maxShots;
  }

  /**
   * Получает базовое время перезарядки атаки
   */
  public getAttackCooldownBase(): number {
    const config = this.getConfig();
    const cooldown = config.combatSystem.attackCooldown.base;
    
    console.log(`[ConfigManager] 📊 Запрос базового времени перезарядки атаки: ${cooldown}мс`);
    
    return cooldown;
  }

  /**
   * Получает сокращение времени перезарядки от навыков
   */
  public getAttackCooldownSkillReduction(): number {
    const config = this.getConfig();
    const reduction = config.combatSystem.attackCooldown.skillReduction;
    
    console.log(`[ConfigManager] 📊 Запрос сокращения времени перезарядки от навыков: ${reduction}мс`);
    
    return reduction;
  }

  // ===== СИСТЕМА МОРАЛИ =====
  
  /**
   * Получает максимальное значение морали
   */
  public getMaxMorale(): number {
    const config = this.getConfig();
    const maxMorale = config.moraleSystem.maxMorale;
    
    console.log(`[ConfigManager] 📊 Запрос максимальной морали: ${maxMorale}%`);
    
    return maxMorale;
  }

  /**
   * Получает базовое снижение морали
   */
  public getMoraleBaseDecay(): number {
    const config = this.getConfig();
    const decay = config.moraleSystem.baseDecay;
    
    console.log(`[ConfigManager] 📊 Запрос базового снижения морали: ${decay}`);
    
    return decay;
  }

  /**
   * Получает изменение морали от события
   */
  public getMoraleEventChange(eventType: 'positive' | 'negative', eventName: string): number {
    const config = this.getConfig();
    const events = config.moraleSystem[`${eventType}Events`];
    const change = events[eventName] || 0;
    
    console.log(`[ConfigManager] 📊 Запрос изменения морали от события ${eventType}.${eventName}: ${change}`);
    
    return change;
  }

  /**
   * Получает бонус к очкам способностей за уровень в зависимости от морали
   */
  public getMoraleLevelUpBonus(morale: number): number {
    const config = this.getConfig();
    const thresholds = config.moraleSystem.levelUpBonus;
    
    let bonus = 0;
    if (morale >= thresholds.high.min) {
      bonus = thresholds.high.bonus;
    } else if (morale >= thresholds.medium.min) {
      bonus = thresholds.medium.bonus;
    } else {
      bonus = thresholds.low.bonus;
    }
    
    console.log(`[ConfigManager] 📊 Бонус к очкам способностей при морали ${morale}%: +${bonus}`);
    
    return bonus;
  }

  /**
   * Получает качество торговли в зависимости от морали
   */
  public getMoraleTradingQuality(morale: number): { type: 'discount' | 'markup'; value: number } {
    const config = this.getConfig();
    const thresholds = config.moraleSystem.tradingQuality;
    
    let result: { type: 'discount' | 'markup'; value: number };
    
    if (morale >= thresholds.high.min) {
      result = { type: 'discount', value: thresholds.high.discount };
    } else if (morale >= thresholds.medium.min) {
      result = { type: 'discount', value: thresholds.medium.discount };
    } else if (morale >= thresholds.normal.min) {
      result = { type: 'discount', value: thresholds.normal.discount };
    } else if (morale >= thresholds.low.min) {
      result = { type: 'markup', value: thresholds.low.markup };
    } else {
      result = { type: 'markup', value: thresholds.critical.markup };
    }
    
    console.log(`[ConfigManager] 📊 Качество торговли при морали ${morale}%: ${result.type} ${result.value}%`);
    
    return result;
  }

  /**
   * Получает восстановление морали от комфорта
   */
  public getMoraleComfortRecovery(comfort: number): number {
    const config = this.getConfig();
    
    if (!config.moraleSystem.comfortRecovery.enabled) {
      return 0;
    }
    
    const thresholds = config.moraleSystem.comfortRecovery;
    
    let recovery = 0;
    if (comfort >= thresholds.high.min) {
      recovery = thresholds.high.recoveryPerHour;
    } else if (comfort >= thresholds.medium.min) {
      recovery = thresholds.medium.recoveryPerHour;
    } else {
      recovery = thresholds.low.recoveryPerHour;
    }
    
    console.log(`[ConfigManager] 📊 Восстановление морали от комфорта ${comfort}%: +${recovery}/час`);
    
    return recovery;
  }

  // ===== СИСТЕМА БЕЗУМИЯ =====
  
  /**
   * Получает базовый шанс безумия
   */
  public getInsanityBaseChance(): number {
    const config = this.getConfig();
    const chance = config.insanitySystem.baseChance;
    
    console.log(`[ConfigManager] 📊 Запрос базового шанса безумия: ${chance}`);
    
    return chance;
  }

  /**
   * Получает шанс безумия от триггера
   */
  public getInsanityTriggerChance(triggerName: string): number {
    const config = this.getConfig();
    const chance = config.insanitySystem.triggers[triggerName] || 0;
    
    console.log(`[ConfigManager] 📊 Запрос шанса безумия от триггера ${triggerName}: ${chance}`);
    
    return chance;
  }

  /**
   * Получает шанс восстановления от безумия
   */
  public getInsanityRecoveryChance(): number {
    const config = this.getConfig();
    const chance = config.insanitySystem.recoveryChance;
    
    console.log(`[ConfigManager] 📊 Запрос шанса восстановления от безумия: ${chance}`);
    
    return chance;
  }

  // ===== ВОССТАНОВЛЕНИЕ ЗАЩИТЫ =====
  
  /**
   * Получает базовую регенерацию защиты в час
   */
  public getDefenseRegenerationPerHour(): number {
    const config = this.getConfig();
    const regeneration = config.defenseRegeneration.baseRegenerationPerHour;
    
    console.log(`[ConfigManager] 📊 Запрос регенерации защиты в час: ${regeneration}%`);
    
    return regeneration;
  }

  /**
   * Проверяет, включена ли регенерация защиты при отсутствии врагов
   */
  public isDefenseRegenerationEnabled(): boolean {
    const config = this.getConfig();
    const enabled = config.defenseRegeneration.enabledWhenNoEnemies;
    
    console.log(`[ConfigManager] 📊 Регенерация защиты при отсутствии врагов: ${enabled ? 'включена' : 'выключена'}`);
    
    return enabled;
  }

  /**
   * Получает максимальное значение защиты
   */
  public getMaxDefense(): number {
    const config = this.getConfig();
    const maxDefense = config.defenseRegeneration.maxDefense;
    
    console.log(`[ConfigManager] 📊 Максимальная защита: ${maxDefense}%`);
    
    return maxDefense;
  }

  // ===== СИСТЕМА КОМФОРТА =====
  
  /**
   * Получает базовый комфорт
   */
  public getBaseComfort(): number {
    const config = this.getConfig();
    const baseComfort = config.comfortSystem.defenseDependency.baseComfort;
    
    console.log(`[ConfigManager] 📊 Базовый комфорт: ${baseComfort}%`);
    
    return baseComfort;
  }

  /**
   * Проверяет, включена ли зависимость комфорта от защиты
   */
  public isComfortDefenseDependencyEnabled(): boolean {
    const config = this.getConfig();
    const enabled = config.comfortSystem.defenseDependency.enabled;
    
    console.log(`[ConfigManager] 📊 Зависимость комфорта от защиты: ${enabled ? 'включена' : 'выключена'}`);
    
    return enabled;
  }

  /**
   * Получает пороги зависимости комфорта от защиты
   */
  public getComfortDefenseThresholds(): any {
    const config = this.getConfig();
    const thresholds = config.comfortSystem.defenseDependency.defenseThresholds;
    
    console.log(`[ConfigManager] 📊 Пороги зависимости комфорта от защиты:`, thresholds);
    
    return thresholds;
  }

  /**
   * Проверяет, включена ли зависимость счастья от комфорта
   */
  public isHappinessComfortDependencyEnabled(): boolean {
    const config = this.getConfig();
    const enabled = config.comfortSystem.happinessDependency.enabled;
    
    console.log(`[ConfigManager] 📊 Зависимость счастья от комфорта: ${enabled ? 'включена' : 'выключена'}`);
    
    return enabled;
  }

  /**
   * Получает пороги зависимости счастья от комфорта
   */
  public getHappinessComfortThresholds(): any {
    const config = this.getConfig();
    const thresholds = config.comfortSystem.happinessDependency.comfortThresholds;
    
    console.log(`[ConfigManager] 📊 Пороги зависимости счастья от комфорта:`, thresholds);
    
    return thresholds;
  }

  // ===== УТИЛИТЫ =====
  
  /**
   * Проверяет, загружена ли конфигурация
   */
  public isConfigLoaded(): boolean {
    const loaded = this.config !== null;
    console.log(`[ConfigManager] 📊 Проверка загрузки конфигурации: ${loaded ? 'Да' : 'Нет'}`);
    return loaded;
  }

  /**
   * Проверяет, загружена ли конфигурация из JSON файла
   */
  public isConfigFromJSON(): boolean {
    // Простая проверка - если есть сложность "nightmare", то это JSON
    // В дефолтной конфигурации есть все сложности
    const fromJSON = this.config !== null && this.config.difficulty.nightmare !== undefined;
    console.log(`[ConfigManager] 📊 Проверка источника конфигурации: ${fromJSON ? 'JSON файл' : 'Дефолтные значения'}`);
    return fromJSON;
  }

  /**
   * Получает источник конфигурации для отладки
   */
  public getConfigSource(): string {
    if (!this.isConfigLoaded()) {
      return 'Не загружена';
    }
    const source = this.isConfigFromJSON() ? 'JSON файл' : 'Дефолтные значения (fallback)';
    console.log(`[ConfigManager] 📊 Источник конфигурации: ${source}`);
    return source;
  }

  /**
   * Получает информацию о сложности
   */
  public getDifficultyInfo(difficulty: Difficulty): any {
    const config = this.getConfig();
    const info = config.difficulty[difficulty];
    
    console.log(`[ConfigManager] 📊 Запрос информации о сложности ${difficulty}:`, info);
    
    return info;
  }

  /**
   * Получает все доступные сложности
   */
  public getAvailableDifficulties(): Difficulty[] {
    const config = this.getConfig();
    const difficulties = Object.keys(config.difficulty) as Difficulty[];
    
    console.log(`[ConfigManager] 📊 Запрос доступных сложностей: ${difficulties.join(', ')}`);
    
    return difficulties;
  }
}
