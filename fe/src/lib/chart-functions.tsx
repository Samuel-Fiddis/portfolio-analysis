export function generateTicks(
  min: number,
  max: number,
  interval: number,
  domainPadding: number = 0
): number[] {
  const domainMin = Math.floor((min - domainPadding) / interval) * interval;
  const domainMax = Math.ceil(max / interval) * interval;
  return Array.from(
    { length: Math.ceil((domainMax - domainMin) / interval) + 1 },
    (_, i) => domainMin + i * interval
  ).filter((tick) => tick >= min - domainPadding && tick <= max);
}
