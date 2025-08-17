import Phaser from 'phaser'
import { t, getLanguage, toggleLanguage, onLanguageChange } from '../core/i18n'
import { createTextButton, createToggle, createPixelPanel, getPanelContent, createMenuButton, createRadiationBadge } from '../core/ui'
import { THEME, uiScale, fs } from '../core/theme'
import { addScanlines, addEmergencyLights, addGlitchTitle } from '../core/effects'
import { onResize, isPortrait } from '../core/responsive'

export class MainMenuScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text

  constructor() {
    super('MainMenu')
  }

  create(): void {
    const { width, height } = this.scale

    // Effects
    addScanlines(this)
    addEmergencyLights(this)

    // Main pixel panel container
    const s = uiScale(this)
    const panelWidth = Math.min(920 * s, Math.floor(width * 0.92))
    const panelHeight = Math.min(560 * s, Math.floor(height * 0.82))
    const panelX = Math.floor((width - panelWidth) / 2)
    const panelY = Math.floor((height - panelHeight) / 2)
    const panel = createPixelPanel(this, panelX, panelY, panelWidth, panelHeight, 20)
    const content = getPanelContent(panel)!

    // Radiation badge
    const badge = createRadiationBadge(this, panelX + panelWidth - 48, panelY + 48)
    
    // Title with glitch effect
    addGlitchTitle(this, t('title').toUpperCase(), width / 2, panelY + 44 * s, {
      fontFamily: THEME.fonts.heading,
      fontSize: fs(this, 28),
      color: '#b71c1c'
    })

    // Menu list inside panel
    const menuStartY = Math.round(90 * s)
    const menuGap = Math.round(48 * s)
    const menuX = 0
    const addItem = (label: string, idx: number, cb: () => void) => {
      const btn = createMenuButton(this, label, 0, menuStartY + idx * menuGap, cb, Math.floor(panelWidth * 0.7), Math.max(34, Math.round(40 * s)))
      content.add(btn)
    }
    addItem(t('play').toUpperCase(), 0, () => this.scene.start('Difficulty'))
    addItem('SETTINGS', 1, () => this.scene.start('Settings'))
    addItem('ABOUT', 2, () => this.scene.start('About'))

    // Status bar (inside main panel, bottom area)
    const statusY = Math.round(menuStartY + 3 * menuGap)
    const status = this.add.container(0, statusY)
    const statusBg = this.add.rectangle(0, 0, Math.floor(panelWidth * 0.7), Math.max(30, Math.round(34 * s)), 0x1a1d22, 1).setOrigin(0, 0.5)
    statusBg.setStrokeStyle(1, 0x2a2d33)
    const dot = (x: number, color: number) => this.add.rectangle(x, 0, Math.max(8, Math.round(10 * s)), Math.max(8, Math.round(10 * s)), color).setOrigin(0, 0.5)
    const term = (x: number, text: string) => this.add.text(x, 0, text, { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#00ff00' }).setOrigin(0, 0.5)
    status.add([statusBg,
      dot(8, 0x2ecc71), term(8 + Math.round(14 * s), 'SYSTEM: OPERATIONAL'),
      dot(Math.round(220 * s), 0xf1c40f), term(Math.round(220 * s) + Math.round(14 * s), 'POWER: 78%'),
      dot(Math.round(360 * s), 0xe74c3c), term(Math.round(360 * s) + Math.round(14 * s), 'RATIONS: CRITICAL')
    ])
    content.add(status)

    // Authenticator bar below panel
    const authWidth = Math.min(panelWidth, Math.floor(width * 0.9))
    const authHeight = Math.max(40, Math.round(48 * s))
    const authPanel = createPixelPanel(this, Math.floor((width - authWidth) / 2), Math.floor(panelY + panelHeight + Math.round(12 * s)), authWidth, authHeight, Math.max(8, Math.round(10 * s)))
    const authContent = getPanelContent(authPanel)!
    const pulse = this.add.rectangle(0, 0, Math.max(8, Math.round(10 * s)), Math.max(8, Math.round(10 * s)), 0x2ecc71).setOrigin(0, 0.5)
    this.tweens.add({ targets: pulse, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 })
    const leftText = this.add.text(Math.round(14 * s), 0, 'AUTHENTICATING...', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#00ff00' }).setOrigin(0, 0.5)
    const rightText = this.add.text(Math.floor(authWidth * 0.45), 0, 'USER: COMMANDER | CLEARANCE: ALPHA-9', { fontFamily: THEME.fonts.body, fontSize: fs(this, 10), color: '#00ff00' }).setOrigin(0, 0.5)
    authContent.add([pulse, leftText, rightText])

    // Обновление при смене языка и ресайзе
    onLanguageChange(() => this.scene.restart())
  }

  updateTexts = (): void => {
    this.titleText?.setText(t('title'))
  }
}


