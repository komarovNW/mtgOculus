import { cn } from '@/shared/lib/cn';

type ManaPipsProps = {
  colors?: string[] | null;
  className?: string;
};

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C'];

function normalizeColors(colors?: string[] | null) {
  if (!colors?.length) {
    return [];
  }

  const unique = [...new Set(colors.map((color) => color.toUpperCase()))];

  return unique.sort((left, right) => {
    const leftIndex = COLOR_ORDER.indexOf(left);
    const rightIndex = COLOR_ORDER.indexOf(right);

    if (leftIndex === -1 || rightIndex === -1) {
      return left.localeCompare(right, 'en');
    }

    return leftIndex - rightIndex;
  });
}

export function ManaPips({ colors, className }: ManaPipsProps) {
  const normalizedColors = normalizeColors(colors);

  if (normalizedColors.length === 0) {
    return null;
  }

  return (
    <span className={cn('mana-pips', className)}>
      {normalizedColors.map((color) => (
        <span
          key={color}
          className={cn('mana-pip', `mana-pip--${color.toLowerCase()}`)}
          title={`Цвет колоды: ${color}`}
        >
          {color}
        </span>
      ))}
    </span>
  );
}
