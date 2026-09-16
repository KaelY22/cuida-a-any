import type Phaser from 'phaser';
import type { UIManager } from './ui/UIManager';

declare global {
    interface Window {
        uiManager: UIManager | null;
        game: Phaser.Game | null;
        switchToScene: (index: number) => void;
        getCurrentSceneIndex: () => number;
        tutorialDragOK: () => boolean;
        refreshDock: () => void;
        __feedAttempted: boolean;
        isDraggingFood: boolean;
        __suppressSave: boolean;
    }
    interface Navigator {
        standalone?: boolean;
    }
}

export {};