# Cuida A Any — Documentación técnica 🧡

Mascota virtual de **Any** — juego PWA construido con Phaser 3 y JavaScript vanilla. Sin frameworks de UI, sin dependencias pesadas: canvas + DOM overlay.

- **URL producción**: https://cuida-a-any.pages.dev
- **Versión actual**: `any-v25` (migración FULL-BLEED)
- **Plataforma**: Cloudflare Pages · deploy con Wrangler CLI

---

## Stack técnico

| Herramienta | Versión | Uso |
|---|---|---|
| Vite | 8.2.1 | Build + dev server |
| Phaser | 3.60.0 | Motor de juego (npm local, NO CDN) |
| JavaScript | ES modules | Vanilla, cero frameworks |
| playwright-core | devDependency | Tests headless |
| Wrangler | 4.x | Deploy a Cloudflare Pages |

**Trampa del entorno (sdcard)**: FUSE no soporta symlinks ni mmap de binarios → `node_modules` vive en `/root/cua-any-node_modules` y se bind-monta al proyecto (auto-mount en `/root/.bashrc`). Scripts npm invocan binarios por ruta directa (`node node_modules/vite/bin/vite.js`) para evitar `.bin` links.

---

## Arquitectura de renderizado (modelo FULL-BLEED v25)

### Mundo fijo + cámara cover

El juego vive en un **mundo lógico de 2560×1440 px** (16:9 horizontal). El canvas Phaser usa `Scale.RESIZE` (el canvas = viewport real del dispositivo) y una cámara con zoom calculado:

```
zoom = max(anchoViewport / 2560, altoViewport / 1440)
cámara centrada en (1280, 720)
```

Resultado: el fondo **cubre siempre toda la pantalla** en cualquier dispositivo:
- PC 16:9 → mundo completo visible
- Teléfono vertical ~20:9 → recorta laterales (~10% por lado), zoom al centro
- Ultra-wide 21:9 → recorta arriba/abajo levemente

Implementado en `fitCamera(scene)` (`src/utils.js`), que además escucha `resize` (rotación de pantalla) y reajusta solo.

### Banda segura interactiva

Todo lo clickeable vive dentro de la franja central de **~700px de ancho** (`x ∈ [930, 1630]`) para garantizar alcance en cualquier aspect ratio. Los bordes del mundo son "sangrado": arte decorativo que puede recortarse sin perder nada.

### Coordenadas: mundo vs pantalla

Con zoom activo, las reglas son estrictas:

| Contexto | Sistema de coords |
|---|---|
| Posicionar sprites/hitboxes | Coordenadas de MUNDO (0..2560 × 0..1440) |
| Input del usuario (drag) | `pointer.worldX / pointer.worldY` — NUNCA `pointer.x/y` |
| DOM overlay (topbar/dock/modales) | CSS sobre el viewport real |

---

## Escenas

Flujo: `LoadScene` → `RoomScene` ⇄ `KitchenScene` ⇄ `SalonScene`. Cambio con stop+start vía cola (`transitionQueue`) con fade 250ms y timeout forzado a 800ms.

### Constantes LAYOUT (coords de mundo)

**RoomScene** (`src/scenes/RoomScene.js`):
```js
LAYOUT = {
    anyAwake: { x: 1380, y: 1080, h: 518 },
    anySleep: { x: 1560, y: 980, h: 403 },   // sprite any_durmiendo
    lamp:     { x: 1000, y: 1120, h: 144 },  // ui_light_on/off
}
```

**KitchenScene** (`src/scenes/KitchenScene.js`):
```js
LAYOUT = {
    any:    { x: 1400, y: 920, h: 576 },
    foodY:  1240,   // altura Y del plato/comida
    foodH:  173,    // altura visual de la comida
    fridge: { x: 1030, y: 1080, h: 520 },
}
```

**SalonScene** (`src/scenes/SalonScene.js`): Any en `(1380, 980)` escala `518/450`; tocarla abre el vestidor.

> `h` = altura visual objetivo en px de mundo; la escala del sprite es `h / 450` (los frames base miden 450×450).

### Día/Noche

