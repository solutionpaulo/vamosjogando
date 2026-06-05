export function readingTime(body) {
  if (!body) return '1 min de leitura';
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de leitura`;
}
