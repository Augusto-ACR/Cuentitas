// Tokens de diseño extraídos del bundle Cuentitas.dc.html
export const colors = {
  // Base
  bg: '#F6F7F9',
  surface: '#ffffff',
  surfaceAlt: '#FBFCFD',
  border: '#E6E9EF',
  borderLight: '#EEF1F5',
  dark: '#0F172A',

  // Texto
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Semánticos
  primary: '#4F46E5',
  primarySoft: '#EEF0FE',
  income: '#16A34A',
  incomeSoft: '#E7F6EC',
  expense: '#E11D48',
  expenseSoft: '#FCE8EC',
  savings: '#0D9488',
  savingsSoft: '#E3F4F1',
  dollar: '#2563EB',
  dollarSoft: '#E8EFFD',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
} as const;

export const fonts = {
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const radius = {
  card: '16px',
  pill: '999px',
  input: '12px',
  frame: '30px',
  sm: '9px',
} as const;

// Categorías con colores fijos del bundle
export const CATEGORIAS_COLORES: Record<string, string> = {
  comida:      '#F59E0B',
  subs:        '#A855F7',
  ia:          '#EC4899',
  impresion3d: '#06B6D4',
  mascotas:    '#10B981',
  servicios:   '#3B82F6',
  combustible: '#F97316',
  impuestos:   '#64748B',
  tarjeta:     '#0EA5E9',
  super:       '#84CC16',
  otros:       '#94A3B8',
};

// Ingreso: borde verde; gasto: borde categoría
export const ingresoColor = colors.income;
