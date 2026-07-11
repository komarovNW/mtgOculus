export function getErrorMessage(error: unknown, fallback = 'Не удалось загрузить данные.') {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message || /failed to fetch|networkerror|load failed|request failed|typeerror|not found/i.test(message)) {
    return fallback;
  }

  return message;
}
