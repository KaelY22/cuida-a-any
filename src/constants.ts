export interface Food {
    id: string;
    cat: string;
    name: string;
    h: [number, number];
    t: [number, number];
    health?: [number, number];
    healthChance?: number;
    healthGain?: number;
    type?: string;
}

export const FOOD_DATABASE: Food[] = [
    { id: 'agua', cat: 'bebidas', name: 'Agua', h: [0,0], t: [15,20], healthChance: 0.35, healthGain: 2 },
    { id: 'medicina', cat: 'especiales', name: 'Medicina', h: [0,0], t: [0,0], health: [50,50] },

    { id: 'alcachofa', cat: 'verduras', name: 'Alcachofa', h: [8,14], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'brocoli', cat: 'verduras', name: 'Brócoli', h: [8,14], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'cerezas', cat: 'frutas', name: 'Cerezas', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'chabacano', cat: 'frutas', name: 'Chabacano', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'chile', cat: 'verduras', name: 'Chile', h: [6,10], t: [-2,2], healthChance: 0.15, healthGain: 1 },
    { id: 'col', cat: 'verduras', name: 'Col', h: [8,14], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'elote', cat: 'verduras', name: 'Elote', h: [10,16], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'frambuesa', cat: 'frutas', name: 'Frambuesa', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'fresa', cat: 'frutas', name: 'Fresa', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'higo', cat: 'frutas', name: 'Higo', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'jitomate', cat: 'verduras', name: 'Jitomate', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'kiwi', cat: 'frutas', name: 'Kiwi', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'mango', cat: 'frutas', name: 'Mango', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'manzana', cat: 'frutas', name: 'Manzana', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'naranja', cat: 'frutas', name: 'Naranja', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'pepino', cat: 'verduras', name: 'Pepino', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'pera', cat: 'frutas', name: 'Pera', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'piña', cat: 'frutas', name: 'Piña', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'platano', cat: 'frutas', name: 'Plátano', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'sandia', cat: 'frutas', name: 'Sandía', h: [8,13], t: [2,5], healthChance: 0.2, healthGain: 1 },
    { id: 'zanahoria', cat: 'verduras', name: 'Zanahoria', h: [8,14], t: [2,5], healthChance: 0.2, healthGain: 1 },

    { id: 'coca_cola', cat: 'bebidas', name: 'Refresco de Cola', h: [0,3], t: [8,14] },
    { id: 'jugo_de_frambuesa', cat: 'bebidas', name: 'Jugo de Frambuesa', h: [0,3], t: [10,18] },
    { id: 'jugo_de_fresa', cat: 'bebidas', name: 'Jugo de Fresa', h: [0,3], t: [10,18] },
    { id: 'jugo_de_manzana', cat: 'bebidas', name: 'Jugo de Manzana', h: [0,3], t: [10,18] },
    { id: 'jugo_de_mora', cat: 'bebidas', name: 'Jugo de Mora', h: [0,3], t: [10,18] },
    { id: 'jugo_de_naranja', cat: 'bebidas', name: 'Jugo de Naranja', h: [0,3], t: [10,18] },
    { id: 'limonada', cat: 'bebidas', name: 'Limonada', h: [0,3], t: [10,18] },
    { id: 'refresco', cat: 'bebidas', name: 'Refresco', h: [0,3], t: [8,14] },
    { id: 'te_helado', cat: 'bebidas', name: 'Té Helado', h: [0,3], t: [10,16] },

    { id: 'leche', cat: 'lacteos', name: 'Leche', h: [5,10], t: [8,12] },
    { id: 'leche_de_chocolate', cat: 'lacteos', name: 'Leche de Chocolate', h: [8,13], t: [8,12] },
    { id: 'malteada_de_chocolate', cat: 'lacteos', name: 'Malteada de Chocolate', h: [12,18], t: [8,12] },

    { id: 'barra_de_chocolate', cat: 'dulces', name: 'Barra de Chocolate', h: [12,18], t: [-2,1] },
    { id: 'baston_de_dulce', cat: 'dulces', name: 'Bastón de Caramelo', h: [9,14], t: [-1,2] },
    { id: 'bolas_de_chocolate', cat: 'dulces', name: 'Bolas de Chocolate', h: [12,17], t: [-2,1] },
    { id: 'caramelo_de_palo', cat: 'dulces', name: 'Caramelo de Palo', h: [9,14], t: [-1,2] },
    { id: 'cereal_azucarado', cat: 'postres', name: 'Cereal Azucarado', h: [12,17], t: [-2,0] },
    { id: 'cereal_de_chocolate', cat: 'postres', name: 'Cereal de Chocolate', h: [12,17], t: [-2,0] },
    { id: 'cereal_de_frutas', cat: 'postres', name: 'Cereal de Frutas', h: [12,17], t: [-2,0] },
    { id: 'chocoflan', cat: 'postres', name: 'Chocoflan', h: [15,22], t: [-4,-2] },
    { id: 'croissant_de_chocolate', cat: 'panes', name: 'Croissant de Chocolate', h: [13,19], t: [-3,0] },
    { id: 'croissant_de_queso', cat: 'panes', name: 'Croissant de Queso', h: [13,19], t: [-3,0] },
    { id: 'cupcake_de_chocolate', cat: 'postres', name: 'Cupcake de Chocolate', h: [12,17], t: [-2,1] },
    { id: 'cupcake_de_fresa', cat: 'postres', name: 'Cupcake de Fresa', h: [12,17], t: [-2,1] },
    { id: 'cupcake_de_limon', cat: 'postres', name: 'Cupcake de Limón', h: [12,17], t: [-2,1] },
    { id: 'donas_de_platano', cat: 'postres', name: 'Dona de Plátano', h: [13,19], t: [-2,1] },
    { id: 'dona_de_chocolate', cat: 'postres', name: 'Dona de Chocolate', h: [13,19], t: [-2,1] },
    { id: 'dona_de_fresa', cat: 'postres', name: 'Dona de Fresa', h: [13,19], t: [-2,1] },
    { id: 'galleta', cat: 'postres', name: 'Galleta', h: [9,14], t: [-1,2] },
    { id: 'galleta_de_miel', cat: 'postres', name: 'Galleta de Miel', h: [9,14], t: [-1,2] },
    { id: 'galleta_salada', cat: 'postres', name: 'Galleta Salada', h: [9,14], t: [-1,2] },
    { id: 'gomitas_de_fruta', cat: 'dulces', name: 'Gomitas de Fruta', h: [8,13], t: [-1,2] },
    { id: 'hotcakes', cat: 'postres', name: 'Hotcakes', h: [14,20], t: [-2,1] },
    { id: 'malvavisco', cat: 'dulces', name: 'Malvavisco', h: [9,14], t: [-1,2] },
    { id: 'muñeco_de_jengibre', cat: 'dulces', name: 'Hombre de Jengibre', h: [12,17], t: [-1,2] },
    { id: 'ositos_de_goma', cat: 'dulces', name: 'Ositos de Goma', h: [8,13], t: [-1,2] },
    { id: 'paleta', cat: 'dulces', name: 'Paleta', h: [9,14], t: [-1,2] },
    { id: 'pastel_de_chocolate', cat: 'postres', name: 'Pastel de Chocolate', h: [14,20], t: [-3,1] },
    { id: 'pastel_de_fresa', cat: 'postres', name: 'Pastel de Fresa', h: [14,20], t: [-3,1] },
    { id: 'pastel_de_queso', cat: 'postres', name: 'Pastel de Queso', h: [14,20], t: [-3,1] },
    { id: 'pretzel', cat: 'postres', name: 'Pretzel', h: [12,17], t: [-2,1] },
    { id: 'waffles', cat: 'postres', name: 'Waffles', h: [14,20], t: [-2,1] },

    { id: 'pan_con_crema_de_cacahuate', cat: 'panes', name: 'Pan con Crema de Cacahuate', h: [16,24], t: [-3,0] },
    { id: 'pan_con_crema_de_chocolate', cat: 'panes', name: 'Pan con Crema de Chocolate', h: [16,24], t: [-3,0] },
    { id: 'pan_con_mermelada_de_durazno', cat: 'panes', name: 'Pan con Mermelada de Durazno', h: [16,24], t: [-3,0] },
    { id: 'pan_con_mermelada_de_fresa', cat: 'panes', name: 'Pan con Mermelada de Fresa', h: [16,24], t: [-3,0] },

    { id: 'aros_de_cebolla', cat: 'snacks', name: 'Aros de Cebolla', h: [13,19], t: [-3,-1] },
    { id: 'almejas', cat: 'mariscos', name: 'Almejas', h: [13,19], t: [-1,2] },
    { id: 'calamar', cat: 'mariscos', name: 'Calamar', h: [13,19], t: [-1,2] },
    { id: 'camaron', cat: 'mariscos', name: 'Camarón', h: [13,19], t: [-1,2] },
    { id: 'doritos', cat: 'snacks', name: 'Totopos', h: [13,19], t: [-3,-1] },
    { id: 'fideos', cat: 'rapidas', name: 'Fideos', h: [13,19], t: [-1,2] },
    { id: 'hamburguesa', cat: 'rapidas', name: 'Hamburguesa', h: [20,30], t: [-6,-3], health: [-2,-1] },
    { id: 'hotdog', cat: 'rapidas', name: 'Hotdog', h: [19,26], t: [-5,-2] },
    { id: 'huevo', cat: 'rapidas', name: 'Huevo', h: [11,16], t: [-1,2], healthChance: 0.15, healthGain: 1 },
    { id: 'langosta', cat: 'mariscos', name: 'Langosta', h: [16,23], t: [-1,2] },
    { id: 'mejillon', cat: 'mariscos', name: 'Mejillón', h: [13,19], t: [-1,2] },
    { id: 'papas_a_la_francesa', cat: 'snacks', name: 'Papas a la Francesa', h: [13,19], t: [-3,-1] },
    { id: 'papas_fritas', cat: 'snacks', name: 'Papas Fritas', h: [13,19], t: [-3,-1] },
    { id: 'pierna_de_pollo', cat: 'rapidas', name: 'Pierna de Pollo', h: [19,26], t: [-5,-2] },
    { id: 'pizza', cat: 'rapidas', name: 'Pizza', h: [20,30], t: [-6,-3], health: [-2,-1] },
    { id: 'pulpo', cat: 'mariscos', name: 'Pulpo', h: [13,19], t: [-1,2] },
    { id: 'salchichas', cat: 'rapidas', name: 'Salchichas', h: [16,23], t: [-4,-1] },
    { id: 'sardina', cat: 'mariscos', name: 'Sardina', h: [13,19], t: [-1,2] },
    { id: 'tocino', cat: 'rapidas', name: 'Tocino', h: [16,23], t: [-4,-1] },

    { id: 'sopa_de_calabaza', cat: 'sopas', name: 'Sopa de Calabaza', h: [12,18], t: [6,10] },
    { id: 'sopa_de_pollo', cat: 'sopas', name: 'Sopa de Pollo', h: [12,18], t: [6,10] },
    { id: 'sopa_de_ramen', cat: 'sopas', name: 'Sopa de Ramen', h: [14,20], t: [6,10] },
    { id: 'sopa_de_verduras', cat: 'sopas', name: 'Sopa de Verduras', h: [12,18], t: [6,10] },
    { id: 'sopa_de_wonton', cat: 'sopas', name: 'Sopa de Wonton', h: [12,18], t: [6,10] },

    { id: 'maki_de_aguacate', cat: 'sushi', name: 'Maki de Aguacate', h: [13,19], t: [-1,2] },
    { id: 'maki_de_atun', cat: 'sushi', name: 'Maki de Atún', h: [13,19], t: [-1,2] },
    { id: 'maki_de_salmon', cat: 'sushi', name: 'Maki de Salmón', h: [13,19], t: [-1,2] },
    { id: 'sushi_de_atun', cat: 'sushi', name: 'Sushi de Atún', h: [13,19], t: [-1,2] },
    { id: 'sushi_de_camaron', cat: 'sushi', name: 'Sushi de Camarón', h: [13,19], t: [-1,2] },
    { id: 'sushi_de_pulpo', cat: 'sushi', name: 'Sushi de Pulpo', h: [13,19], t: [-1,2] },
    { id: 'sushi_de_salmon', cat: 'sushi', name: 'Sushi de Salmón', h: [13,19], t: [-1,2] },
    { id: 'temaki_california', cat: 'sushi', name: 'Temaki California', h: [13,19], t: [-1,2] },
    { id: 'temaki_de_anguila', cat: 'sushi', name: 'Temaki de Anguila', h: [13,19], t: [-1,2] },
    { id: 'temaki_de_salmon', cat: 'sushi', name: 'Temaki de Salmón', h: [13,19], t: [-1,2] },

    { id: 'helado_de_chocolate', cat: 'helados', name: 'Helado de Chocolate', h: [10,16], t: [6,10], type: 'icecream' },
    { id: 'helado_de_fresa', cat: 'helados', name: 'Helado de Fresa', h: [10,16], t: [6,10], type: 'icecream' },
    { id: 'helado_de_todo', cat: 'helados', name: 'Helado Surtido', h: [10,16], t: [6,10], type: 'icecream' },
    { id: 'helado_de_vainilla', cat: 'helados', name: 'Helado de Vainilla', h: [10,16], t: [6,10], type: 'icecream' },

    { id: 'enchiladas', cat: 'mexicana', name: 'Enchiladas', h: [16,24], t: [-6,-3] },
    { id: 'enmoladas', cat: 'mexicana', name: 'Enmoladas', h: [18,26], t: [-8,-4], health: [-2,-1] },
    { id: 'pozole', cat: 'mexicana', name: 'Pozole', h: [22,32], t: [-10,-6], health: [-2,-1] },
    { id: 'taco', cat: 'mexicana', name: 'Taco', h: [20,30], t: [-6,-3] },
    { id: 'torta', cat: 'mexicana', name: 'Torta', h: [20,30], t: [-6,-3] }
];

