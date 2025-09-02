/**
 * Система фракций для игры Bunker Survivors
 */

export type FactionId = 'hq' | 'rebels' | 'marauders' | 'free' | 'mystery';

export interface Faction {
  id: FactionId;
  name: string;
  description: string;
  motivation: string;
  communicationMethod: string;
  unlockItem?: string; // Предмет, который разблокирует доступ к фракции
  isUnlocked: boolean;
  isTruthful: boolean; // Только одна фракция говорит правду
}

export interface FactionInfo {
  currentTruthfulFaction: FactionId;
  unlockedFactions: FactionId[];
  factionRelations: Record<FactionId, 'hostile' | 'neutral' | 'friendly'>;
}

/**
 * Базовые данные о фракциях
 */
export const FACTION_DEFINITIONS: Record<FactionId, Omit<Faction, 'isUnlocked' | 'isTruthful'>> = {
  hq: {
    id: 'hq',
    name: 'Штаб',
    description: 'Советский рычаг, жесткий тоталитаризм, жесткие приказы, подчинение системы.',
    motivation: 'Поддержание порядка и контроля над выжившими. Обеспечение безопасности через дисциплину и подчинение.',
    communicationMethod: 'Официальные радиопередачи и приказы'
  },
  rebels: {
    id: 'rebels',
    name: 'Повстанцы',
    description: 'Радикалы, нападают на бункеры штаба, исповедуют свою религию.',
    motivation: 'Свержение тоталитарного режима Штаба. Установление справедливого порядка.',
    communicationMethod: 'Скрытые радиопередачи и координаты',
    unlockItem: 'gps'
  },
  marauders: {
    id: 'marauders',
    name: 'Мародеры',
    description: 'Жестокие люди, грабят другие бункеры, можно взаимодействовать/сотрудничать в дальнейшем.',
    motivation: 'Выживание любой ценой. Накопление ресурсов и власти.',
    communicationMethod: 'Перехваченные переговоры',
    unlockItem: 'phone'
  },
  free: {
    id: 'free',
    name: 'Свободные',
    description: 'Люди, которые ценят свободу, держат нейтралитет.',
    motivation: 'Сохранение независимости и свободы выбора. Мирное сосуществование.',
    communicationMethod: 'Свободный интернет и открытые каналы',
    unlockItem: 'laptop'
  },
  mystery: {
    id: 'mystery',
    name: 'Тайна',
    description: 'Зомби и Мутанты. Нужно рассказывать через истории выживших людей подробности про врагов.',
    motivation: 'Неизвестно. Возможно, разумные существа с собственной логикой.',
    communicationMethod: 'Таинственные сигналы и передачи',
    unlockItem: 'transmitter'
  }
};

/**
 * Класс для управления фракциями
 */
export class FactionManager {
  private static instance: FactionManager;
  private factionInfo: FactionInfo;
  private gameSeed: number;

  private constructor(seed: number = Date.now()) {
    this.gameSeed = seed;
    this.factionInfo = this.initializeFactions();
  }

  public static getInstance(seed?: number): FactionManager {
    if (!FactionManager.instance) {
      FactionManager.instance = new FactionManager(seed);
    }
    return FactionManager.instance;
  }

  /**
   * Инициализация фракций с выбором правдивой фракции
   */
  private initializeFactions(): FactionInfo {
    // Выбираем случайную правдивую фракцию (кроме mystery)
    const possibleTruthfulFactions: FactionId[] = ['hq', 'rebels', 'marauders', 'free'];
    const randomIndex = this.seededRandom(0, possibleTruthfulFactions.length - 1);
    const truthfulFaction = possibleTruthfulFactions[randomIndex];

    // Инициализируем отношения между фракциями
    const factionRelations: Record<FactionId, 'hostile' | 'neutral' | 'friendly'> = {
      hq: 'neutral',
      rebels: 'neutral',
      marauders: 'neutral',
      free: 'neutral',
      mystery: 'hostile'
    };

    // Устанавливаем базовые отношения
    if (truthfulFaction === 'hq') {
      factionRelations.rebels = 'hostile';
      factionRelations.marauders = 'hostile';
    } else if (truthfulFaction === 'rebels') {
      factionRelations.hq = 'hostile';
      factionRelations.marauders = 'neutral';
    } else if (truthfulFaction === 'marauders') {
      factionRelations.hq = 'hostile';
      factionRelations.rebels = 'neutral';
    } else if (truthfulFaction === 'free') {
      factionRelations.hq = 'neutral';
      factionRelations.rebels = 'neutral';
      factionRelations.marauders = 'neutral';
    }

    return {
      currentTruthfulFaction: truthfulFaction,
      unlockedFactions: ['hq'], // Штаб доступен по умолчанию
      factionRelations
    };
  }