`isNight = GameState.isSleeping || isNightTime()` — hora real de **Ciudad de México** (`America/Mexico_City`); noche entre **19:00 y 05:59**. Cada escena elige textura `*_dia` / `*_noche`; RoomScene intercambia en vivo al dormir/despertar.

---

## Fondos SVG (placeholders paramétricos)

Generados por `scripts/gen-bgs.py` — 6 archivos SVG flat-design de 2560×1440 en `public/assets/backgrounds/`. Se rasterizan con `load.svg(key, url, {width: 2560, height: 1440})`.

**Pendiente**: reemplazo por arte definitivo de Kael (mismas dimensiones, contenido importante en la banda segura).

### Paletas completas (hex exactos)

**Habitación** (identidad morado `#9b6fd8`):

| Elemento | Día | Noche |
|---|---|---|
| Pared | `#dccdf2` | `#463c63` |
| Guarda inferior (wainscot) | `#bb9fe6` | `#38304f` |
| Línea trim | `#a98cd6` | `#2e2742` |
| Piso madera | `#c98d5e` | `#5d4230` |
| Tablones | `#b87c4f` | `#4e3626` |
| Marco ventana | `#8f74bd` | `#332b4a` |
| Acento (cama/cuadro/noctaresta) | `#9b6fd8` | `#6b55a3` |
| Sombra | `rgba(90,60,120,0.18)` | `rgba(10,8,20,0.35)` |

Extras: ventana 420×520 @(320,200), cama decorativa derecha (x≥1880), mesita+base de lámpara @x=1000, alfombra doble bajo Any @x=1380. De noche: luna `#f4ecc8`, estrellas blancas, charco cálido `#ffb75e` opacity 0.14.

**Cocina** (identidad naranja `#f4792f`):

| Elemento | Día | Noche |
|---|---|---|
| Pared | `#fdeed6` | `#4d4038` |
| Guarda | `#f6d3a4` | `#3e332c` |
| Trim | `#eabf85` | `#332a24` |
| Piso loseta | `#e7cdb2` | `#54453a` |
| Tablones | `#d9b891` | `#463a31` |
| Marco ventana | `#d99a52` | `#372d26` |
| Refri cuerpo | `#b9c6ce` | `#5f6d77` |
| Refri puerta | `#e9f2f6` | `#8fa0ab` |
| Gabinetes | `#e8a86a` | `#7a5638` |
| Mesa del plato | `#f4792f` (op .85 día / .5 noche) | — |

Extras: refri dibujado EXACTAMENTE donde está su hitbox (rect 190×560 desde y=640 @x=950), mesa ovalada bajo el plato @x=1400,y≈1250, ventanal derecho 400×480, dos lámparas colgantes @x=1180/1380.

**Vestidor** (identidad rosa `#e07a9f`):

| Elemento | Día | Noche |
|---|---|---|
| Pared | `#f7dee7` | `#4a3944` |
| Guarda | `#efc0d1` | `#3b2d36` |
| Trim | `#e3a8be` | `#31252c` |
| Piso madera clara | `#d8ab84` | `#57402f` |
| Tablones | `#c79771` | `#48351f` |
| Closet madera | `#c98d5e` | `#5d4230` |
| Interior closet | `#f7efe4` | `#3a2f27` |
| Espejo marco | `#d493ac` | `#33262e` |
| Cristal espejo | `#dff2fa` | `#26303f` |
| Banca/puf | `#e07a9f` | op .5 |

Ropa colgada (5 colores ciclo): `#e07a9f #9b6fd8 #5aa9d6 #f4b942 #67b99a`.

Cielo diurno (todas): `#aee6f8` + sol `#ffd75e` + nubes blancas. Cielo nocturno: `#171d38`.

---

## Sistema de diseño GUI ("juguete físico")

Lenguaje: colores sólidos, borde inferior duro (`0 3px 0`), estados presionados con `translateY`, **cero gradientes, cero glassmorphism**, tipografía Fredoka.

### Tokens (`index.html` :root)

