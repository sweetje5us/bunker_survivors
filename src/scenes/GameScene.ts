import Phaser from 'phaser'
import { t } from '../core/i18n'
import { onResize, isPortrait } from '../core/responsive'
import { THEME, applyPanelBackground, uiScale, fs } from '../core/theme'
import type { Difficulty } from './DifficultyScene'
import { ParallaxBackground } from '../core/parallax'
import { SimpleBunkerView } from '../core/bunkerView'
import { createCharacterSprite, pickSkinForGender, ensureCharacterAnimations, pickClothingSetForGender, pickHairForGender } from '../core/characters'

type Phase = 'day' | 'night'

type MobilePanel = 'bunker' | 'info' | 'people' | 'resources'

export class GameScene extends Phaser.Scene {
  private difficulty: Difficulty = 'normal'
  private dayNumber = 1
  private phase: Phase = 'day'
  private readonly DAY_DURATION_MS = 3 * 60 * 1000
  private readonly NIGHT_DURATION_MS = 2 * 60 * 1000
  private dayCycleStartAt = 0
  private phaseEndsAt = 0
  private clockEvent?: Phaser.Time.TimerEvent
  private midnightHandled = false

  private topBar?: Phaser.GameObjects.Container
  private dayText?: Phaser.GameObjects.Text
  private resourcesText?: Phaser.GameObjects.Text
  private abilitiesBtn?: Phaser.GameObjects.Text
  private pauseBtn?: Phaser.GameObjects.Text
  private populationBtn?: Phaser.GameObjects.Text
  private happinessBtn?: Phaser.GameObjects.Text
  private defenseBtn?: Phaser.GameObjects.Text
  private ammoBtn?: Phaser.GameObjects.Text
  private comfortBtn?: Phaser.GameObjects.Text
  private foodBtn?: Phaser.GameObjects.Text
  private waterBtn?: Phaser.GameObjects.Text
  private moneyBtn?: Phaser.GameObjects.Text

  private surfaceArea?: Phaser.GameObjects.Container
  private parallax?: ParallaxBackground
  private personArea?: Phaser.GameObjects.Container
  private peopleArea?: Phaser.GameObjects.Container
  private resourcesArea?: Phaser.GameObjects.Container
  private personTop?: Phaser.GameObjects.Container
  private personBottom?: Phaser.GameObjects.Container
  private personEntranceImage?: Phaser.GameObjects.Image
  private acceptBtnObj?: Phaser.GameObjects.Text
  private denyBtnObj?: Phaser.GameObjects.Text
  private defendBtnObj?: Phaser.GameObjects.Text
  private personPreview?: Phaser.GameObjects.Rectangle
  private personPreviewSprite?: Phaser.GameObjects.Sprite
  private personPreviewShirt?: Phaser.GameObjects.Sprite
  private personPreviewPants?: Phaser.GameObjects.Sprite
  private personPreviewFootwear?: Phaser.GameObjects.Sprite
  private personPreviewHair?: Phaser.GameObjects.Sprite
  private gunSprite?: Phaser.GameObjects.Image
  private gunAnimTimer?: Phaser.Time.TimerEvent
  private enemyHpBg?: Phaser.GameObjects.Rectangle
  private enemyHpFg?: Phaser.GameObjects.Rectangle
  private currentWeapon: 'melee' | 'pistol' | 'shotgun' | 'ar' | 'sniper' = 'pistol'
  private lastHourTick: number = -1
  private sessionSeed: number = 0
  private personCache: Map<number, { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; loot: { ammo: number; food: number; water: number; money: number } }> = new Map()
  private noSpaceLabel?: Phaser.GameObjects.Text
  private personNameText?: Phaser.GameObjects.Text
  private personDetailsText?: Phaser.GameObjects.Text
  private personSkillText?: Phaser.GameObjects.Text
  private bunkerArea?: Phaser.GameObjects.Container
  private simpleBunker?: SimpleBunkerView

  private visitorsRemaining = 3
  private surfaceQueue?: Phaser.GameObjects.Container
  private queueItems: { id: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; exiting?: boolean }[] = []
  private nextVisitorId = 1
  private arrivalEvent?: Phaser.Time.TimerEvent
  private initialQueueSeeded = false
  private lastSurfaceRect?: Phaser.Geom.Rectangle
  // Enemies
  private surfaceEnemyQueue?: Phaser.GameObjects.Container
  private enemyQueueItems: { id: number; rect: Phaser.GameObjects.Rectangle; type: string; exiting?: boolean; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite }[] = []
  private nextEnemyId = 1
  private enemyArrivalEvent?: Phaser.Time.TimerEvent
  private _previewBusy: boolean = false
  private _previewCurrentId: number | null = null
  private _previewCurrentIsEnemy: boolean = false
  private lastPersonRect?: Phaser.Geom.Rectangle
  
  // Люди в бункере
  private bunkerResidents: Array<{
    id: number
    name: string
    gender: string
    age: number
    profession: string
    skills: Array<{ text: string; positive: boolean }>
    itemsText: string
    admittedAt: number
    status?: string
    // Потребности 0..100 (100 = полно/здоров/энергичен)
    hunger?: number
    thirst?: number
    energy?: number
    health?: number
    patient?: boolean
  }> = []
  
  private mobileActive: MobilePanel = 'info'
  private mobileTabs?: Phaser.GameObjects.Container
  
  // Базовые ресурсы
  private happiness = 50
  private defense = 50
  private ammo = 100
  private comfort = 100
  private food = 100
  private water = 100
  private money = 200
  // Идентификаторы жителей, с которых уже были добавлены ресурсы (чтобы не терять и не дублировать)
  private claimedLootIds: Set<number> = new Set()
  
  private hasSkill(skills: Array<{ text: string; positive: boolean }> | undefined, name: string): boolean {
    if (!Array.isArray(skills)) return false
    return skills.some(s => s && typeof s.text === 'string' && s.text.toLowerCase() === name.toLowerCase())
  }

  private computeSoldierShotsPerHour(skills: Array<{ text: string; positive: boolean }> | undefined): number {
    // База 1 выстрел/час
    let shots = 1
    if (!Array.isArray(skills)) return shots
    // трудолюбивый: +1
    if (this.hasSkill(skills, 'трудолюбивый')) shots += 1
    // гений: +2
    if (this.hasSkill(skills, 'гений')) shots += 2
    // выгоревший: 30% не работает в этот час
    if (this.hasSkill(skills, 'выгоревший') && Math.random() < 0.3) return 0
    // группа инвалидности: -33%
    if (this.hasSkill(skills, 'группа инвалидности')) shots = Math.max(0, Math.floor(shots * (2 / 3)))
    // лентяй: 60% отдыхает
    if (this.hasSkill(skills, 'лентяй') && Math.random() < 0.6) return 0
    return Math.max(0, shots)
  }
  private getBunkerCapacity(): number {
    // 1 "Комната отдыха" = 4 места. Считаем из текущего bunkerView
    const bv: any = this.simpleBunker
    if (!bv || !(bv as any).roomNames) return 0
    const rooms: string[] = (bv as any).roomNames || []
    const restCount = rooms.filter(n => n === 'Комната отдыха').length
    return restCount * 4
  }

  private playPistolOnce(): void {
    if (!this.gunSprite) return
    this.gunAnimTimer?.remove(false)
    const seq: Array<{ key: string; d: number }> = [
      { key: 'pistol_f00', d: 300 },
      { key: 'pistol_f01', d: 20 },
      { key: 'pistol_f02', d: 20 },
      { key: 'pistol_f03', d: 20 },
      { key: 'pistol_f04', d: 30 },
      { key: 'pistol_f05', d: 30 },
      { key: 'pistol_f06', d: 50 },
      { key: 'pistol_f07', d: 50 },
      { key: 'pistol_f08', d: 50 },
      { key: 'pistol_f09', d: 100 },
      { key: 'pistol_f10', d: 100 },
      { key: 'pistol_f11', d: 50 }
    ]
    let i = 0
    const step = () => {
      if (!this.gunSprite) return
      const f = seq[i]
      this.gunSprite.setTexture(f.key)
      i += 1
      if (i >= seq.length) {
        // Вернуть на первый кадр
        this.gunSprite.setTexture('pistol_f00')
        return
      }
      this.gunAnimTimer = this.time.delayedCall(seq[i].d, step)
    }
    step()
  }

