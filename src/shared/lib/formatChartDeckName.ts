export function formatChartDeckName(name: string) {
  const maxLength = 18;

  return name.length > maxLength ? `${name.slice(0, maxLength - 1)}…` : name;
}