```css
--panel:       #fff6e9;   /* fondo general crema */
--card:        #fffdf6;   /* tarjetas */
--text-1:      #4a3b32;   /* texto principal café */
--text-2:      #8a7468;   /* texto secundario */
--text-3:      #b39a88;   /* texto terciario */
--accent:      #f4792f;   /* naranja principal */
--accent-deep: #d9621d;   /* naranja profundo (bordes/bottoms) */
--line:        rgba(74,59,50,0.10);
--danger:      #e5484d;
--ok:          #2aa854;
--hielo:       #e3f2f7;   /* interior nevera */
--estante:     #a8cfe0;   /* barras estante nevera */
--tinta-fria:  #3d5866;   /* texto frío nevera */
--mandarina:   #ff8c42;   /* selección activa nevera */
--radius:      20px;
--font: 'Fredoka', 'Segoe UI', system-ui, sans-serif;
--shadow-rest:  0 3px 0 rgba(74,59,50,.13), 0 8px 18px rgba(74,59,50,.08);
--shadow-press: 0 1px 0 rgba(74,59,50,.13);
```

Colores de habitación en dock/topbar: Habitación `#9b6fd8` · Cocina `#f4792f` · Vestidor `#e07a9f`.

### Capas DOM y z-index map

| z-index | Elemento | Notas |
|---|---|---|
| — | `#ambient` (muerto) | eliminado en v25 |
| 1 | `#app-container` | ahora `position: fixed; inset: 0` (viewport completo) |
| 100 | `.modal` | backdrop blur 10px `rgba(74,59,50,0.38)` |
| 200 | `#tutorial-overlay` | SIEMPRE encima de modales |
| 500 | `#splash` | pantalla de carga |
| 9999 | `#boot-error` | overlay crítico |

Contenedor usa `container-type: size` → unidades `cqw/cqh` disponibles para escalado responsivo.

### Componentes

- **Topbar**: settings (icon-btn) + 4 píldoras `.status-pill` (hambre/sed/sueño/salud). Fill sólido; clase `.low` (<25%) pulso rojo `dangerPulse`.
- **Dock** (`#down-dock`): barra inferior centrada, data-driven desde array `ROOMS` en `main.js` — agregar escena = agregar 1 objeto `{key, icon, name, color}`. Botón activo "pops up" con color de sala + animación `dockPop`. Tocar Vestidor activo abre outfits.
- **Modales**: sheet-style bottom (align-items: flex-end), radius superior, cierre con X.
- **Nevera** (modal cocina): interior hielo `--hielo`, estantes `--estante`, texto `--tinta-fria`; tarjeta actual estilo **imán de refrigerador** (blanca troquelada rotada -1.3deg); chips de categoría con escarcha; selección `--mandarina`. Animación `luzRefri` (brillo al abrir).
- **Toast de logros**: cola 1-a-la-vez, 3.8s, animación `toastDrop`, sonido `achievement-unlock.mp3`.
- **Tutorial**: overlay z 200; clase `.lifted` sube el cartel si el target está en la mitad inferior o hay modal abierto (nunca tapa menús).
- **Splash** (`#splash`): título + subtítulo + barra `--accent` ligada al progreso real del loader; se autodestruye tras completar.
- Accesibilidad movimiento: bloque `prefers-reduced-motion`.

---

## Mecánicas de juego

### Stats y decaimiento (por minuto)

| Stat | Fuera de sueño | Durmiendo |
|---|---|---|
| Hambre | −1 | +4 |
| Sed | −1 | +1 |
| Sueño | −4 | (recupera) |
| Salud | −0.25 | — |

Decaimiento offline aplicado al volver (delta timestamps). Persistencia: `localStorage['any_game_data']` con safeGet/safeSet + fallback en memoria; save forzado en `beforeunload/pagehide/visibilitychange(hidden)`; throttledSave cada ≥1s.

### Comida (112 items, 15 categorías)

`FOOD_DATABASE` en `src/constants.js`. Campos por item: `{id, cat, name, h:[min,max], t:[min,max], health?, healthChance?, healthGain?}`.

Categorías (conteo): postres 19 · frutas 13 · bebidas 10 · sushi 10 · dulces 9 · verduras 8 · rápida 8 · mariscos 7 · panes 6 · sopas 5 · mexicana 5 · snacks 4 · lácteos 3 · helados 4 · especiales 1.

