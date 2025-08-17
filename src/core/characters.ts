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