  private ensureZombieAnimations(): void {
    const A = this.anims
    const mk = (key: string, sheet: string, frames: number, frameRate: number) => {
      if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end: frames - 1 }), frameRate, repeat: -1 })
    }
    // Wild
    mk('z_wild_walk', 'zombie_wild_walk', 10, 10)
    mk('z_wild_idle', 'zombie_wild_idle', 9, 6)
    if (!A.exists('z_wild_dead')) A.create({ key: 'z_wild_dead', frames: A.generateFrameNumbers('zombie_wild_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_wild_hurt')) A.create({ key: 'z_wild_hurt', frames: A.generateFrameNumbers('zombie_wild_hurt', { start: 0, end: 4 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_wild_attack')) A.create({ key: 'z_wild_attack', frames: A.generateFrameNumbers('zombie_wild_attack1', { start: 0, end: 3 }), frameRate: 10, repeat: 0 })
    // Man
    mk('z_man_walk', 'zombie_man_walk', 8, 10)
    mk('z_man_idle', 'zombie_man_idle', 8, 6)
    if (!A.exists('z_man_dead')) A.create({ key: 'z_man_dead', frames: A.generateFrameNumbers('zombie_man_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_man_hurt')) A.create({ key: 'z_man_hurt', frames: A.generateFrameNumbers('zombie_man_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_man_attack')) A.create({ key: 'z_man_attack', frames: A.generateFrameNumbers('zombie_man_attack', { start: 0, end: 10 }), frameRate: 10, repeat: 0 })
    // Woman
    mk('z_woman_walk', 'zombie_woman_walk', 7, 10)
    mk('z_woman_idle', 'zombie_woman_idle', 5, 6)
    if (!A.exists('z_woman_dead')) A.create({ key: 'z_woman_dead', frames: A.generateFrameNumbers('zombie_woman_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_woman_hurt')) A.create({ key: 'z_woman_hurt', frames: A.generateFrameNumbers('zombie_woman_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_woman_attack')) A.create({ key: 'z_woman_attack', frames: A.generateFrameNumbers('zombie_woman_attack1', { start: 0, end: 3 }), frameRate: 10, repeat: 0 })
  }

  private ensureMutantAnimations(): void {
    const A = this.anims
    const mkLoop = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: -1 }) }
    const mkOnce = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: 0 }) }
    // m1
    mkLoop('m1_walk', 'mutant1_walk', 9, 10); mkLoop('m1_idle', 'mutant1_idle', 5, 6)
    mkOnce('m1_dead', 'mutant1_dead', 4, 8); mkOnce('m1_hurt', 'mutant1_hurt', 3, 10); mkOnce('m1_attack', 'mutant1_attack', 4, 10)
    // m2
    mkLoop('m2_walk', 'mutant2_walk', 9, 10); mkLoop('m2_idle', 'mutant2_idle', 5, 6)
    mkOnce('m2_dead', 'mutant2_dead', 4, 8); mkOnce('m2_hurt', 'mutant2_hurt', 3, 10); mkOnce('m2_attack', 'mutant2_attack', 4, 10)
    // m3
    mkLoop('m3_walk', 'mutant3_walk', 9, 10); mkLoop('m3_idle', 'mutant3_idle', 5, 6)
    mkOnce('m3_dead', 'mutant3_dead', 4, 8); mkOnce('m3_hurt', 'mutant3_hurt', 3, 10); mkOnce('m3_attack', 'mutant3_attack', 4, 10)
    // m4
    mkLoop('m4_walk', 'mutant4_walk', 9, 10); mkLoop('m4_idle', 'mutant4_idle', 5, 6)
    mkOnce('m4_dead', 'mutant4_dead', 4, 8); mkOnce('m4_hurt', 'mutant4_hurt', 3, 10); mkOnce('m4_attack', 'mutant4_attack', 4, 10)
  }

  private ensureSoldierAnimations(): void {
    const A = this.anims
    const mkLoop = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: -1 }) }
    const mkOnce = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: 0 }) }
    mkLoop('sold_walk', 'soldier_walk', 7, 10)
    mkLoop('sold_idle', 'soldier_idle', 6, 6)
    mkOnce('sold_dead', 'soldier_dead', 4, 8)
    mkOnce('sold_hurt', 'soldier_hurt', 3, 10)
  }

  private pickEnemyType(): 'МАРОДЕР' | 'ЗОМБИ' | 'МУТАНТ' | 'СОЛДАТ' {
    const day = Math.max(0, this.dayNumber - 1)
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const diff = this.difficulty
    // Базовые веса по сложности
    let base = { M: 0.5, Z: 0.3, Mu: 0.15, S: 0.05 }
    if (diff === 'easy') base = { M: 0.65, Z: 0.25, Mu: 0.08, S: 0.02 }
    if (diff === 'hard') base = { M: 0.35, Z: 0.35, Mu: 0.2, S: 0.1 }
    // Рост сложности с днём: постепенно уменьшаем мародёров и увеличиваем остальных
    const t = clamp01(day / 12)
    const wM = lerp(base.M, base.M * 0.4, t)
    const wZ = lerp(base.Z, base.Z + 0.1, t)
    const wMu = lerp(base.Mu, base.Mu + 0.1, t)
    const wS = lerp(base.S, base.S + 0.05, t)
    const sum = wM + wZ + wMu + wS
    const r = Math.random() * sum
    if (r < wM) return 'МАРОДЕР'
    if (r < wM + wZ) return 'ЗОМБИ'
    if (r < wM + wZ + wMu) return 'МУТАНТ'
    return 'СОЛДАТ'
  }

  private fireWeaponOnce(): void {
    // Требуется враг
    if (this.enemyQueueItems.length === 0) return
    // Тратим патрон (кроме melee)
    if (this.currentWeapon !== 'melee') {
      if (this.ammo <= 0) { this.showToast('Нет патронов'); return }
      this.ammo = Math.max(0, this.ammo - 1)
      this.updateResourcesText()
    }
    // Анимация выстрела пистолета (пока только пистолет)
    if (this.currentWeapon === 'pistol') this.playPistolOnce()

    // Урон по первому врагу в очереди
    const enemy = this.enemyQueueItems[0] as any
    if (enemy) {
      // Инициализация HP/MaxHP, если нет — используем новую шкалу
      if (enemy.maxHp == null) { enemy.maxHp = (this as any).hpByType ? (this as any).hpByType(enemy.type) : 3; enemy.hp = enemy.maxHp }
      // Урон оружия
      let dmg = 1
      switch (this.currentWeapon) {
        case 'melee': dmg = 1; break
        case 'pistol': dmg = 1; break
        case 'shotgun': dmg = 2; break
        case 'ar': dmg = 1; break
        case 'sniper': dmg = 3; break
      }
      enemy.hp = Math.max(0, (enemy.hp ?? enemy.maxHp) - dmg)
      // Обновим HP-бар (layoutPersonArea вызывает это при следующем layout)
      if (enemy.hp <= 0) {
        // Смерть: сыграть анимацию death/dead, затем увести и только потом показать следующего
        const it = this.enemyQueueItems.shift()!
        it.exiting = true
        // Проиграть death в превью, если сейчас показываем этого врага
        try {
          const samePreviewEnemy = (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === it.id
          if (samePreviewEnemy) {
            if (this.personPreviewSprite && this.personPreviewSprite.visible) {
              if ((it as any).zombieKind) {
                const kind = (it as any).zombieKind
                if (kind === 'wild') this.personPreviewSprite.anims.play('z_wild_dead', true)
                else if (kind === 'man') this.personPreviewSprite.anims.play('z_man_dead', true)
                else this.personPreviewSprite.anims.play('z_woman_dead', true)
              } else if ((it as any).mutantKind) {
                const k = (it as any).mutantKind
                this.personPreviewSprite.anims.play(`m${k}_dead`, true)
              } else if (it.type === 'СОЛДАТ') {
                this.ensureSoldierAnimations(); this.personPreviewSprite.anims.play('sold_dead', true)
              }
            }
            // Мародёр в превью — послойно
            if (it.type === 'МАРОДЕР') {
              const play = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; try { s.anims.play(`${s.texture.key}_dead`, true) } catch {} }
              play(this.personPreviewSprite)
              play(this.personPreviewShirt)
              play(this.personPreviewPants)
              play(this.personPreviewFootwear)
              play(this.personPreviewHair)
            }
          }
        } catch {}
        try {
          if (it.type === 'МАРОДЕР') {
            const play = (s?: Phaser.GameObjects.Sprite, key?: string) => { if (!s || !key) return; try { s.anims.play(`${key}_dead`, true) } catch {} }
            play(it.sprite, it.sprite?.texture.key); play(it.shirt, it.shirt?.texture.key); play(it.pants, it.pants?.texture.key); play(it.footwear, it.footwear?.texture.key); play(it.hair, it.hair?.texture.key)
          } else if (it.type === 'ЗОМБИ' && (it as any).sprite) {
            const spr = (it as any).sprite as Phaser.GameObjects.Sprite
            if ((it as any).zombieKind === 'wild') spr.anims.play('z_wild_dead', true)
            else if ((it as any).zombieKind === 'man') spr.anims.play('z_man_dead', true)
            else spr.anims.play('z_woman_dead', true)
          } else if (it.type === 'МУТАНТ' && (it as any).sprite) {
            const k = (it as any).mutantKind; (it as any).sprite.anims.play(`m${k}_dead`, true)
          } else if (it.type === 'СОЛДАТ' && (it as any).sprite) {
            (it as any).sprite.anims.play('sold_dead', true)
          }
        } catch {}
        // Подождём полсекунды, затем уводим влево
        ;(this as any)._previewBusy = true
        this.time.delayedCall(500, () => {
          const tweenTargets: any[] = [it.rect]
          if (it.sprite) tweenTargets.push(it.sprite)
          if (it.shirt) tweenTargets.push(it.shirt)
          if (it.pants) tweenTargets.push(it.pants)
          if (it.footwear) tweenTargets.push(it.footwear)
          if (it.hair) tweenTargets.push(it.hair)
          this.tweens.add({ targets: tweenTargets, x: -60, alpha: 0.7, duration: 450, ease: 'Sine.easeIn', onComplete: () => {
            it.rect.destroy(); it.sprite?.destroy(); it.shirt?.destroy(); it.pants?.destroy(); it.footwear?.destroy(); it.hair?.destroy()
            if (this.lastPersonRect) this.layoutEnemyQueue(this.lastPersonRect)
            ;(this as any)._previewBusy = false
            this.updatePersonInfoFromQueue()
            if (this.enemyQueueItems.length === 0) { this.enemyHpBg?.setVisible(false); this.enemyHpFg?.setVisible(false) }
          } })
        })
      } else {
        // Hurt/Hit: краткая анимация урона
        try {
          const samePreviewEnemy = (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === enemy.id
          if (enemy.type === 'МАРОДЕР') {
            const play = (s?: Phaser.GameObjects.Sprite, key?: string) => { if (!s || !key) return; try { s.anims.play(`${key}_hurt`, true) } catch {} }
            play(enemy.sprite, enemy.sprite?.texture.key); play(enemy.shirt, enemy.shirt?.texture.key); play(enemy.pants, enemy.pants?.texture.key); play(enemy.footwear, enemy.footwear?.texture.key); play(enemy.hair, enemy.hair?.texture.key)
            // В превью — послойно
            if (samePreviewEnemy) {
              const playPrev = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; try { s.anims.play(`${s.texture.key}_hurt`, true) } catch {} }
              playPrev(this.personPreviewSprite)
              playPrev(this.personPreviewShirt)
              playPrev(this.personPreviewPants)
              playPrev(this.personPreviewFootwear)
              playPrev(this.personPreviewHair)
            }
            this.time.delayedCall(250, () => {
              const idle = (s?: Phaser.GameObjects.Sprite, key?: string) => { if (!s || !key) return; try { s.anims.play(`${key}_idle`, true) } catch {} }
              idle(enemy.sprite, enemy.sprite?.texture.key); idle(enemy.shirt, enemy.shirt?.texture.key); idle(enemy.pants, enemy.pants?.texture.key); idle(enemy.footwear, enemy.footwear?.texture.key); idle(enemy.hair, enemy.hair?.texture.key)
              if (samePreviewEnemy) {
                const idlePrev = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; try { s.anims.play(`${s.texture.key}_idle`, true) } catch {} }
                idlePrev(this.personPreviewSprite)
                idlePrev(this.personPreviewShirt)
                idlePrev(this.personPreviewPants)
                idlePrev(this.personPreviewFootwear)
                idlePrev(this.personPreviewHair)
              }
            })
          } else if (enemy.type === 'ЗОМБИ' && enemy.sprite) {
            if (enemy.zombieKind === 'wild') enemy.sprite.anims.play('z_wild_hurt', true)
            else if (enemy.zombieKind === 'man') enemy.sprite.anims.play('z_man_hurt', true)
            else enemy.sprite.anims.play('z_woman_hurt', true)
            if (samePreviewEnemy && this.personPreviewSprite) {
              if (enemy.zombieKind === 'wild') this.personPreviewSprite.anims.play('z_wild_hurt', true)
              else if (enemy.zombieKind === 'man') this.personPreviewSprite.anims.play('z_man_hurt', true)
              else this.personPreviewSprite.anims.play('z_woman_hurt', true)
            }
            this.time.delayedCall(250, () => {
              if (enemy.zombieKind === 'wild') enemy.sprite.anims.play('z_wild_idle', true)
              else if (enemy.zombieKind === 'man') enemy.sprite.anims.play('z_man_idle', true)
              else enemy.sprite.anims.play('z_woman_idle', true)
              if (samePreviewEnemy && this.personPreviewSprite) {
                if (enemy.zombieKind === 'wild') this.personPreviewSprite.anims.play('z_wild_idle', true)
                else if (enemy.zombieKind === 'man') this.personPreviewSprite.anims.play('z_man_idle', true)
                else this.personPreviewSprite.anims.play('z_woman_idle', true)
              }
            })
          } else if (enemy.type === 'МУТАНТ' && enemy.sprite) {
            const k = enemy.mutantKind; enemy.sprite.anims.play(`m${k}_hurt`, true); this.time.delayedCall(250, () => { enemy.sprite.anims.play(`m${k}_idle`, true) })
            if (samePreviewEnemy && this.personPreviewSprite) { this.personPreviewSprite.anims.play(`m${enemy.mutantKind}_hurt`, true); this.time.delayedCall(250, () => { this.personPreviewSprite?.anims?.play(`m${enemy.mutantKind}_idle`, true) }) }
          } else if (enemy.type === 'СОЛДАТ' && enemy.sprite) {
            enemy.sprite.anims.play('sold_hurt', true); this.time.delayedCall(250, () => { enemy.sprite.anims.play('sold_idle', true) })
            if (samePreviewEnemy && this.personPreviewSprite) { this.ensureSoldierAnimations(); this.personPreviewSprite.anims.play('sold_hurt', true); this.time.delayedCall(250, () => { this.personPreviewSprite?.anims?.play('sold_idle', true) }) }
          }
        } catch {}
      }
      // Перерисуем панель для обновления полоски HP
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    }
  }
  constructor() {
    super('Game')
  }

  init(data: { difficulty?: Difficulty }): void {
    if (data?.difficulty) this.difficulty = data.difficulty
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1b1e')

    // Инициализация ресурсов в зависимости от сложности
    this.initResourcesBasedOnDifficulty()
    // Случайный сессионный сид для разнообразия генерации персонажей
    this.sessionSeed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
    console.log('[GameScene] sessionSeed:', this.sessionSeed, 'difficulty:', this.difficulty)

    // Top bar
    this.topBar = this.add.container(0, 0)
    const s = uiScale(this)
    const barBg = this.add.rectangle(0, 0, 100, Math.round(56 * s), 0x111214).setOrigin(0)
    this.dayText = this.add.text(16, Math.round(8 * s), `${t('day')}: ${this.dayNumber} • ${t(this.phase === 'day' ? 'dayPhase' : 'nightPhase')}`, {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 12),
      color: THEME.colors.text
    })
    this.resourcesText = this.add.text(16, Math.round(28 * s), '', {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: THEME.colors.textMuted
    })
    // Инициализируем строку ресурсов после создания контейнеров, чтобы избежать нулевых ссылок
    this.time.delayedCall(0, () => this.updateResourcesText())
    // Кнопка населения (десктоп). Кликабельно только на десктопе; на мобильном переключает вкладку PEOPLE
    this.populationBtn = this.add.text(16, Math.round(28 * s), '', {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: THEME.colors.accentGreen
    }).setInteractive({ useHandCursor: true })
    this.populationBtn.on('pointerdown', () => this.openResidentsOverlay())
    // Кнопки ресурсов
    this.happinessBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#81c784' }).setInteractive({ useHandCursor: true })
    this.happinessBtn.on('pointerdown', () => this.openResourceOverlay('СЧАСТЬЕ'))
    this.defenseBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#ffca28' }).setInteractive({ useHandCursor: true })
    this.defenseBtn.on('pointerdown', () => this.openResourceOverlay('ЗАЩИТА'))
    this.ammoBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#90caf9' }).setInteractive({ useHandCursor: true })
    this.ammoBtn.on('pointerdown', () => this.openResourceOverlay('ПАТРОНЫ'))
    this.comfortBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#ce93d8' }).setInteractive({ useHandCursor: true })
    this.comfortBtn.on('pointerdown', () => this.openResourceOverlay('КОМФОРТ'))
    // Еда, Вода, Деньги как отдельные кнопки
    this.foodBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: THEME.colors.text }).setInteractive({ useHandCursor: true })
    this.foodBtn.on('pointerdown', () => this.openResourceOverlay(t('food').toUpperCase()))
    this.waterBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: THEME.colors.text }).setInteractive({ useHandCursor: true })
    this.waterBtn.on('pointerdown', () => this.openResourceOverlay(t('water').toUpperCase()))
    this.moneyBtn = this.add.text(0, Math.round(28 * s), '', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: THEME.colors.text }).setInteractive({ useHandCursor: true })
    this.moneyBtn.on('pointerdown', () => this.openResourceOverlay(t('money').toUpperCase()))
    this.abilitiesBtn = this.add.text(0, Math.round(8 * s), `[ ${t('abilities')} ]`, {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: THEME.colors.accentGreen
    }).setInteractive({ useHandCursor: true })
    this.abilitiesBtn.on('pointerdown', () => {
      this.showToast(t('abilitiesWip'))
    })
    this.pauseBtn = this.add.text(0, Math.round(8 * s), `[ ${t('pause')} ]`, {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: THEME.colors.accentYellow
    }).setInteractive({ useHandCursor: true })
    this.pauseBtn.on('pointerdown', () => this.togglePause())
    this.topBar.add([barBg, this.dayText, this.populationBtn!, this.happinessBtn!, this.defenseBtn!, this.ammoBtn!, this.comfortBtn!, this.foodBtn!, this.waterBtn!, this.moneyBtn!, this.resourcesText, this.abilitiesBtn, this.pauseBtn])
    this.topBar.setDepth(1000)

    // Areas containers
    this.surfaceArea = this.add.container(0, 0)
    this.personArea = this.add.container(0, 0)
    this.peopleArea = this.add.container(0, 0)
    this.resourcesArea = this.add.container(0, 0)
    this.bunkerArea = this.add.container(0, 0)
    // Set explicit depths - все области на одном уровне, но топ-бар выше
    this.surfaceArea.setDepth(2)
    this.personArea.setDepth(2)
    this.peopleArea.setDepth(2)
    this.resourcesArea.setDepth(2)
    this.bunkerArea.setDepth(2)

    // Placeholders content
    this.buildSurfacePlaceholders()
    this.buildPersonPlaceholders()
    this.buildBunkerPlaceholders()

    // Запускаем цикл дня/ночи по времени
    this.startDayPhase(true)
    // Периодическое обновление часов и смены фазы — каждые 150мс
    this.clockEvent = this.time.addEvent({ delay: 150, loop: true, callback: () => this.tickClockAndPhase() })
    // Чистка по выключению сцены
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.clockEvent?.remove(false))

    // Resize handling
    onResize(this, () => this.layout())
    this.layout()
    
    // Принудительно применяем лэйаут для корректной инициализации позиций превью и кнопок
    this.time.delayedCall(0, () => this.layout())
    this.time.delayedCall(50, () => this.layout())
  }

  private initResourcesBasedOnDifficulty(): void {
    // База для NORMAL
    this.happiness = 50
    this.defense = 50
    this.ammo = 100
    this.comfort = 100
    this.food = 100
    this.water = 100
    this.money = 200

    // Модификатор сложности только для food/water/ammo/money
    const scale = this.difficulty === 'easy' ? 1.25 : this.difficulty === 'hard' ? 0.75 : 1
    this.food = Math.round(this.food * scale)
    this.water = Math.round(this.water * scale)
    this.ammo = Math.round(this.ammo * scale)
    this.money = Math.round(this.money * scale)
  }

  // ======== Daily resources processing ========
  private getRoomCount(roomName: string): number {
    const bv: any = this.simpleBunker
    if (!bv || !(bv as any).roomNames) return 0
    const rooms: string[] = (bv as any).roomNames || []
    return rooms.filter(n => n === roomName).length
  }

  private processDailyResources(): void {
    const residents = this.bunkerResidents.length
    const diningCount = this.getRoomCount('Столовая')
    const toiletCount = this.getRoomCount('Туалет')

    // Accumulation
    const foodGain = diningCount * 2
    const waterGain = toiletCount * 2
    // Consumption (per resident)
    const foodUse = residents * 1
    const waterUse = residents * 1

    this.food = Math.max(0, this.food + foodGain - foodUse)
    this.water = Math.max(0, this.water + waterGain - waterUse)

    // Happiness dynamics
    const deltaH = this.computeDailyHappinessDelta(residents)
    this.happiness = Math.max(0, Math.min(100, this.happiness + deltaH))

    this.updateResourcesText()
  }

  private computeDailyHappinessDelta(residents: number): number {
    if (residents === 0) return 0

    let delta = 0
    // Food satisfaction
    if (this.food >= residents) delta += 2
    else delta -= Math.min(5, residents - this.food)
    // Water satisfaction
    if (this.water >= residents) delta += 2
    else delta -= Math.min(5, residents - this.water)
    // Comfort
    if (this.comfort >= 70) delta += 1
    else if (this.comfort < 40) delta -= 2
    // Defense
    if (this.defense >= 70) delta += 1
    else if (this.defense < 30) delta -= 2
    // Money buffer
    if (this.money >= 200) delta += 1
    else if (this.money < 50) delta -= 1

    return Phaser.Math.Clamp(delta, -10, 6)
  }

  private buildSurfacePlaceholders(): void {
    if (!this.surfaceArea) return
    const oldLabel = this.surfaceArea.list.find(g => g.name === 'surfaceLabel') as Phaser.GameObjects.Text | undefined
    if (oldLabel) oldLabel.destroy()
    const surfaceLabel = this.add.text(8, 8, t('surface').toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#b71c1c' })
    surfaceLabel.name = 'surfaceLabel'
    this.surfaceArea.add([surfaceLabel])
    if (!this.surfaceQueue) {
      this.surfaceQueue = this.add.container(0, 0)
      this.surfaceArea.add(this.surfaceQueue)
    }
    if (!this.surfaceEnemyQueue) {
      this.surfaceEnemyQueue = this.add.container(0, 0)
      this.surfaceArea.add(this.surfaceEnemyQueue)
    }
  }

  private buildPersonPlaceholders(): void {
    if (!this.personArea) return
    this.personArea.removeAll(true)

    // Верхняя часть: вход в бункер + Accept / Deny
    this.personTop = this.add.container(0, 0)
    // Фоновая подложка для обеспечения валидной области контейнера (перехватывает размеры)
    const topBg = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0)
    this.personTop.add(topBg)
    const entranceImg = this.add.image(0, 0, 'room_entrance_out').setOrigin(0.5)
    this.personEntranceImage = entranceImg
    // Превью текущего персонажа (спрайт + рамка)
    this.personPreviewSprite = this.add.sprite(0, 0, undefined as unknown as string)
    this.personPreviewSprite.setOrigin(0.5, 1)
    this.personPreviewSprite.setVisible(false)
    this.personTop.add(this.personPreviewSprite)
    this.personPreviewShirt = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewPants = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewFootwear = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewHair = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personTop.add(this.personPreviewShirt)
    this.personTop.add(this.personPreviewPants)
    this.personTop.add(this.personPreviewFootwear)
    this.personTop.add(this.personPreviewHair)
    this.personPreview = this.add.rectangle(0, 0, 56, 72, 0x000000, 0).setOrigin(0.5, 1)
    // Отключаем отладочную рамку превью навсегда
    this.personPreview.setStrokeStyle(0)
    this.personPreview.setVisible(false)
    this.personTop.add(this.personPreview)
    this.acceptBtnObj = this.add.text(0, 0, `[ ${t('accept')} ]`, { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#81c784' }).setInteractive({ useHandCursor: true })
    this.denyBtnObj = this.add.text(0, 0, `[ ${t('deny')} ]`, { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373' }).setInteractive({ useHandCursor: true })
    this.defendBtnObj = this.add.text(0, 0, `[ ${'DEFENSE'} ]`, { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#ff8a65' }).setInteractive({ useHandCursor: true })
    // Изначально скрываем все кнопки
    this.acceptBtnObj.setVisible(false)
    this.denyBtnObj.setVisible(false)
    this.defendBtnObj.setVisible(false)
    this.acceptBtnObj.on('pointerdown', () => this.decideCurrent(true))
    this.denyBtnObj.on('pointerdown', () => this.decideCurrent(false))
    this.defendBtnObj.on('pointerdown', () => this.showToast('Битва: WIP'))
    this.personTop.add([entranceImg, this.acceptBtnObj, this.denyBtnObj])
    this.personTop.add(this.defendBtnObj)
    // Надпись "нет мест"
    this.noSpaceLabel = this.add.text(0, 0, 'НЕТ МЕСТ', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373' }).setOrigin(0.5)
    this.noSpaceLabel.setVisible(false)
    this.personTop.add(this.noSpaceLabel)

    // Нижняя часть: детали персонажа
    this.personBottom = this.add.container(0, 0)
    this.personNameText = this.add.text(0, 0, `${t('name')}: ???`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })
    this.personDetailsText = this.add.text(0, 0, `${t('age')}: ??\nПОЛ: ??\n${t('specialty')}: ??\n${t('inventory')}: ??`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })
    this.personSkillText = this.add.text(0, 0, `${t('skill')}: ???`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })
    // Изначально скрываем детали персонажа
    this.personNameText.setVisible(false)
    this.personDetailsText.setVisible(false)
    this.personSkillText.setVisible(false)
    this.personBottom.add([this.personNameText, this.personDetailsText, this.personSkillText])

    this.personArea.add([this.personTop, this.personBottom])
    this.updatePersonInfoFromQueue()
  }

  private buildBunkerPlaceholders(): void {
    if (!this.bunkerArea) return
    this.bunkerArea.removeAll(true)
    
    // Создаём маску для ограничения содержимого bunkerArea
    const bunkerMask = this.add.graphics()
    bunkerMask.setVisible(false) // Маска невидима
    this.bunkerArea.setMask(bunkerMask.createGeometryMask())
    this.bunkerArea.setData('mask', bunkerMask)
    
    const label = this.add.text(8, 6, t('bunkerView').toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#b71c1c' })
    label.name = 'bunkerLabel'
    this.bunkerArea.add([label])
    this.simpleBunker = new SimpleBunkerView(this, this.bunkerArea)
    // В контейнерах Phaser порядок определяется позицией в списке, depth внутри контейнера не влияет.
    // Поднимем заголовок в конец списка, чтобы он был поверх картинок комнат.
    this.bunkerArea.bringToTop(label)
  }

  private buildMobileTabs(x: number, y: number): void {
    if (this.mobileTabs) this.mobileTabs.destroy()
    const c = this.add.container(x, y)
    const makeBtn = (label: string, active: boolean, onClick: () => void, offsetX: number) => {
      const bg = this.add.rectangle(offsetX, 0, 96, 28, active ? 0x2a2d33 : 0x1a1d22).setOrigin(0, 0.5)
      bg.setStrokeStyle(1, active ? 0x4fc3f7 : 0x2a2d33)
      const text = this.add.text(offsetX + 8, 0, label, { fontFamily: THEME.fonts.body, fontSize: '10px', color: active ? '#ffffff' : THEME.colors.textMuted }).setOrigin(0, 0.5)
      const hit = this.add.rectangle(offsetX, 0, 96, 28, 0x000000, 0.001).setOrigin(0, 0.5)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', onClick)
      c.add([bg, text, hit])
    }
    makeBtn('INFO', this.mobileActive === 'info', () => { this.mobileActive = 'info'; this.layout() }, 0)
    makeBtn('BUNKER', this.mobileActive === 'bunker', () => { this.mobileActive = 'bunker'; this.layout() }, 104)
    makeBtn('PEOPLE', this.mobileActive === 'people', () => { this.mobileActive = 'people'; this.layout() }, 208)
    makeBtn('RESOURCES', this.mobileActive === 'resources', () => { this.mobileActive = 'resources'; this.layout() }, 312)
    this.mobileTabs = c
    this.mobileTabs.setDepth(900)
  }

  private layout(): void {
    const { width, height } = this.scale
    const portrait = isPortrait(this)
    const s = uiScale(this)

    // Layout top bar
    const barHeight = Math.round(56 * s)
    if (this.topBar) {
      const bg = this.topBar.getAt(0) as Phaser.GameObjects.Rectangle
      bg.width = width
      bg.height = barHeight
      this.topBar.setPosition(0, 0)
      this.pauseBtn?.setPosition(width - 16 - (this.pauseBtn.width), Math.round(8 * s))
      this.abilitiesBtn?.setPosition(width - 16 - (this.pauseBtn?.width ?? 0) - 16 - (this.abilitiesBtn?.width ?? 0), Math.round(8 * s))
      // Позиционирование Population и остальных ресурсов в одну строку
      this.arrangeTopBarRow()
    }

    // Areas rectangles
    const outer = 16
    const gap = 12

    let surfaceRect: Phaser.Geom.Rectangle
    let bunkerRect: Phaser.Geom.Rectangle
    let infoRect: Phaser.Geom.Rectangle
    let peopleRect: Phaser.Geom.Rectangle
    let resourcesRect: Phaser.Geom.Rectangle

    if (portrait) {
      const usableH = height - barHeight - outer * 2 - gap - 30
      const surfaceH = Math.max(180, Math.floor(usableH * 0.5))
      const bottomH = usableH - surfaceH
      const fullW = width - outer * 2
      surfaceRect = new Phaser.Geom.Rectangle(outer, barHeight + outer, fullW, surfaceH)
      const tabsY = surfaceRect.y + surfaceRect.height + 6
      this.buildMobileTabs(outer, tabsY)
      const bottomY = tabsY + 24 + 6
      bunkerRect = new Phaser.Geom.Rectangle(outer, bottomY, fullW, bottomH)
      infoRect = bunkerRect
      peopleRect = bunkerRect
      resourcesRect = bunkerRect
    } else {
      const contentH = height - barHeight - outer * 2
      const leftW = Math.max(420, Math.floor(width * 0.58))
      const rightW = width - outer * 2 - leftW - gap
      const leftX = outer
      const topY = barHeight + outer
      const surfaceH = Math.floor((contentH - gap) / 2)
      const bunkerH = contentH - surfaceH - gap
      surfaceRect = new Phaser.Geom.Rectangle(leftX, topY, leftW, surfaceH)
      bunkerRect = new Phaser.Geom.Rectangle(leftX, surfaceRect.bottom + gap, leftW, bunkerH)
      infoRect = new Phaser.Geom.Rectangle(surfaceRect.right + gap, topY, rightW, contentH)
      peopleRect = infoRect
      resourcesRect = infoRect
      if (this.mobileTabs) { this.mobileTabs.destroy(); this.mobileTabs = undefined }
    }

    const isDay = this.phase === 'day'
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t(isDay ? 'dayPhase' : 'nightPhase')} • ${this.getClockText()}`)

    // Surface
    this.surfaceArea?.setVisible(true)
    this.layoutContainer(this.surfaceArea!, surfaceRect)
    if (!this.parallax) this.parallax = new ParallaxBackground(this, this.surfaceArea!, surfaceRect, 5, isDay ? 'day' : 'night')
    this.parallax.layout(surfaceRect)
    this.parallax.setPhase(isDay ? 'day' : 'night')
    // Поднимем над параллаксом
    const surfLabel = this.surfaceArea?.list.find(g => g.name === 'surfaceLabel')
    if (surfLabel) this.surfaceArea?.bringToTop(surfLabel)
    if (this.surfaceQueue) this.surfaceArea?.bringToTop(this.surfaceQueue)
    if (this.surfaceEnemyQueue) this.surfaceArea?.bringToTop(this.surfaceEnemyQueue)
    // Враги должны быть поверх людей
    if (this.surfaceEnemyQueue) this.surfaceArea?.bringToTop(this.surfaceEnemyQueue)
    this.layoutQueue(surfaceRect)
    this.layoutEnemyQueue(surfaceRect)

    // Bunker
    const showBunker = !portrait || (portrait && this.mobileActive === 'bunker')
    this.bunkerArea?.setVisible(showBunker)
    if (showBunker) {
      this.layoutContainer(this.bunkerArea!, bunkerRect)
      this.simpleBunker?.layout(new Phaser.Geom.Rectangle(0, 0, Math.max(1, bunkerRect.width - 2), Math.max(1, bunkerRect.height - 2)))
      // Синхронизация количества визуальных жителей
      this.simpleBunker?.syncResidents(this.bunkerResidents.length)
    }

    // Info
    const showInfo = !portrait || (portrait && this.mobileActive === 'info')
    this.personArea?.setVisible(showInfo)
    if (showInfo) {
      this.layoutContainer(this.personArea!, infoRect)
      this.layoutPersonArea(infoRect)
      this.lastPersonRect = infoRect
      // Обновим превью сразу при первом лэйауте
      this.updatePersonInfoFromQueue()
    }

    // People panel (mobile dedicated tab)
    const showPeople = portrait && this.mobileActive === 'people'
    this.peopleArea?.setVisible(showPeople)
    if (showPeople) {
      this.layoutContainer(this.peopleArea!, peopleRect)
      this.buildPeoplePanel(peopleRect)
    }

    // Resources panel (mobile dedicated tab)
    const showResources = portrait && this.mobileActive === 'resources'
    this.resourcesArea?.setVisible(showResources)
    if (showResources) {
      this.layoutContainer(this.resourcesArea!, resourcesRect)
      this.buildResourcesPanel(resourcesRect)
    }
  }

  private layoutPersonArea(rect: Phaser.Geom.Rectangle): void {
    if (!this.personArea || !this.personTop || !this.personBottom) return
    const s = uiScale(this)
    const pad = 8
    const topH = Math.floor(rect.height * 0.5)
    const botH = rect.height - topH

    // Верхняя часть
    this.personTop.setPosition(0, 0)
    // Entrance image fit (contain)
    if (this.personEntranceImage) {
      const img = this.personEntranceImage
      const texW = img.texture.getSourceImage().width || 576
      const texH = img.texture.getSourceImage().height || 324
      const scale = Math.min(Math.max(1, rect.width) / texW, Math.max(1, topH - pad * 2) / texH)
      img.setScale(scale)
      img.setPosition(rect.width / 2, topH / 2)
    }
    // Accept / Deny кнопки
    const btnFont = fs(this, 12)
    const isNight = this.phase === 'night'
    const hasEnemies = this.enemyQueueItems.length > 0
    const hasVisitors = this.queueItems.length > 0
    const capacity = this.getBunkerCapacity()
    const hasCapacity = this.bunkerResidents.length < capacity
    const showDecision = !isNight && !hasEnemies && hasVisitors && hasCapacity
    const showDefense = hasEnemies

    if (this.acceptBtnObj && this.denyBtnObj && this.defendBtnObj) {
      this.acceptBtnObj.setVisible(showDecision)
      this.denyBtnObj.setVisible(showDecision)
      this.defendBtnObj.setVisible(showDefense)
      
      // Позиционирование Accept/Deny (всегда, независимо от видимости)
      this.acceptBtnObj.setFontSize(btnFont)
      this.denyBtnObj.setFontSize(btnFont)
      const space = 24 * s
      const y = topH - pad - this.acceptBtnObj.height / 2
      const totalW = this.acceptBtnObj.width + this.denyBtnObj.width + space
      const startX = rect.width / 2 - totalW / 2
      this.acceptBtnObj.setPosition(startX + this.acceptBtnObj.width / 2, y)
      this.denyBtnObj.setPosition(startX + this.acceptBtnObj.width + space + this.denyBtnObj.width / 2, y)
      this.acceptBtnObj.setOrigin(0.5)
      this.denyBtnObj.setOrigin(0.5)
      
      // Позиционирование Defense (всегда, независимо от видимости)
      this.defendBtnObj.setFontSize(btnFont)
      const defenseY = topH - pad - this.defendBtnObj.height / 2
      const defenseX = rect.width * 0.72
      this.defendBtnObj.setPosition(defenseX, defenseY)
      this.defendBtnObj.setOrigin(0.5)
    }

    // Оружие (только ночью, левый нижний угол personTop)
    const wantGun = hasEnemies
    if (wantGun) {
      if (!this.gunSprite) {
        this.gunSprite = this.add.image(0, 0, 'pistol_f00').setOrigin(0, 1)
        this.gunSprite.setDisplaySize(128, 64)
        this.gunSprite.setInteractive({ useHandCursor: true })
        this.gunSprite.on('pointerdown', () => this.fireWeaponOnce())
        this.personTop?.add(this.gunSprite)
      }
      const gx = pad
      const gy = topH - pad
      this.gunSprite.setPosition(gx, gy)
      this.gunSprite.setVisible(true)
    } else {
      // Скрываем, но оставляем объект, чтобы появлялся снова при новых врагах
      if (this.gunSprite) this.gunSprite.setVisible(false)
    }

    // Превью текущего персонажа или врага
    if (this.personPreview) {
      const showPreview = hasEnemies || (!isNight && hasVisitors)
      this.personPreview.setVisible(showPreview)
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(showPreview)
      if (showPreview) {
        const s = uiScale(this)
        const baseW = 48, baseH = 64
        let pw = Math.round(baseW * s)
        let ph = Math.round(baseH * s)
        // Вписываем по высоте в доступную область: topH - высота кнопок - отступы
        const btnH = (this.acceptBtnObj ? this.acceptBtnObj.height : 16)
        const availableH = Math.max(16, topH - pad - btnH - 8)
        const aspect = baseW / baseH
        if (ph > availableH) {
          ph = Math.floor(availableH)
          pw = Math.max(8, Math.floor(ph * aspect))
        }
        // Подгон по ширине, чтобы не выходил за края
        if (pw > rect.width - pad * 2) {
          pw = Math.floor(rect.width - pad * 2)
          ph = Math.max(8, Math.floor(pw / aspect))
        }
        this.personPreview.setSize(pw, ph)
        this.personPreview.setOrigin(0.5, 1)
        // Центр контейнера по X, дно над кнопками
        const bottom = topH - pad - btnH - 6
        let x = Math.round(rect.width / 2)
        let y = Math.round(bottom)
        // Кламп внутри границ верхнего блока
        const minX = Math.ceil(pw / 2)
        const maxX = Math.floor(rect.width - pw / 2)
        if (x < minX) x = minX
        if (x > maxX) x = maxX
        if (y > topH - pad) y = topH - pad
        if (y < ph) y = ph
        this.personPreview.setPosition(x, y)
        if (this.personPreviewSprite) {
          // Подгоняем спрайт под рамку и позицию
          this.personPreviewSprite.setVisible(true)
          this.personPreviewSprite.setPosition(x, y)
          const scaleX = (pw / 80) * 2.25
          const scaleY = (ph / 64) * 2.25
          this.personPreviewSprite.setScale(scaleX, scaleY)
          this.personPreviewShirt?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewPants?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewFootwear?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewHair?.setPosition(x, y).setScale(scaleX, scaleY)
          if (this.personTop) {
            if (this.personPreviewSprite.parentContainer !== this.personTop) this.personTop.add(this.personPreviewSprite)
            this.personTop.bringToTop(this.personPreviewSprite)
            if (this.personPreviewShirt) this.personTop.bringToTop(this.personPreviewShirt)
            if (this.personPreviewPants) this.personTop.bringToTop(this.personPreviewPants)
            if (this.personPreviewFootwear) this.personTop.bringToTop(this.personPreviewFootwear)
            if (this.personPreviewHair) this.personTop.bringToTop(this.personPreviewHair)
          }
        }
        // Убедимся, что превью — дочерний элемент personTop и на верхнем слое
        if (this.personTop && this.personPreview) {
          if (this.personPreview.parentContainer !== this.personTop) {
            this.personTop.add(this.personPreview)
          }
          // Красную плашку поднимаем только если показываем врага без спрайта (устанавливается ниже)
        }
        // Полоса HP врага над превью, если есть враги
        const hasEnemiesNow = this.enemyQueueItems.length > 0
        if (hasEnemiesNow) {
          const firstEnemy: any = this.enemyQueueItems[0]
          const maxHp = firstEnemy?.maxHp ?? 0
          const hp = firstEnemy?.hp ?? 0
          const topY = y - ph
          const barW = Math.max(24, Math.floor(pw * 0.8))
          const barH = 6
          const bx = Math.round(x - barW / 2)
          const by = Math.round(topY - 8)
          if (!this.enemyHpBg) {
            this.enemyHpBg = this.add.rectangle(bx, by, barW, barH, 0x111214, 0.9).setOrigin(0, 0)
            this.personTop.add(this.enemyHpBg)
          }
          if (!this.enemyHpFg) {
            this.enemyHpFg = this.add.rectangle(bx, by, barW, barH, 0xe53935, 0.95).setOrigin(0, 0)
            this.personTop.add(this.enemyHpFg)
          }
          this.enemyHpBg.setVisible(true)
          this.enemyHpFg.setVisible(true)
          this.enemyHpBg.setPosition(bx, by); this.enemyHpBg.setSize(barW, barH)
          const frac = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 1
          this.enemyHpFg.setPosition(bx, by); this.enemyHpFg.setSize(Math.max(0, Math.floor(barW * frac)), barH)
          this.personTop.bringToTop(this.enemyHpBg)
          this.personTop.bringToTop(this.enemyHpFg)
        } else {
          // Нет врагов — скрываем только HP-бар, не трогаем слои превью жителей
          this.enemyHpBg?.setVisible(false)
          this.enemyHpFg?.setVisible(false)
          // Не сбрасываем fill/visibility превью здесь, это делает updatePersonInfoFromQueue
        }
      }
    }

    // Плашка нет мест
    if (this.noSpaceLabel) {
      const showNoSpace = !isNight && !hasEnemies && hasVisitors && !hasCapacity
      this.noSpaceLabel.setVisible(showNoSpace)
      if (showNoSpace) {
        const msg = (t('noSpace') ?? 'НЕТ МЕСТ') + ` (${this.bunkerResidents.length}/${capacity})`
        this.noSpaceLabel.setText(msg)
        const y = topH - pad - parseInt(btnFont, 10) / 2
        this.noSpaceLabel.setPosition(rect.width / 2, y)
      }
    }

    // Нижняя часть
    this.personBottom.setPosition(0, topH)
    if (this.personNameText && this.personDetailsText && this.personSkillText) {
      const showPersonDetails = hasVisitors || hasEnemies

      this.personNameText.setVisible(showPersonDetails)
      this.personDetailsText.setVisible(showPersonDetails)
      this.personSkillText.setVisible(showPersonDetails)
      const nameFont = fs(this, 12)
      const detailsFont = fs(this, 11)
      this.personNameText.setFontSize(nameFont)
      this.personNameText.setPosition(pad, pad)
      this.personDetailsText.setFontSize(detailsFont)
      this.personDetailsText.setPosition(pad, pad + this.personNameText.height + 6)
      this.personDetailsText.setWordWrapWidth(Math.max(1, rect.width - pad * 2))
      this.personSkillText.setFontSize(detailsFont)
      this.personSkillText.setPosition(pad, this.personDetailsText.y + this.personDetailsText.height + 6)
      this.personSkillText.setWordWrapWidth(Math.max(1, rect.width - pad * 2))
    }
  }

  // ======== Очередь посетителей на поверхности ========
  private seedInitialVisitors(count: number): void {
    for (let i = 0; i < count; i++) this.enqueueVisitor()
    if (this.lastSurfaceRect) this.layoutQueue(this.lastSurfaceRect)
  }

  private maybeArriveVisitor(): void {
    if (this.phase !== 'day') return
    // Если есть враги — люди не приходят
    if (this.enemyQueueItems.length > 0) return
    if (this.queueItems.length >= 8) return
    const v = this.enqueueVisitor(true)
    if (!this.lastSurfaceRect || !v) return
    const rect = this.lastSurfaceRect
    const positions = this.getQueuePositions(this.queueItems.length, rect)
    const idx = this.queueItems.length - 1
    const target = positions[idx]
    const startX = -40
    v.rect.setPosition(startX, target.y)
    if (v.sprite) {
      v.sprite.setPosition(startX, target.y)
      // Бежит направо к входу
      v.sprite.setFlipX(true)
      const skin = v.sprite.texture.key
      try { v.sprite.anims.play(`${skin}_run`, true) } catch {}
    }
    if (v.shirt) { v.shirt.setPosition(startX, target.y); v.shirt.setFlipX(true); try { v.shirt.anims.play(`${v.shirt.texture.key}_run`, true) } catch {} }
    if (v.pants) { v.pants.setPosition(startX, target.y); v.pants.setFlipX(true); try { v.pants.anims.play(`${v.pants.texture.key}_run`, true) } catch {} }
    if (v.footwear) { v.footwear.setPosition(startX, target.y); v.footwear.setFlipX(true); try { v.footwear.anims.play(`${v.footwear.texture.key}_run`, true) } catch {} }
    if (v.hair) { v.hair.setPosition(startX, target.y); v.hair.setFlipX(true); try { v.hair.anims.play(`${v.hair.texture.key}_run`, true) } catch {} }
    this.tweens.add({ targets: [v.rect, v.sprite!, v.shirt!, v.pants!, v.footwear!, v.hair!], x: target.x, duration: 600, ease: 'Sine.easeOut', onComplete: () => {
      if (v.sprite) {
        const skin = v.sprite.texture.key
        try { v.sprite.anims.play(`${skin}_idle`, true) } catch {}
      }
      if (v.shirt) { try { v.shirt.anims.play(`${v.shirt.texture.key}_idle`, true) } catch {} }
      if (v.pants) { try { v.pants.anims.play(`${v.pants.texture.key}_idle`, true) } catch {} }
      if (v.footwear) { try { v.footwear.anims.play(`${v.footwear.texture.key}_idle`, true) } catch {} }
      if (v.hair) { try { v.hair.anims.play(`${v.hair.texture.key}_idle`, true) } catch {} }
    } })
  }

  private computeVisitorArrivalDelay(): number {
    let base = 5000
    switch (this.difficulty) {
      case 'easy':
        base = 4200
        break
      case 'normal':
        base = 5000
        break
      case 'hard':
        base = 6500
        break
      default:
        base = 5000
    }
    const jitter = Phaser.Math.Clamp(Phaser.Math.FloatBetween(0.6, 1.5), 0.6, 1.5)
    const minDelay = 1800
    const delay = Math.max(minDelay, Math.floor(base * jitter))
    return delay
  }

  // scheduleVisitorArrival уже определён выше (динамический, с джиттером)

  private enqueueVisitor(createOnly = false): { id: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite } | null {
    if (!this.surfaceQueue) return null
    const id = this.nextVisitorId++
    console.log('[enqueueVisitor] id=', id, 'day=', this.dayNumber, 'clock=', this.getClockText())
    const box = this.add.rectangle(0, 0, 28, 36, 0x000000, 0).setOrigin(0, 1)
    box.setStrokeStyle(2, 0x4fc3f7, 0.9)
    box.setVisible(false)
    // Спрайт тела
    const data = this.generatePersonData(id)
    const skinKey = pickSkinForGender(data.gender, id)
    ensureCharacterAnimations(this, skinKey)
    const sprite = this.add.sprite(0, 0, skinKey, 0).setOrigin(0, 1)
    sprite.anims.play(`${skinKey}_idle`)
    sprite.setScale((28 / 80) * 1.5, (36 / 64) * 1.5)
    // Одежда
    const clothes = pickClothingSetForGender(data.gender, id)
    const mkPiece = (key: string | undefined): Phaser.GameObjects.Sprite | undefined => {
      if (!key) return undefined
      ensureCharacterAnimations(this, key)
      const s = this.add.sprite(0, 0, key, 0).setOrigin(0, 1)
      s.anims.play(`${key}_idle`)
      s.setScale((28 / 80) * 1.5, (36 / 64) * 1.5)
      return s
    }
    const shirt = mkPiece(clothes.shirt)
    const pants = mkPiece(clothes.pants)
    const footwear = mkPiece(clothes.footwear)
    const hairKey = pickHairForGender(data.gender, id)
    const hair = mkPiece(hairKey)
    this.surfaceQueue.add(sprite)
    if (shirt) this.surfaceQueue.add(shirt)
    if (pants) this.surfaceQueue.add(pants)
    if (footwear) this.surfaceQueue.add(footwear)
    if (hair) this.surfaceQueue.add(hair)
    const item = { id, rect: box, sprite, shirt, pants, footwear, hair }
    this.queueItems.push(item)
    this.surfaceQueue.add(box)
    if (!createOnly && this.lastSurfaceRect) this.layoutQueue(this.lastSurfaceRect)
    this.updatePersonInfoFromQueue()
    return item
  }

  private getQueuePositions(n: number, surfaceRect: Phaser.Geom.Rectangle): { x: number; y: number }[] {
    const pad = 10
    const gap = 8
    const w = 28
    const h = 36
    const rightmostX = surfaceRect.width - pad - w
    const y = surfaceRect.height - pad
    const pos: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const x = rightmostX - i * (w + gap)
      pos.push({ x, y })
    }
    return pos
  }

  private layoutQueue(surfaceRect: Phaser.Geom.Rectangle): void {
    this.lastSurfaceRect = surfaceRect
    if (!this.surfaceQueue) return
    const positions = this.getQueuePositions(this.queueItems.length, surfaceRect)
    this.queueItems.forEach((item, i) => {
      if (item.exiting) return
      const p = positions[i]
      item.rect.setPosition(p.x, p.y)
      if (item.sprite) {
        item.sprite.setPosition(p.x, p.y)
        // Все стоят лицом к входу (вправо)
        item.sprite.setFlipX(true)
        const skin = (item.sprite.texture && item.sprite.texture.key) || ''
        if (skin) {
          try { item.sprite.anims.play(`${skin}_idle`, true) } catch {}
        }
      }
      if (item.shirt) { item.shirt.setPosition(p.x, p.y); item.shirt.setFlipX(true); try { item.shirt.anims.play(`${item.shirt.texture.key}_idle`, true) } catch {} }
      if (item.pants) { item.pants.setPosition(p.x, p.y); item.pants.setFlipX(true); try { item.pants.anims.play(`${item.pants.texture.key}_idle`, true) } catch {} }
      if (item.footwear) { item.footwear.setPosition(p.x, p.y); item.footwear.setFlipX(true); try { item.footwear.anims.play(`${item.footwear.texture.key}_idle`, true) } catch {} }
      if (item.hair) { item.hair.setPosition(p.x, p.y); item.hair.setFlipX(true); try { item.hair.anims.play(`${item.hair.texture.key}_idle`, true) } catch {} }
      if (item.shirt) { item.shirt.setPosition(p.x, p.y); item.shirt.setFlipX(true); try { item.shirt.anims.play(`${item.shirt.texture.key}_idle`, true) } catch {} }
      if (item.pants) { item.pants.setPosition(p.x, p.y); item.pants.setFlipX(true); try { item.pants.anims.play(`${item.pants.texture.key}_idle`, true) } catch {} }
      if (item.footwear) { item.footwear.setPosition(p.x, p.y); item.footwear.setFlipX(true); try { item.footwear.anims.play(`${item.footwear.texture.key}_idle`, true) } catch {} }
    })
  }

  // ======== Очередь врагов ========
  private getEnemyQueuePositions(n: number, surfaceRect: Phaser.Geom.Rectangle): { x: number; y: number }[] {
    const pad = 10
    const gap = 8
    const w = 28
    const rightmostX = surfaceRect.width - pad - w
    // Располагем на том же уровне пола, что и люди
    const y = surfaceRect.height - pad
    const pos: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) pos.push({ x: rightmostX - i * (w + gap), y })
    return pos
  }

  private layoutEnemyQueue(surfaceRect: Phaser.Geom.Rectangle): void {
    if (!this.surfaceEnemyQueue) return
    const positions = this.getEnemyQueuePositions(this.enemyQueueItems.length, surfaceRect)
    this.enemyQueueItems.forEach((item, i) => {
      if (item.exiting) return
      const p = positions[i]
      item.rect.setPosition(p.x, p.y)
      if (item.type === 'МАРОДЕР') {
        const flip = true
        const setPos = (s?: Phaser.GameObjects.Sprite) => { if (s) s.setPosition(p.x, p.y).setFlipX(flip) }
        const playIdle = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; try { s.anims.play(`${s.texture.key}_idle`, true) } catch {} }
        setPos(item.sprite); setPos(item.shirt); setPos(item.pants); setPos(item.footwear); setPos(item.hair)
        playIdle(item.sprite); playIdle(item.shirt); playIdle(item.pants); playIdle(item.footwear); playIdle(item.hair)
      } else if (item.type === 'ЗОМБИ') {
        // Позиционируем одиночный спрайт зомби, без отражения, idle
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
        if (spr) {
          spr.setPosition(p.x, p.y)
          try {
            const kind = (item as any).zombieKind
            if (kind === 'wild') spr.anims.play('z_wild_idle', true)
            else if (kind === 'man') spr.anims.play('z_man_idle', true)
            else spr.anims.play('z_woman_idle', true)
          } catch {}
        }
        // Гарантированно удалить слои одежды, если остались от мародёра
        if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
        if (item.pants) { item.pants.destroy(); item.pants = undefined }
        if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
        if (item.hair) { item.hair.destroy(); item.hair = undefined }
      } else if (item.type === 'МУТАНТ') {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
        if (spr) {
          spr.setPosition(p.x, p.y)
          try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_idle`, true) } catch {}
        }
        // убрать лишние слои на всякий случай
        if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
        if (item.pants) { item.pants.destroy(); item.pants = undefined }
        if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
        if (item.hair) { item.hair.destroy(); item.hair = undefined }
      } else if (item.type === 'СОЛДАТ') {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
        if (spr) { spr.setPosition(p.x, p.y); try { spr.anims.play('sold_idle', true) } catch {} }
        if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
        if (item.pants) { item.pants.destroy(); item.pants = undefined }
        if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
        if (item.hair) { item.hair.destroy(); item.hair = undefined }
      } else {
        // Страховка: очистить лишние слои
        if (item.sprite && !(item as any).zombieKind) { item.sprite.destroy(); item.sprite = undefined }
        if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
        if (item.pants) { item.pants.destroy(); item.pants = undefined }
        if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
        if (item.hair) { item.hair.destroy(); item.hair = undefined }
      }
    })
  }

  private enqueueEnemy(createOnly = false): { id: number; rect: Phaser.GameObjects.Rectangle; type: string } | null {
    if (!this.surfaceEnemyQueue) return null
    const id = this.nextEnemyId++
    const type = this.pickEnemyType()
    const box = this.add.rectangle(0, 0, 28, 36, 0x000000, 0).setOrigin(0, 1)
    box.setStrokeStyle(2, 0xe53935, 0.95)
    const item: any = { id, rect: box, type }
    // Инициализация HP сразу, чтобы шкала была полной при первом показе
    // Настройка HP по типу и сложности: соответствие количеству попаданий разным оружием
    const hpByType = (tp: string): number => {
      // Базовые уроны оружия соответствуют fireWeaponOnce: pistol=1, shotgun=2, ar=1, sniper=3
      // Цель: примерные диапазоны выстрелов из ТЗ. Возьмём среднее значение диапазона и конвертируем в HP относительно урона пистолета (=1)
      switch (tp) {
        case 'МАРОДЕР':
          // 1–2 пули pistol → среднее ~1.5
          return 2
        case 'ЗОМБИ':
          // 2–4 pistol → среднее ~3
          return 3
        case 'МУТАНТ':
          // 4–8 pistol → среднее ~6
          return 6
        case 'СОЛДАТ':
          // 8–12 pistol → среднее ~10
          return 10
        default:
          return 2
      }
    }
    item.maxHp = hpByType(type)
    item.hp = item.maxHp
    if (type === 'МАРОДЕР') {
      const gender = Math.random() < 0.5 ? 'М' : 'Ж'
      const skinKey = pickSkinForGender(gender, id + 10000)
      ensureCharacterAnimations(this, skinKey)
      const sprite = this.add.sprite(0, 0, skinKey, 0).setOrigin(0, 1)
      sprite.anims.play(`${skinKey}_idle`)
      sprite.setScale((28 / 80) * 1.5, (36 / 64) * 1.5)
      const clothes = pickClothingSetForGender(gender, id + 10000)
      const mkPiece = (key: string | undefined): Phaser.GameObjects.Sprite | undefined => {
        if (!key) return undefined
        ensureCharacterAnimations(this, key)
        const s = this.add.sprite(0, 0, key, 0).setOrigin(0, 1)
        s.anims.play(`${key}_idle`)
        s.setScale((28 / 80) * 1.5, (36 / 64) * 1.5)
        return s
      }
      const shirt = mkPiece(clothes.shirt)
      const pants = mkPiece(clothes.pants)
      const footwear = mkPiece(clothes.footwear)
      const hair = mkPiece(pickHairForGender(gender, id + 10000))
      this.surfaceEnemyQueue.add(sprite)
      if (shirt) this.surfaceEnemyQueue.add(shirt)
      if (pants) this.surfaceEnemyQueue.add(pants)
      if (footwear) this.surfaceEnemyQueue.add(footwear)
      if (hair) this.surfaceEnemyQueue.add(hair)
      item.sprite = sprite
      item.shirt = shirt
      item.pants = pants
      item.footwear = footwear
      item.hair = hair
    } else if (type === 'ЗОМБИ') {
      this.ensureZombieAnimations()
      const kinds = ['wild','man','woman'] as const
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      let sprite: Phaser.GameObjects.Sprite
      if (kind === 'wild') sprite = this.add.sprite(0, 0, 'zombie_wild_idle', 0)
      else if (kind === 'man') sprite = this.add.sprite(0, 0, 'zombie_man_idle', 0)
      else sprite = this.add.sprite(0, 0, 'zombie_woman_idle', 0)
      sprite.setOrigin(0, 1)
      // Масштаб из 96x96 в 28x36, увеличенный в 1.5 раза
      sprite.setScale((28 / 96) * 1.5, (36 / 96) * 1.5)
      // Без отражения — зомби смотрят вправо по умолчанию
      if (kind === 'wild') { try { sprite.anims.play('z_wild_idle', true) } catch {} }
      if (kind === 'man') { try { sprite.anims.play('z_man_idle', true) } catch {} }
      if (kind === 'woman') { try { sprite.anims.play('z_woman_idle', true) } catch {} }
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
      ;(item as any).zombieKind = kind
    } else if (type === 'МУТАНТ') {
      this.ensureMutantAnimations()
      const kinds = [1,2,3,4] as const
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      const sprite = this.add.sprite(0, 0, `mutant${kind}_idle`, 0).setOrigin(0, 1)
      // Масштаб под 28x36 с небольшим увеличением, т.к. размер 128
      sprite.setScale((28 / 128) * 1.6, (36 / 128) * 1.6)
      try { sprite.anims.play(`m${kind}_idle`, true) } catch {}
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
      ;(item as any).mutantKind = kind
    } else if (type === 'СОЛДАТ') {
      this.ensureSoldierAnimations()
      const sprite = this.add.sprite(0, 0, 'soldier_idle', 0).setOrigin(0, 1)
      sprite.setScale((28 / 128) * 1.6, (36 / 128) * 1.6)
      try { sprite.anims.play('sold_idle', true) } catch {}
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
    }
    this.enemyQueueItems.push(item)
    this.surfaceEnemyQueue.add(box)
    if (!createOnly && this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect)
    this.updatePersonInfoFromQueue()
    return item
  }

  private maybeArriveEnemy(): void {
    if (this.phase !== 'night') return
    const v = this.enqueueEnemy(true)
    if (!this.lastSurfaceRect || !v) return
    const rect = this.lastSurfaceRect
    const positions = this.getEnemyQueuePositions(this.enemyQueueItems.length, rect)
    const idx = this.enemyQueueItems.length - 1
    const target = positions[idx]
    const startX = -40 // приходят с левой границы
    v.rect.setPosition(startX, target.y)
    const item: any = v
    const tweenTargets: any[] = [v.rect]
    if (item.type === 'МАРОДЕР') {
      const flip = true
      const prepare = (s?: Phaser.GameObjects.Sprite) => {
        if (!s) return
        s.setPosition(startX, target.y).setFlipX(flip)
        try { s.anims.play(`${s.texture.key}_run`, true) } catch {}
        tweenTargets.push(s)
      }
      prepare(item.sprite)
      prepare(item.shirt)
      prepare(item.pants)
      prepare(item.footwear)
      prepare(item.hair)
    } else if (item.type === 'ЗОМБИ' && item.sprite) {
      // Зомби не отражаем, просто двигаем и играем walk
      item.sprite.setPosition(startX, target.y)
      try {
        if (item.zombieKind === 'wild') item.sprite.anims.play('z_wild_walk', true)
        else if (item.zombieKind === 'man') item.sprite.anims.play('z_man_walk', true)
        else item.sprite.anims.play('z_woman_walk', true)
      } catch {}
      tweenTargets.push(item.sprite)
    } else if (item.type === 'МУТАНТ' && (item as any).sprite) {
      const spr = (item as any).sprite as Phaser.GameObjects.Sprite
      spr.setPosition(startX, target.y)
      try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_walk`, true) } catch {}
      tweenTargets.push(spr)
    } else if (item.type === 'СОЛДАТ' && (item as any).sprite) {
      const spr = (item as any).sprite as Phaser.GameObjects.Sprite
      spr.setPosition(startX, target.y)
      try { spr.anims.play('sold_walk', true) } catch {}
      tweenTargets.push(spr)
    }
    this.tweens.add({ targets: tweenTargets, x: target.x, duration: 600, ease: 'Sine.easeOut', onComplete: () => {
      if (item.type === 'МАРОДЕР') {
        const idle = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; try { s.anims.play(`${s.texture.key}_idle`, true) } catch {} }
        idle(item.sprite); idle(item.shirt); idle(item.pants); idle(item.footwear); idle(item.hair)
      } else if (item.type === 'ЗОМБИ' && item.sprite) {
        try {
          if (item.zombieKind === 'wild') item.sprite.anims.play('z_wild_idle', true)
          else if (item.zombieKind === 'man') item.sprite.anims.play('z_man_idle', true)
          else item.sprite.anims.play('z_woman_idle', true)
        } catch {}
      } else if (item.type === 'МУТАНТ' && (item as any).sprite) {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite
        try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_idle`, true) } catch {}
      } else if (item.type === 'СОЛДАТ' && (item as any).sprite) {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite
        try { spr.anims.play('sold_idle', true) } catch {}
      }
      // Обновим лэйаут очереди и правую панель, чтобы гарантировать корректную видимость оружия/HP
      if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect)
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    } })
  }

  private decideCurrent(accepted: boolean): void {
    if (this.queueItems.length === 0) {
      this.showToast(t('noVisitors') ?? 'No visitors')
      return
    }
    // Обслуживаем крайнего правого (первого у входа)
    const first = this.queueItems.shift()!
    first.exiting = true
    const rect = first.rect
    const sprite = first.sprite
    const sr = this.lastSurfaceRect!
    
    if (accepted) {
      const capacity = this.getBunkerCapacity()
      const canAccept = this.bunkerResidents.length < capacity
      if (canAccept) {
        const personData = this.getPersonData(first.id)
        this.addResidentToBunker(first.id, personData)
        // Игровое уведомление в зоне уведомлений
        this.announce(`принят ${personData.name} ${personData.profession}`)
        // Перенос ресурсов персонажа в бункер, защищённый от повторного начисления
        this.claimVisitorLoot(first.id)
        // 1) Превью: приподнять и скрыть
        const pvTargets: any[] = []
        if (this.personPreviewSprite?.visible) pvTargets.push(this.personPreviewSprite)
        if (this.personPreviewShirt?.visible) pvTargets.push(this.personPreviewShirt)
        if (this.personPreviewPants?.visible) pvTargets.push(this.personPreviewPants)
        if (this.personPreviewFootwear?.visible) pvTargets.push(this.personPreviewFootwear)
        if (this.personPreviewHair?.visible) pvTargets.push(this.personPreviewHair)
        ;(this as any)._previewBusy = true
        if (pvTargets.length > 0) {
          this.tweens.add({ targets: pvTargets, y: "+= -24", alpha: 0, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
            pvTargets.forEach((t: any) => { try { t.setAlpha(1); t.setVisible(false) } catch {} })
            ;(this as any)._previewBusy = false
            this.updatePersonInfoFromQueue()
          } })
        }
        // 2) Очередь на поверхности: уход вправо (как раньше)
        const targetX = sr.width + 60
        const outTargets: any[] = [rect]
        if (sprite) { sprite.setFlipX(true); try { sprite.anims.play(`${sprite.texture.key}_walk`, true) } catch {}; outTargets.push(sprite) }
        if (first.shirt) { first.shirt.setFlipX(true); try { first.shirt.anims.play(`${first.shirt.texture.key}_walk`, true) } catch {}; outTargets.push(first.shirt) }
        if (first.pants) { first.pants.setFlipX(true); try { first.pants.anims.play(`${first.pants.texture.key}_walk`, true) } catch {}; outTargets.push(first.pants) }
        if (first.footwear) { first.footwear.setFlipX(true); try { first.footwear.anims.play(`${first.footwear.texture.key}_walk`, true) } catch {}; outTargets.push(first.footwear) }
        if (first.hair) { first.hair.setFlipX(true); try { first.hair.anims.play(`${first.hair.texture.key}_walk`, true) } catch {}; outTargets.push(first.hair) }
        this.tweens.add({ targets: outTargets, x: targetX, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
          rect.destroy(); sprite?.destroy(); first.shirt?.destroy(); first.pants?.destroy(); first.footwear?.destroy(); first.hair?.destroy()
          this.simpleBunker?.syncResidents(this.bunkerResidents.length)
        } })
      } else {
        // Покажем плашку "нет мест" и оставим человека в очереди (не выкидываем)
        this.updatePersonInfoFromQueue()
        // Мест нет — уходит влево (как отказ)
        // Убираем выкидывание: возвращаем кандидата в очередь, чтобы игрок мог дождаться мест
        // Для простоты — возвращаем в начало очереди визуально справа
        const item = { id: first.id, rect }
        this.queueItems.unshift(item)
        const positions = this.getQueuePositions(this.queueItems.length, sr)
        this.queueItems.forEach((it, i) => {
          const p = positions[i]
          this.tweens.add({ targets: [it.rect, it.sprite!], x: p.x, y: p.y, duration: 400, ease: 'Sine.easeOut' })
        })
      }
    } else {
      // Уходят влево
      // Движение влево — лицом влево (flipX=false)
      if (sprite) { sprite.setFlipX(false); try { sprite.anims.play(`${sprite.texture.key}_walk`, true) } catch {} }
      if (first.shirt) { first.shirt.setFlipX(false); try { first.shirt.anims.play(`${first.shirt.texture.key}_walk`, true) } catch {} }
      if (first.pants) { first.pants.setFlipX(false); try { first.pants.anims.play(`${first.pants.texture.key}_walk`, true) } catch {} }
      if (first.footwear) { first.footwear.setFlipX(false); try { first.footwear.anims.play(`${first.footwear.texture.key}_walk`, true) } catch {} }
      if (first.hair) { first.hair.setFlipX(false); try { first.hair.anims.play(`${first.hair.texture.key}_walk`, true) } catch {} }
      this.tweens.add({ targets: [rect, sprite!, first.shirt!, first.pants!, first.footwear!, first.hair!], x: -60, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
        rect.destroy()
        sprite?.destroy()
        first.shirt?.destroy()
        first.pants?.destroy()
        first.footwear?.destroy()
        first.hair?.destroy()
        this.updatePersonInfoFromQueue()
      }})
    }
    const positions = this.getQueuePositions(this.queueItems.length, sr)
    this.queueItems.forEach((it, i) => {
      const p = positions[i]
      // Смещение очереди направо — лицом вправо
      if (it.sprite) { it.sprite.setFlipX(true); try { it.sprite.anims.play(`${it.sprite.texture.key}_walk`, true) } catch {} }
      if (it.shirt) { it.shirt.setFlipX(true); try { it.shirt.anims.play(`${it.shirt.texture.key}_walk`, true) } catch {} }
      if (it.pants) { it.pants.setFlipX(true); try { it.pants.anims.play(`${it.pants.texture.key}_walk`, true) } catch {} }
      if (it.footwear) { it.footwear.setFlipX(true); try { it.footwear.anims.play(`${it.footwear.texture.key}_walk`, true) } catch {} }
      if (it.hair) { it.hair.setFlipX(true); try { it.hair.anims.play(`${it.hair.texture.key}_walk`, true) } catch {} }
      this.tweens.add({ targets: [it.rect, it.sprite!, it.shirt!, it.pants!, it.footwear!, it.hair!], x: p.x, y: p.y, duration: 400, ease: 'Sine.easeOut', onComplete: () => {
        if (it.sprite) { try { it.sprite.anims.play(`${it.sprite.texture.key}_idle`, true) } catch {} }
        if (it.shirt) { try { it.shirt.anims.play(`${it.shirt.texture.key}_idle`, true) } catch {} }
        if (it.pants) { try { it.pants.anims.play(`${it.pants.texture.key}_idle`, true) } catch {} }
        if (it.footwear) { try { it.footwear.anims.play(`${it.footwear.texture.key}_idle`, true) } catch {} }
        if (it.hair) { try { it.hair.anims.play(`${it.hair.texture.key}_idle`, true) } catch {} }
      } })
    })
    // Обновление превью выполняется по завершению анимации превью/очереди
  }

  private disperseQueue(): void {
    const sr = this.lastSurfaceRect
    this.queueItems.forEach((it, idx) => {
      const targets: any[] = [it.rect]
      if (it.sprite) targets.push(it.sprite)
      if (it.shirt) targets.push(it.shirt)
      if (it.pants) targets.push(it.pants)
      if (it.footwear) targets.push(it.footwear)
      if (it.hair) targets.push(it.hair)
      this.tweens.add({ targets, x: -60 - idx * 20, duration: 500 + idx * 120, ease: 'Sine.easeIn', onComplete: () => {
        it.rect.destroy()
        it.sprite?.destroy()
        it.shirt?.destroy()
        it.pants?.destroy()
        it.footwear?.destroy()
        it.hair?.destroy()
        // Обновляем только когда последний элемент уходит
        if (idx === this.queueItems.length - 1) {
          this.updatePersonInfoFromQueue()
        }
      }})
    })
    this.queueItems = []
    // Сброс защитного множителя лута на случай, если очередь опустела (на новых снова начислять)
    this.claimedLootIds.clear()
    // Обновляем сразу после очистки массива
    this.updatePersonInfoFromQueue()
  }

  private updatePersonInfoFromQueue(): void {
    const slideInFromLeft = (targets: any[], toX: number, toY: number, onDone?: () => void) => {
      // старт за пределами слева
      targets.forEach((t: any) => { if (t && typeof t.setPosition === 'function') t.setPosition(-60, toY) })
      this.tweens.add({ targets, x: toX, y: toY, duration: 900, ease: 'Sine.easeOut', onComplete: onDone })
    }
    const riseAndFade = (targets: any[], toY: number, onDone?: () => void) => {
      this.tweens.add({ targets, y: toY, alpha: 0, duration: 500, ease: 'Sine.easeIn', onComplete: onDone })
    }
    // Приоритет: если ночью есть враги — показываем информацию о врагах
    const isNight = this.phase === 'night'
    if (isNight && this.enemyQueueItems.length > 0) {
      const e = this.enemyQueueItems[0]
      // если это тот же враг, не проигрывать вход повторно
      if (this._previewCurrentIsEnemy && this._previewCurrentId === e.id) {
        // обновим только тексты и выходим
        if (this.personNameText) this.personNameText.setText(`ВРАГ: ID-${e.id}`)
        if (this.personDetailsText) this.personDetailsText.setText(`ТИП: ${e.type}`)
        if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
        return
      }
      this._previewCurrentIsEnemy = true
      this._previewCurrentId = e.id
      if (this.personNameText) this.personNameText.setText(`ВРАГ: ID-${e.id}`)
      if (this.personDetailsText) this.personDetailsText.setText(`ТИП: ${e.type}`)
      if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
      // Превью врага: мародёр — слои персонажа, иначе — красный прямоугольник
      if (this.personPreview && this.personPreviewSprite) {
        if (e.type === 'МАРОДЕР') {
          // Отображаем мародёра по фактическим слоям первого врага в очереди
          const src: any = this.enemyQueueItems[0]
          const skinKey = src?.sprite?.texture?.key
          const shirtKey = src?.shirt?.texture?.key
          const pantsKey = src?.pants?.texture?.key
          const footwearKey = src?.footwear?.texture?.key
          const hairKey = src?.hair?.texture?.key
          if (skinKey) {
            ensureCharacterAnimations(this, skinKey)
            this.personPreviewSprite.setTexture(skinKey)
            this.personPreviewSprite.anims.play(`${skinKey}_idle`, true)
            this.personPreviewSprite.setVisible(true)
          }
          const setPiece = (sprite: Phaser.GameObjects.Sprite | undefined, key?: string) => {
            if (!sprite) return
            if (!key) { sprite.setVisible(false); return }
            ensureCharacterAnimations(this, key)
            sprite.setTexture(key)
            sprite.anims.play(`${key}_idle`, true)
            sprite.setVisible(true)
          }
          setPiece(this.personPreviewShirt!, shirtKey)
          setPiece(this.personPreviewPants!, pantsKey)
          setPiece(this.personPreviewFootwear!, footwearKey)
          setPiece(this.personPreviewHair!, hairKey)
          this.personPreview.setFillStyle(0x000000, 0)
        } else {
          // Для зомби/мутанта — показать их спрайт в превью; для прочих без спрайтов — красный блок
          const e0: any = e
          const isZombie = e0?.type === 'ЗОМБИ' && !!e0.sprite && !!e0.zombieKind
          const isMutant = e0?.type === 'МУТАНТ' && !!e0.sprite && !!e0.mutantKind
          const isSoldier = e0?.type === 'СОЛДАТ' && !!e0.sprite
          const hide = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; s.setVisible(false); }
          if ((isZombie || isMutant || isSoldier) && this.personPreviewSprite) {
            // Используем единый спрайт превью как отображение зомби
            this.personPreviewShirt?.setVisible(false)
            this.personPreviewPants?.setVisible(false)
            this.personPreviewFootwear?.setVisible(false)
            this.personPreviewHair?.setVisible(false)
            if (isZombie) {
              const kind = e0.zombieKind
              const texKey = kind === 'wild' ? 'zombie_wild_idle' : kind === 'man' ? 'zombie_man_idle' : 'zombie_woman_idle'
              this.personPreviewSprite.setTexture(texKey)
              try {
                if (kind === 'wild') this.personPreviewSprite.anims.play('z_wild_idle', true)
                else if (kind === 'man') this.personPreviewSprite.anims.play('z_man_idle', true)
                else this.personPreviewSprite.anims.play('z_woman_idle', true)
              } catch {}
            } else if (isMutant) {
              const k = e0.mutantKind
              const texKey = `mutant${k}_idle`
              this.personPreviewSprite.setTexture(texKey)
              try { this.personPreviewSprite.anims.play(`m${k}_idle`, true) } catch {}
            } else if (isSoldier) {
              // Солдат
              this.ensureSoldierAnimations()
              this.personPreviewSprite.setTexture('soldier_idle')
              try { this.personPreviewSprite.anims.play('sold_idle', true) } catch {}
            }
            this.personPreviewSprite.setVisible(true)
            this.personPreview.setFillStyle(0x000000, 0)
          } else {
            // Показать красный прямоугольник, спрятать все слои превью
            hide(this.personPreviewShirt)
            hide(this.personPreviewPants)
            hide(this.personPreviewFootwear)
            hide(this.personPreviewHair)
            hide(this.personPreviewSprite)
            this.personPreview.setFillStyle(0xb71c1c, 0.9)
          }
        }
      }
      this.updateUIVisibility()
      // Вход анимацией слева для врага превью (если что-то отображается)
      if (this.personPreviewSprite && this.personPreview) {
        const toX = this.personPreviewSprite.x
        const toY = this.personPreviewSprite.y
        const targets: any[] = []
        const hasSprite = this.personPreviewSprite.visible
        if (hasSprite) targets.push(this.personPreviewSprite)
        if (this.personPreviewShirt?.visible) targets.push(this.personPreviewShirt)
        if (this.personPreviewPants?.visible) targets.push(this.personPreviewPants)
        if (this.personPreviewFootwear?.visible) targets.push(this.personPreviewFootwear)
        if (this.personPreviewHair?.visible) targets.push(this.personPreviewHair)
        if (targets.length > 0) {
          try {
            if (hasSprite) {
              const k = this.personPreviewSprite.texture.key.toString()
              if (k && k !== '__DEFAULT') this.personPreviewSprite.anims.play(`${k.replace('_idle','')}_walk`, true)
            }
          } catch {}
          try { this.personPreviewShirt?.anims?.play(`${this.personPreviewShirt.texture.key}_walk`, true) } catch {}
          try { this.personPreviewPants?.anims?.play(`${this.personPreviewPants.texture.key}_walk`, true) } catch {}
          try { this.personPreviewFootwear?.anims?.play(`${this.personPreviewFootwear.texture.key}_walk`, true) } catch {}
          try { this.personPreviewHair?.anims?.play(`${this.personPreviewHair.texture.key}_walk`, true) } catch {}
          targets.forEach((t: any) => { if (t && typeof t.setPosition === 'function') t.setPosition(-60, toY) })
          this.tweens.add({ targets, x: toX, y: toY, duration: 900, ease: 'Sine.easeOut', onComplete: () => {
            try {
              if (hasSprite && this.personPreviewSprite && this.personPreviewSprite.texture) {
                const k = this.personPreviewSprite.texture.key as string
                if (k && k !== '__DEFAULT') this.personPreviewSprite.anims?.play(`${k}_idle`, true)
              }
            } catch {}
            try { this.personPreviewShirt?.anims?.play(`${this.personPreviewShirt.texture.key}_idle`, true) } catch {}
            try { this.personPreviewPants?.anims?.play(`${this.personPreviewPants.texture.key}_idle`, true) } catch {}
            try { this.personPreviewFootwear?.anims?.play(`${this.personPreviewFootwear.texture.key}_idle`, true) } catch {}
            try { this.personPreviewHair?.anims?.play(`${this.personPreviewHair.texture.key}_idle`, true) } catch {}
          } })
        }
      }
      // При появлении врагов убедимся, что панель перерисована (например, вернуть видимость оружия)
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      return
    }
    const first = this.queueItems[0]
    if (!first) {
      if (this.personNameText) this.personNameText.setText(`${t('name')}: —`)
      if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: —\nПОЛ: —\n${t('specialty')}: —\nРЕСУРСЫ: —`)
      if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
      if (this.personPreview) this.personPreview.setVisible(false)
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(false)
      this.personPreviewShirt?.setVisible(false)
      this.personPreviewPants?.setVisible(false)
      this.personPreviewFootwear?.setVisible(false)
      this.personPreviewHair?.setVisible(false)
      this.updateUIVisibility()
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      return
    }
    // Если тот же человек — не переигрывать вход
    if (!this._previewCurrentIsEnemy && this._previewCurrentId === first.id) {
      const dataSame = this.getPersonData(first.id)
      if (this.personNameText) this.personNameText.setText(`${t('name')}: ${dataSame.name}`)
      if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: ${dataSame.age}\nПОЛ: ${dataSame.gender}\n${t('specialty')}: ${dataSame.profession}\nРЕСУРСЫ: ${dataSame.itemsText}`)
      if (this.personSkillText) {
        const skills = (dataSame as any).allSkills as Array<{ text: string; positive: boolean }> | undefined
        const firstSkill = Array.isArray(skills) && skills.length > 0 ? skills[0] : undefined
        const txt = firstSkill && typeof firstSkill.text === 'string' && firstSkill.text.length > 0 ? firstSkill.text : '—'
        this.personSkillText.setText(`${t('skill')}: ${txt}`)
        const col = firstSkill && typeof firstSkill.positive === 'boolean' ? (firstSkill.positive ? '#81c784' : '#e57373') : THEME.colors.text
        this.personSkillText.setColor(col)
      }
      return
    }
    this._previewCurrentIsEnemy = false
    this._previewCurrentId = first.id
    const data = this.getPersonData(first.id)
    if (this.personNameText) this.personNameText.setText(`${t('name')}: ${data.name}`)
    if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: ${data.age}\nПОЛ: ${data.gender}\n${t('specialty')}: ${data.profession}\nРЕСУРСЫ: ${data.itemsText}`)
    if (this.personSkillText) {
      const skills = (data as any).allSkills as Array<{ text: string; positive: boolean }> | undefined
      const firstSkill = Array.isArray(skills) && skills.length > 0 ? skills[0] : undefined
      const txt = firstSkill && typeof firstSkill.text === 'string' && firstSkill.text.length > 0 ? firstSkill.text : '—'
      this.personSkillText.setText(`${t('skill')}: ${txt}`)
      const col = firstSkill && typeof firstSkill.positive === 'boolean' ? (firstSkill.positive ? '#81c784' : '#e57373') : THEME.colors.text
      this.personSkillText.setColor(col)
    }
    // Обновим превью (цвет рамки в зависимости от навыка)
    if (this.personPreview) {
      this.personPreview.setVisible(true)
    }
    // Спрайт превью (тело): выбираем по полу
    if (this.personPreviewSprite) {
      const skinKey = pickSkinForGender(data.gender, first.id)
      ensureCharacterAnimations(this, skinKey)
      this.personPreviewSprite.setTexture(skinKey)
      this.personPreviewSprite.anims.play(`${skinKey}_idle`)
      this.personPreviewSprite.setVisible(true)
      this.personPreviewSprite.setAlpha(1)
    }
    // Одежда превью
    const clothes = pickClothingSetForGender(data.gender, first.id)
    const setPiece = (sprite: Phaser.GameObjects.Sprite | undefined, key: string | undefined) => {
      if (!sprite) return
      if (!key) { sprite.setVisible(false); return }
      ensureCharacterAnimations(this, key)
      sprite.setTexture(key)
      sprite.anims.play(`${key}_idle`)
      sprite.setVisible(true)
    }
    setPiece(this.personPreviewShirt!, clothes.shirt)
    setPiece(this.personPreviewPants!, clothes.pants)
    setPiece(this.personPreviewFootwear!, clothes.footwear)
    // Волосы превью
    const hairKey = pickHairForGender(data.gender, first.id)
    setPiece(this.personPreviewHair!, hairKey)
    // Гарантируем альфу и видимость у включённых слоёв
    ;[this.personPreviewShirt, this.personPreviewPants, this.personPreviewFootwear, this.personPreviewHair].forEach(s => { if (s && s.visible) s.setAlpha(1) })
    this.updateUIVisibility()
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    // Вход анимацией слева: соберём текущие слои превью в массив и заедем в целевую позицию
    if (this.personPreviewSprite && this.personPreview) {
      const sr = this.lastPersonRect!
      const toX = this.personPreviewSprite.x
      const toY = this.personPreviewSprite.y
      const targets: any[] = [this.personPreviewSprite]
      if (this.personPreviewShirt?.visible) targets.push(this.personPreviewShirt)
      if (this.personPreviewPants?.visible) targets.push(this.personPreviewPants)
      if (this.personPreviewFootwear?.visible) targets.push(this.personPreviewFootwear)
      if (this.personPreviewHair?.visible) targets.push(this.personPreviewHair)
      // Проигрываем walk при заходе
      try { this.personPreviewSprite.anims.play(`${this.personPreviewSprite.texture.key}_walk`, true) } catch {}
      try { this.personPreviewShirt?.anims?.play(`${this.personPreviewShirt.texture.key}_walk`, true) } catch {}
      try { this.personPreviewPants?.anims?.play(`${this.personPreviewPants.texture.key}_walk`, true) } catch {}
      try { this.personPreviewFootwear?.anims?.play(`${this.personPreviewFootwear.texture.key}_walk`, true) } catch {}
      try { this.personPreviewHair?.anims?.play(`${this.personPreviewHair.texture.key}_walk`, true) } catch {}
      slideInFromLeft(targets, toX, toY, () => {
        // Вернем idle после входа
        try { this.personPreviewSprite?.anims?.play(`${this.personPreviewSprite.texture.key}_idle`, true) } catch {}
        try { this.personPreviewShirt?.anims?.play(`${this.personPreviewShirt.texture.key}_idle`, true) } catch {}
        try { this.personPreviewPants?.anims?.play(`${this.personPreviewPants.texture.key}_idle`, true) } catch {}
        try { this.personPreviewFootwear?.anims?.play(`${this.personPreviewFootwear.texture.key}_idle`, true) } catch {}
        try { this.personPreviewHair?.anims?.play(`${this.personPreviewHair.texture.key}_idle`, true) } catch {}
      })
    }
  }

  private updateUIVisibility(): void {
    const isNight = this.phase === 'night'
    const hasEnemies = this.enemyQueueItems.length > 0
    const hasVisitors = this.queueItems.length > 0
    const showDecision = !isNight && !hasEnemies && hasVisitors
    const showDefense = isNight && hasEnemies
    const showPersonDetails = hasVisitors || hasEnemies

    // Принудительно обновляем видимость кнопок
    if (this.acceptBtnObj) this.acceptBtnObj.setVisible(showDecision)
    if (this.denyBtnObj) this.denyBtnObj.setVisible(showDecision)
    if (this.defendBtnObj) this.defendBtnObj.setVisible(showDefense)
    
    // Принудительно обновляем видимость деталей
    if (this.personNameText) this.personNameText.setVisible(showPersonDetails)
    if (this.personDetailsText) this.personDetailsText.setVisible(showPersonDetails)
    if (this.personSkillText) this.personSkillText.setVisible(showPersonDetails)
  }

  private generatePersonData(seed: number): { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; loot: { ammo: number; food: number; water: number; money: number } } {
    let s = (seed ^ this.sessionSeed) >>> 0
    const rng = (min: number, max: number) => {
      // Xorshift32
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
      const n = (s & 0xffffffff) / 0x100000000
      return Math.floor(min + n * (max - min + 1))
    }
    const pick = <T>(arr: T[]) => arr[rng(0, arr.length - 1)]
    const genders = ['М', 'Ж']
    const maleNames = ['Алексей', 'Иван', 'Сергей', 'Дмитрий', 'Максим', 'Никита', 'Павел', 'Егор', 'Олег', 'Антон']
    const femaleNames = ['Анна', 'Екатерина', 'Мария', 'Алина', 'Ольга', 'Наталья', 'София', 'Виктория', 'Дарья', 'Юлия']
    const professions = ['доктор','повар','сантехник','ученый','инженер','химик','разведчик','охотник','безработный','актер','солдат']
    const skillsPos = ['трудолюбивый','гений','лидер','везунчик','крепкий иммунитет','герой']
    const skillsNeg = ['лентяй','выгоревший','слепой','группа инвалидности','шпион','страдает бессоницей','сова','неудачник','зараженный','неизлечимая болезнь','трус']

    // Равновероятный выбор пола (недетерминированный, чтобы избежать смещения)
    let gender = Math.random() < 0.5 ? 'Ж' : 'М'
    if (gender !== 'М' && gender !== 'Ж') gender = 'М'
    let name = gender === 'М' ? pick(maleNames) : pick(femaleNames)
    if (!name) name = gender === 'М' ? 'Иван' : 'Анна'
    let age = rng(18, 80)
    if (age < 18 || age > 80) age = 18 + Math.abs(age % 63)
    // 50% безработный, иначе равновероятно из остальных
    let profession: string | undefined
    const roll = Math.random()
    if (roll < 0.5) {
      profession = 'безработный'
    } else {
      const pool = professions.filter(p => p !== 'безработный')
      // Выбор из пула без привязки к xorshift
      const idx = Math.floor(Math.random() * pool.length)
      profession = pool[Math.min(pool.length - 1, Math.max(0, idx))]
    }
    console.log('[generatePersonData] roll=', roll.toFixed(3), 'profession=', profession)
    if (!profession) profession = 'безработный'
    
    // Генерируем навыки (1..3) — используем независимую от xorshift случайность для разнообразия
    const randInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1))
    let numSkills = randInt(1, 3)
    if (numSkills < 1) numSkills = 1
    const allSkills: Array<{ text: string; positive: boolean }> = []
    const usedSkills = new Set<string>()
    const getUniqueSkill = (pool: string[]): string => {
      let guard = 0
      let skillText = pool[0]
      while (guard++ < 50) {
        const idx = randInt(0, pool.length - 1)
        skillText = pool[idx]
        if (!usedSkills.has(skillText)) break
      }
      usedSkills.add(skillText)
      return skillText
    }
    for (let i = 0; i < numSkills; i++) {
      // 50/50 базово, меняем полярность для разнообразия
      let isPositive = Math.random() < 0.5
      if (i > 0 && allSkills[i - 1]?.positive === isPositive) isPositive = !isPositive
      const pool = isPositive ? skillsPos : skillsNeg
      let skillText = getUniqueSkill(pool)
      if (!skillText || typeof skillText !== 'string') skillText = isPositive ? skillsPos[0] : skillsNeg[0]
      allSkills.push({ text: String(skillText), positive: isPositive })
    }
    if (allSkills.length === 0) allSkills.push({ text: 'лидер', positive: true })
    // Открытый навык — первый из списка
    const openSkill = allSkills[0]
    
    // Ресурсы у персонажа
    const loot = {
      ammo: rng(1, 100),
      food: rng(1, 10),
      water: rng(1, 10),
      money: rng(1, 100)
    }
    const itemsText = `патроны x${loot.ammo}, еда x${loot.food}, вода x${loot.water}, деньги x${loot.money}`

    return { name, gender, age, profession, openSkill, allSkills, itemsText, loot }
  }

  private getPersonData(id: number) {
    const cached = this.personCache.get(id)
    if (cached) return cached
    const data = this.generatePersonData(id)
    this.personCache.set(id, data)
    return data
  }

  private addResidentToBunker(id: number, personData: ReturnType<typeof this.generatePersonData>): void {
    this.bunkerResidents.push({
      id,
      name: personData.name,
      gender: personData.gender,
      age: personData.age,
      profession: personData.profession,
      skills: personData.allSkills,
      itemsText: personData.itemsText,
      admittedAt: this.time.now,
      status: 'отдыхает',
      hunger: 100,
      thirst: 100,
      energy: 100,
      health: 100,
      patient: false
    })
    this.updateResourcesText()
  }

  // Механика смерти/удаления жителя (освобождает место)
  public removeResidentFromBunker(id: number, reason?: string): void {
    const idx = this.bunkerResidents.findIndex(r => r.id === id)
    if (idx >= 0) {
      const [r] = this.bunkerResidents.splice(idx, 1)
      // Можно в будущем логировать причину/статистику
      this.updateResourcesText()
      this.simpleBunker?.syncResidents(this.bunkerResidents.length)
      if (reason) this.showToast(`${r.name} удалён: ${reason}`)
    }
  }

  private claimVisitorLoot(id: number): void {
    if (this.claimedLootIds.has(id)) return
    const personData = this.getPersonData(id)
    const loot = personData?.loot
    if (!loot) { this.claimedLootIds.add(id); return }
    const addAmmo = Math.max(0, Math.floor(loot.ammo || 0))
    const addFood = Math.max(0, Math.floor(loot.food || 0))
    const addWater = Math.max(0, Math.floor(loot.water || 0))
    const addMoney = Math.max(0, Math.floor(loot.money || 0))
    // Добавляем ресурсы один раз
    this.ammo = Math.max(0, this.ammo + addAmmo)
    this.food = Math.max(0, this.food + addFood)
    this.water = Math.max(0, this.water + addWater)
    this.money = Math.max(0, this.money + addMoney)
    this.claimedLootIds.add(id)
    this.updateResourcesText()
    this.showToast(`+${addAmmo} патр., +${addFood} еды, +${addWater} воды, +${addMoney} ден.`)
  }

  // Обновление статуса жителя из bunkerView
  public _updateResidentStatus(id: number, status: string): void {
    const r = this.bunkerResidents.find(x => x.id === id)
    if (!r) return
    r.status = status
    // Если открыт оверлей деталей — можно в будущем обновлять его вживую
  }

  private layoutContainer(container: Phaser.GameObjects.Container, rect: Phaser.Geom.Rectangle): void {
    container.setPosition(rect.x, rect.y)
    const existingBg = container.list.find(g => g.name === 'panelBg') as Phaser.GameObjects.Rectangle | undefined
    if (existingBg) existingBg.destroy()
    applyPanelBackground(this, rect, container)
    
    // Обновляем маску для bunkerArea
    if (container === this.bunkerArea) {
      const mask = container.getData('mask') as Phaser.GameObjects.Graphics
      if (mask) {
        mask.clear()
        mask.fillStyle(0xffffff)
        // Маска должна быть в мировых координатах относительно сцены
        mask.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    }
  }

  private updateResourcesText(): void {
    const population = this.bunkerResidents.length
    const compact = isPortrait(this) || this.scale.width < 700
    const capacity = this.getBunkerCapacity()
    if (compact) {
      this.populationBtn?.setText(`👥 ${population}/${capacity}`)
      this.happinessBtn?.setText(`😊 ${this.happiness}`)
      this.defenseBtn?.setText(`🛡️ ${this.defense}`)
      this.ammoBtn?.setText(`🔫 ${this.ammo}`)
      this.comfortBtn?.setText(`🛋️ ${this.comfort}`)
      this.foodBtn?.setText(`🍖 ${this.food}`)
      this.waterBtn?.setText(`💧 ${this.water}`)
      this.moneyBtn?.setText(`💰 ${this.money}`)
      this.resourcesText?.setText('')
    } else {
      this.populationBtn?.setText(`${t('population').toUpperCase()}: ${population}/${capacity}`)
      this.happinessBtn?.setText(`СЧАСТЬЕ: ${this.happiness}`)
      this.defenseBtn?.setText(`ЗАЩИТА: ${this.defense}`)
      this.ammoBtn?.setText(`ПАТРОНЫ: ${this.ammo}`)
      this.comfortBtn?.setText(`КОМФОРТ: ${this.comfort}`)
      this.foodBtn?.setText(`${t('food')}: ${this.food}`)
      this.waterBtn?.setText(`${t('water')}: ${this.water}`)
      this.moneyBtn?.setText(`${t('money')}: ${this.money}`)
      this.resourcesText?.setText('')
    }
    this.arrangeTopBarRow()
  }

  // Балансные ставки расхода потребностей по сложности (единиц в час)
  public getNeedsRates(): { hunger: number; thirst: number; energyWork: number; energyIdle: number } {
    switch (this.difficulty) {
      case 'easy':
        return { hunger: 2, thirst: 3, energyWork: 10, energyIdle: 3 }
      case 'hard':
        return { hunger: 4, thirst: 6, energyWork: 14, energyIdle: 5 }
      default:
        return { hunger: 3, thirst: 5, energyWork: 12, energyIdle: 4 }
    }
  }

  // Синхронизация потребностей жителя из bunkerView
  public _updateResidentNeeds(id: number, needs: { hunger?: number; thirst?: number; energy?: number; health?: number; patient?: boolean }): void {
    const r = this.bunkerResidents.find(x => x.id === id)
    if (!r) return
    if (typeof needs.hunger === 'number') r.hunger = Math.max(0, Math.min(100, Math.floor(needs.hunger)))
    if (typeof needs.thirst === 'number') r.thirst = Math.max(0, Math.min(100, Math.floor(needs.thirst)))
    if (typeof needs.energy === 'number') r.energy = Math.max(0, Math.min(100, Math.floor(needs.energy)))
    if (typeof needs.health === 'number') r.health = Math.max(0, Math.min(100, Math.floor(needs.health)))
    if (typeof needs.patient === 'boolean') r.patient = needs.patient
  }

  // Методы для вызова из bunkerView (работники)
  public addFood(amount: number): void { this.food = Math.max(0, this.food + Math.max(0, Math.floor(amount))); this.updateResourcesText() }
  public addWater(amount: number): void { this.water = Math.max(0, this.water + Math.max(0, Math.floor(amount))); this.updateResourcesText() }
  public killOneEnemyFromQueue(): void {
    if (this.enemyQueueItems.length === 0) return
    const it = this.enemyQueueItems.shift()!
    it.exiting = true
    const tweenTargets: any[] = [it.rect]
    if (it.sprite) tweenTargets.push(it.sprite)
    if (it.shirt) tweenTargets.push(it.shirt)
    if (it.pants) tweenTargets.push(it.pants)
    if (it.footwear) tweenTargets.push(it.footwear)
    if (it.hair) tweenTargets.push(it.hair)
    this.tweens.add({ targets: tweenTargets, x: -60, duration: 300, ease: 'Sine.easeIn', onComplete: () => {
      it.rect.destroy()
      it.sprite?.destroy()
      it.shirt?.destroy()
      it.pants?.destroy()
      it.footwear?.destroy()
      it.hair?.destroy()
      // Обновление панели (скрыть HP и оружие, если врагов больше нет)
      if (this.enemyQueueItems.length === 0) {
        this.enemyHpBg?.setVisible(false)
        this.enemyHpFg?.setVisible(false)
        if (this.gunSprite) this.gunSprite.setVisible(false)
      }
    } })
    if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect)
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  // Автоматический выстрел солдата раз в час. Возвращает false, если нет патронов и стрелять нельзя
  public soldierAutoFireWeapon(soldierId?: number): boolean {
    // Если врагов нет — солдат на посту, но не стреляет
    if (this.enemyQueueItems.length === 0) return true
    // Навыки солдата
    const soldier = soldierId != null ? this.bunkerResidents.find(r => r.id === soldierId) : undefined
    const skills = soldier?.skills
    const shots = this.computeSoldierShotsPerHour(skills)
    if (shots <= 0) return true
    // Неудачник: шанс 10% умереть при работе
    if (this.hasSkill(skills, 'неудачник') && Math.random() < 0.1 && soldier) {
      this.removeResidentFromBunker(soldier.id, 'погиб при исполнении')
      this.showToast(`${soldier.name} погиб при службе`)
      return false
    }
    // Выполняем shots раз выстрел с модификаторами патронов
    for (let i = 0; i < shots; i++) {
      // Слепой: тратит в 2 раза больше патронов
      const extraAmmo = this.hasSkill(skills, 'слепой') ? 1 : 0
      // Везунчик: 50% не тратит патрон
      const freeShot = this.hasSkill(skills, 'везунчик') && Math.random() < 0.5
      if (this.currentWeapon !== 'melee') {
        const ammoCost = freeShot ? 0 : 1 + extraAmmo
        if (this.ammo < ammoCost) return false
        this.ammo = Math.max(0, this.ammo - ammoCost)
        this.updateResourcesText()
      }
      // Выстрел
      this.fireWeaponOnce()
      if (this.enemyQueueItems.length === 0) break
    }
    return true
  }

  private arrangeTopBarRow(): void {
    if (!this.topBar) return
    const s = uiScale(this)
    const baseY = Math.round(28 * s)
    let cursorX = 16
    // Левый блок: население и ресурсы-кнопки
    if (this.populationBtn) { this.populationBtn.setPosition(cursorX, baseY); cursorX += this.populationBtn.width + 12 }
    if (this.happinessBtn) { this.happinessBtn.setPosition(cursorX, baseY); cursorX += this.happinessBtn.width + 12 }
    if (this.defenseBtn) { this.defenseBtn.setPosition(cursorX, baseY); cursorX += this.defenseBtn.width + 12 }
    if (this.ammoBtn) { this.ammoBtn.setPosition(cursorX, baseY); cursorX += this.ammoBtn.width + 12 }
    if (this.comfortBtn) { this.comfortBtn.setPosition(cursorX, baseY); cursorX += this.comfortBtn.width + 12 }
    if (this.foodBtn) { this.foodBtn.setPosition(cursorX, baseY); cursorX += this.foodBtn.width + 12 }
    if (this.waterBtn) { this.waterBtn.setPosition(cursorX, baseY); cursorX += this.waterBtn.width + 12 }
    if (this.moneyBtn) { this.moneyBtn.setPosition(cursorX, baseY); cursorX += this.moneyBtn.width + 12 }
    // Правый блок: abilities/pause
    const rightMargin = 16
    let rightX = this.scale.width - rightMargin
    if (this.pauseBtn) { this.pauseBtn.setPosition(rightX - this.pauseBtn.width, Math.round(8 * s)); rightX = this.pauseBtn.x - 16 }
    if (this.abilitiesBtn) { this.abilitiesBtn.setPosition(rightX - this.abilitiesBtn.width, Math.round(8 * s)); rightX = this.abilitiesBtn.x - 16 }
    // Центральная строка ресурсов теперь не используется
    if (this.resourcesText) { this.resourcesText.setPosition(cursorX, baseY); }
  }

  // Вызывается при изменении структуры бункера (например, построена новая комната)
  public onBunkerChanged(): void {
    // Обновим ресурсы/вместимость
    this.updateResourcesText()
    // Пересчёт видимости кнопок Accept/Deny и плашки «нет мест»
    this.updateUIVisibility()
    // Перелэйаутим правую панель с учётом нового capacity
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    // Обновим текущее превью/тексты (на случай, если «нет мест» было показано)
    this.updatePersonInfoFromQueue()
  }

  private buildPeoplePanel(rect: Phaser.Geom.Rectangle): void {
    if (!this.peopleArea) return
    this.peopleArea.removeAll(true)
    // Заголовок
    const title = this.add.text(8, 6, `${t('population').toUpperCase()} • ${this.bunkerResidents.length}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    this.peopleArea.add(title)
    // Список
    let y = 32
    const lineH = 22
    const maxLines = Math.floor((rect.height - y - 8) / lineH)
    for (let i = 0; i < Math.min(this.bunkerResidents.length, maxLines); i++) {
      const r = this.bunkerResidents[i]
      const line = this.add.text(12, y, `${r.name} • ${r.profession}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text })
      const hit = this.add.rectangle(8, y - 2, rect.width - 16, lineH, 0x000000, 0.001).setOrigin(0, 0)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.showResidentDetailsInPeople(r, rect))
      this.peopleArea.add(line)
      this.peopleArea.add(hit)
      y += lineH
    }
  }

  private showResidentDetailsInPeople(r: any, rect: Phaser.Geom.Rectangle): void {
    if (!this.peopleArea) return
    this.peopleArea.removeAll(true)
    const title = this.add.text(8, 6, r.name.toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    const back = this.add.text(rect.width - 8, 6, '< BACK', { fontFamily: THEME.fonts.body, fontSize: '10px', color: '#8bc34a' }).setOrigin(1, 0)
    back.setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.buildPeoplePanel(rect))
    const skillsStr = (Array.isArray(r.skills) ? r.skills : []).map((s: any) => `• ${s?.text ?? '—'}`).join('\n')
    const details = this.add.text(12, 36, `ВОЗРАСТ: ${r.age}\nПОЛ: ${r.gender}\nПРОФЕССИЯ: ${r.profession}\nПРЕДМЕТЫ: ${r.itemsText}\n\nНАВЫКИ:\n${skillsStr}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: rect.width - 24 } })
    this.peopleArea.add([title, back, details])
  }

  private buildResourcesPanel(rect: Phaser.Geom.Rectangle): void {
    if (!this.resourcesArea) return
    this.resourcesArea.removeAll(true)
    const title = this.add.text(8, 6, 'РЕСУРСЫ', { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    const body = this.add.text(12, 36, 'Окно ресурсов (WIP)\nСчастье, Защита, Патроны, Комфорт, Еда, Вода, Деньги', { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: rect.width - 24 } })
    this.resourcesArea.add([title, body])
  }

  private openResourceOverlay(kind: string): void {
    if (isPortrait(this)) {
      this.mobileActive = 'resources'
      this.layout()
      return
    }
    const overlay = this.add.container(0, 0)
    overlay.name = 'resourceOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(520, Math.floor(w * 0.55))
    const panelH = Math.min(420, Math.floor(h * 0.6))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, `${kind.toUpperCase()}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const close = this.add.text(panelW - 12, 12, 'X', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(1, 0)
    close.setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    const body = this.add.text(12, 44, 'Здесь будет управление ресурсом (WIP)', { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: panelW - 24 } }).setOrigin(0, 0)
    panel.add([panelBg, title, close, body])
    overlay.add([bg, panel])
  }

  // Десктопный оверлей со списком жителей (при клике по кнопке населения в топ-баре)
  private openResidentsOverlay(): void {
    // Если мобильный режим — переключаем вкладку PEOPLE
    if (isPortrait(this)) {
      this.mobileActive = 'people'
      this.layout()
      return
    }
    const overlay = this.add.container(0, 0)
    overlay.name = 'residentsOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(560, Math.floor(w * 0.6))
    const panelH = Math.min(520, Math.floor(h * 0.7))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, `${t('population').toUpperCase()} • ${this.bunkerResidents.length}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const close = this.add.text(panelW - 12, 12, 'X', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(1, 0)
    close.setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    panel.add([panelBg, title, close])
    let y = 48
    const lineH = 26
    const listH = panelH - 60
    const max = Math.floor(listH / lineH)
    for (let i = 0; i < Math.min(this.bunkerResidents.length, max); i++) {
      const r = this.bunkerResidents[i]
      const text = this.add.text(12, y, `${r.name} • ${r.profession}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text }).setOrigin(0, 0)
      const hit = this.add.rectangle(8, y - 2, panelW - 16, lineH, 0x000000, 0.001).setOrigin(0, 0)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => { overlay.destroy(); this.openResidentDetailOverlay(r) })
      panel.add([text, hit])
      y += lineH
    }
    overlay.add([bg, panel])
  }

  private openResidentDetailOverlay(r: any): void {
    const overlay = this.add.container(0, 0)
    overlay.name = 'residentDetailOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(560, Math.floor(w * 0.6))
    const panelH = Math.min(520, Math.floor(h * 0.7))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, r.name.toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const back = this.add.text(12, 12, '< BACK', { fontFamily: THEME.fonts.body, fontSize: '10px', color: '#8bc34a', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(0, 0)
    back.setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => { overlay.destroy(); this.openResidentsOverlay() })
    const skillsStr = (Array.isArray(r.skills) ? r.skills : []).map((s: any) => `• ${s?.text ?? '—'}`).join('\n')
    const statusLine = r.status ? `\nСТАТУС: ${r.status}` : ''
    const needH = (n: number|undefined) => (n==null? '—' : `${n}%`)
    const details = this.add.text(12, 44, `ВОЗРАСТ: ${r.age}\nПОЛ: ${r.gender}\nПРОФЕССИЯ: ${r.profession}${statusLine}\nРЕСУРСЫ: ${r.itemsText}\n\нНАВЫКИ:\n${skillsStr}\n\nПОТРЕБНОСТИ:\nГОЛОД: ${needH(r.hunger)}  ЖАЖДА: ${needH(r.thirst)}\nЭНЕРГИЯ: ${needH(r.energy)}  ЗДОРОВЬЕ: ${needH(r.health)}${r.patient? ' (пациент)' : ''}`.replace('\н', '\n'), { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: panelW - 24 } }).setOrigin(0, 0)
    panel.add([panelBg, title, back, details])
    overlay.add([bg, panel])
  }

  private togglePause(): void {
    if (this.scene.isPaused()) {
      this.scene.resume()
      this.pauseBtn?.setText(`[ ${t('pause')} ]`)
      this.showToast(t('resume'))
    } else {
      this.scene.pause()
      this.pauseBtn?.setText(`[ ${t('resume')} ]`)
      this.showToast(t('paused'))
    }
  }

  private nextCandidate(): void {
    // Переход дня/ночи теперь по таймеру. Кнопки лишь переключают кандидата
    this.showToast(t('next'))
    this.buildPersonPlaceholders()
    this.layout()
  }

  private startNewDay(): void {
    this.dayNumber += 1
    this.phase = 'day'
    this.visitorsRemaining = 3
    this.buildSurfacePlaceholders()
    this.buildPersonPlaceholders()
    this.buildBunkerPlaceholders()
    this.layout()
    this.announce(`${t('day')} ${this.dayNumber}`)
  }

  private startDayPhase(resetCycleStart: boolean): void {
    // Начинаем цикл с 06:00. dayCycleStartAt = now - смещение, соответствующее 06:00 в пределах суток
    if (resetCycleStart) {
      // Для старта: пусть within=0 => 06:00
      this.dayCycleStartAt = this.time.now
    }
    this.phase = 'day'
    this.phaseEndsAt = this.dayCycleStartAt + this.DAY_DURATION_MS
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t('dayPhase')} • ${this.getClockText()}`)
    this.parallax?.setPhase('day')
    this.announce(t('dayPhase'))
    // Если первый день — создаём 3 посетителей
    if (this.dayNumber === 1 && !this.initialQueueSeeded) {
      this.initialQueueSeeded = true
      // Задержка перед появлением первых посетителей
      this.time.delayedCall(2000, () => {
        this.seedInitialVisitors(3)
      })
    }
    // Запускаем прибытие людей периодически днём
    this.arrivalEvent?.remove(false)
    this.scheduleVisitorArrival()
    // Останавливаем ночную волну врагов
    this.enemyArrivalEvent?.remove(false)
    // Обновляем интерфейс при смене фазы
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  private startNightPhase(): void {
    this.phase = 'night'
    this.phaseEndsAt = this.dayCycleStartAt + this.DAY_DURATION_MS + this.NIGHT_DURATION_MS
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t('nightPhase')} • ${this.getClockText()}`)
    this.parallax?.setPhase('night')
    this.announce(t('nightComing'))
    // Ночью очередь людей расходится
    this.arrivalEvent?.remove(false)
    this.disperseQueue()
    // Запускаем волну врагов с динамическим интервалом
    this.scheduleEnemyArrival()
    // Сразу создадим первого врага, чтобы отобразить кнопку DEFENSE
    this.maybeArriveEnemy()
    // Обновляем интерфейс при смене фазы
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  private getClockText(): string {
    const cycle = this.DAY_DURATION_MS + this.NIGHT_DURATION_MS
    if (this.dayCycleStartAt === 0) return '06:00'
    const now = this.time.now
    let elapsed = now - this.dayCycleStartAt
    if (elapsed < 0) elapsed = 0
    const within = elapsed % cycle
    // День: 06:00 -> 22:00 (16ч) за DAY_DURATION_MS
    // Ночь: 22:00 -> 06:00 (8ч) за NIGHT_DURATION_MS
    const secondsInHour = 3600
    const baseDayStartSec = 6 * secondsInHour
    const daySpanSec = 16 * secondsInHour
    const nightSpanSec = 8 * secondsInHour
    let totalSec: number
    if (within < this.DAY_DURATION_MS) {
      const k = within / this.DAY_DURATION_MS
      totalSec = baseDayStartSec + Math.floor(k * daySpanSec)
    } else {
      const nightElapsed = within - this.DAY_DURATION_MS
      const k = nightElapsed / this.NIGHT_DURATION_MS
      totalSec = (22 * secondsInHour) + Math.floor(k * nightSpanSec)
    }
    totalSec = totalSec % (24 * secondsInHour)
    const hh = Math.floor(totalSec / secondsInHour)
    const mm = Math.floor((totalSec % secondsInHour) / 60)
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return `${pad(hh)}:${pad(mm)}`
  }

  private tickClockAndPhase(): void {
    if (!this.topBar) return
    if (this.dayCycleStartAt === 0) this.dayCycleStartAt = this.time.now
    const isDay = this.phase === 'day'
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t(isDay ? 'dayPhase' : 'nightPhase')} • ${this.getClockText()}`)
    // Смена фазы по времени часов: в 22:00 — ночь, в 06:00 — день
    const clock = this.getClockText()
    if (clock === '22:00' && this.phase !== 'night') {
      this.sendResidentsToRestRooms()
      this.startNightPhase()
      this.layout()
    }
    if (clock === '06:00' && this.phase !== 'day') {
      this.startDayPhase(false)
      this.layout()
    }

    // Новый день наступает в 00:00 (счётчик дня +1), но фаза остаётся ночной до 06:00
    if (clock === '00:00') {
      if (!this.midnightHandled) {
        // Суточная экономика в полночь
        this.processDailyResources()
        this.dayNumber += 1
        this.announce(`${t('day')} ${this.dayNumber}`)
        this.midnightHandled = true
        // Ночью при новом дне — враги продолжают стоять, люди не приходят
        if (this.phase === 'night') this.scheduleEnemyArrival()
      }
    } else {
      this.midnightHandled = false
    }

    // Ежечасная обработка работы жителей (06..21 — день, 22..05 — ночь)
    const hh = parseInt(clock.slice(0, 2), 10)
    const isDayHour = hh >= 6 && hh < 22
    if (this.lastHourTick !== hh) {
      ;(this.simpleBunker as any)?.onHourTick?.(hh, isDayHour)
      this.lastHourTick = hh
    }
  }

  private sendResidentsToRestRooms(): void {
    // Сообщаем bunkerView, что ночь — отправить жителей в комнаты отдыха
    try {
      (this.simpleBunker as any)?.sendResidentsToRestRooms?.()
    } catch {}
  }

  private computeEnemyArrivalDelay(): number {
    let base = 8000
    switch (this.difficulty) {
      case 'easy':
        base = 9000
        break
      case 'normal':
        base = 8000
        break
      case 'hard':
        base = 6500
        break
      default:
        base = 8000
    }
    const daysPassed = Math.max(0, this.dayNumber - 1)
    const factor = Math.pow(0.94, daysPassed)
    const minDelay = 2200
    const delay = Math.max(minDelay, Math.floor(base * factor))
    return delay
  }

  private scheduleEnemyArrival(): void {
    this.enemyArrivalEvent?.remove(false)
    const delay = this.computeEnemyArrivalDelay()
    this.enemyArrivalEvent = this.time.addEvent({ delay, loop: true, callback: () => this.maybeArriveEnemy() })
  }

  private scheduleVisitorArrival(): void {
    this.arrivalEvent?.remove(false)
    const delay = this.computeVisitorArrivalDelay()
    this.arrivalEvent = this.time.delayedCall(delay, () => {
      this.maybeArriveVisitor()
      if (this.phase === 'day') this.scheduleVisitorArrival()
    })
  }

  // Очистка привязана к событию SHUTDOWN

  private showToast(text: string): void {
    const toast = this.add.text(this.scale.width / 2, 64, text, {
      fontFamily: THEME.fonts.body,
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#424242'
    }).setOrigin(0.5)
    this.tweens.add({ targets: toast, alpha: 0, duration: 1200, ease: 'Sine.easeOut', onComplete: () => toast.destroy() })
  }

  private announce(text: string): void {
    // Очередь игровых уведомлений, чтобы показывать их по одному
    const self: any = this as any
    if (!self._notifQueue) self._notifQueue = []
    if (!self._notifBusy) self._notifBusy = false
    self._notifQueue.push(text)
    if (self._notifBusy) return
    const runNext = () => {
      if (self._notifQueue.length === 0) { self._notifBusy = false; return }
      const msg: string = self._notifQueue.shift()
      self._notifBusy = true
      const s = uiScale(this)
      const yBase = Math.round(80 * s)
      const container = this.add.container(this.scale.width / 2, yBase)
      container.setDepth(2000)
      const bgPadding = 8
      const label = this.add.text(0, 0, msg, {
        fontFamily: THEME.fonts.heading,
        fontSize: fs(this, 18),
        color: '#ffffff'
      }).setOrigin(0.5)
      const bg = this.add.rectangle(0, 0, Math.ceil(label.width + bgPadding * 2), Math.ceil(label.height + bgPadding * 2), 0x000000, 0.4).setOrigin(0.5)
      container.add([bg, label])
      container.setAlpha(0)
      this.tweens.add({ targets: container, alpha: 1, y: yBase + 10, duration: 400, ease: 'Sine.easeOut', onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({ targets: container, alpha: 0, y: yBase + 20, duration: 500, ease: 'Sine.easeIn', onComplete: () => { container.destroy(); runNext() } })
        })
      } })
    }
    runNext()
  }
}


