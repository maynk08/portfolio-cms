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
  fixturePort: Number(required('FIXTURE_PORT')),
};

export const fixtureBaseUrl = `http://localhost:${e2eConfig.fixturePort}`;

// Ready-made library files inserted before each run (S3 is not used in end-to-end tests); newest first.
export const E2E_MEDIA_FILES: {
  key: string;
  fileName: string;
  mimeType: 'image/png' | 'application/pdf';
  size: number;
  width?: number;
  height?: number;
  color?: [number, number, number];
  altText: string | null;
}[] = [
  {
    key: 'media/e2e-ocean/ocean.png',
    fileName: 'ocean.png',
    mimeType: 'image/png',
    size: 2048,
    width: 640,
    height: 400,
    color: [37, 99, 235],
    altText: 'A blue test image',
  },
  {
    key: 'media/e2e-forest/forest.png',
    fileName: 'forest.png',
    mimeType: 'image/png',
    size: 2048,
    width: 400,
    height: 400,
    color: [22, 163, 74],
    altText: null,
  },
  { key: 'media/e2e-resume/resume.pdf', fileName: 'resume.pdf', mimeType: 'application/pdf', size: 4096, altText: null },
];