  /**
   * Генератор псевдослучайных чисел на основе seed
   */
  private seededRandom(min: number, max: number): number {
    const x = Math.sin(this.gameSeed++) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  }

  /**
   * Получить информацию о фракциях
   */
  public getFactionInfo(): FactionInfo {
    return { ...this.factionInfo };
  }

  /**
   * Получить данные о конкретной фракции
   */
  public getFaction(factionId: FactionId): Faction {
    const definition = FACTION_DEFINITIONS[factionId];
    return {
      ...definition,
      isUnlocked: this.factionInfo.unlockedFactions.includes(factionId),
      isTruthful: this.factionInfo.currentTruthfulFaction === factionId
    };
  }

  /**
   * Разблокировать фракцию при получении предмета
   */
  public unlockFactionByItem(itemId: string): boolean {
    for (const [factionId, definition] of Object.entries(FACTION_DEFINITIONS)) {
      if (definition.unlockItem === itemId) {
        if (!this.factionInfo.unlockedFactions.includes(factionId as FactionId)) {
          this.factionInfo.unlockedFactions.push(factionId as FactionId);
          console.log(`[FactionManager] Разблокирована фракция: ${definition.name}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Проверить, разблокирована ли фракция
   */
  public isFactionUnlocked(factionId: FactionId): boolean {
    return this.factionInfo.unlockedFactions.includes(factionId);
  }

  /**
   * Получить правдивую фракцию
   */
  public getTruthfulFaction(): FactionId {
    return this.factionInfo.currentTruthfulFaction;
  }

  /**
   * Получить все разблокированные фракции
   */
  public getUnlockedFactions(): Faction[] {
    return this.factionInfo.unlockedFactions.map(id => this.getFaction(id));
  }

  /**
   * Получить отношение фракции к игроку
   */
  public getFactionRelation(factionId: FactionId): 'hostile' | 'neutral' | 'friendly' {
    return this.factionInfo.factionRelations[factionId] || 'neutral';
  }

  /**
   * Установить правдивую фракцию
   */
  public setTruthfulFaction(factionId: FactionId): void {
    this.factionInfo.currentTruthfulFaction = factionId;
    console.log(`[FactionManager] Установлена правдивая фракция: ${FACTION_DEFINITIONS[factionId]?.name}`);
  }

  /**
   * Получить все фракции
   */
  public getAllFactions(): Faction[] {
    return Object.keys(FACTION_DEFINITIONS).map(id => this.getFaction(id as FactionId));
  }

  /**
   * Сбросить менеджер фракций (для новой игры)
   */
  public reset(seed?: number): void {
    if (seed) {
      this.gameSeed = seed;
    }
    this.factionInfo = this.initializeFactions();
  }
}

/**
 * Утилиты для работы с фракциями
 */
export const FactionUtils = {
  /**
   * Получить название фракции по ID
   */
  getFactionName(factionId: FactionId): string {
    return FACTION_DEFINITIONS[factionId]?.name || 'Неизвестная фракция';
  },

  /**
   * Получить предмет для разблокировки фракции
   */
  getUnlockItem(factionId: FactionId): string | undefined {
    return FACTION_DEFINITIONS[factionId]?.unlockItem;
  },

  /**
   * Проверить, является ли предмет ключом к фракции
   */
  isFactionUnlockItem(itemId: string): FactionId | null {
    for (const [factionId, definition] of Object.entries(FACTION_DEFINITIONS)) {
      if (definition.unlockItem === itemId) {
        return factionId as FactionId;
      }
    }
    return null;
  }
};