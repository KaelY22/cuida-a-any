import Phaser from 'phaser';
import { GameState, forceSave, throttledSave, updateStats } from '../gameState';
import { updateAnyExpression, resetFrameCache, isNightTime, updateUIBars, fitCamera } from '../utils';
import { ANY_FRAMES } from '../constants';

export const OUTFITS: { id: string; name: string }[] = [
    { id: 'any_base', name: 'Clásico' },
    { id: 'any_casual', name: 'Casual' }
];

export class SalonScene extends Phaser.Scene {
    bg!: Phaser.GameObjects.Image;
    any: Phaser.GameObjects.Sprite | null = null;
    decayAccumulator = 0;

    constructor() {
        super('SalonScene');
    }

    create(): void {
        this.cameras.main.fadeIn(250);
        fitCamera(this);

        const isNight = GameState.isSleeping || isNightTime();
        this.bg = this.add.image(1280, 720, isNight ? 'bg_salon_noche' : 'bg_salon_dia').setDepth(-10);

        if (!GameState.isSleeping) {
            this.createAny();
        } else {
            this.any = null;
        }

        resetFrameCache();
        updateAnyExpression(this);

        GameState.currentScene = 'SalonScene';
    }

    createAny(): void {
        if (this.any) this.any.destroy();

        let startFrame: number = ANY_FRAMES.NORMAL;
        if (GameState.health < 15) startFrame = ANY_FRAMES.ENFERMA_2;
        else if (GameState.health < 30) startFrame = ANY_FRAMES.ENFERMA_1;
        else if (GameState.sleep <= 25) startFrame = ANY_FRAMES.TIRED;
        else if (GameState.hunger < 20 || GameState.thirst < 20) startFrame = ANY_FRAMES.MOLESTA;

        this.any = this.add.sprite(1380, 980, GameState.outfit, startFrame);
        this.any.setOrigin(0.5, 0.5);
        this.any.setScale(518 / 450);

        this.any.setInteractive({ cursor: 'pointer' });
        this.any.on('pointerdown', () => {
            window.uiManager?.openOutfits();
        });
    }

    applyOutfit(id: string): void {
        if (!this.any) return;
        GameState.outfit = id;
        this.any.setTexture(id);
        resetFrameCache();
        updateAnyExpression(this);
        forceSave();
    }

    update(time: number, delta: number): void {
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