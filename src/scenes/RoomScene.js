import Phaser from 'phaser';
import { GameState, throttledSave, updateStats } from '../gameState.js';
import { ANY_FRAMES } from '../constants.js';
import { updateUIBars, updateAnyExpression, resetFrameCache, isNightTime, fitCamera } from '../utils.js';
import { bumpCounter } from '../achievements.js';

const LAYOUT = {
    anyAwake: { x: 1380, y: 1080, h: 518 },
    anySleep: { x: 1560, y: 980, h: 403 },
    lamp: { x: 1000, y: 1120, h: 144 },
};

export class RoomScene extends Phaser.Scene {
    constructor() {
        super('RoomScene');
        this.bg = null;
        this.any = null;
        this.lamp = null;
        this.decayAccumulator = 0;
        this.isToggling = false;
    }

    create() {
        this.cameras.main.fadeIn(250);
        fitCamera(this);

        const isNight = GameState.isSleeping || isNightTime();
        this.bg = this.add.image(1280, 720, isNight ? 'bg_noche' : 'bg_dia').setDepth(-10);

        this.createAny();
        this.createLamp();

        resetFrameCache();
        updateAnyExpression(this);

        GameState.currentScene = 'RoomScene';
    }

    createAny() {
        if (this.any) this.any.destroy();

        if (GameState.isSleeping) {
            const l = LAYOUT.anySleep;
            this.any = this.add.image(l.x, l.y, 'any_durmiendo');
            this.any.setOrigin(0.5, 0.5);
            this.any.setScale(l.h / 450);
        } else {
            let startFrame = ANY_FRAMES.NORMAL;
            if (GameState.health < 15) startFrame = ANY_FRAMES.ENFERMA_2;
            else if (GameState.health < 30) startFrame = ANY_FRAMES.ENFERMA_1;
            else if (GameState.sleep <= 25) startFrame = ANY_FRAMES.TIRED;
            else if (GameState.hunger < 20 || GameState.thirst < 20) startFrame = ANY_FRAMES.MOLESTA;

            const l = LAYOUT.anyAwake;
            this.any = this.add.sprite(l.x, l.y, GameState.outfit, startFrame);
            this.any.setOrigin(0.5, 0.5);
            this.any.setScale(l.h / 450);
        }
        this.any.setDepth(0);
    }

    createLamp() {
        if (this.lamp) this.lamp.destroy();

        const lampKey = GameState.isSleeping ? 'ui_light_on' : 'ui_light_off';
        this.lamp = this.add.sprite(LAYOUT.lamp.x, LAYOUT.lamp.y, lampKey);
        this.lamp.setOrigin(0.5, 0.5);
        this.lamp.setScale(LAYOUT.lamp.h / this.lamp.height);
        this.lamp.setDepth(1);
        this.lamp.setInteractive({ cursor: 'pointer' });
        this.lamp.on('pointerup', () => {
            this.toggleSleep();
        });
    }

    toggleSleep() {
        if (this.isToggling) return;
        this.isToggling = true;

        GameState.isSleeping = !GameState.isSleeping;

        const isNight = GameState.isSleeping || isNightTime();
        this.bg.setTexture(isNight ? 'bg_noche' : 'bg_dia');

        this.createAny();
        this.createLamp();

        resetFrameCache();
        updateAnyExpression(this);
        throttledSave();
        updateUIBars();
        if (GameState.isSleeping) bumpCounter('sleepCount');

        this.time.delayedCall(300, () => {
            this.isToggling = false;
        });
    }

    update(time, delta) {
        let dt = Math.min(delta / 1000, 0.1);
        this.decayAccumulator += dt;
        if (this.decayAccumulator >= 1.0) {
            const elapsed = this.decayAccumulator;
            this.decayAccumulator = 0;
            updateStats(elapsed);
            updateUIBars();
            updateAnyExpression(this);
            throttledSave();
        }
    }
}

export { LAYOUT as ROOM_LAYOUT };
