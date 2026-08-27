import { loadEnv } from './config/env';

// Se valida el entorno antes de construir la app o conectar a la base de datos:
// si falta alguna variable requerida, el proceso termina aquí con un mensaje explícito.
const env = loadEnv();

import { createApp } from './app';
import { prisma } from './prisma/client';

const app = createApp(prisma);
const port = Number(env.PORT);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Backend de promociones escuchando en el puerto ${port} (${env.NODE_ENV})`);
});

async function shutdown(): Promise<void> {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
