#!/usr/bin/env python3
import os

W, H = 2560, 1440
FLOOR_Y = 1150
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'backgrounds')

ROOMS = {
    'habitacion': {
        'dia': {
            'wall': '#dccdf2', 'wain': '#bb9fe6', 'trim': '#a98cd6',
            'floor': '#c98d5e', 'plank': '#b87c4f', 'sky': '#aee6f8',
            'sun': '#ffd75e', 'frame': '#8f74bd', 'accent': '#9b6fd8',
            'shadow': 'rgba(90,60,120,0.18)', 'stars': 0,
        },
        'noche': {
            'wall': '#463c63', 'wain': '#38304f', 'trim': '#2e2742',
            'floor': '#5d4230', 'plank': '#4e3626', 'sky': '#171d38',
            'sun': None, 'frame': '#332b4a', 'accent': '#6b55a3',
            'shadow': 'rgba(10,8,20,0.35)', 'stars': 1,
        },
    },
    'cocina': {
        'dia': {
            'wall': '#fdeed6', 'wain': '#f6d3a4', 'trim': '#eabf85',
            'floor': '#e7cdb2', 'plank': '#d9b891', 'sky': '#aee6f8',
            'sun': '#ffd75e', 'frame': '#d99a52', 'accent': '#f4792f',
            'shadow': 'rgba(150,90,30,0.16)', 'stars': 0,
        },
        'noche': {
            'wall': '#4d4038', 'wain': '#3e332c', 'trim': '#332a24',
            'floor': '#54453a', 'plank': '#463a31', 'sky': '#171d38',
            'sun': None, 'frame': '#372d26', 'accent': '#b35f28',
            'shadow': 'rgba(15,10,6,0.35)', 'stars': 1,
        },
    },
    'vestidor': {
        'dia': {
            'wall': '#f7dee7', 'wain': '#efc0d1', 'trim': '#e3a8be',
            'floor': '#d8ab84', 'plank': '#c79771', 'sky': '#aee6f8',
            'sun': '#ffd75e', 'frame': '#d493ac', 'accent': '#e07a9f',
            'shadow': 'rgba(150,70,100,0.16)', 'stars': 0,
        },
        'noche': {
            'wall': '#4a3944', 'wain': '#3b2d36', 'trim': '#31252c',
            'floor': '#57402f', 'plank': '#48351f', 'sky': '#171d38',
            'sun': None, 'frame': '#33262e', 'accent': '#a5587a',
            'shadow': 'rgba(12,8,14,0.35)', 'stars': 1,
        },
    },
}

def stars(x, y, w, h):
    out = []
    pts = [(x+w*0.2, y+h*0.25, 5), (x+w*0.65, y+h*0.15, 4), (x+w*0.45, y+h*0.5, 4), (x+w*0.8, y+h*0.45, 5), (x+w*0.3, y+h*0.68, 3)]
    for px, py, r in pts:
        out.append(f'<circle cx="{px:.0f}" cy="{py:.0f}" r="{r}" fill="#fff" opacity="0.9"/>')
    return ''.join(out)