export const ANY_SPRITE_CONFIG = {
    frameWidth: 450,
    frameHeight: 450,
    totalFrames: 9
};

export const ANY_FRAMES = {
    NORMAL: 0,
    BOCA_ABIERTA: 1,
    MASTICANDO: 2,
    LAMIENDO_1: 3,
    LAMIENDO_2: 4,
    ENFERMA_1: 5,
    ENFERMA_2: 6,
    MOLESTA: 7,
    TIRED: 8
} as const;

export interface Category {
    id: string;
    icon: string;
    name: string;
}

export const CATEGORIES: Category[] = [
    { id: 'especiales', icon: 'medical_services', name: 'Especiales' },
    { id: 'frutas', icon: 'nutrition', name: 'Frutas' },
    { id: 'verduras', icon: 'eco', name: 'Verduras' },
    { id: 'bebidas', icon: 'emoji_food_beverage', name: 'Bebidas' },
    { id: 'lacteos', icon: 'local_cafe', name: 'Lácteos' },
    { id: 'helados', icon: 'icecream', name: 'Helados' },
    { id: 'dulces', icon: 'candy', name: 'Dulces' },
    { id: 'postres', icon: 'cake', name: 'Postres' },
    { id: 'panes', icon: 'bakery_dining', name: 'Panes' },
    { id: 'snacks', icon: 'tapas', name: 'Snacks' },
    { id: 'rapidas', icon: 'fastfood', name: 'Comida rápida' },
    { id: 'mariscos', icon: 'set_meal', name: 'Mariscos' },
    { id: 'sopas', icon: 'soup_kitchen', name: 'Sopas' },
    { id: 'sushi', icon: 'dinner_dining', name: 'Sushi' },
    { id: 'mexicana', icon: 'local_dining', name: 'Mexicana' }
];