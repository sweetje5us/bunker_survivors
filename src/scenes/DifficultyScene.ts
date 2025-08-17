import Phaser from 'phaser'
import { t } from '../core/i18n'
import { createTextButton, createPixelPanel, getPanelContent, createMenuButton } from '../core/ui'
import { THEME, uiScale, fs } from '../core/theme'
import { addScanlines, addEmergencyLights, addGlitchTitle } from '../core/effects'
import { onResize, isPortrait } from '../core/responsive'

export type Difficulty = 'easy' | 'normal' | 'hard'

export class DifficultyScene extends Phaser.Scene {
  private header?: Phaser.GameObjects.Text
  private buttons: Phaser.GameObjects.Container[] = []

  constructor() {
    super('Difficulty')
  }

  create(): void {
    const { width, height } = this.scale

    addScanlines(this)
    addEmergencyLights(this)

    const topStripe = this.add.rectangle(0, 0, width, 4, 0xb71c1c).setOrigin(0)
    const bottomStripe = this.add.rectangle(0, height - 4, width, 4, 0xb71c1c).setOrigin(0)

    const s = uiScale(this)
    addGlitchTitle(this, t('difficulty').toUpperCase(), width / 2, height * 0.18, {
      fontFamily: THEME.fonts.heading,
      fontSize: fs(this, 24),
      color: '#b71c1c'
    })

    // Panelized menu like main menu
    const panelWidth = Math.min(920 * s, Math.floor(width * 0.9))
    const panelHeight = Math.min(560 * s, Math.floor(height * 0.8))
    const panelX = Math.floor((width - panelWidth) / 2)
    const panelY = Math.floor((height - panelHeight) / 2)
    const panel = createPixelPanel(this, panelX, panelY, panelWidth, panelHeight, 20)
    const content = getPanelContent(panel)!

    const startY = Math.round(90 * s)
    const gap = Math.round(50 * s)
    const addItem = (label: string, idx: number, cb: () => void) => {
      const btn = createMenuButton(this, label.toUpperCase(), 0, startY + idx * gap, cb, Math.floor(panelWidth * 0.7), Math.max(34, Math.round(40 * s)))
      content.add(btn)
    }

    addItem(t('easy'), 0, () => this.startGame('easy'))
    addItem(t('normal'), 1, () => this.startGame('normal'))
    addItem(t('hard'), 2, () => this.startGame('hard'))
    addItem(t('back'), 3, () => this.scene.start('MainMenu'))

    onResize(this, () => this.layout())
    this.layout()
  }

  private startGame(level: Difficulty): void {
    this.scene.start('Game', { difficulty: level })
  }

  private layout(): void {
    const { width, height } = this.scale
    const portrait = isPortrait(this)
    const centerX = width / 2
    if (this.header) this.header.setPosition(centerX, height * (portrait ? 0.18 : 0.25))

    const spacing = portrait ? 72 : 80
    const startY = height * (portrait ? 0.4 : 0.45)
    this.buttons.forEach((btn, idx) => btn.setPosition(centerX, startY + spacing * idx))
  }
}


