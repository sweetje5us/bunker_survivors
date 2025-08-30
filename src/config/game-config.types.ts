export interface GameConfig {
  difficulty: DifficultyConfig;
  experience: ExperienceConfig;
  resourceConsumption: ResourceConsumptionConfig;
  initialResources: InitialResourcesConfig;
  enemyDamage: EnemyDamageConfig;
  enemyHealth: EnemyHealthConfig;
  weaponDamage: WeaponDamageConfig;
  dayNightCycle: DayNightCycleConfig;
  visitorSystem: VisitorSystemConfig;
  bunkerCapacity: BunkerCapacityConfig;
  skillEffects: SkillEffectsConfig;
  combatSystem: CombatSystemConfig;
  moraleSystem: MoraleSystemConfig;
  insanitySystem: InsanitySystemConfig;
  defenseRegeneration: DefenseRegenerationConfig;
  comfortSystem: ComfortSystemConfig;
}

export interface DifficultyConfig {
  easy: DifficultyLevel;
  normal: DifficultyLevel;
  hard: DifficultyLevel;
  nightmare: DifficultyLevel;
}

export interface DifficultyLevel {
  name: string;
  description: string;
}

export interface ExperienceConfig {
  baseLevelExperience: number;
  enemyKillRewards: Record<string, number>;
  dailyReward: number;
  abilityPointsPerLevel: number;
}

export interface ResourceConsumptionConfig {
  food: Record<string, ResourceConsumptionLevel>;
  water: Record<string, ResourceConsumptionLevel>;
}

export interface ResourceConsumptionLevel {
  intervalHours: number;
  baseConsumption: number;
  multiplier: number;
}

export interface InitialResourcesConfig {
  easy: Resources;
  normal: Resources;
  hard: Resources;
  nightmare: Resources;
}

export interface Resources {
  happiness: number;
  defense: number;
  ammo: number;
  comfort: number;
  moral: number;
  food: number;
  water: number;
  money: number;
  wood: number;
  metal: number;
  coal: number;
  nails: number;
  paper: number;
  glass: number;
}

export interface EnemyDamageConfig {
  baseDamage: Record<string, number>;
  defenseDamage: Record<string, DefenseDamageLevel>;
  firstEnemyDelay: Record<string, number>;
  subsequentEnemyInterval: Record<string, number>;
}

export interface DefenseDamageLevel {
  multiplier: number;
  intervalHours: number;
}

export interface EnemyHealthConfig {
  [key: string]: number;
}

export interface WeaponDamageConfig {
  melee: number;
  pistol: number;
  shotgun: number;
  ar: number;
  sniper: number;
}

export interface DayNightCycleConfig {
  dayDurationHours: number;
  nightDurationHours: number;
  dayStartHour: number;
  nightStartHour: number;
}

export interface VisitorSystemConfig {
  maxQueueSize: number;
  initialVisitors: number;
  arrivalInterval: Record<string, string>;
}

export interface BunkerCapacityConfig {
  baseCapacity: number;
  capacityPerRoom: Record<string, number>;
}

export interface SkillEffectsConfig {
  cooking: SkillEffect;
  plumbing: SkillEffect;
  hunting: SkillEffect;
  scouting: SkillEffect;
}

export interface SkillEffect {
  [key: string]: number;
}

export interface CombatSystemConfig {
  soldierShotsPerHour: SoldierShotsConfig;
  attackCooldown: AttackCooldownConfig;
}

export interface SoldierShotsConfig {
  base: number;
  skillBonus: number;
  maxShots: number;
}

export interface AttackCooldownConfig {
  base: number;
  skillReduction: number;
}

export interface MoraleSystemConfig {
  baseDecay: number;
  maxMorale: number;
  positiveEvents: Record<string, number>;
  negativeEvents: Record<string, number>;
  levelUpBonus: {
    high: { min: number; bonus: number };
    medium: { min: number; bonus: number };
    low: { min: number; bonus: number };
  };
  tradingQuality: {
    high: { min: number; discount: number };
    medium: { min: number; discount: number };
    normal: { min: number; discount: number };
    low: { min: number; markup: number };
    critical: { min: number; markup: number };
  };
  comfortRecovery: {
    enabled: boolean;
    high: { min: number; recoveryPerHour: number };
    medium: { min: number; recoveryPerHour: number };
    low: { min: number; recoveryPerHour: number };
  };
}

export interface InsanitySystemConfig {
  baseChance: number;
  triggers: Record<string, number>;
  recoveryChance: number;
}

// Типы для сложности
export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

// Типы для врагов
export type EnemyType = 'МАРОДЕР' | 'ЗОМБИ' | 'МУТАНТ' | 'СОЛДАТ';

// Типы для оружия
export type WeaponType = 'melee' | 'pistol' | 'shotgun' | 'ar' | 'sniper';

// Типы для ресурсов
export type ResourceType = keyof Resources;

export interface DefenseRegenerationConfig {
  baseRegenerationPerHour: number;
  enabledWhenNoEnemies: boolean;
  maxDefense: number;
}

export interface ComfortSystemConfig {
  defenseDependency: {
    enabled: boolean;
    baseComfort: number;
    defenseThresholds: {
      high: { min: number; bonus: number };
      medium: { min: number; bonus: number };
      low: { min: number; penalty: number };
      critical: { min: number; penalty: number };
    };
  };
  happinessDependency: {
    enabled: boolean;
    comfortThresholds: {
      high: { min: number; bonus: number };
      medium: { min: number; bonus: number };
      low: { min: number; penalty: number };
      critical: { min: number; penalty: number };
    };
  };
}
