import Phaser from 'phaser'

export const FEMALE_SKINS = [
  'char_female_skin1',
  'char_female_skin2',
  'char_female_skin3',
  'char_female_skin4',
  'char_female_skin5'
]

export const MALE_SKINS = [
  'char_male_skin1',
  'char_male_skin2',
  'char_male_skin3',
  'char_male_skin4',
  'char_male_skin5'
]

// Одежда: ключи-идентификаторы
export const MALE_SHIRTS = [
  'm_shirt',
  'm_shirt_v2',
  'm_blue_shirt_v2',
  'm_green_shirt_v2',
  'm_orange_shirt_v2'
]
export const MALE_PANTS = [
  'm_pants',
  'm_blue_pants',
  'm_green_pants',
  'm_orange_pants',
  'm_purple_pants'
]
export const MALE_FOOTWEAR = [
  'm_boots',
  'm_shoes',
  'none'
]

export const FEMALE_SHIRTS = [
  'f_corset',
  'f_corset_v2',
  'f_blue_corset',
  'f_blue_corset_v2',
  'f_green_corset',
  'f_green_corset_v2',
  'f_orange_corset',
  'f_orange_corset_v2',
  'f_purple_corset',
  'f_purple_corset_v2'
]
export const FEMALE_PANTS = [
  'f_skirt',
  'none'
]
export const FEMALE_FOOTWEAR = [
  'f_boots',
  'f_socks',
  'none'
]

export const MALE_HAIR = [
  'm_hair1',
  'm_hair2',
  'm_hair3',
  'm_hair4',
  'm_hair5',
  'none'
]
export const FEMALE_HAIR = [
  'f_hair1',
  'f_hair2',
  'f_hair3',
  'f_hair4',
  'f_hair5',
  'none'
]

