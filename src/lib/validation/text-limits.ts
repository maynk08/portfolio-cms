// The backend's limits (backend `TEXT_LIMITS`), repeated so forms can explain them before saving.
export const TEXT_LIMITS = {
  name: 100,
  title: 200,
  summary: 1000,
  markdown: 20_000,
  url: 2048,
  listItem: 300,
  tag: 50,
} as const;

export function maxLengthMessage(max: number): string {
  return `Use at most ${max.toLocaleString('en')} characters`;
}
