const REQUIRED_ENV_VARS = ['DATABASE_URL', 'PORT'] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export type Env = Record<RequiredEnvVar, string> & { NODE_ENV: string };

/**
 * Valida que todas las variables de entorno requeridas estén presentes.
 * Si falta alguna, detiene el arranque de la aplicación con un mensaje explícito
 * en lugar de fallar más adelante de forma silenciosa/ambigua.
 */
export function loadEnv(): Env {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === '',
  );

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ Faltan variables de entorno requeridas: ${missing.join(', ')}. ` +
        'Revisa tu archivo .env (usa .env.example como referencia).',
    );
    process.exit(1);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  };
}