Reglas:
- **Solo drag & drop** al plato→boca
- Hitbox boca: `35% ancho × 28% alto` del display de Any, centro desplazado `y − 2% displayHeight` (calibrada por Kael)
- La boca se ABRE al acercar comida (frame `BOCA_ABIERTA`)
- Drop fuera → tween `Back.out` de regreso al plato
- `canEatFood`: rechaza si TODAS las stats que subiría están ≥99.5 (no 100: el decaimiento deja 99.98)
- Helados TAMBIÉN hidratan (t[6,10])
- Comida dual (sube h y t): solo permitida si AMBAS stats no llenas
- Salud <15: solo agua/medicina aceptadas
- `healthChance` genérico en finishEating

### Dormir

Lámpara toggle en RoomScene. Al dormir: fondo nocturno inmediato + sprite `any_durmiendo` + stats según tabla + contador `sleepCount`.

### Vestidor

```js
OUTFITS = [
    { id: 'any_base',   name: 'Clásico' },
    { id: 'any_casual', name: 'Casual' },
]
```
Spritesheet 1800×1350, grid 4×3 frames de 450×450. Agregar ropa = objeto + PNG. Aplicar cambia `GameState.outfit` + `applyOutfit()` en escena viva. Previews CSS con `background-size:400% 300%`.

### Frames de Any (ANY_FRAMES)

```
NORMAL:0 · BOCA_ABIERTA:1 · MASTICANDO:2 · LAMIENDO_1:3 · LAMIENDO_2:4
ENFERMA_1:5 · ENFERMA_2:6 · MOLESTA:7 · TIRED:8
```

Expresión automática según estado: salud<15→ENFERMA_2, <30→ENFERMA_1, sueño≤25→TIRED, hambre o sed <20→MOLESTA.

### Logros (12)

| ID | Título | Condición |
|---|---|---|
| first_meal | Primer bocado | feedCount ≥1 |
| gourmet | Gourmet | feedCount ≥20 |
| chef | Chef de lujo | feedCount ≥100 |
| first_nap | Dulces sueños | sleepCount ≥1 |
| dormilon | Dormilón | sleepCount ≥20 |
| hydrated | Hidratada | sed ≥99.5 |
| full_belly | Barriga llena | hambre ≥99.5 |
| healthy | Sana y salva | salud ≥99.5 |
| balanced | Equilibrio total | 4 stats ≥90 |
| day2 | Buenos días | loginDays ≥2 |
| week | Semana completa | loginDays ≥7 |
| friend | Mejor amiga | loginDays ≥30 |

Chequeo cada 500ms (UIManager interval) vía bumpCounters y predicates `state(g)`.

### Tutorial (7 pasos)

Flag `any_tutorial_done`. Cartel a los 900ms tras boot (pregunta sí/no; relanzable desde Ajustes).

| Paso | Contenido | Target/Acción |
|---|---|---|
| intro | ¡Hola, soy Any! | libre |
| stats | Mis barras | spotlight `.status-pill` → tocar una |
| rooms | Mi mundo (dock) | spotlight `#down-dock` → tocarlo |
| fridge | La nevera | auto-goTo Cocina → elegir comida |
| feed | ¡A comer! | arrastrar a la boca (isEating) |
| sleep | A descansar | auto-goTo Habitación → lámpara (isSleeping) |
| done | ¡Ya eres de la familia! | **requiere `last: true`** |

Guards: no fuerza cambio de escena si `GameState.isEating`.

---

## Assets (inventario)

```
public/assets/
├── any_sprites/         2.7M
│   ├── any_base.png       spritesheet 1800×1350 (4×3, frames 450)
│   ├── any_casual.png     idem
│   └── any_durmiendo.png  imagen simple
├── backgrounds/         52K ← 6 SVG horizontales 2560×1440
├── comida/              916K · 112 WebP (quality 82)
├── favicon/             656K
└── ui/
    ├── fridge.png · light_on.png · light_off.png
    └── achievement-unlock.mp3
```

Iconografía GUI: Material Symbols Rounded (Google Fonts, Fredoka como fuente principal).

---

## PWA / Service Worker

