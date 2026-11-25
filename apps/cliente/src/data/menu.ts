// Menú local, tomado de assets/marca/menu.csv. Se usa en la versión de prueba
// (sin Supabase) y para generar supabase/migrations/*_menu_inicial.sql.
// Tiene la misma forma que las tablas menu_categories, menu_items e item_options.

export type OptionKind = 'tamano' | 'leche' | 'extra';

export interface MenuCategory {
  id: number;
  name_es: string;
  name_en: string;
  sort: number;
}

export interface ItemOption {
  id: number;
  item_id: number;
  kind: OptionKind;
  name_es: string;
  name_en: string;
  price_delta: number;
  is_default: boolean;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name_es: string;
  name_en: string;
  desc_es: string;
  desc_en: string;
  size: string;
  base_price: number;
  is_drink: boolean;
  is_coffee: boolean;
  is_available: boolean;
  sort: number;
}

export const categories: MenuCategory[] = [
  { id: 1, name_es: 'Espresso', name_en: 'Espresso', sort: 1 },
  { id: 2, name_es: 'Fríos', name_en: 'Cold', sort: 2 },
  { id: 3, name_es: 'Métodos', name_en: 'Brew methods', sort: 3 },
  { id: 4, name_es: 'Sin café', name_en: 'No coffee', sort: 4 },
  { id: 5, name_es: 'Alimentos', name_en: 'Food', sort: 5 },
];

type Row = [
  category: number,
  name_es: string,
  name_en: string,
  size: string,
  price: number,
  desc_es: string,
  desc_en: string,
  kind: 'cafe' | 'bebida' | 'comida',
  milk: boolean,
];

// [categoría, nombre ES, nombre EN, tamaño, precio, descripción ES, descripción EN, tipo, lleva leche]
const rows: Row[] = [
  [1, 'Espresso', 'Espresso', '2oz', 50, '', '', 'cafe', false],
  [1, 'Cortado', 'Cortado', '4oz', 60, '', '', 'cafe', true],
  [1, 'Latte corto', 'Short latte', '8oz', 70, '', '', 'cafe', true],
  [1, 'Latte', 'Latte', '12oz', 80, '', '', 'cafe', true],
  [1, 'Americano', 'Americano', '12oz', 60, '', '', 'cafe', false],
  [2, 'Cold brew', 'Cold brew', '12oz', 80, 'Extracción 18 hrs', '18-hour extraction', 'cafe', false],
  [2, 'Cold brew latte', 'Cold brew latte', '12oz', 85, '', '', 'cafe', true],
  [2, 'Cold brew tonic', 'Cold brew tonic', '12oz', 90, '', '', 'cafe', false],
  [2, 'Cold brew lemonade', 'Cold brew lemonade', '12oz', 90, '', '', 'cafe', false],
  [2, 'Cold brew float', 'Cold brew float', '8oz', 80, 'Helado + cold brew', 'Ice cream + cold brew', 'cafe', false],
  [2, 'Honey vainilla CB', 'Honey vanilla CB', '20oz', 95, 'Miel + vainilla + leche + cold brew', 'Honey + vanilla + milk + cold brew', 'cafe', true],
  [2, 'Junio shaken espresso', 'Junio shaken espresso', '20oz', 100, 'Espresso + azúcar + canela (shakeados) + leche + cold foam', 'Espresso + sugar + cinnamon (shaken) + milk + cold foam', 'cafe', true],
  [2, 'Dirty chai', 'Dirty chai', '16oz', 90, 'Espresso + chai David Rio + leche', 'Espresso + David Rio chai + milk', 'cafe', true],
  [3, 'V60 / Aeropress', 'V60 / Aeropress', '', 80, 'Pregunta por granos', 'Ask about our beans', 'cafe', false],
  [4, 'Matcha', 'Matcha', '16oz', 100, 'Shizuoka grado alto', 'High-grade Shizuoka', 'bebida', true],
  [4, 'Strawberry matcha', 'Strawberry matcha', '16oz', 100, '', '', 'bebida', true],
  [4, 'Cold foam matcha', 'Cold foam matcha', '16oz', 100, '', '', 'bebida', true],
  [4, 'Matcha cloud', 'Matcha cloud', '12oz', 100, 'Agua de coco + cold foam de matcha', 'Coconut water + matcha cold foam', 'bebida', false],
  [4, 'Chai', 'Chai', '12oz', 90, 'David Rio', 'David Rio', 'bebida', true],
  [4, 'Chocolate', 'Hot chocolate', '12oz', 80, '', '', 'bebida', true],
  [4, 'Blueberry lemonade', 'Blueberry lemonade', '16oz', 70, '', '', 'bebida', false],
  [4, 'Suerito', 'Suerito', '', 50, '', '', 'bebida', false],
  [4, 'Kombucha', 'Kombucha', '', 100, '', '', 'bebida', false],
  [4, 'Agua mineral', 'Sparkling water', '', 40, '', '', 'bebida', false],
  [5, 'Bagel clásico', 'Classic bagel', '', 135, 'Bagel, queso Philadelphia, jamón, queso panela, tomate y espinaca', 'Bagel, cream cheese, ham, panela cheese, tomato and spinach', 'comida', false],
  [5, 'Roastbeef bagel', 'Roast beef bagel', '', 145, 'Bagel, aderezo chipotle, roast beef, queso manchego', 'Bagel, chipotle dressing, roast beef, manchego cheese', 'comida', false],
  [5, 'Sweet bagel', 'Sweet bagel', '', 120, 'Bagel, peanut butter, plátano, miel y canela', 'Bagel, peanut butter, banana, honey and cinnamon', 'comida', false],
  [5, 'Bowl de yogurt', 'Yogurt bowl', '', 90, 'Yogurt griego, granola, fruta de temporada', 'Greek yogurt, granola, seasonal fruit', 'comida', false],
  [5, 'Overnight oats', 'Overnight oats', '', 80, 'Avena, leche, peanut butter, fruta, miel', 'Oats, milk, peanut butter, fruit, honey', 'comida', false],
  [5, 'Postres del día', 'Today’s desserts', '', 40, 'Cambian cada día según disponibilidad', 'They change daily depending on availability', 'comida', false],
];

