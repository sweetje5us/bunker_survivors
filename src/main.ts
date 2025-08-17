import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { DifficultyScene } from './scenes/DifficultyScene'
import { GameScene } from './scenes/GameScene'
import { SettingsScene } from './scenes/SettingsScene'
import { AboutScene } from './scenes/AboutScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#111111',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [BootScene, PreloadScene, MainMenuScene, DifficultyScene, SettingsScene, AboutScene, GameScene]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const game = new Phaser.Game(config)


