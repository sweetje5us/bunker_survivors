import Phaser from 'phaser'
import { t, getLanguage, toggleLanguage } from '../core/i18n'
import { THEME, uiScale, fs } from '../core/theme'
import { createPixelPanel, getPanelContent, createMenuButton } from '../core/ui'
import { addScanlines, addEmergencyLights, addGlitchTitle } from '../core/effects'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings')
  }

  create(): void {
    const { width, height } = this.scale
    const s = uiScale(this)

    addScanlines(this)
    addEmergencyLights(this)

    addGlitchTitle(this, t('language').toUpperCase(), width / 2, height * 0.18, {
      fontFamily: THEME.fonts.heading,
      fontSize: fs(this, 22),
      color: '#b71c1c'
    })

    const panelWidth = Math.min(920 * s, Math.floor(width * 0.9))
    const panelHeight = Math.min(560 * s, Math.floor(height * 0.8))
    const panelX = Math.floor((width - panelWidth) / 2)
    const panelY = Math.floor((height - panelHeight) / 2)
    const panel = createPixelPanel(this, panelX, panelY, panelWidth, panelHeight, 20)
    const content = getPanelContent(panel)!

    const startY = Math.round(120 * s)
    const gap = Math.round(64 * s)

    const langButton = createMenuButton(
      this,
      `${t('language')}: ${t(getLanguage())}`.toUpperCase(),
      0,
      startY,
      () => {
        toggleLanguage()
        // Обновляем подпись
        const newLabel = `${t('language')}: ${t(getLanguage())}`.toUpperCase()
        ;(langButton.getAt(3) as Phaser.GameObjects.Text).setText(newLabel)
      },
      Math.floor(panelWidth * 0.7),
      Math.max(34, Math.round(40 * s))
    )
    content.add(langButton)

    const backBtn = createMenuButton(
      this,
      t('back').toUpperCase(),
      0,
      startY + gap,
      () => this.scene.start('MainMenu'),
      Math.floor(panelWidth * 0.7),
      Math.max(34, Math.round(40 * s))
    )
    content.add(backBtn)
  }
}


