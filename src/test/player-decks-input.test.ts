import { describe, expect, it } from 'vitest';
import { analyzePlayerDecksInput } from '@/shared/lib/playerDecksInput';

describe('analyzePlayerDecksInput', () => {
  it('recognizes named input with supported dash variants', () => {
    expect(analyzePlayerDecksInput('Игрок 1 - Lands\nИгрок 2 — Painter')).toEqual({
      mode: 'named',
      errors: [],
      warnings: [],
    });
  });

  it('requires every line to have a separator in named mode', () => {
    const result = analyzePlayerDecksInput('Игрок 1 - Lands\nPainter');

    expect(result.mode).toBe('named');
    expect(result.errors).toContain('Строка 2: в режиме с именами используйте формат «Имя игрока - Название колоды».');
  });

  it('recognizes an ordered list without player names', () => {
    expect(analyzePlayerDecksInput('Lands\nPainter\nEldrazi')).toEqual({
      mode: 'ordered',
      errors: [],
      warnings: [],
    });
  });

  it('accepts continuous numbering and rejects broken numbering', () => {
    expect(analyzePlayerDecksInput('1. Lands\n2) Painter').errors).toEqual([]);
    expect(analyzePlayerDecksInput('1. Lands\n3. Painter').errors).toContain(
      'Нумерация должна идти подряд от 1 до последней строки без пропусков, повторов и перестановок.',
    );
  });

  it('warns when an ordered list looks like mixed input', () => {
    const result = analyzePlayerDecksInput('Lands\nИгрок - Painter\nEldrazi');

    expect(result.mode).toBe('ordered');
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});
