import { GameState } from './gameState.js';
import { ANY_FRAMES } from './constants.js';

let domCache = null;
let lastStats = { hunger: -1, thirst: -1, sleep: -1, health: -1 };
let currentAnyFrame = -1;

function getDOM() {
    if (!domCache) {
        domCache = {
            hungerFill: document.getElementById('fill-hunger'),
            thirstFill: document.getElementById('fill-thirst'),
            sleepFill: document.getElementById('fill-sleep'),
            healthFill: document.getElementById('fill-health'),
            hungerNum: document.getElementById('num-hunger'),
            thirstNum: document.getElementById('num-thirst'),
            sleepNum: document.getElementById('num-sleep'),
            healthNum: document.getElementById('num-health'),
            hungerPill: document.querySelector('.status-pill[data-stat="hunger"]'),
            thirstPill: document.querySelector('.status-pill[data-stat="thirst"]'),
            sleepPill: document.querySelector('.status-pill[data-stat="sleep"]'),
            healthPill: document.querySelector('.status-pill[data-stat="health"]'),
        };
    }
    return domCache;
}

function updatePillState(pill, value) {
    if (!pill) return;
    pill.classList.toggle('low', value < 25);
    pill.classList.toggle('mid', value >= 25 && value < 50);
}

export function updateUIBars() {
    const dom = getDOM();
    const h = Math.floor(GameState.hunger);
    const t = Math.floor(GameState.thirst);
    const s = Math.floor(GameState.sleep);
    const he = Math.floor(GameState.health);

    if (lastStats.hunger !== h) {
        dom.hungerFill.style.height = h + '%';
        dom.hungerNum.textContent = h + '%';
        updatePillState(dom.hungerPill, h);
        lastStats.hunger = h;
    }
    if (lastStats.thirst !== t) {
        dom.thirstFill.style.height = t + '%';
        dom.thirstNum.textContent = t + '%';
        updatePillState(dom.thirstPill, t);
        lastStats.thirst = t;
    }
    if (lastStats.sleep !== s) {
        dom.sleepFill.style.height = s + '%';
        dom.sleepNum.textContent = s + '%';
        updatePillState(dom.sleepPill, s);
        lastStats.sleep = s;
    }
    if (lastStats.health !== he) {
        dom.healthFill.style.height = he + '%';
        dom.healthNum.textContent = he + '%';
        updatePillState(dom.healthPill, he);
        lastStats.health = he;
    }
}

export function updateAnyExpression(scene) {
    if (!scene || !scene.any) return;

    let targetFrame;
    if (GameState.health < 15) targetFrame = ANY_FRAMES.ENFERMA_2;
    else if (GameState.health < 30) targetFrame = ANY_FRAMES.ENFERMA_1;
    else if (GameState.sleep <= 25) targetFrame = ANY_FRAMES.TIRED;
    else if (GameState.hunger < 20 || GameState.thirst < 20) targetFrame = ANY_FRAMES.MOLESTA;
    else targetFrame = ANY_FRAMES.NORMAL;

    if (targetFrame !== currentAnyFrame) {
        if (scene.any.texture.key === 'any_base' || scene.any.texture.key === 'any_casual') {
            scene.any.setFrame(targetFrame);
        }
        currentAnyFrame = targetFrame;
    }
}

export function resetFrameCache() {
    currentAnyFrame = -1;
}

// ===== NUEVA FUNCIÓN PARA DETECTAR NOCHE (hora México) =====
export function isNightTime() {
    const now = new Date();
    // Obtener hora en zona horaria de México (CDMX)
    const formatter = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: 'numeric',
        hour12: false
    });
    const hour = parseInt(formatter.format(now), 10);
    // Noche: de 19:00 a 5:59
    return (hour >= 19 || hour < 6);
}

export function canEatFood(ref) {
    const hungerFull = ref.h[1] > 0 && GameState.hunger >= 99.5;
    const thirstFull = ref.t[1] > 0 && GameState.thirst >= 99.5;
    const healthFull = ref.health && ref.health[0] > 0 && GameState.health >= 99.5;
    if (ref.h[1] > 0 && ref.t[1] > 0) {
        return !(hungerFull && thirstFull);
    }
    return !hungerFull && !thirstFull && !healthFull;
}
export const WORLD_W = 2560;
export const WORLD_H = 1440;

export function fitCamera(scene) {
    const cam = scene.cameras.main;
    const apply = () => {
        cam.setZoom(Math.max(scene.scale.width / WORLD_W, scene.scale.height / WORLD_H));
        cam.centerOn(WORLD_W / 2, WORLD_H / 2);
    };
    apply();
    scene.scale.on('resize', apply);
    scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}

export function releaseTextures(keys) {
    keys.forEach((k) => window.game?.textures?.remove(k));
}
