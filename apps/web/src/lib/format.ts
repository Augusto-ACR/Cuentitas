// Formateo es-AR
const fmtARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const fmtUSD = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

export function ars(n: number | string): string {
  return fmtARS.format(Number(n));
}

export function usd(n: number | string): string {
  return `US$${fmtUSD.format(Number(n))}`;
}

export function num(n: number | string): string {
  return fmtNum.format(Number(n));
}

export function fecha(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function mesLabel(mes: string): string {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [, m] = mes.split('-');
  return meses[parseInt(m) - 1] ?? mes;
}

export function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function deltaPct(actual: number, anterior: number): string {
  if (!anterior) return '';
  const pct = ((actual - anterior) / anterior) * 100;
  return `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`;
}
