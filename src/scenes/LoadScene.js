import Phaser from 'phaser';
import { FOOD_DATABASE } from '../constants.js';
import { UIManager } from '../ui/UIManager.js';

export class LoadScene extends Phaser.Scene {
    constructor() {
        super('LoadScene');
    }

    preload() {
        const fill = document.getElementById('splash-fill');
        const sub = document.querySelector('.splash-sub');
        this.load.on('progress', (v) => {
            if (fill) fill.style.width = `${Math.floor(v * 100)}%`;
        });
        this.load.on('complete', () => {
            if (sub) sub.textContent = '¡Todo listo!';
            if (fill) fill.style.width = '100%';
            window.uiManager = new UIManager();
            document.getElementById('ui-layer').classList.add('visible');
            const splash = document.getElementById('splash');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 600);
            }
            import('../tutorial.js').then(({ startTutorialSystem }) => startTutorialSystem()).catch(() => {});
        });

        this.load.spritesheet('any_base', 'assets/any_sprites/any_base.png', { frameWidth: 450, frameHeight: 450 });
        this.load.spritesheet('any_casual', 'assets/any_sprites/any_casual.png', { frameWidth: 450, frameHeight: 450 });
        this.load.image('any_durmiendo', 'assets/any_sprites/any_durmiendo.png');

        const opts = { width: 2560, height: 1440 };
        this.load.svg('bg_dia', 'assets/backgrounds/bg_dia.svg', opts);
        this.load.svg('bg_noche', 'assets/backgrounds/bg_noche.svg', opts);
        this.load.svg('bg_cocina_dia', 'assets/backgrounds/bg_cocina_dia.svg', opts);
        this.load.svg('bg_cocina_noche', 'assets/backgrounds/bg_cocina_noche.svg', opts);
        this.load.svg('bg_salon_dia', 'assets/backgrounds/bg_salon_dia.svg', opts);
        this.load.svg('bg_salon_noche', 'assets/backgrounds/bg_salon_noche.svg', opts);

        FOOD_DATABASE.forEach((food) => this.load.image(food.id, `assets/comida/${food.id}.webp`));

        this.load.image('ui_fridge', 'assets/ui/fridge.png');
        this.load.image('ui_light_on', 'assets/ui/light_on.png');
        this.load.image('ui_light_off', 'assets/ui/light_off.png');
        this.load.audio('achievement_unlock', 'assets/ui/achievement-unlock.mp3');
    }

    create() {
        this.time.delayedCall(500, () => {
            this.cameras.main.fadeOut(250);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('RoomScene');
            });
        });
    }
}
