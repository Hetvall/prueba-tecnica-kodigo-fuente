# Decisiones Técnicas

Este documento explica y justifica las decisiones tecnológicas tomadas para el módulo de Gestión de Promociones.

## Frontend: React + Vite + TypeScript

- **Requisito obligatorio.** Se usa TypeScript sobre JavaScript plano para detectar errores en tiempo de compilación (tipos de dominio compartidos con el backend: `DiscountType`, `PromotionStatus`, etc.).
- **React Query (`@tanstack/react-query`)** para el estado del servidor: maneja cache, invalidación tras mutaciones (crear/cambiar estado/eliminar) y estados de carga/error sin necesidad de un store manual (Redux sería sobre-ingeniería para este alcance).
- **Sin librería de UI de terceros**: CSS propio minimalista. El objetivo es un módulo de gestión, no un showcase visual; se prioriza claridad y tiempo de desarrollo.

## Backend: Node.js + Express + TypeScript + Prisma

- **Node vs. Laravel:** se eligió Node.js porque permite compartir el lenguaje (TypeScript) con el frontend, reduce el peso de las imágenes Docker (Node slim/alpine vs. PHP+Composer+extensiones) y agiliza el pipeline de CI (una sola toolchain: `npm`, `eslint`, `vitest`).
- **Express** por ser minimalista y suficiente para 5-6 endpoints; no se requiere un framework más pesado (NestJS) dado el alcance acotado que pide la prueba ("prioriza calidad sobre cantidad").
- **Prisma ORM** sobre `pg`/`knex` crudo: genera tipos TypeScript desde el esquema (elimina desincronización entre modelo y código), gestiona migraciones versionadas (`prisma/migrations`) y simplifica el query de `/health` (`SELECT 1`) para verificar la conexión real a la base de datos.
- **Arquitectura en capas** (`routes` → `services` → `domain`): las reglas de negocio y validaciones viven en `domain/validation.ts` (funciones puras, fáciles de testear sin mocks) y `services/promotion.service.ts` (orquesta Prisma + reglas). Esto separa HTTP de lógica de negocio y facilita el testing unitario.

## Base de datos: PostgreSQL

- Elegida sobre SQL Server (imagen Docker más pesada, licenciamiento) y MongoDB (el dominio es fuertemente relacional: una promoción referencia opcionalmente un producto O una categoría, y un producto pertenece a una categoría — encaja mejor con integridad referencial de un motor relacional).
- **3 tablas** (supera el mínimo de 2 pedido): `categories`, `products`, `promotions`. Los nombres de tabla/columna van en `snake_case` (convención SQL) mientras el código TypeScript usa `camelCase`, mapeado vía `@map`/`@@map` de Prisma.
- `promotions.discount_value` es `DECIMAL(10,2)` (no `FLOAT`) para evitar errores de redondeo en dinero/porcentajes.

## Regla "vigente hoy"

El requisito de "vigentes hoy" se calcula comparando la fecha actual contra `[startDate, endDate]` de **cada promoción**, independientemente de su campo `status`. Esto refleja fielmente el problema de negocio descrito ("descuentos activos fuera de su vigencia"): una promoción puede tener `status = ACTIVE` pero ya haber vencido en fechas si nadie actualizó su estado manualmente, y el resumen debe mostrar la vigencia real por fecha, no solo el estado declarado.

## Transiciones de estado

Se modela `SCHEDULED → ACTIVE → FINISHED` como una máquina de estados **estrictamente hacia adelante** (`domain/validation.ts::canTransition`): no permite saltos (`SCHEDULED → FINISHED` directo) ni retrocesos. Una promoción `FINISHED` rechaza cualquier modificación (edición, cambio de estado, eliminación) con `409 Conflict`, cumpliendo la regla "una promoción Finalizada no puede modificarse".

## Testing

- **Vitest** en ambos paquetes (más rápido que Jest, configuración nativa con Vite, misma herramienta para frontend y backend).
- **Backend:** tests unitarios puros sobre `domain/validation.ts` (sin base de datos) + tests de integración con Supertest contra una base de datos real (se omiten automáticamente si `DATABASE_URL` no está definida, y se ejecutan en CI contra un contenedor de servicio de Postgres).
- **Frontend:** Testing Library sobre componentes clave (badges de estado, resumen, manejo de errores de validación del formulario).

## Docker y despliegue

- **Multi-stage builds** en ambos Dockerfiles: build con dependencias completas, runtime con solo lo necesario (`npm ci --omit=dev` en backend; Nginx sirviendo estáticos en frontend) para imágenes más pequeñas y sin herramientas de desarrollo.
- El **frontend** se sirve con Nginx y actúa como reverse proxy de `/api` y `/health` hacia el backend dentro de la red de `docker-compose`, evitando problemas de CORS en producción y unificando el punto de entrada en un solo puerto.
- El **backend** ejecuta `prisma migrate deploy` + seed antes de arrancar (vía `CMD` del contenedor), garantizando que `docker-compose up` deje la base de datos lista sin pasos manuales.
- `healthcheck` en `docker-compose.yml` para `db` (`pg_isready`) y `backend` (`/health`), y `depends_on: condition: service_healthy` para asegurar el orden de arranque.

## Manejo de secretos

- Ningún valor real está en el repositorio. `.env.example` documenta las variables sin valores sensibles.
- `docker-compose.yml` lee todo desde variables de entorno (`${VAR}`), nunca hardcodeadas.
- El pipeline de CI usa **GitHub Secrets** y falla explícitamente (`check-secrets` job) si falta alguno antes de ejecutar cualquier otra etapa.
