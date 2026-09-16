import Phaser from 'phaser';
import { loadData, GameState, forceSave } from './gameState';
import { LoadScene } from './scenes/LoadScene';
import { KitchenScene } from './scenes/KitchenScene';
import { RoomScene } from './scenes/RoomScene';
import { SalonScene } from './scenes/SalonScene';

loadData();

const config: Phaser.Types.Core.GameConfig = {
    type: location.search.includes('renderer=canvas') ? Phaser.CANVAS : Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        autoCenter: Phaser.Scale.NO_CENTER,
    },
    transparent: false,
    scene: [LoadScene, RoomScene, KitchenScene, SalonScene],
    render: {
        clearBeforeRender: true,
        pixelArt: false,
        antialias: true,
    },
    fps: {
        target: 60,
        min: 30,
        smoothStep: true
    },
    physics: {
        default: 'none',
    },
};

export const game = new Phaser.Game(config);
window.game = game;

window.addEventListener('webglcontextlost', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (game.renderer.type === Phaser.WEBGL) {
        const gl = (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl;
        if (gl && gl.isContextLost && gl.isContextLost()) {
            window.location.reload();
        }
    }
});

const ROOMS: { key: string; icon: string; name: string; color: string }[] = [
    { key: 'RoomScene', icon: 'bed', name: 'Habitación', color: '#9b6fd8' },
    { key: 'KitchenScene', icon: 'restaurant', name: 'Cocina', color: '#f4792f' },
    { key: 'SalonScene', icon: 'checkroom', name: 'Vestidor', color: '#e07a9f' },
];
const sceneOrder = ROOMS.map((r) => r.key);
let transitionQueue: string[] = [];
let isProcessing = false;

function getCurrentSceneIndex(): number {
    const active = game.scene.getScenes(true)[0];
    if (!active) return 0;
    const idx = sceneOrder.indexOf(active.scene.key);
    return idx !== -1 ? idx : 0;
}
window.getCurrentSceneIndex = getCurrentSceneIndex;

export function switchToScene(index: number): void {
    if (GameState.isEating) return;

    const normalizedIndex = ((index % sceneOrder.length) + sceneOrder.length) % sceneOrder.length;
    const targetKey = sceneOrder[normalizedIndex];
    const active = game.scene.getScenes(true)[0];

    if (!active || active.scene.key === targetKey) return;
    if (transitionQueue.includes(targetKey)) return;

    transitionQueue.push(targetKey);
    processQueue();
}
window.switchToScene = switchToScene;

function processQueue(): void {
    if (isProcessing || transitionQueue.length === 0) return;

    isProcessing = true;
    const targetKey = transitionQueue.shift() as string;
    const activeScene = game.scene.getScenes(true)[0];

    if (!activeScene || activeScene.scene.key === targetKey) {
        isProcessing = false;
        processQueue();
        return;
    }

    const activeKey = activeScene.scene.key;
    const fadeDuration = 250;

    activeScene.cameras.main.fadeOut(fadeDuration);

    activeScene.cameras.main.once('camerafadeoutcomplete', () => {
        game.scene.stop(activeKey);
        game.scene.start(targetKey);
        window.refreshDock?.();
        setTimeout(() => {
            isProcessing = false;
            processQueue();
        }, 100);
    });

    setTimeout(() => {
        if (isProcessing) {
            isProcessing = false;
            console.warn('Transición forzada por timeout');
            processQueue();
        }
    }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
    const dock = document.getElementById('down-dock')!;
    const salonIdx = sceneOrder.indexOf('SalonScene');

    const dockBtns = ROOMS.map((room, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dock-btn';
        btn.style.setProperty('--room', room.color);
        btn.innerHTML = `<span class="dock-icon material-symbols-rounded">${room.icon}</span><span class="dock-label">${room.name}</span>`;
        btn.addEventListener('click', () => {
            if (GameState.isEating) return;
            if (index === salonIdx && getCurrentSceneIndex() === salonIdx) {
                window.uiManager?.openOutfits();
                return;
            }
            switchToScene(index);
        });
        dock.appendChild(btn);
        return btn;
    });

    window.refreshDock = () => {
        const disabled = GameState.isEating;
        const activeIdx = getCurrentSceneIndex();
        dockBtns.forEach((btn, index) => {
            btn.classList.toggle('active', index === activeIdx);
            btn.classList.toggle('disabled', disabled && index !== activeIdx);
        });
    };
    window.refreshDock();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}