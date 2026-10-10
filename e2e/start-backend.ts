import { execFileSync, spawn } from 'node:child_process';

import { E2E_MEDIA_FILES, e2eConfig, fixtureBaseUrl } from './e2e-config';

// Starts the backend for an end-to-end run: wipes the e2e database, seeds the test admin, then runs the server.
const env = {
  ...process.env,
  NODE_ENV: 'development' as const,
  PORT: String(e2eConfig.backendPort),
  MONGODB_URI: e2eConfig.mongodbUri,
  JWT_SECRET: e2eConfig.jwtSecret,
  ADMIN_EMAIL: e2eConfig.adminEmail,
  ADMIN_PASSWORD: e2eConfig.adminPassword,
  LOG_LEVEL: 'warn',
};

if (!e2eConfig.mongodbUri.includes('e2e')) {
  throw new Error('Refusing to wipe a database whose name does not contain "e2e"');
}

const runInBackend = (args: string[]): void => {
  execFileSync('npx', args, { cwd: e2eConfig.backendDir, env, stdio: 'inherit' });
};

// Run from the backend folder so `mongoose` resolves from its node_modules.
runInBackend([
  'tsx',
  '--eval',
  `(async () => { const { default: mongoose } = await import('mongoose'); await mongoose.connect(process.env.MONGODB_URI); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); })();`,
]);
runInBackend(['tsx', 'src/scripts/seed-admin.ts']);

// Ready library files pointing at the fixture server, since uploads to S3 are not part of end-to-end runs.
const now = Date.now();
const mediaDocuments = E2E_MEDIA_FILES.map((file, index) => ({
  key: file.key,
  url: `${fixtureBaseUrl}/${file.key}`,
  fileName: file.fileName,
  mimeType: file.mimeType,
  size: file.size,
  width: file.width ?? null,
  height: file.height ?? null,
  altText: file.altText,
  isVisible: true,
  status: 'ready',
  createdAt: new Date(now - index * 60_000).toISOString(),
}));
execFileSync(
  'npx',
  [
    'tsx',
    '--eval',
    `(async () => { const { default: mongoose } = await import('mongoose'); await mongoose.connect(process.env.MONGODB_URI); const documents = JSON.parse(process.env.E2E_MEDIA).map((document) => ({ ...document, createdAt: new Date(document.createdAt), updatedAt: new Date(document.createdAt) })); await mongoose.connection.collection('media').insertMany(documents); await mongoose.disconnect(); })();`,
  ],
  { cwd: e2eConfig.backendDir, env: { ...env, E2E_MEDIA: JSON.stringify(mediaDocuments) }, stdio: 'inherit' },
);

const server = spawn('npx', ['tsx', 'src/index.ts'], { cwd: e2eConfig.backendDir, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.kill(signal);
  });
}
server.on('exit', (code) => {
  process.exit(code ?? 0);
});