- `sw.js` con placeholder `__PRECACHE_LIST__` reemplazado en build por `scripts/gen-sw.mjs`
- **v25**: precache SOLO esencial (~10 archivos: index, JS core, CSS, manifest, icons, fonts) → instalación rápida; el resto entra por runtime cache-first
- Navegaciones network-first (solo cachea res.ok), resto cache-first + fill
- `VERSION = 'any-v25'` — bump OBLIGATORIO en cada deploy
- Dedupe de fuentes antes de `addAll` (URLs duplicadas de Google Fonts matan el install)
- Módulos ES exigen MIME correcto en cache

### Estabilidad móvil

- `webglcontextlost` → preventDefault + reload on visibilitychange (canvas negro en background Android)
- Boot guard pre-boot (600ms, errores críticos only) + watchdog 10s + overlay post-boot para errores de escena
- Fallback CDN jsdelivr→unpkg (histórico)
- `manifest.json` con start_url ABSOLUTOS (relativos rompían install)

---

## Tests

Cuatro suites headless (`playwright-core`, Chromium, `?renderer=canvas`). Servidores efímeros por test:

| Suite | Puerto | Cubre |
|---|---|---|
| kitchen.test.mjs | 8123 | drag&drop, hitbox boca, canEatFood (dual/full/sick), retorno al plato |
| decay.test.mjs | 8124 | decaimiento por minuto + recuperación durmiendo |
| menu.test.mjs | 8127 | boot limpio, 0 errores consola/página |
| features.test.mjs | 8125 | tutorial completo, vestidor, logros, ajustes, persistencia |

Comando: `npm test` (build + las 4).

**Conversiones mundo→página para clicks sintéticos:**
```js
z = Math.max(canvasW / 2560, canvasH / 1440);
sx = rect.x + rect.w / 2 + (worldX − 1280) * z;
sy = rect.y + rect.h / 2 + (worldY − 720) * z;
```

Lecciones hard-knocked: touch real vía CDP (mouse headless no dispara pointer events de Phaser); inyectar `any_game_data` desde `/blank` mismo origen (pagehide pisa saves); setear flag de tutorial antes de tests de mecánicas.

---

## Scripts y estructura

```
npm run dev      → vite dev
npm run build    → build + gen-sw.mjs
npm run deploy   → build + wrangler pages deploy (deploy.sh NO buildea)
npm test         → build + 4 suites
scripts/gen-bgs.py   → regenerar fondos SVG paramétricos
```

```
├── index.html            DOM + TODO el CSS inline (tokens, componentes)
├── public/sw.js          service worker
├── src/
│   ├── main.js           config Phaser, ROOMS/dock, transiciones
│   ├── constants.js      FOOD_DATABASE, CATEGORIES, ANY_FRAMES
│   ├── gameState.js      estado + persistencia + decaimiento
│   ├── utils.js          fitCamera, updateUIBars, expresiones, WORLD_W/H
│   ├── achievements.js   12 logros + toasts
│   ├── tutorial.js       STEPS + overlay/lifted logic
│   ├── scenes/           Load, Room, Kitchen, Salon
│   └── ui/UIManager.js   topbar, modales, ajustes, nevera, vestidor
├── scripts/              gen-sw.mjs, gen-bgs.py
└── tests/                4 suites .mjs
```

---

## Historial de versiones

| Ver | Qué |
|---|---|
| v3 | PWA + config extensible |
| v5–v8 | fixes pantalla negra (root cause: start_url relativo) |
| v9 | migración a Vite |
| v10 | drag&drop + hitbox boca verificada |
| v11 | estabilidad + rebalanceo comidas + tests |
| v12–v13 | modal estado, canEatFood, categorías |
| v15 | rediseño "Cute pet" (crema+Fredoka) |
| v16–v18 | hamburguesa, logros, tutorial, vestidor |
| v19–v21 | borrado total, sonido logro |
| v22–v24 | rediseño anti-genérico: tokens juguete físico, dock central, nevera "imán" |
| **v25** | **FULL-BLEED**: fuera contenedor 9:16 → mundo 2560×1440 + cámara cover, fondos SVG horizontales, splash, carga perezosa, WebP, SW ligero, tutorial reescrito |

Backup pre-rediseño: commit local `fc614f9`.
