export type SupportedLanguage = 'ru' | 'en'

type Dictionary = Record<string, string>

const TRANSLATIONS: Record<SupportedLanguage, Dictionary> = {
  ru: {
    title: 'Bunker Survivors',
    play: 'Играть',
    difficulty: 'Сложность',
    easy: 'Легко',
    normal: 'Нормально',
    hard: 'Сложно',
    back: 'Назад',
    language: 'Язык',
    ru: 'Русский',
    en: 'English',
    fullscreen: 'Полный экран',
    exitFullscreen: 'В окно',
    loading: 'Загрузка...',
    selectedDifficulty: 'Выбрана сложность:',
    day: 'День',
    resources: 'Ресурсы',
    population: 'Люди',
    food: 'Еда',
    water: 'Вода',
    money: 'Деньги',
    abilities: 'Способности',
    pause: 'Пауза',
    resume: 'Продолжить',
    next: 'Далее',
    surface: 'Поверхность',
    bunkerView: 'Вид бункера',
    characterPreview: 'Превью персонажа',
    characterDetails: 'Детали персонажа',
    name: 'Имя',
    age: 'Возраст',
    specialty: 'Специальность',
    inventory: 'Инвентарь',
    skill: 'Навык',
    accept: 'Принять',
    deny: 'Отказать',
    dayPhase: 'День',
    nightPhase: 'Ночь',
    paused: 'Пауза',
    abilitiesWip: 'Дерево способностей (WIP)',
    nightComing: 'Наступает ночь'
  },
  en: {
    title: 'Bunker Survivors',
    play: 'Play',
    difficulty: 'Difficulty',
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    back: 'Back',
    language: 'Language',
    ru: 'Русский',
    en: 'English',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Windowed',
    loading: 'Loading...',
    selectedDifficulty: 'Selected difficulty:',
    day: 'Day',
    resources: 'Resources',
    population: 'Population',
    food: 'Food',
    water: 'Water',
    money: 'Money',
    abilities: 'Abilities',
    pause: 'Pause',
    resume: 'Resume',
    next: 'Next',
    surface: 'Surface',
    bunkerView: 'Bunker View',
    characterPreview: 'Character Preview',
    characterDetails: 'Character Details',
    name: 'Name',
    age: 'Age',
    specialty: 'Specialty',
    inventory: 'Inventory',
    skill: 'Skill',
    accept: 'Accept',
    deny: 'Deny',
    dayPhase: 'Day',
    nightPhase: 'Night',
    paused: 'Paused',
    abilitiesWip: 'Abilities tree (WIP)',
    nightComing: 'Night falls'
  }
}

const STORAGE_KEY = 'bunker:lang'

let currentLanguage: SupportedLanguage = (localStorage.getItem(STORAGE_KEY) as SupportedLanguage) || 'ru'

type LanguageListener = (lang: SupportedLanguage) => void
const listeners = new Set<LanguageListener>()

export function t(key: keyof typeof TRANSLATIONS['en'] | string): string {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.ru
  return dict[key] ?? key
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage
}

export function setLanguage(lang: SupportedLanguage): void {
  if (currentLanguage === lang) return
  currentLanguage = lang
  localStorage.setItem(STORAGE_KEY, lang)
  listeners.forEach(l => l(currentLanguage))
}

export function toggleLanguage(): SupportedLanguage {
  const next = currentLanguage === 'ru' ? 'en' : 'ru'
  setLanguage(next)
  return next
}

export function onLanguageChange(listener: LanguageListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}