export function registerCharacterSheets(scene: Phaser.Scene): void {
  // 10 columns x 7 rows; frame 80x64
  const load = scene.load
  load.spritesheet('char_female_skin1', 'src/sprites/characters/Character skin colors/Female Skin1.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_female_skin2', 'src/sprites/characters/Character skin colors/Female Skin2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_female_skin3', 'src/sprites/characters/Character skin colors/Female Skin3.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_female_skin4', 'src/sprites/characters/Character skin colors/Female Skin4.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_female_skin5', 'src/sprites/characters/Character skin colors/Female Skin5.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_male_skin1', 'src/sprites/characters/Character skin colors/Male Skin1.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_male_skin2', 'src/sprites/characters/Character skin colors/Male Skin2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_male_skin3', 'src/sprites/characters/Character skin colors/Male Skin3.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_male_skin4', 'src/sprites/characters/Character skin colors/Male Skin4.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('char_male_skin5', 'src/sprites/characters/Character skin colors/Male Skin5.png', { frameWidth: 80, frameHeight: 64 })
}

export function registerClothingSheets(scene: Phaser.Scene): void {
  const load = scene.load
  // Мужская одежда (без underwear)
  load.spritesheet('m_blue_pants', 'src/sprites/characters/Male Clothing/Blue Pants.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_green_pants', 'src/sprites/characters/Male Clothing/Green Pants.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_orange_pants', 'src/sprites/characters/Male Clothing/Orange Pants.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_pants', 'src/sprites/characters/Male Clothing/Pants.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_purple_pants', 'src/sprites/characters/Male Clothing/Purple Pants.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_blue_shirt_v2', 'src/sprites/characters/Male Clothing/Blue Shirt v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_green_shirt_v2', 'src/sprites/characters/Male Clothing/Green Shirt v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_orange_shirt_v2', 'src/sprites/characters/Male Clothing/orange Shirt v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_shirt_v2', 'src/sprites/characters/Male Clothing/Shirt v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_shirt', 'src/sprites/characters/Male Clothing/Shirt.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_boots', 'src/sprites/characters/Male Clothing/Boots.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_shoes', 'src/sprites/characters/Male Clothing/Shoes.png', { frameWidth: 80, frameHeight: 64 })
  // Женская одежда (без underwear / panties and bra)
  load.spritesheet('f_blue_corset_v2', 'src/sprites/characters/Female Clothing/Blue Corset v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_blue_corset', 'src/sprites/characters/Female Clothing/Blue Corset.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_corset_v2', 'src/sprites/characters/Female Clothing/Corset v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_corset', 'src/sprites/characters/Female Clothing/Corset.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_green_corset_v2', 'src/sprites/characters/Female Clothing/Green Corset v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_green_corset', 'src/sprites/characters/Female Clothing/Green Corset.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_orange_corset_v2', 'src/sprites/characters/Female Clothing/Orange Corset v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_orange_corset', 'src/sprites/characters/Female Clothing/Orange Corset.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_purple_corset_v2', 'src/sprites/characters/Female Clothing/Purple Corset v2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_purple_corset', 'src/sprites/characters/Female Clothing/Purple Corset.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_skirt', 'src/sprites/characters/Female Clothing/Skirt.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_boots', 'src/sprites/characters/Female Clothing/Boots.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_socks', 'src/sprites/characters/Female Clothing/Socks.png', { frameWidth: 80, frameHeight: 64 })
}

export function registerHairSheets(scene: Phaser.Scene): void {
  const load = scene.load
  // Мужские волосы
  load.spritesheet('m_hair1', 'src/sprites/characters/Male Hair/Male Hair1.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_hair2', 'src/sprites/characters/Male Hair/Male Hair2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_hair3', 'src/sprites/characters/Male Hair/Male Hair3.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_hair4', 'src/sprites/characters/Male Hair/Male Hair4.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('m_hair5', 'src/sprites/characters/Male Hair/Male Hair5.png', { frameWidth: 80, frameHeight: 64 })
  // Женские волосы
  load.spritesheet('f_hair1', 'src/sprites/characters/Female Hair/Female Hair1.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_hair2', 'src/sprites/characters/Female Hair/Female Hair2.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_hair3', 'src/sprites/characters/Female Hair/Female Hair3.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_hair4', 'src/sprites/characters/Female Hair/Female Hair4.png', { frameWidth: 80, frameHeight: 64 })
  load.spritesheet('f_hair5', 'src/sprites/characters/Female Hair/Female Hair5.png', { frameWidth: 80, frameHeight: 64 })
}

export function ensureCharacterAnimations(scene: Phaser.Scene, textureKey: string): void {
  const anims = scene.anims
  const mk = (suffix: string) => `${textureKey}_${suffix}`
  const make = (key: string, row: number, frames: number, frameRate: number, repeat: number) => {
    if (anims.exists(key)) return
    const start = row * 10
    const end = start + frames - 1
    anims.create({ key, frames: anims.generateFrameNumbers(textureKey, { start, end }), frameRate, repeat })
  }
  // row indices 0-based: idle 0 (5), walk 1 (8), run 2 (8)
  try { make(mk('idle'), 0, 5, 6, -1) } catch {}
  try { make(mk('walk'), 1, 8, 10, -1) } catch {}
  try { make(mk('run'), 2, 8, 14, -1) } catch {}
  // Real attack row: 6th row (1-based) => index 5, 6 frames; fallback to walk row
  try { make(mk('attack'), 5, 6, 12, -1) } catch {}
  if (!anims.exists(mk('attack'))) {
    try { make(mk('attack'), 1, 8, 12, -1) } catch {}
  }
  // Death row: 7th row (1-based) => index 6, 10 frames; non-looping
  try { make(mk('dead'), 6, 10, 10, 0) } catch {}
  // Hurt: use first 2 frames of death row; non-looping
  try { make(mk('hurt'), 6, 2, 12, 0) } catch {}
  // Sleep (slow idle)
  try { make(mk('sleep'), 0, 5, 3, -1) } catch {}
  if (!anims.exists(mk('sleep'))) {
    try { make(mk('sleep'), 0, 5, 3, -1) } catch {}
  }
}

export function createCharacterSprite(scene: Phaser.Scene, textureKey: string, anim: 'idle' | 'walk' | 'run' = 'idle'): Phaser.GameObjects.Sprite {
  ensureCharacterAnimations(scene, textureKey)
  const sprite = scene.add.sprite(0, 0, textureKey, 0)
  sprite.setOrigin(0.5, 1)
  sprite.anims.play(`${textureKey}_${anim}`)
  return sprite
}

export function pickSkinForGender(gender: string, seed: number): string {
  const arr = gender === 'Ж' ? FEMALE_SKINS : MALE_SKINS
  const idx = Math.abs(seed) % arr.length
  return arr[idx]
}

export type ClothingSet = { shirt?: string; pants?: string; footwear?: string }

export function pickClothingSetForGender(gender: string, seed: number): ClothingSet {
  // Простая детерминированная выборка с шансом "ничего" для брюк/обуви
  const rng = (n: number) => Math.abs(Math.sin(seed * 9301.123 + n * 49297.77))
  if (gender === 'Ж') {
    const shirt = FEMALE_SHIRTS[Math.floor(rng(1) * FEMALE_SHIRTS.length)]
    const pants = FEMALE_PANTS[Math.floor(rng(2) * FEMALE_PANTS.length)]
    const footwearIdx = Math.floor(rng(3) * FEMALE_FOOTWEAR.length)
    const footwear = FEMALE_FOOTWEAR[footwearIdx]
    return { shirt, pants: pants !== 'none' ? pants : undefined, footwear: footwear !== 'none' ? footwear : undefined }
  } else {
    const shirt = MALE_SHIRTS[Math.floor(rng(1) * MALE_SHIRTS.length)]
    const pants = MALE_PANTS[Math.floor(rng(2) * MALE_PANTS.length)]
    const footwearIdx = Math.floor(rng(3) * MALE_FOOTWEAR.length)
    const footwear = MALE_FOOTWEAR[footwearIdx]
    return { shirt, pants, footwear: footwear !== 'none' ? footwear : undefined }
  }
}

export function pickHairForGender(gender: string, seed: number): string | undefined {
  const rng = (n: number) => Math.abs(Math.sin(seed * 1337.77 + n * 17.71))
  const arr = gender === 'Ж' ? FEMALE_HAIR : MALE_HAIR
  const idx = Math.floor(rng(1) * arr.length)
  const choice = arr[Math.min(arr.length - 1, idx)]
  return choice === 'none' ? undefined : choice
}

// Функция для создания анимаций специализаций
export function ensureSpecialistAnimations(scene: Phaser.Scene, profession: string): void {
  const key = profession.toLowerCase()
  
  if (key === 'безработный') {
    // Создаем анимации для безработного
    const anims = scene.anims
    
    // Attack (10 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('unemployed_attack', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (4 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('unemployed_dead', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (3 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('unemployed_hurt', { frames: [0, 1, 2] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle_2 (9 кадров)
    if (!anims.exists(`${key}_idle2`)) {
      anims.create({
        key: `${key}_idle2`,
        frames: anims.generateFrameNumbers('unemployed_idle2', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Idle (7 кадров) - основная анимация покоя
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('unemployed_idle', { frames: [0, 1, 2, 3, 4, 5, 6] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (8 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('unemployed_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'повар') {
    // Создаем анимации для повара
    const anims = scene.anims
    
    // Attack (5 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('chef_attack', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (4 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('chef_dead', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (3 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('chef_hurt', { frames: [0, 1, 2] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров) - основная анимация покоя
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('chef_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (10 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('chef_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'химик') {
    // Создаем анимации для химика
    const anims = scene.anims
    
    // Attack (8 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('chemist_attack', { frames: [0, 1, 2, 3, 4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Protection (4 кадра) - вместо dead и hurt
    if (!anims.exists(`${key}_protection`)) {
      anims.create({
        key: `${key}_protection`,
        frames: anims.generateFrameNumbers('chemist_protection', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Dead как алиас для protection (для совместимости с системой)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('chemist_protection', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt как алиас для protection (для совместимости с системой)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('chemist_protection', { frames: [0, 1] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (9 кадров) - основная анимация покоя
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('chemist_idle', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (12 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('chemist_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'доктор') {
    // Создаем анимации для доктора
    const anims = scene.anims
    
    // Attack (4 кадра)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('doctor_attack', { frames: [0, 1, 2, 3] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (5 кадров)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('doctor_dead', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (3 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('doctor_hurt', { frames: [0, 1, 2] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров) - основная анимация покоя
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('doctor_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (10 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('doctor_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'инженер') {
    // Создаем анимации для инженера
    const anims = scene.anims
    
    // Attack (7 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('engineer_attack', { frames: [0, 1, 2, 3, 4, 5, 6] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (3 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('engineer_dead', { frames: [0, 1, 2] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (4 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('engineer_hurt', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров) - основная анимация покоя
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('engineer_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (12 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('engineer_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'бездомный') {
    // Создаем анимации для бездомного
    const anims = scene.anims
    
    // Attack (3 кадра)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('homeless_attack', { frames: [0, 1, 2] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (4 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('homeless_dead', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (3 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('homeless_hurt', { frames: [0, 1, 2] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle_2 (11 кадров)
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('homeless_idle', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (8 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('homeless_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'охотник') {
    // Создаем анимации для охотника
    const anims = scene.anims
    
    // Attack (6 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('hunter_attack', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (3 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('hunter_dead', { frames: [0, 1, 2] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (4 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('hunter_hurt', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров)
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('hunter_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (12 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('hunter_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'сантехник') {
    // Создаем анимации для сантехника
    const anims = scene.anims
    
    // Attack (6 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('plumber_attack', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (5 кадров)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('plumber_dead', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (4 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('plumber_hurt', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (13 кадров) - используем Idle_2
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('plumber_idle', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (10 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('plumber_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'ученый' || key === 'учёный') {
    // Создаем анимации для ученого
    const anims = scene.anims
    
    // Attack (5 кадров)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('scientist_attack', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (5 кадров)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('scientist_dead', { frames: [0, 1, 2, 3, 4] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (4 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('scientist_hurt', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров)
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('scientist_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (10 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('scientist_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'разведчик') {
    // Создаем анимации для разведчика
    const anims = scene.anims
    
    // Attack (4 кадра)
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('scout_attack', { frames: [0, 1, 2, 3] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (4 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('scout_dead', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (4 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('scout_hurt', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (6 кадров)
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('scout_idle', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (12 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('scout_walk', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
        frameRate: 12,
        repeat: -1
      })
    }
  } else if (key === 'солдат') {
    // Создаем анимации для солдата
    const anims = scene.anims
    
    // Attack (4 кадра) - используем Shot_1
    if (!anims.exists(`${key}_attack`)) {
      anims.create({
        key: `${key}_attack`,
        frames: anims.generateFrameNumbers('soldier_attack', { frames: [0, 1, 2, 3] }),
        frameRate: 12,
        repeat: -1
      })
    }
    
    // Dead (4 кадра)
    if (!anims.exists(`${key}_dead`)) {
      anims.create({
        key: `${key}_dead`,
        frames: anims.generateFrameNumbers('soldier_dead', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: 0
      })
    }
    
    // Hurt (3 кадра)
    if (!anims.exists(`${key}_hurt`)) {
      anims.create({
        key: `${key}_hurt`,
        frames: anims.generateFrameNumbers('soldier_hurt', { frames: [0, 1, 2] }),
        frameRate: 10,
        repeat: 0
      })
    }
    
    // Idle (7 кадров)
    if (!anims.exists(`${key}_idle`)) {
      anims.create({
        key: `${key}_idle`,
        frames: anims.generateFrameNumbers('soldier_idle', { frames: [0, 1, 2, 3, 4, 5, 6] }),
        frameRate: 8,
        repeat: -1
      })
    }
    
    // Walk (7 кадров)
    if (!anims.exists(`${key}_walk`)) {
      anims.create({
        key: `${key}_walk`,
        frames: anims.generateFrameNumbers('soldier_walk', { frames: [0, 1, 2, 3, 4, 5, 6] }),
        frameRate: 12,
        repeat: -1
      })
    }
  }
}

// Функция для получения ключа спрайта по специализации
export function getSpecialistSpriteKey(profession: string): string | null {
  const key = profession.toLowerCase()
  if (key === 'безработный') {
    return 'unemployed_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'повар') {
    return 'chef_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'химик') {
    return 'chemist_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'доктор' || key === 'врач') {
    return 'doctor_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'инженер') {
    return 'engineer_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'бездомный') {
    return 'homeless_idle' // Используем idle_2 для бездомного
  }
  if (key === 'охотник') {
    return 'hunter_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'сантехник') {
    return 'plumber_idle' // Возвращаем базовый спрайт для создания (Idle_2)
  }
  if (key === 'ученый' || key === 'учёный') {
    return 'scientist_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'разведчик') {
    return 'scout_idle' // Возвращаем базовый спрайт для создания
  }
  if (key === 'солдат') {
    return 'soldier_idle' // Возвращаем базовый спрайт для создания
  }
  return null
}

// Функция для проверки является ли текстура спрайтом специализации
export function isSpecialistSprite(textureKey: string): boolean {
  const specialistTextures = [
    'unemployed_idle', 'chef_idle', 'chemist_idle', 'doctor_idle', 'engineer_idle',
    'homeless_idle', 'hunter_idle', 'plumber_idle', 'scientist_idle', 'scout_idle', 'soldier_idle'
  ]
  return specialistTextures.includes(textureKey)
}


