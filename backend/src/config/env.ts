import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const envFile = path.join(__dirname, '../../.env');

if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string({ required_error: 'is required, copy .env.example to .env and fill it in' }).min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
});

const result = envSchema.safeParse(process.env);

// Stop the server at startup if the configuration is wrong
if (!result.success) {
  const problems = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`);
  throw new Error(`Invalid environment variables: ${problems.join('; ')}`);
}

export const env = {
  port: result.data.PORT,
  databaseUrl: result.data.DATABASE_URL,
  frontendUrl: result.data.FRONTEND_URL,
  logLevel: result.data.LOG_LEVEL
};
