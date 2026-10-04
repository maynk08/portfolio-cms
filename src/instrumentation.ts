// Runs once when the server starts, so a bad configuration fails immediately instead of on the first request.
export async function register(): Promise<void> {
  await import('@/config/env');
}
