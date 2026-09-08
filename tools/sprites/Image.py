import os
from PIL import Image

# Carpeta actual (donde está el script)
carpeta_entrada = "."
carpeta_salida  = "uniformes"   # los resultados irán aquí

os.makedirs(carpeta_salida, exist_ok=True)

TAMAÑO = (250, 250)

for archivo in os.listdir(carpeta_entrada):
    if archivo.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
        # Evitar procesar imágenes que ya están en la carpeta de salida
        if carpeta_salida in archivo:
            continue
            
        ruta_entrada = os.path.join(carpeta_entrada, archivo)
        img = Image.open(ruta_entrada).convert("RGBA")

        img.thumbnail(TAMAÑO, Image.LANCZOS)

        lienzo = Image.new("RGBA", TAMAÑO, (0, 0, 0, 0))

        x = (TAMAÑO[0] - img.width) // 2   # centrado en X
        y = TAMAÑO[1] - img.height         # pegado abajo

        lienzo.paste(img, (x, y), img)

        ruta_salida = os.path.join(carpeta_salida, archivo)
        lienzo.save(ruta_salida)
        print(f"✅ {archivo} -> {ruta_salida}")