-- Nuevo grupo de opciones: caliente o frío.
-- Va solo en su archivo porque un valor nuevo de enum no se puede usar en la misma transacción.
alter type option_kind add value if not exists 'temperatura' before 'leche';
