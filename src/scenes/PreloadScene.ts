import Phaser from 'phaser'
import { registerCharacterSheets, registerClothingSheets, registerHairSheets } from '../core/characters'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  preload(): void {
    const width = this.scale.width
    const height = this.scale.height
    const progressBar = this.add.rectangle(width / 2, height / 2, 400, 24, 0x2e7d32).setOrigin(0.5)
    const progressBg = this.add.rectangle(width / 2, height / 2, 420, 32, 0x1d1f24).setOrigin(0.5)
    progressBar.width = 0

    this.load.on('progress', (value: number) => {
      progressBar.width = 400 * value
    })

    // Фоны день/ночь (5 слоев)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`bg_day_${i}`, `src/sprites/2 Background/Day/${i}.png`)
      this.load.image(`bg_night_${i}`, `src/sprites/2 Background/Night/${i}.png`)
    }

    // Текстуры комнат
    this.load.image('room_bathroom', 'src/sprites/rooms/bathroom.png')
    this.load.image('room_bedroom', 'src/sprites/rooms/bedroom.png')
    this.load.image('room_computer', 'src/sprites/rooms/computer_room.png')
    this.load.image('room_dining', 'src/sprites/rooms/dining_room.png')
    this.load.image('room_elevator', 'src/sprites/rooms/elevator.png')
    this.load.image('room_entrance_in', 'src/sprites/rooms/entrance_inside.png')
    this.load.image('room_entrance_out', 'src/sprites/rooms/entrance_outside.png')
    this.load.image('room_hospital', 'src/sprites/rooms/hospital.png')
    this.load.image('room_lab', 'src/sprites/rooms/lab_room.png')
    this.load.image('room_storage', 'src/sprites/rooms/storage_room.png')
    this.load.image('room_tech', 'src/sprites/rooms/tech_room.png')
    this.load.image('room_station', 'src/sprites/rooms/station.png')

    // Предметы инвентаря (32x32)
    this.load.image('ammo', 'src/sprites/items/ammo.png')
    this.load.image('arrow', 'src/sprites/items/arrow.png')
    this.load.image('backpack', 'src/sprites/items/backpack.png')
    this.load.image('battery', 'src/sprites/items/battery.png')
    this.load.image('book1', 'src/sprites/items/book1.png')
    this.load.image('book2', 'src/sprites/items/book2.png')
    this.load.image('boots', 'src/sprites/items/boots.png')
    this.load.image('bottle', 'src/sprites/items/bottle.png')
    this.load.image('c4', 'src/sprites/items/c4.png')
    this.load.image('cap', 'src/sprites/items/cap.png')
    this.load.image('car_tires', 'src/sprites/items/car_tires.png')
    this.load.image('coal', 'src/sprites/items/coal.png')
    this.load.image('compass', 'src/sprites/items/compass.png')
    this.load.image('cup', 'src/sprites/items/cup.png')
    this.load.image('flashlight', 'src/sprites/items/flashlight.png')
    this.load.image('floppy_disk', 'src/sprites/items/floppy_disk.png')
    this.load.image('food', 'src/sprites/items/food.png')
    this.load.image('fur', 'src/sprites/items/fur.png')
    this.load.image('glass', 'src/sprites/items/glass.png')
    this.load.image('gps', 'src/sprites/items/gps.png')
    this.load.image('hat', 'src/sprites/items/hat.png')
    this.load.image('jacket1', 'src/sprites/items/jacket1.png')
    this.load.image('jacket2', 'src/sprites/items/jacket2.png')
    this.load.image('jeans', 'src/sprites/items/jeans.png')
    this.load.image('laptop', 'src/sprites/items/laptop.png')
    this.load.image('light_bulb', 'src/sprites/items/light_bulb.png')
    this.load.image('lighter', 'src/sprites/items/lighter.png')
    this.load.image('map', 'src/sprites/items/map.png')
    this.load.image('matches', 'src/sprites/items/matches.png')
    this.load.image('med_backpack', 'src/sprites/items/med_backpack.png')
    this.load.image('medicine', 'src/sprites/items/medicine.png')
    this.load.image('medicine2', 'src/sprites/items/medicine2.png')
    this.load.image('metal', 'src/sprites/items/metal.png')
    this.load.image('molotov', 'src/sprites/items/molotov.png')
    this.load.image('money', 'src/sprites/items/money.png')
    this.load.image('multi_tool', 'src/sprites/items/multi_tool.png')
    this.load.image('nails', 'src/sprites/items/nails.png')
    this.load.image('newspaper', 'src/sprites/items/newspaper.png')
    this.load.image('oil_canister', 'src/sprites/items/oil_canister.png')
    this.load.image('pants', 'src/sprites/items/pants.png')
    this.load.image('pants3', 'src/sprites/items/pants3.png')
    this.load.image('paper', 'src/sprites/items/paper.png')
    this.load.image('petrol_canister', 'src/sprites/items/petrol_canister.png')
    this.load.image('phone', 'src/sprites/items/phone.png')
    this.load.image('radio', 'src/sprites/items/radio.png')
    this.load.image('raw_meat', 'src/sprites/items/raw_meat.png')
    this.load.image('rope', 'src/sprites/items/rope.png')
    this.load.image('seeds', 'src/sprites/items/seeds.png')
    this.load.image('shirt', 'src/sprites/items/shirt.png')
    this.load.image('shirt2', 'src/sprites/items/shirt2.png')
    this.load.image('shoes', 'src/sprites/items/shoes.png')
    this.load.image('shoes2', 'src/sprites/items/shoes2.png')
    this.load.image('silencer', 'src/sprites/items/silencer.png')
    this.load.image('smoke_grenade', 'src/sprites/items/smoke_grenade.png')
    this.load.image('tape', 'src/sprites/items/tape.png')
    this.load.image('thread', 'src/sprites/items/thread.png')
    this.load.image('transmitter', 'src/sprites/items/transmitter.png')
    this.load.image('waffles', 'src/sprites/items/waffles.png')
    this.load.image('water', 'src/sprites/items/water.png')
    this.load.image('wires', 'src/sprites/items/wires.png')
    this.load.image('wood', 'src/sprites/items/wood.png')

    // Персонажи (спрайтшиты)
    registerCharacterSheets(this)
    registerClothingSheets(this)
    registerHairSheets(this)
    
    // Специализации персонажей (128x128)
    // Безработный
    this.load.spritesheet('unemployed_attack', 'src/sprites/characters/specialist/unemployed/Attack_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('unemployed_dead', 'src/sprites/characters/specialist/unemployed/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('unemployed_hurt', 'src/sprites/characters/specialist/unemployed/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('unemployed_idle2', 'src/sprites/characters/specialist/unemployed/Idle_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('unemployed_idle', 'src/sprites/characters/specialist/unemployed/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('unemployed_walk', 'src/sprites/characters/specialist/unemployed/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Повар
    this.load.spritesheet('chef_attack', 'src/sprites/characters/specialist/chef/Attack.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chef_dead', 'src/sprites/characters/specialist/chef/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chef_hurt', 'src/sprites/characters/specialist/chef/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chef_idle', 'src/sprites/characters/specialist/chef/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chef_walk', 'src/sprites/characters/specialist/chef/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Химик
    this.load.spritesheet('chemist_attack', 'src/sprites/characters/specialist/chemic/Attack.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chemist_idle', 'src/sprites/characters/specialist/chemic/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chemist_protection', 'src/sprites/characters/specialist/chemic/Protection.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('chemist_walk', 'src/sprites/characters/specialist/chemic/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Доктор
    this.load.spritesheet('doctor_attack', 'src/sprites/characters/specialist/doctor/Attack.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('doctor_dead', 'src/sprites/characters/specialist/doctor/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('doctor_hurt', 'src/sprites/characters/specialist/doctor/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('doctor_idle', 'src/sprites/characters/specialist/doctor/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('doctor_walk', 'src/sprites/characters/specialist/doctor/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Инженер
    this.load.spritesheet('engineer_attack', 'src/sprites/characters/specialist/engineer/Attack_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('engineer_dead', 'src/sprites/characters/specialist/engineer/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('engineer_hurt', 'src/sprites/characters/specialist/engineer/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('engineer_idle', 'src/sprites/characters/specialist/engineer/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('engineer_walk', 'src/sprites/characters/specialist/engineer/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Бездомный
    this.load.spritesheet('homeless_attack', 'src/sprites/characters/specialist/homeless/Attack_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('homeless_dead', 'src/sprites/characters/specialist/homeless/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('homeless_hurt', 'src/sprites/characters/specialist/homeless/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('homeless_idle', 'src/sprites/characters/specialist/homeless/Idle_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('homeless_special', 'src/sprites/characters/specialist/homeless/Special.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('homeless_walk', 'src/sprites/characters/specialist/homeless/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Охотник
    this.load.spritesheet('hunter_attack', 'src/sprites/characters/specialist/hunter/Attack_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('hunter_dead', 'src/sprites/characters/specialist/hunter/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('hunter_hurt', 'src/sprites/characters/specialist/hunter/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('hunter_idle', 'src/sprites/characters/specialist/hunter/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('hunter_walk', 'src/sprites/characters/specialist/hunter/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Сантехник
    this.load.spritesheet('plumber_attack', 'src/sprites/characters/specialist/plumber/Attack_3.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('plumber_dead', 'src/sprites/characters/specialist/plumber/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('plumber_hurt', 'src/sprites/characters/specialist/plumber/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('plumber_idle', 'src/sprites/characters/specialist/plumber/Idle_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('plumber_walk', 'src/sprites/characters/specialist/plumber/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Ученый
    this.load.spritesheet('scientist_attack', 'src/sprites/characters/specialist/scientist/Attack.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scientist_dead', 'src/sprites/characters/specialist/scientist/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scientist_hurt', 'src/sprites/characters/specialist/scientist/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scientist_idle', 'src/sprites/characters/specialist/scientist/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scientist_walk', 'src/sprites/characters/specialist/scientist/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Разведчик
    this.load.spritesheet('scout_attack', 'src/sprites/characters/specialist/scout/Attack_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scout_dead', 'src/sprites/characters/specialist/scout/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scout_hurt', 'src/sprites/characters/specialist/scout/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scout_idle', 'src/sprites/characters/specialist/scout/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('scout_walk', 'src/sprites/characters/specialist/scout/Walk.png', { frameWidth: 128, frameHeight: 128 })
    
    // Солдат
    this.load.spritesheet('soldier_attack', 'src/sprites/characters/specialist/soldier/Shot_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_dead', 'src/sprites/characters/specialist/soldier/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_hurt', 'src/sprites/characters/specialist/soldier/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_idle', 'src/sprites/characters/specialist/soldier/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_walk', 'src/sprites/characters/specialist/soldier/Walk.png', { frameWidth: 128, frameHeight: 128 })

    // Оружие: пистолет (кадры 64x32)
    this.load.image('pistol_f00', 'src/sprites/weapon/pistol/frame_00_delay-0.3s.png')
    this.load.image('pistol_f01', 'src/sprites/weapon/pistol/frame_01_delay-0.02s.png')
    this.load.image('pistol_f02', 'src/sprites/weapon/pistol/frame_02_delay-0.02s.png')
    this.load.image('pistol_f03', 'src/sprites/weapon/pistol/frame_03_delay-0.02s.png')
    this.load.image('pistol_f04', 'src/sprites/weapon/pistol/frame_04_delay-0.03s.png')
    this.load.image('pistol_f05', 'src/sprites/weapon/pistol/frame_05_delay-0.03s.png')
    this.load.image('pistol_f06', 'src/sprites/weapon/pistol/frame_06_delay-0.05s.png')
    this.load.image('pistol_f07', 'src/sprites/weapon/pistol/frame_07_delay-0.05s.png')
    this.load.image('pistol_f08', 'src/sprites/weapon/pistol/frame_08_delay-0.05s.png')
    this.load.image('pistol_f09', 'src/sprites/weapon/pistol/frame_09_delay-0.1s.png')
    this.load.image('pistol_f10', 'src/sprites/weapon/pistol/frame_10_delay-0.1s.png')
    this.load.image('pistol_f11', 'src/sprites/weapon/pistol/frame_11_delay-0.05s.png')

    // Враги: зомби (спрайтшиты 96x96, 1 слой, смотрят вправо)
    // Враги: мародеры 128x128
    // Мародер 1
    this.load.spritesheet('raider1_attack', 'src/sprites/enemies/bandits/Raider_1/Shot.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider1_walk', 'src/sprites/enemies/bandits/Raider_1/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider1_idle', 'src/sprites/enemies/bandits/Raider_1/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider1_hurt', 'src/sprites/enemies/bandits/Raider_1/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider1_dead', 'src/sprites/enemies/bandits/Raider_1/Dead.png', { frameWidth: 128, frameHeight: 128 })
    // Мародер 2
    this.load.spritesheet('raider2_attack', 'src/sprites/enemies/bandits/Raider_2/Shot_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider2_walk', 'src/sprites/enemies/bandits/Raider_2/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider2_idle', 'src/sprites/enemies/bandits/Raider_2/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider2_hurt', 'src/sprites/enemies/bandits/Raider_2/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider2_dead', 'src/sprites/enemies/bandits/Raider_2/Dead.png', { frameWidth: 128, frameHeight: 128 })
    // Мародер 3
    this.load.spritesheet('raider3_attack', 'src/sprites/enemies/bandits/Raider_3/Attack_1.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider3_walk', 'src/sprites/enemies/bandits/Raider_3/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider3_idle', 'src/sprites/enemies/bandits/Raider_3/Idle_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider3_hurt', 'src/sprites/enemies/bandits/Raider_3/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('raider3_dead', 'src/sprites/enemies/bandits/Raider_3/Dead.png', { frameWidth: 128, frameHeight: 128 })

    // Враги: зомби 96x96
    // Дикий зомби
    this.load.spritesheet('zombie_wild_walk', 'src/sprites/enemies/Zombie/Wild Zombie/Walk.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_wild_idle', 'src/sprites/enemies/Zombie/Wild Zombie/Idle.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_wild_dead', 'src/sprites/enemies/Zombie/Wild Zombie/Dead.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_wild_hurt', 'src/sprites/enemies/Zombie/Wild Zombie/Hurt.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_wild_attack1', 'src/sprites/enemies/Zombie/Wild Zombie/Attack_1.png', { frameWidth: 96, frameHeight: 96 })
    // Зомби мужчина
    this.load.spritesheet('zombie_man_walk', 'src/sprites/enemies/Zombie/Zombie Man/Walk.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_man_idle', 'src/sprites/enemies/Zombie/Zombie Man/Idle.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_man_dead', 'src/sprites/enemies/Zombie/Zombie Man/Dead.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_man_hurt', 'src/sprites/enemies/Zombie/Zombie Man/Hurt.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_man_attack', 'src/sprites/enemies/Zombie/Zombie Man/Bite.png', { frameWidth: 96, frameHeight: 96 })
    // Зомби женщина
    this.load.spritesheet('zombie_woman_walk', 'src/sprites/enemies/Zombie/Zombie Woman/Walk.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_woman_idle', 'src/sprites/enemies/Zombie/Zombie Woman/Idle.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_woman_dead', 'src/sprites/enemies/Zombie/Zombie Woman/Dead.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_woman_hurt', 'src/sprites/enemies/Zombie/Zombie Woman/Hurt.png', { frameWidth: 96, frameHeight: 96 })
    this.load.spritesheet('zombie_woman_attack1', 'src/sprites/enemies/Zombie/Zombie Woman/Attack_1.png', { frameWidth: 96, frameHeight: 96 })

    // Враги: мутанты (hard_zombie), спрайтшиты 128x128
    // Мутант 1
    this.load.spritesheet('mutant1_walk', 'src/sprites/enemies/hard_zombie/Zombie_1/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant1_idle', 'src/sprites/enemies/hard_zombie/Zombie_1/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant1_dead', 'src/sprites/enemies/hard_zombie/Zombie_1/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant1_hurt', 'src/sprites/enemies/hard_zombie/Zombie_1/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant1_attack', 'src/sprites/enemies/hard_zombie/Zombie_1/Attack.png', { frameWidth: 128, frameHeight: 128 })
    // Мутант 2
    this.load.spritesheet('mutant2_walk', 'src/sprites/enemies/hard_zombie/Zombie_2/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant2_idle', 'src/sprites/enemies/hard_zombie/Zombie_2/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant2_dead', 'src/sprites/enemies/hard_zombie/Zombie_2/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant2_hurt', 'src/sprites/enemies/hard_zombie/Zombie_2/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant2_attack', 'src/sprites/enemies/hard_zombie/Zombie_2/Attack.png', { frameWidth: 128, frameHeight: 128 })
    // Мутант 3
    this.load.spritesheet('mutant3_walk', 'src/sprites/enemies/hard_zombie/Zombie_3/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant3_idle', 'src/sprites/enemies/hard_zombie/Zombie_3/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant3_dead', 'src/sprites/enemies/hard_zombie/Zombie_3/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant3_hurt', 'src/sprites/enemies/hard_zombie/Zombie_3/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant3_attack', 'src/sprites/enemies/hard_zombie/Zombie_3/Attack.png', { frameWidth: 128, frameHeight: 128 })
    // Мутант 4
    this.load.spritesheet('mutant4_walk', 'src/sprites/enemies/hard_zombie/Zombie_4/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant4_idle', 'src/sprites/enemies/hard_zombie/Zombie_4/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant4_dead', 'src/sprites/enemies/hard_zombie/Zombie_4/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant4_hurt', 'src/sprites/enemies/hard_zombie/Zombie_4/Hurt.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('mutant4_attack', 'src/sprites/enemies/hard_zombie/Zombie_4/Attack.png', { frameWidth: 128, frameHeight: 128 })

    // Враги: солдат 128x128
    this.load.spritesheet('soldier_walk', 'src/sprites/enemies/soldier/Walk.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_idle', 'src/sprites/enemies/soldier/Idle.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_dead', 'src/sprites/enemies/soldier/Dead.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('soldier_hurt', 'src/sprites/enemies/soldier/Hurt.png', { frameWidth: 128, frameHeight: 128 })
  }

  create(): void {
    this.scene.start('MainMenu')
  }
}


