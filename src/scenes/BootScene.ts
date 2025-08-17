import Phaser from 'phaser'
import { t } from '../core/i18n'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload(): void {
    // Здесь можно подгрузить минимальные ассеты, шрифты, спрайты для прелоадера
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#111')
    this.add.text(this.scale.width / 2, this.scale.height / 2, t('loading'), {
      fontFamily: 'Arial, system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.scene.start('Preload')
  }
}


