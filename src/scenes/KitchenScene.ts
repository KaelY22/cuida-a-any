import Phaser from 'phaser';
import { GameState, currentFoodIndex, setCurrentFoodIndex, throttledSave, updateStats } from '../gameState';
import { FOOD_DATABASE, ANY_FRAMES } from '../constants';
import type { Food } from '../constants';
import { updateUIBars, updateAnyExpression, resetFrameCache, isNightTime, canEatFood, fitCamera } from '../utils';
import { bumpCounter } from '../achievements';

const WORLD_W = 2560;
const WORLD_H = 1440;
const LAYOUT = {
    any: { x: 1400, y: 920, h: 576 },
    foodY: 1240,
    foodH: 173,
    fridge: { x: 1030, y: 1080, h: 520 },
};

interface FoodSprite extends Phaser.GameObjects.Sprite {
    foodRef: Food;
}

export class KitchenScene extends Phaser.Scene {
    any: Phaser.GameObjects.Sprite | null = null;
    food!: FoodSprite;
    fridge!: Phaser.GameObjects.Sprite;
    decayAccumulator = 0;
    bg!: Phaser.GameObjects.Image;
    foodY = 0;
    isDragging = false;
    nearMouth = false;
    mouthBox: Phaser.Geom.Rectangle | null = null;

    constructor() {
        super('KitchenScene');
    }

    create(): void {
        this.cameras.main.fadeIn(250);
        fitCamera(this);

        const isNight = GameState.isSleeping || isNightTime();
        this.bg = this.add.image(WORLD_W / 2, WORLD_H / 2, isNight ? 'bg_cocina_noche' : 'bg_cocina_dia').setDepth(-10);

        if (!GameState.isSleeping) {
            this.createAny();
        } else {
            this.any = null;
        }

        this.createPlateAndFood();
        this.createFridge();

        resetFrameCache();
        updateAnyExpression(this);

        GameState.currentScene = 'KitchenScene';
    }

    createAny(): void {
        if (this.any) this.any.destroy();
        let startFrame: number = ANY_FRAMES.NORMAL;
        if (GameState.health < 15) startFrame = ANY_FRAMES.ENFERMA_2;
        else if (GameState.health < 30) startFrame = ANY_FRAMES.ENFERMA_1;
        else if (GameState.sleep <= 25) startFrame = ANY_FRAMES.TIRED;
        else if (GameState.hunger < 20 || GameState.thirst < 20) startFrame = ANY_FRAMES.MOLESTA;

        const l = LAYOUT.any;
        this.any = this.add.sprite(l.x, l.y, GameState.outfit, startFrame);
        this.any.setOrigin(0.5, 0.5);
        this.any.setScale(l.h / 450);
        this.any.setDepth(0);
        const mw = this.any.displayWidth * 0.35;
        const mh = this.any.displayHeight * 0.28;
        this.mouthBox = new Phaser.Geom.Rectangle(
            this.any.x - mw / 2,
            this.any.y - this.any.displayHeight * 0.02 - mh / 2,
            mw,
            mh
        );
    }

    createPlateAndFood(): void {
        const foodKey = FOOD_DATABASE[currentFoodIndex].id;
        this.foodY = LAYOUT.foodY;
        this.food = this.add.sprite(LAYOUT.any.x, this.foodY, foodKey) as FoodSprite;
        this.food.setScale(LAYOUT.foodH / 200);
        this.food.setDepth(1);
        this.food.foodRef = FOOD_DATABASE[currentFoodIndex];

        this.food.setInteractive({
            draggable: true,
            cursor: 'grab'
        });

        this.food.on('dragstart', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (GameState.isEating || GameState.isSleeping || !(window.tutorialDragOK?.() ?? true)) {
                return;
            }
            this.isDragging = true;
            window.isDraggingFood = true;
            this.food.setDepth(10);
            this.food.setScale(LAYOUT.foodH / 200 * 1.2);
            this.food.input!.cursor = 'grabbing';
        });

