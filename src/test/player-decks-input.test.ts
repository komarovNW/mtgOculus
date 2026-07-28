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
      warnings: [
        'Список будет сопоставлен с участниками по порядку итоговых мест. После добавления проверьте привязку.',
      ],
    });
  });

  it('rejects broken numbering', () => {
    expect(analyzePlayerDecksInput('1. Lands\n3. Painter').errors).toContain(
      'Нумерация должна идти подряд от 1 без пропусков и повторов.',
    );
  });

  it('rejects a duplicate player in named mode', () => {
    expect(
      analyzePlayerDecksInput(
        'Игрок 1 - Lands\nИгрок 1 - Painter',
      ).errors,
    ).toContain('Строка 2: игрок «Игрок 1» уже указан выше.');
  });
});