export const items: MenuItem[] = rows.map(
  ([category_id, name_es, name_en, size, base_price, desc_es, desc_en, kind], i) => ({
    id: i + 1,
    category_id,
    name_es,
    name_en,
    desc_es,
    desc_en,
    size,
    base_price,
    is_drink: kind !== 'comida',
    is_coffee: kind === 'cafe',
    is_available: true,
    sort: i,
  }),
);

const MILKS: Array<[string, string, number, boolean]> = [
  ['Leche entera', 'Whole milk', 0, true],
  ['Leche de avena', 'Oat milk', 20, false],
  ['Leche de almendra', 'Almond milk', 20, false],
  ['Leche de coco', 'Coconut milk', 20, false],
];
const EXTRAS: Array<[string, string, number]> = [
  ['Jarabe de vainilla', 'Vanilla syrup', 5],
  ['Jarabe maple & sal', 'Maple & salt syrup', 5],
  ['Shot de espresso', 'Espresso shot', 20],
];

function buildOptions(): ItemOption[] {
  const out: ItemOption[] = [];
  let id = 1;
  const add = (o: Omit<ItemOption, 'id'>) => out.push({ id: id++, ...o });

  rows.forEach(([, name_es, , , , , , kind, milk], i) => {
    const item_id = i + 1;
    if (name_es === 'V60 / Aeropress') {
      add({ item_id, kind: 'tamano', name_es: 'Grano de la casa', name_en: 'House beans', price_delta: 0, is_default: true });
      add({ item_id, kind: 'tamano', name_es: 'Guest Beans', name_en: 'Guest Beans', price_delta: 20, is_default: false });
    }
    if (name_es === 'Postres del día') {
      add({ item_id, kind: 'tamano', name_es: 'Galleta', name_en: 'Cookie', price_delta: 0, is_default: true });
      add({ item_id, kind: 'tamano', name_es: 'Rol de canela', name_en: 'Cinnamon roll', price_delta: 40, is_default: false });
      add({ item_id, kind: 'tamano', name_es: 'Rebanada de pastel', name_en: 'Slice of cake', price_delta: 40, is_default: false });
    }
    if (milk) {
      MILKS.forEach(([es, en, delta, def]) =>
        add({ item_id, kind: 'leche', name_es: es, name_en: en, price_delta: delta, is_default: def }),
      );
    }
    if (kind === 'cafe' || milk) {
      EXTRAS.forEach(([es, en, delta]) =>
        add({ item_id, kind: 'extra', name_es: es, name_en: en, price_delta: delta, is_default: false }),
      );
    }
  });
  return out;
}

export const options: ItemOption[] = buildOptions();

export interface Menu {
  categories: MenuCategory[];
  items: MenuItem[];
  options: ItemOption[];
}

export const localMenu: Menu = { categories, items, options };

export const optionsFor = (menu: Menu, itemId: number) => menu.options.filter((o) => o.item_id === itemId);
export const itemById = (menu: Menu, id: number) => menu.items.find((i) => i.id === id);

// Café invitado del mes (tabla guest_beans). Dato de ejemplo hasta que el dueño lo cargue.
export const guestBeans = {
  roaster: 'Tostador invitado',
  origin: 'Por anunciar',
  notes_es: 'El dueño lo actualiza cada mes desde el panel.',
  notes_en: 'Updated monthly by the owner from the panel.',
};
