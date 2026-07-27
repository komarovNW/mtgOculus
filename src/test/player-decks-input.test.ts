import { describe, expect, it } from 'vitest';
import { analyzePlayerDecksInput } from '@/shared/lib/playerDecksInput';

describe('analyzePlayerDecksInput', () => {
  it('recognizes named input', () => {
    expect(analyzePlayerDecksInput('Игрок 1 - Lands\nИгрок 2 — Painter')).toEqual({
      mode: 'named',
      errors: [],
      warnings: [],
    });
  });

  it('recognizes an ordered list', () => {
    expect(analyzePlayerDecksInput('Lands\nPainter\nEldrazi')).toEqual({
      mode: 'ordered',
      errors: [],
      warnings: [],
    });
  });

  it('rejects broken numbering', () => {
    expect(analyzePlayerDecksInput('1. Lands\n3. Painter').errors).toContain(
      'Нумерация должна идти подряд от 1 без пропусков и повторов.',
    );
  });
});
