export function badgeClass(value: string): string {
  return `badge badge-${value.toLowerCase().replace(/\s+/g, "-")}`;
}
