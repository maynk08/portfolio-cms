import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_URL: z.url({ protocol: /^https?$/ }),
  PORTFOLIO_URL: z.url({ protocol: /^https?$/ }),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Names only: values may be secrets.
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid or missing environment variables: ${names.join(', ')}. See .env.example.`);
  }
  return {
    isProduction: result.data.NODE_ENV === 'production',
    backendUrl: result.data.BACKEND_URL.replace(/\/+$/, ''),
    portfolioUrl: result.data.PORTFOLIO_URL,
  };
}

export const env = loadEnv();
