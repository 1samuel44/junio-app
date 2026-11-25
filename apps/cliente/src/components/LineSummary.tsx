import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { itemById, type Menu } from '@/data/menu';
import { pick, type Lang } from '@/lib/i18n';
import type { CartLine } from '@/lib/pricing';
import { money, unitPrice } from '@/lib/pricing';
import { fonts } from '@/theme';

/** Nombre del producto con sus opciones, por ejemplo "2 × Latte · Leche de avena". */
export function LineSummary({
  menu,
  line,
  lang,
  isReward,
  freeLabel,
}: {
  menu: Menu;
  line: CartLine;
  lang: Lang;
  isReward?: boolean;
  freeLabel: string;
}) {
  const item = itemById(menu, line.itemId);
  if (!item) return null;
  const opts = menu.options
    .filter((o) => line.optionIds.includes(o.id) && !(o.is_default && o.price_delta === 0 && o.kind === 'leche'))
    .map((o) => pick(o, 'name', lang));
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <T style={styles.name}>
          {line.qty} × {pick(item, 'name', lang)}
        </T>
        {opts.length > 0 && <T variant="small">{opts.join(' · ')}</T>}
        {isReward && <T variant="small">★ {freeLabel}</T>}
      </View>
      <T>{money(unitPrice(menu, item, line.optionIds) * line.qty)}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, flex: 1 },
  name: { fontFamily: fonts.semibold },
});