def window_g(p, x, y, w, h):
    s = [f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{p["frame"]}"/>']
    iw, ih = w - 36, h - 36
    ix, iy = x + 18, y + 18
    s.append(f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" rx="10" fill="{p["sky"]}"/>')
    if p['sun']:
        cx, cy = ix + iw * 0.72, iy + ih * 0.28
        s.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="42" fill="{p["sun"]}"/>')
        s.append(f'<ellipse cx="{ix+iw*0.32:.0f}" cy="{iy+ih*0.62:.0f}" rx="{iw*0.26:.0f}" ry="{ih*0.13:.0f}" fill="#ffffff" opacity="0.85"/>')
        s.append(f'<ellipse cx="{ix+iw*0.55:.0f}" cy="{iy+ih*0.78:.0f}" rx="{iw*0.2:.0f}" ry="{ih*0.1:.0f}" fill="#ffffff" opacity="0.7"/>')
    else:
        mx, my = ix + iw * 0.68, iy + ih * 0.26
        s.append(f'<circle cx="{mx:.0f}" cy="{my:.0f}" r="38" fill="#f4ecc8"/><circle cx="{mx+16:.0f}" cy="{my-10:.0f}" r="32" fill="{p["sky"]}"/>')
        s.append(stars(ix, iy, iw, ih))
    s.append(f'<rect x="{x+w/2-7:.0f}" y="{y}" width="14" height="{h}" fill="{p["frame"]}"/>')
    s.append(f'<rect x="{x}" y="{y+h/2-7:.0f}" width="{w}" height="14" fill="{p["frame"]}"/></g>')
    return ''.join(s)

def base_room(name, p):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="{p["wall"]}"/>')
    s.append(f'<rect y="980" width="{W}" height="170" fill="{p["wain"]}"/>')
    s.append(f'<rect y="978" width="{W}" height="10" fill="{p["trim"]}"/>')
    s.append(f'<rect y="{FLOOR_Y}" width="{W}" height="{H-FLOOR_Y}" fill="{p["floor"]}"/>')
    step = 128
    for i in range(-2, W // step + 3):
        x = i * step
        s.append(f'<path d="M{x} {FLOOR_Y} L{x-60} {H} L{x-60+step//2} {H} L{x+step//2} {FLOOR_Y} Z" fill="{p["plank"]}" opacity="0.35"/>')
    s.append(f'<rect y="{FLOOR_Y}" width="{W}" height="12" fill="{p["trim"]}"/>')
    return s

def shadow(cx, cy, rx, p):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{rx*0.22:.0f}" fill="{p["shadow"]}"/>'

def habitacion_extra(name, p):
    s = []
    s.append(window_g(p, 320, 200, 420, 520))
    s.append(f'<rect x="1880" y="330" width="470" height="360" rx="16" fill="{p["frame"]}" opacity="0.9"/>')
    s.append(f'<rect x="1910" y="360" width="410" height="300" rx="10" fill="{p["accent"]}" opacity="0.25"/>')
    s.append(f'<circle cx="2115" cy="510" r="70" fill="{p["accent"]}" opacity="0.3"/>')
    s.append(f'<text x="2115" y="535" font-family="Arial" font-size="64" text-anchor="middle" fill="{p["wall"]}" opacity="0.9">&#9829;</text>')
    bx, bw = 1950, 560
    s.append(shadow(bx + bw/2, FLOOR_Y + 150, bw * 0.62, p))
    s.append(f'<rect x="{bx}" y="880" width="60" height="270" rx="14" fill="{p["accent"]}"/>')
    s.append(f'<rect x="{bx}" y="880" width="{bw}" height="150" rx="26" fill="{p["accent"]}"/>')
    s.append(f'<rect x="{bx+30}" y="1010" width="{bw-60}" height="130" rx="20" fill="#fdf6ec"/>')
    s.append(f'<rect x="{bx+50}" y="1030" width="110" height="90" rx="16" fill="{p["frame"]}"/>')
    nx = 1000
    s.append(shadow(nx, FLOOR_Y + 120, 130, p))
    s.append(f'<rect x="{nx-95}" y="1020" width="190" height="130" rx="14" fill="{p["accent"]}"/>')
    s.append(f'<rect x="{nx-95}" y="1020" width="190" height="26" rx="10" fill="#ffffff" opacity="0.25"/>')
    s.append(f'<circle cx="{nx}" cy="990" r="10" fill="{p["trim"]}"/>')
    if not p['sun']:
        glow = '#ffb75e' if name != 'vestidor' else '#ff9fbf'
        s.append(f'<ellipse cx="{nx}" cy="1170" rx="360" ry="120" fill="{glow}" opacity="0.14"/>')
    s.append(f'<ellipse cx="1380" cy="1290" rx="430" ry="105" fill="{p["accent"]}" opacity="0.3"/>')
    s.append(f'<ellipse cx="1380" cy="1290" rx="340" ry="78" fill="{p["accent"]}" opacity="0.35"/>')
    return s

def cocina_extra(name, p):
    s = []
    s.append(window_g(p, 2080, 180, 400, 480))
    fx, fy, fw, fh = 950, 640, 190, 560
    s.append(shadow(fx + fw/2, FLOOR_Y + 60, fw * 0.75, p))
    body = '#b9c6ce' if p['sun'] else '#5f6d77'
    s.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="22" fill="{body}"/>')
    s.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="22" fill="none" stroke="{p["shadow"]}" stroke-width="6"/>')
    dl = '#e9f2f6' if p['sun'] else '#8fa0ab'
    s.append(f'<rect x="{fx+18}" y="{fy+16}" width="{fw-36}" height="230" rx="12" fill="{dl}"/>')
    hx = fx + fw/2
    s.append(f'<rect x="{hx-58}" y="{fy+108}" width="116" height="12" rx="6" fill="#8fa2ad"/>')
    s.append(f'<rect x="{hx-40}" y="{fy+300}" width="80" height="14" rx="7" fill="#8fa2ad"/>')
    cx2, cw = 1620, 880
    s.append(shadow(cx2 + cw/2, FLOOR_Y + 80, cw * 0.55, p))
    cab = '#e8a86a' if p['sun'] else '#7a5638'
    s.append(f'<rect x="{cx2}" y="920" width="{cw}" height="230" rx="14" fill="{cab}"/>')
    s.append(f'<rect x="{cx2}" y="905" width="{cw}" height="34" rx="12" fill="#fdf6ec" opacity="{0.9 if p["sun"] else 0.4}"/>')
    for i in range(3):
        dxx = cx2 + 40 + i * (cw / 3)
        s.append(f'<circle cx="{dxx+cw/6-40:.0f}" cy="1035" r="11" fill="{p["trim"]}"/>')
        s.append(f'<rect x="{dxx+cw/6-4:.0f}" y="954" width="8" height="196" fill="{p["shadow"]}"/>')
    px = 1400
    s.append(shadow(px, FLOOR_Y + 130, 240, p))
    s.append(f'<ellipse cx="{px}" cy="1262" rx="215" ry="52" fill="{cab}"/>')
    s.append(f'<ellipse cx="{px}" cy="1250" rx="215" ry="52" fill="{p["accent"]}" opacity="{0.85 if p["sun"] else 0.5}"/>')
    for ang in range(0, 360, 45):
        pass
    lx, ly = 1280, 120
    cord = p['trim']
    for dx in (1180, 1380):
        s.append(f'<rect x="{dx-3}" y="0" width="6" height="150" fill="{cord}"/>')
        s.append(f'<path d="M{dx-70} 210 L{dx} 140 L{dx+70} 210 Z" fill="{p["accent"]}"/>')
        s.append(f'<circle cx="{dx}" cy="{222 if p["sun"] else 224}" r="26" fill="{"#ffe9b8" if not p["sun"] else "#fff3d6"}"/>')
    return s

def vestidor_extra(name, p):
    s = []
    s.append(window_g(p, 2180, 200, 340, 460))
    clx, clw = 1760, 700
    s.append(shadow(clx + clw/2, FLOOR_Y + 90, clw * 0.55, p))
    wood = '#c98d5e' if p['sun'] else '#5d4230'
    s.append(f'<rect x="{clx}" y="300" width="{clw}" height="850" rx="20" fill="{wood}" opacity="0.92"/>')
    inner = '#f7efe4' if p['sun'] else '#3a2f27'
    s.append(f'<rect x="{clx+26}" y="330" width="{clw-52}" height="790" rx="12" fill="{inner}"/>')
    rail_y = 430
    s.append(f'<rect x="{clx+50}" y="{rail_y}" width="{clw-100}" height="12" rx="6" fill="{p["trim"]}"/>')
    cols = ['#e07a9f', '#9b6fd8', '#5aa9d6', '#f4b942', '#67b99a']
    cw2 = 88
    for i in range(6):
        cxx = clx + 80 + i * 92
        col = cols[i % len(cols)]
        op = 0.9 if p['sun'] else 0.55
        s.append(f'<path d="M{cxx+8} {rail_y+12} h{cw2-16} l16 120 h-{cw2+16} Z" fill="{col}" opacity="{op}"/>')
        s.append(f'<rect x="{cxx+cw2/2-3:.0f}" y="{rail_y-26}" width="6" height="30" fill="{p["trim"]}"/>')
    sh_y = 720
    for row in range(2):
        yy = sh_y + row * 190
        s.append(f'<rect x="{clx+50}" y="{yy+150}" width="{clw-100}" height="16" fill="{p["trim"]}"/>')
        for b in range(2):
            bxx = clx + 80 + b * ((clw - 140) / 2)
            bw2 = 150
            col = cols[(row * 2 + b + 2) % len(cols)]
            s.append(f'<rect x="{bxx:.0f}" y="{yy+40}" width="{bw2}" height="110" rx="12" fill="{col}" opacity="{0.8 if p["sun"] else 0.45}"/>')
            s.append(f'<rect x="{bxx:.0f}" y="{yy+40}" width="{bw2}" height="26" rx="10" fill="#ffffff" opacity="0.3"/>')
    mx, my = 380, 380
    s.append(shadow(mx, FLOOR_Y + 60, 150, p))
    s.append(f'<ellipse cx="{mx}" cy="{my+280}" rx="130" ry="330" fill="{p["frame"]}"/>')
    glass = '#dff2fa' if p['sun'] else '#26303f'
    s.append(f'<ellipse cx="{mx}" cy="{my+280}" rx="108" ry="308" fill="{glass}"/>')
    s.append(f'<ellipse cx="{mx-30}" cy="{my+180}" rx="26" ry="90" fill="#ffffff" opacity="0.5"/>')
    s.append(f'<rect x="{mx-90}" y="{my+600}" width="180" height="20" rx="10" fill="{p["frame"]}"/>')
    bxx, byy = 1560, 1210
    s.append(shadow(bxx + 90, byy + 60, 160, p))
    s.append(f'<rect x="{bxx}" y="{byy-60}" width="220" height="70" rx="24" fill="{p["accent"]}" opacity="{0.9 if p["sun"] else 0.5}"/>')
    s.append(f'<rect x="{bxx+18}" y="{byy+8}" width="184" height="46" rx="14" fill="{p["frame"]}"/>')
    return s

EXTRA = {'habitacion': habitacion_extra, 'cocina': cocina_extra, 'vestidor': vestidor_extra}

os.makedirs(OUT, exist_ok=True)
for room, pals in ROOMS.items():
    for tod, p in pals.items():
        parts = base_room(room, p)
        parts += EXTRA[room](tod, p)
        parts.append('</svg>')
        key = {'habitacion': 'bg', 'cocina': 'bg_cocina', 'vestidor': 'bg_salon'}[room]
        fname = f"{key}_{tod}.svg"
        with open(os.path.join(OUT, fname), 'w') as f:
            f.write(''.join(parts))
        print(fname)
