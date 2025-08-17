import Phaser from 'phaser'
import { t } from '../core/i18n'
import { THEME, uiScale, fs } from '../core/theme'
import { createPixelPanel, getPanelContent, createMenuButton } from '../core/ui'
import { addScanlines, addEmergencyLights, addGlitchTitle } from '../core/effects'

export class AboutScene extends Phaser.Scene {
  constructor() {
    super('About')
  }

  create(): void {
    const { width, height } = this.scale
    const s = uiScale(this)

    addScanlines(this)
    addEmergencyLights(this)

    addGlitchTitle(this, 'ABOUT'.toUpperCase(), width / 2, height * 0.18, {
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

    const text = this.add.text(0, Math.round(80 * s), 'BUNKER PROTOCOL\nPrototype UI\nCredits: You', {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 12),
      color: THEME.colors.text
    }).setOrigin(0, 0)
    content.add(text)

    const backBtn = createMenuButton(
      this,
      t('back').toUpperCase(),
      0,
      Math.round(280 * s),
      () => this.scene.start('MainMenu'),
      Math.floor(panelWidth * 0.7),
      Math.max(34, Math.round(40 * s))
    )
    content.add(backBtn)
  }
}


