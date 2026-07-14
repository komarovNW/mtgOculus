export type PlayerDecksInputMode = 'named' | 'ordered';

type PlayerDecksInputAnalysis = {
  mode: PlayerDecksInputMode;
  errors: string[];
  warnings: string[];
};

const separatorPattern = /\s[-–—]\s/;
const leadingNumberPattern = /^(\d+)[.)]\s*/;

export function analyzePlayerDecksInput(value: string): PlayerDecksInputAnalysis {
  const lines = value
    .split('\n')
    .map((value, index) => ({ value: value.trim(), lineNumber: index + 1 }))
    .filter((line) => line.value.length > 0);

  const separatorCount = lines.filter((line) => separatorPattern.test(line.value)).length;
  const mode: PlayerDecksInputMode = separatorCount * 2 >= lines.length ? 'named' : 'ordered';
  const errors: string[] = [];
  const warnings: string[] = [];
  const numberedLines = lines.map((line) => line.value.match(leadingNumberPattern));

  if (numberedLines.some(Boolean)) {
    const hasContinuousNumbering = numberedLines.every((match, index) => Number(match?.[1]) === index + 1);

    if (!hasContinuousNumbering) {
      errors.push('Нумерация должна идти подряд от 1 до последней строки без пропусков, повторов и перестановок.');
    }
  }

  if (mode === 'named') {
    lines.forEach((line) => {
      const valueWithoutNumber = line.value.replace(leadingNumberPattern, '');
      const separator = valueWithoutNumber.match(separatorPattern);

      if (!separator || separator.index === undefined) {
        errors.push(
          `Строка ${line.lineNumber}: в режиме с именами используйте формат «Имя игрока - Название колоды».`,
        );
        return;
      }

      const playerName = valueWithoutNumber.slice(0, separator.index).trim();
      const deckName = valueWithoutNumber.slice(separator.index + separator[0].length).trim();

      if (!playerName || !deckName) {
        errors.push(`Строка ${line.lineNumber}: имя игрока и название колоды не должны быть пустыми.`);
      }
    });
  } else if (separatorCount > 0) {
    warnings.push(
      'Некоторые строки похожи на формат «Игрок - Колода», но список будет привязан по порядку мест. Проверьте, что это части названий колод, а не смешение двух режимов.',
    );
  }

  return { mode, errors, warnings };
}
