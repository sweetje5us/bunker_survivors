import Phaser from 'phaser'

export function isPortrait(scene: Phaser.Scene): boolean {
  const { width, height } = scene.scale
  return height >= width
}

export function onResize(
  scene: Phaser.Scene,
  handler: (gameSize: Phaser.Structs.Size) => void
): void {
  scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => handler(gameSize))
  handler(scene.scale.gameSize)
}


