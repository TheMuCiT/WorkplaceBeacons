export function smoothRssi(prev: number | undefined, next: number, factor = 0.5) {
  if (prev === undefined) return next;
  return Math.round(prev * factor + next * (1 - factor));
}
