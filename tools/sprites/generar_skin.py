#!/usr/bin/env python3
"""
Generador de spritesheets con estilo anime/gacha usando Anything v5 + IP‑Adapter + ControlNet.
Uso:
  python spritesheet_anime.py --ref base.png --prompt "atuendo deseado" --negativo "lo que no quieres" --out resultado.png
"""

import subprocess, sys, pkg_resources, os

# --- AUTOINSTALACIÓN ---
REQUIRED = ["torch", "diffusers", "transformers", "accelerate", "opencv-python", "Pillow", "huggingface_hub"]
for pkg in REQUIRED:
    try:
        pkg_resources.get_distribution(pkg)
    except pkg_resources.DistributionNotFound:
        print(f"📦 Instalando {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])
print("✅ Dependencias listas.\n")

# --- GENERACIÓN ---
import argparse, torch, numpy as np, cv2
from PIL import Image
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel

def main():
    parser = argparse.ArgumentParser(description="Genera spritesheets anime/gacha con IA")
    parser.add_argument("--ref", required=True, help="Imagen de referencia (spritesheet original)")
    parser.add_argument("--prompt", required=True, help="Descripción del nuevo atuendo")
    parser.add_argument("--negativo", default="", help="Cosas a evitar")
    parser.add_argument("--out", default="resultado.png", help="Archivo de salida")
    parser.add_argument("--ip-scale", type=float, default=0.2, help="IP-Adapter (0.15-0.3)")
    parser.add_argument("--control-scale", type=float, default=0.4, help="ControlNet (0.35-0.5)")
    parser.add_argument("--steps", type=int, default=20, help="Pasos (20-25)")
    parser.add_argument("--guidance", type=float, default=7.5, help="Guidance")
    args = parser.parse_args()

    # Cargar referencia y extraer bordes
    print("📷 Leyendo imagen de referencia...")
    ref = Image.open(args.ref).convert("RGB")
    ref_np = np.array(ref)
    edges = cv2.Canny(cv2.cvtColor(ref_np, cv2.COLOR_RGB2GRAY), 100, 200)
    edge_img = Image.fromarray(edges).convert("RGB")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"⚙️ Dispositivo: {device}")

    # ControlNet Canny para SD 1.5
    print("🧠 Cargando ControlNet...")
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/control_v11p_sd15_canny",
        torch_dtype=dtype,
        use_safetensors=True
    ).to(device)

    # Pipeline ANYTHING V5 (anime)
    print("🎨 Cargando Anything v5 (modelo anime)...")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "andite/anything-v5.0",
        controlnet=controlnet,
        torch_dtype=dtype,
        use_safetensors=True,
        safety_checker=None  # sin censura
    ).to(device)

    # IP-Adapter (versión para SD 1.5)
    print("👤 Cargando IP-Adapter...")
    pipe.load_ip_adapter(
        "h94/IP-Adapter",
        subfolder="models",
        weight_name="ip-adapter_sd15.safetensors",
        torch_dtype=dtype
    )
    pipe.set_ip_adapter_scale(args.ip_scale)

    # Prompt final con estilo fijo
    prompt = f"{args.prompt}, anime style, gacha game character, chibi, clean lines, flat colors, simple shading, 2D sprite sheet, multiple poses, white background, same layout as reference"
    print(f"✨ Prompt: {args.prompt}")
    if args.negativo:
        print(f"🚫 Negativo: {args.negativo}")

    print("⚡ Generando... (15-30 s)")
    with torch.autocast(device):
        result = pipe(
            prompt=prompt,
            negative_prompt=args.negativo if args.negativo else None,
            ip_adapter_image=ref,
            image=edge_img,
            controlnet_conditioning_scale=args.control_scale,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance,
            height=ref.height,
            width=ref.width
        ).images[0]

    result.save(args.out)
    print(f"✅ Guardado como: {args.out}")

if __name__ == "__main__":
    main()