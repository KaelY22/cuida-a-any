import os
import math
from PIL import Image

def generar_spritesheet_cuadricula():
    # Carpeta donde está el script
    carpeta_actual = os.path.dirname(os.path.abspath(__file__))
    
    # Parámetros
    MAX_ANCHO = 2048  # Límite seguro para iOS (2048 o 4096, usamos 2048)
    # También puedes establecer un valor fijo de frames por fila si prefieres:
    # FRAMES_POR_FILA = 4  # descomenta y comenta la línea de cálculo si quieres fijo
    
    # Buscar imágenes numeradas consecutivamente (1.png, 2.png, ...)
    imagenes_validas = []
    numero = 1
    while True:
        nombre = f"{numero}.png"
        ruta = os.path.join(carpeta_actual, nombre)
        if os.path.exists(ruta):
            imagenes_validas.append(ruta)
            numero += 1
        else:
            break
    
    if not imagenes_validas:
        print("Error: No se encontraron imágenes numeradas (1.png, 2.png...) en esta carpeta.")
        return
    
    print(f"Se encontraron {len(imagenes_validas)} frames.")
    
    # Abrir todas las imágenes
    imagenes = [Image.open(img).convert('RGBA') for img in imagenes_validas]
    ancho_frame, alto_frame = imagenes[0].size
    
    # Verificar que todas tengan el mismo tamaño
    for img in imagenes:
        if img.size != (ancho_frame, alto_frame):
            print("Advertencia: Las imágenes no tienen el mismo tamaño.")
            # Ajustar? Mejor salir
            return
    
    # Calcular cuántos frames caben por fila
    frames_por_fila = MAX_ANCHO // ancho_frame
    if frames_por_fila == 0:
        frames_por_fila = 1  # Si un frame ya es más ancho que el límite, forzar 1 por fila
    
    total_frames = len(imagenes)
    filas = math.ceil(total_frames / frames_por_fila)
    
    ancho_total = frames_por_fila * ancho_frame
    alto_total = filas * alto_frame
    
    print(f"Distribución: {frames_por_fila} frames por fila, {filas} filas.")
    print(f"Dimensiones finales: {ancho_total} x {alto_total} px")
    
    # Crear lienzo transparente
    spritesheet = Image.new("RGBA", (ancho_total, alto_total), (0, 0, 0, 0))
    
    # Pegar frames en orden
    for idx, img in enumerate(imagenes):
        fila = idx // frames_por_fila
        columna = idx % frames_por_fila
        x = columna * ancho_frame
        y = fila * alto_frame
        spritesheet.paste(img, (x, y))
    
    # Guardar
    salida = os.path.join(carpeta_actual, "Any_normal.png")
    spritesheet.save(salida, "PNG")
    print(f"✅ Spritesheet generado: {salida}")
    print(f"   Tamaño: {ancho_total}x{alto_total} (máximo por dimensión: {max(ancho_total, alto_total)})")

if __name__ == "__main__":
    generar_spritesheet_cuadricula()