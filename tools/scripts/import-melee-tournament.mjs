import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const help = `
Импорт завершённого турнира Melee.gg

Использование:
  npm run import:tournament:melee -- \\
    --url 464196 \\
    --date 2026-09-27 \\
    --city moscow \\
    --club portal_moscow \\
    --format standard \\
    --decks tools/import-data/melee-464196-decks.txt

Параметры:
  --url           ссылка Melee.gg или номер турнира
  --date          дата события YYYY-MM-DD
  --city          cityId
  --club          clubId
  --format        formatId
  --decks         UTF-8 файл со списком игроков и колод
  --decks-order   final или swiss; только для списка без имён
  --qualifier     необязательный leagueQualifierId
  --api-base      API base URL; иначе VITE_API_BASE_URL из окружения/.env.local
  --timeout       таймаут в миллисекундах, по умолчанию 120000
  --dry-run       только показать запрос, ничего не отправлять
`;

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Неизвестный аргумент: ${token}`);
    const key = token.slice(2);
    if (key === 'dry-run' || key === 'help') {
      result[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Нет значения для --${key}`);
    result[key] = value;
    index += 1;
  }

  return result;
}

async function readLocalApiBase() {
  try {
    const contents = await readFile(resolve('.env.local'), 'utf8');
    const line = contents
      .split(/\r?\n/)
      .find((item) => item.trim().startsWith('VITE_API_BASE_URL='));
    return line?.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}

function required(args, key) {
  const value = args[key]?.trim();
  if (!value) throw new Error(`Обязательный параметр --${key} не указан.`);
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(help.trim());
    return;
  }

  const meleeUrl = required(args, 'url');
  const date = required(args, 'date');
  const cityId = required(args, 'city');
  const clubId = required(args, 'club');
  const formatId = required(args, 'format');
  const decksPath = resolve(required(args, 'decks'));
  const playerDecksText = (await readFile(decksPath, 'utf8')).trim();
  if (!playerDecksText) throw new Error(`Файл колод пуст: ${decksPath}`);

  const apiBase = (
    args['api-base'] ||
    process.env.VITE_API_BASE_URL ||
    await readLocalApiBase() ||
    'https://oculus.51-250-45-242.sslip.io/api/v1'
  ).replace(/\/$/, '');
  const endpoint = `${apiBase}/admin/imports/tournament/melee`;
  const timeoutMs = Number(args.timeout ?? 120_000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('--timeout должен быть положительным числом.');
  }
  if (args['decks-order'] && !['final', 'swiss'].includes(args['decks-order'])) {
    throw new Error('--decks-order принимает только final или swiss.');
  }

  const fields = {
    meleeUrl,
    playerDecksText,
    date,
    cityId,
    clubId,
    formatId,
    ...(args['decks-order'] ? { decksOrder: args['decks-order'] } : {}),
    ...(args.qualifier ? { leagueQualifierId: args.qualifier } : {}),
  };
  const lineCount = playerDecksText.split(/\r?\n/).filter((line) => line.trim()).length;

  console.log(`POST ${endpoint}`);
  console.log({
    ...fields,
    playerDecksText: `<${lineCount} строк из ${decksPath}>`,
    timeoutMs,
  });

  if (args['dry-run']) {
    console.log('Dry run: запрос не отправлен.');
    return;
  }

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Сервер не ответил за ${timeoutMs} мс.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  let body = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Оставляем исходный текст для диагностики ответа не в JSON.
  }

  console.log(`HTTP ${response.status}`);
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 2));

  if (!response.ok || (body && typeof body === 'object' && body.success === false)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
