import { GameState } from './gameState';

const FLAG = 'any_tutorial_done';

interface TutorialStep {
    id: string;
    icon: string;
    title: string;
    text: string;
    target?: string;
    waitFor?: string;
    goTo?: number;
    last?: boolean;
}

const STEPS: TutorialStep[] = [
    {
        id: 'intro',
        icon: 'pets',
        title: '¡Hola, soy Any!',
        text: 'Bienvenido a mi casa. Pásate por aquí cuando quieras: comer, dormir y jugar me encantan.'
    },
    {
        id: 'stats',
        icon: 'monitoring',
        title: 'Mis estados',
        text: 'Arriba están mis barras: hambre, sed, sueño y salud. Toca una para ver el detalle.',
        target: '.status-pill',
        waitFor: 'statsSeen'
    },
    {
        id: 'rooms',
        icon: 'explore',
        title: 'Mi mundo',
        text: 'Este menú cambia de habitación. Tócalo para moverte; pronto habrá más lugares.',
        target: '#down-dock',
        waitFor: 'roomsSeen'
    },
    {
        id: 'fridge',
        icon: 'kitchen',
        title: 'La nevera',
        text: 'Esta es mi cocina. Toca el refri y elige algo rico del menú para servirme el plato.',
        goTo: 1,
        waitFor: 'foodChosen'
    },
    {
        id: 'feed',
        icon: 'lunch_dining',
        title: '¡A comer!',
        text: 'Arrastra la comida del plato hasta mi boca. Verás que la abro cuando se acerque.',
        waitFor: 'fed'
    },
    {
        id: 'sleep',
        icon: 'bedtime',
        title: 'A descansar',
        text: 'Si me ves cansado, ve a mi habitación y toca la lámpara. Dormir recupera energía.',
        goTo: 0,
        waitFor: 'slept'
    },
    {
        id: 'done',
        icon: 'favorite',
        title: '¡Ya eres de la familia!',
        text: 'Lo básico ya lo tienes. Explora el vestidor para cambiarme de look, desbloquea logros y prueba comidas raras. ¡Nos vemos!',
        last: true
    }
];

let stepIndex = 0;
let overlayEl!: HTMLElement;
let spotEl!: HTMLElement;
let cardEl!: HTMLElement;
let nextBtn!: HTMLButtonElement;
let skipBtn!: HTMLButtonElement;
let blockerEl!: HTMLElement;
let tutorialActive = false;
let pollTimer: number | null = null;
const flags: Record<string, boolean> = {};

window.tutorialDragOK = () => !(tutorialActive && STEPS[stepIndex] && STEPS[stepIndex].id !== 'feed');

