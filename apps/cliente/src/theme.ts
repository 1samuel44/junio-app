// Colores y tipografía de la marca Junio (archivos de marca + prototipo de la fase 2)
export const colors = {
  negro: '#1D1D1B',
  hueso: '#F1EDE6',
  salvia: '#9AA98F',
  salviaClaro: '#CED2BB',
  crema: '#F9ECD2',
  oliva: '#A0A082',
  linea: '#D9D3C8',
  ok: '#5C7A4F',
  alerta: '#B5532F',
  blanco: '#FFFFFF',
} as const;

// Owners Text está pendiente de licencia; mientras tanto usamos Archivo.
export const fonts = {
  regular: 'Archivo_400Regular',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_800ExtraBold',
  display: 'Archivo_900Black',
} as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const space = (n: number) => n * 4;