        this.food.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (!this.isDragging) return;
            this.food.x = dragX;
            this.food.y = dragY;
            const over = this.any && !GameState.isSleeping && this.mouthBox && Phaser.Geom.Rectangle.Contains(this.mouthBox, pointer.worldX, pointer.worldY) && canEatFood(this.food.foodRef);
            if (over !== this.nearMouth) {
                this.nearMouth = !!over;
                if (over) {
                    this.any!.setFrame(ANY_FRAMES.BOCA_ABIERTA);
                } else {
                    this.updateAnyFrameFromState();
                }
            }
        });

        this.food.on('dragend', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (!this.isDragging) {
                return;
            }
            this.isDragging = false;
            window.isDraggingFood = false;
            const wasNearMouth = this.nearMouth;
            this.nearMouth = false;
            this.food.setDepth(1);
            this.food.setScale(LAYOUT.foodH / 200);
            this.food.input!.cursor = 'grab';

            if (wasNearMouth && this.any && !GameState.isSleeping) {
                window.__feedAttempted = true;
                this.startEating(this.food);
                return;
            }

            this.updateAnyFrameFromState();
            this.returnFoodToPlate();
        });
    }

    createFridge(): void {
        this.fridge = this.add.sprite(LAYOUT.fridge.x, LAYOUT.fridge.y, 'ui_fridge');
        const scale = LAYOUT.fridge.h / this.fridge.height;
        this.fridge.setScale(scale);
        this.fridge.setDepth(0);
        this.fridge.setInteractive({ cursor: 'pointer' });
        this.fridge.on('pointerdown', () => {
            const uiManager = window.uiManager;
            if (uiManager) uiManager.openFridge();
        });
    }

    updateFoodSprite(): void {
        const newKey = FOOD_DATABASE[currentFoodIndex].id;
        this.food.setTexture(newKey);
        this.food.foodRef = FOOD_DATABASE[currentFoodIndex];
        this.food.setPosition(LAYOUT.any.x, this.foodY);
        this.food.setScale(LAYOUT.foodH / 200);
        this.food.setInteractive({
            draggable: true,
            cursor: 'grab'
        });
    }

    updateAnyFrameFromState(): void {
        if (!this.any) return;
        resetFrameCache();
        let targetFrame: number = ANY_FRAMES.NORMAL;
        if (GameState.health < 15) targetFrame = ANY_FRAMES.ENFERMA_2;
        else if (GameState.health < 30) targetFrame = ANY_FRAMES.ENFERMA_1;
        else if (GameState.sleep <= 25) targetFrame = ANY_FRAMES.TIRED;
        else if (GameState.hunger < 20 || GameState.thirst < 20) targetFrame = ANY_FRAMES.MOLESTA;
        this.any.setFrame(targetFrame);
    }

    returnFoodToPlate(): void {
        this.tweens.add({
            targets: this.food,
            x: LAYOUT.any.x,
            y: this.foodY,
            scale: LAYOUT.foodH / 200,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                this.food.setDepth(1);
            }
        });
    }

    startEating(foodSprite: FoodSprite): void {
        if (GameState.isEating) return;
        const ref = foodSprite.foodRef;
        const isVerySick = (GameState.health < 15);
        const isAllowedFood = (ref.id === 'agua' || ref.id === 'medicina');
        if (!canEatFood(ref) || (isVerySick && !isAllowedFood)) {
            this.returnFoodToPlate();
            return;
        }

        const isIceCream = ref.type === 'icecream';
        if (isIceCream) {
            this.startLicking(foodSprite);
        } else {
            this.startNormalEating(foodSprite);
        }
    }

    startNormalEating(foodSprite: FoodSprite): void {
        GameState.isEating = true;
        foodSprite.disableInteractive();
        foodSprite.setVisible(false);
        let toggle = false;
        this.time.addEvent({
            delay: 200,
            callback: () => {
                toggle = !toggle;
                if (this.any) this.any.setFrame(toggle ? ANY_FRAMES.MASTICANDO : ANY_FRAMES.BOCA_ABIERTA);
            },
            repeat: 12
        });
        this.time.delayedCall(2600, () => this.finishEating(foodSprite, true));
    }

    startLicking(foodSprite: FoodSprite): void {
        GameState.isEating = true;
        foodSprite.disableInteractive();
        const originalX = foodSprite.x;
        const originalY = foodSprite.y;
        const originalAngle = foodSprite.angle;
        const anyX = this.any ? this.any.x : WORLD_W / 2;
        const anyY = this.any ? this.any.y - this.any.displayHeight * 0.15 : WORLD_H * 0.5;
        const offsetX = this.any ? this.any.displayWidth * 0.19 : 110;
        const offsetY = this.any ? this.any.displayHeight * 0.25 : 145;
        this.tweens.add({
            targets: foodSprite,
            x: anyX + offsetX,
            y: anyY + offsetY,
            angle: -20,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                let lickToggle = false;
                this.time.addEvent({
                    delay: 200,
                    callback: () => {
                        lickToggle = !lickToggle;
                        if (this.any) this.any.setFrame(lickToggle ? ANY_FRAMES.LAMIENDO_2 : ANY_FRAMES.LAMIENDO_1);
                    },
                    repeat: 12
                });
                this.time.delayedCall(2600, () => {
                    this.tweens.add({
                        targets: foodSprite,
                        x: originalX,
                        y: originalY,
                        angle: originalAngle,
                        duration: 400,
                        ease: 'Back.out',
                        onComplete: () => this.finishEating(foodSprite, false)
                    });
                });
            }
        });
    }

    finishEating(foodSprite: FoodSprite, makeVisible: boolean): void {
        const ref = foodSprite.foodRef;
        GameState.hunger = Phaser.Math.Clamp(GameState.hunger + Phaser.Math.Between(ref.h[0], ref.h[1]), 0, 100);
        GameState.thirst = Phaser.Math.Clamp(GameState.thirst + Phaser.Math.Between(ref.t[0], ref.t[1]), 0, 100);
        if (ref.health) {
            GameState.health = Phaser.Math.Clamp(GameState.health + Phaser.Math.Between(ref.health[0], ref.health[1]), 0, 100);
        }
        if (ref.healthChance && Math.random() < ref.healthChance) {
            GameState.health = Math.min(100, GameState.health + (ref.healthGain || 1));
        }
        updateUIBars();
        throttledSave();

        if (makeVisible) foodSprite.setVisible(true);
        foodSprite.setPosition(LAYOUT.any.x, this.foodY);
        foodSprite.setScale(LAYOUT.foodH / 200);
        foodSprite.setDepth(1);
        foodSprite.setInteractive({
            draggable: true,
            cursor: 'grab'
        });

        GameState.isEating = false;
        resetFrameCache();
        updateAnyExpression(this);
        bumpCounter('feedCount');
    }

    update(time: number, delta: number): void {
        let dt = Math.min(delta / 1000, 0.1);
        this.decayAccumulator += dt;
        if (this.decayAccumulator >= 1.0) {
            const elapsed = this.decayAccumulator;
            this.decayAccumulator = 0;
            updateStats(elapsed);
            updateUIBars();
            if (!this.nearMouth) {
                updateAnyExpression(this);
            }
            throttledSave();
        }
    }
}