let lastClipPath = '';
function updateBlocker(): void {
    if (!blockerEl || !tutorialActive) return;
    const cr = document.getElementById('app-container')!.getBoundingClientRect();
    let hole: { x1: number; y1: number; x2: number; y2: number } | null = null;
    const modal = document.querySelector('.modal:not(.hidden)');
    if (modal) {
        const inner = modal.firstElementChild;
        if (inner) {
            const r = inner.getBoundingClientRect();
            hole = { x1: r.left - cr.left - 10, y1: r.top - cr.top - 10, x2: r.right - cr.left + 10, y2: r.bottom - cr.top + 10 };
        }
    } else {
        const step = STEPS[stepIndex];
        const el = step?.target ? document.querySelector(step.target) : null;
        if (el) {
            const r = el.getBoundingClientRect();
            hole = { x1: r.left - cr.left - 12, y1: r.top - cr.top - 12, x2: r.right - cr.left + 12, y2: r.bottom - cr.top + 12 };
        } else {
            const gc = document.getElementById('game-container')!;
            const r = gc.getBoundingClientRect();
            hole = { x1: r.left - cr.left, y1: r.top - cr.top, x2: r.right - cr.left, y2: r.bottom - cr.top };
        }
    }
    let clip = '';
    if (hole) {
        clip = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${hole.x1}px ${hole.y1}px, ${hole.x2}px ${hole.y1}px, ${hole.x2}px ${hole.y2}px, ${hole.x1}px ${hole.y2}px, ${hole.x1}px ${hole.y1}px)`;
    }
    if (clip !== lastClipPath) {
        lastClipPath = clip;
        blockerEl.style.clipPath = clip;
    }
}

function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch (e) {}
}

export function maybeStartTutorial(): void {
    document.addEventListener('click', (e) => {
        if (!tutorialActive) return;
        const t = e.target as Element | null;
        if (t?.closest('.status-pill')) flags.statsSeen = true;
        if (t?.closest('.dock-btn')) flags.roomsSeen = true;
        if (t?.closest('.food-item')) flags.foodChosen = true;
    });
    if (safeGet(FLAG)) return;
    setTimeout(showAsk, 900);
}

export function askTutorial(): void {
    showAsk();
}

function showAsk(): void {
    const ask = document.getElementById('tutorial-ask');
    if (!ask) return;
    ask.classList.remove('hidden');
    requestAnimationFrame(() => ask.classList.add('show'));
}

function dismissAsk(): void {
    const ask = document.getElementById('tutorial-ask');
    if (!ask) return;
    ask.classList.remove('show');
    ask.classList.add('hidden');
}

function markDone(): void {
    safeSet(FLAG, '1');
}

export function initTutorial(): void {
    window.uiManager?.closeAllModals();
    dismissAsk();
    overlayEl = document.getElementById('tutorial-overlay')!;
    blockerEl = document.getElementById('tutorial-blocker')!;
    spotEl = document.getElementById('tutorial-spot')!;
    cardEl = document.getElementById('tutorial-card')!;
    nextBtn = document.getElementById('tutorial-next') as HTMLButtonElement;
    skipBtn = document.getElementById('tutorial-skip') as HTMLButtonElement;
    tutorialActive = true;
    stepIndex = 0;
    flags.statsSeen = false;
    flags.roomsSeen = false;
    flags.foodChosen = false;
    flags.fed = false;
    flags.slept = false;
    overlayEl.classList.remove('hidden');
    blockerEl.classList.add('on');
    renderStep();
    pollTimer = setInterval(refreshStepState, 300);
}

function renderStep(): void {
    const step = STEPS[stepIndex];
    cardEl.querySelector('.tutorial-icon .material-symbols-rounded')!.textContent = step.icon;
    document.getElementById('tutorial-title')!.textContent = step.title;
    document.getElementById('tutorial-text')!.textContent = step.text;
    nextBtn.textContent = step.last ? '¡Empezar!' : 'Continuar';
    const isTargetStep = !!(step.waitFor && step.target);
    cardEl.classList.toggle('compact', !isTargetStep);
    updateLifted();
    if (step.goTo !== undefined) {
        window.switchToScene(step.goTo);
        setTimeout(() => { positionSpot(); updateLifted(); }, 750);
    } else {
        positionSpot();
    }
    refreshStepState();
}

function updateLifted(): void {
    if (!cardEl) return;
    const modalOpen = !!document.querySelector('.modal:not(.hidden)');
    let lifted = modalOpen;
    if (!lifted) {
        const step = STEPS[stepIndex];
        const el = step?.target ? document.querySelector(step.target) : null;
        if (el) {
            const r = el.getBoundingClientRect();
            lifted = r.top + r.height / 2 > window.innerHeight * 0.55;
        }
    }
    cardEl.classList.toggle('lifted', lifted);
}

function positionSpot(): void {
    updateBlocker();
    const step = STEPS[stepIndex];
    if (!step.target) {
        spotEl.classList.add('hidden');
        return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
        spotEl.classList.add('hidden');
        return;
    }
    const r = el.getBoundingClientRect();
    const cr = document.getElementById('app-container')!.getBoundingClientRect();
    const pad = 10;
    spotEl.style.left = (r.left - cr.left - pad) + 'px';
    spotEl.style.top = (r.top - cr.top - pad) + 'px';
    spotEl.style.width = (r.width + pad * 2) + 'px';
    spotEl.style.height = (r.height + pad * 2) + 'px';
    spotEl.classList.remove('hidden');
}

function refreshStepState(): void {
    if (!tutorialActive) return;
    updateLifted();
    updateBlocker();
    const step = STEPS[stepIndex];
    if (step.goTo !== undefined) {
        const active = window.game?.scene?.getScenes(true)[0];
        if (!active || window.getCurrentSceneIndex() !== step.goTo) {
            if (!GameState.isEating) window.switchToScene(step.goTo);
        }
    }
    if (step.waitFor === 'fed' && (GameState.isEating || window.__feedAttempted)) flags.fed = true;
    if (step.waitFor === 'slept' && GameState.isSleeping) flags.slept = true;
    const ready = !step.waitFor || flags[step.waitFor];
    nextBtn.disabled = !ready;
    const hint = cardEl.querySelector('.tutorial-hint')!;
    if (step.waitFor) {
        hint.textContent = ready ? '¡Perfecto!' : 'Hazlo y te espero aquí';
        hint.classList.remove('hidden');
    } else {
        hint.classList.add('hidden');
    }
}

function nextStep(): void {
    window.uiManager?.closeAllModals();
    const step = STEPS[stepIndex];
    if (step.last) {
        finishTutorial();
        return;
    }
    stepIndex++;
    renderStep();
}

function finishTutorial(): void {
    tutorialActive = false;
    clearInterval(pollTimer as number);
    pollTimer = null;
    overlayEl.classList.add('hidden');
    blockerEl.classList.remove('on');
    markDone();
}

export function skipTutorial(): void {
    finishTutorial();
}

export function setupTutorialControls(): void {
    document.getElementById('tutorial-yes')!.addEventListener('click', () => initTutorial());
    document.getElementById('tutorial-no')!.addEventListener('click', () => {
        dismissAsk();
        markDone();
    });
    document.getElementById('tutorial-next')!.addEventListener('click', () => {
        if (nextBtn && nextBtn.disabled) return;
        nextStep();
    });
    document.getElementById('tutorial-skip')!.addEventListener('click', () => skipTutorial());
}

export function startTutorialSystem(): void {
    setupTutorialControls();
    maybeStartTutorial();
}