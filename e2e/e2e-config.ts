import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

// Playwright and the backend starter both run from the CMS folder.
const E2E_DIR = resolve(process.cwd(), 'e2e');
const values = parseEnv(readFileSync(resolve(E2E_DIR, 'e2e.env'), 'utf8'));

function required(name: string): string {
  const value = values[name];
  if (value === undefined || value === '') {
    throw new Error(`e2e/e2e.env is missing ${name}`);
  }
  return value;
}

export const e2eConfig = {
  backendDir: resolve(E2E_DIR, '..', required('BACKEND_DIR')),
  backendPort: Number(required('BACKEND_PORT')),
  cmsPort: Number(required('CMS_PORT')),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  adminEmail: required('ADMIN_EMAIL'),
  adminPassword: required('ADMIN_PASSWORD'),
};
