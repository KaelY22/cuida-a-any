# Cuida A Any 🧡

Mascota virtual PWA construida con **Phaser 3** y **JavaScript vanilla** — sin frameworks de UI, sin dependencias pesadas: canvas + DOM overlay.

Cuida a Any: aliméntala, dale de beber, llévala a dormir, vístela y descubre sus logros. El juego se adapta al día y la noche reales de Ciudad de México y sobrevive en cualquier dispositivo, del teléfono vertical al monitor ultra-wide.

- **Producción**: https://cuida-a-any.pages.dev
- **Versión**: `any-v25`
- **Plataforma**: Cloudflare Pages · deploy con Wrangler CLI

---

## Características

- **Mundo full-bleed 2560×1440** con cámara `cover`: el fondo cubre siempre toda la pantalla, con la zona interactiva protegida en la franja central.
- **4 estatísticas con decaimiento en tiempo real**: hambre, sed, sueño y salud (con decaimiento offline al volver).
- **112 comidas en 15 categorías** con drag & drop al plato → boca (la boca se abre al acercar la comida).
- **Ciclo día/noche real** (`America/Mexico_City`): fondos, lámpara y sprite cambian al dormir.
- **Vestidor** con outfits personalizados y spritesheet por frame.
- **12 logros** con toasts y sonido de desbloqueo.
- **Tutorial interactivo** de 7 pasos para nuevos jugadores.
- **PWA instalable** con service worker optimizado para arranque rápido en móvil.

---

## Stack

| Herramienta | Versión | Uso |
|---|---|---|
| Vite | 8.x | Build + dev server |
| Phaser | 3.60 | Motor de juego (npm local, NO CDN) |
| JavaScript | ES modules | Vanilla, cero frameworks |
| playwright-core | dev | Tests headless |
| Wrangler | 4.x | Deploy a Cloudflare Pages |

## Requisitos

- Node.js ≥ 20
- npm (incluido con Node)

## Puesta en marcha

```bash
# Instalar dependencias
npm install

# Entorno de desarrollo
npm run dev

# Build de producción + service worker
npm run build

# Tests (build + 4 suites headless)
npm test

# Deploy a Cloudflare Pages (requiere token en el entorno)
npm run deploy
```

> Nota para entornos con FUSE (como Termux sobre sdcard): los `node_modules` no deben vivir en el sistema de archivos montado — usa un bind mount a una ruta nativa (ver `docs/DESARROLLO.md`).

---

## Estructura

```
├── index.html            DOM + CSS inline (tokens, componentes)
├── public/sw.js          service worker (precache generado en build)
├── src/
│   ├── main.js           Config Phaser, ROOMS/dock, transiciones
│   ├── constants.js      FOOD_DATABASE, CATEGORIES, ANY_FRAMES
│   ├── gameState.js      Estado + persistencia + decaimiento
│   ├── utils.js          fitCamera, updateUIBars, expresiones
│   ├── achievements.js   12 logros + toasts
│   ├── tutorial.js       Pasos del tutorial + lógica lifted
│   ├── scenes/           Load, Room, Kitchen, Salon
│   └── ui/UIManager.js   Topbar, modales, ajustes, nevera, vestidor
├── scripts/              gen-sw.mjs, gen-bgs.py
├── docs/                 Documentación técnica y de diseño
└── tests/                4 suites headless (.mjs)
```

## Pruebas

```bash
npm test
```

Cuatro suites headless con Chromium (`?renderer=canvas`), cada una con su servidor efímero:

| Suite | Puerto | Cubre |
|---|---|---|
| kitchen.test.mjs | 8123 | Drag & drop, hitbox de boca, canEatFood (dual/lleno/enfermo) |
| decay.test.mjs | 8124 | Decaimiento por minuto + recuperación durmiendo |
| menu.test.mjs | 8127 | Boot limpio, cero errores de consola/página |
| features.test.mjs | 8125 | Tutorial, vestidor, logros, ajustes, persistencia |

## Despliegue

`npm run deploy` construye y sube la carpeta `dist/` al proyecto Cloudflare Pages `cuida-a-any`.

El service worker usa `VERSION` en `sw.js` — es **obligatorio** incrementarla en cada deploy para que el precache se actualice.

---

## Documentación

- **`docs/DESARROLLO.md`** — arquitectura completa: modelo full-bleed, constantes LAYOUT, paletas de fondos SVG, sistema de diseño GUI, mecánicas de las 112 comidas, accesibilidad y notas de estabilidad móvil.
- **`tools/sprites/`** — utilidades de generación de sprites para el juego.

## Licencia

MIT — ver [LICENSE](LICENSE).

> Hecho con cariño y la ayuda de un compañero de código IA. ✨