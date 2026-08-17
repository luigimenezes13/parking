import { z } from 'zod/v4';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.url(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_MAX_POOL_SIZE: z.coerce.number().default(10),

  RABBITMQ_URL: z.string().min(1),
  RABBITMQ_RECOGNITION_EXCHANGE: z.string().default('recognition.events'),
  RABBITMQ_PREFETCH: z.coerce.number().default(10),

  DEFAULT_PARKING_LOT_ID: z.uuid(),

  // Tolerancia entre a vaga ser liberada e a sessao ser encerrada, para o caso
  // de o veiculo apenas ter deixado de ser detectado por alguns ciclos.
  SESSION_EXIT_GRACE_MS: z.coerce.number().default(180_000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(): Environment {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }

  return result.data;
}
