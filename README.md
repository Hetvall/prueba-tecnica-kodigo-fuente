# Módulo de Gestión de Promociones

Aplicación web para registrar y gestionar promociones/descuentos de productos y categorías, controlando su estado (`Programada → Activa → Finalizada`) y su vigencia.

Ver [`DECISIONS.md`](./DECISIONS.md) para el detalle y justificación de las decisiones técnicas.

## Stack

- **Frontend:** React + Vite + TypeScript + React Query
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Base de datos:** PostgreSQL
- **Contenedores:** Docker / docker-compose
- **CI/CD:** GitHub Actions (`lint → test → build → smoke test`)

## Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose v2 (para levantar todo con un solo comando).
- Opcional para desarrollo local sin contenedores: Node.js 22+.

## Levantar el proyecto con Docker (recomendado)

1. Copia el archivo de variables de entorno de ejemplo:

   ```bash
   cp .env.example .env
   ```

   Ajusta los valores si lo deseas (usuario/contraseña de la base de datos, puertos). Los valores por defecto funcionan para uso local.

2. Levanta todos los servicios:

   ```bash
   docker compose up --build
   ```

   Esto construye y levanta 3 servicios:
   - `db`: PostgreSQL 16.
   - `backend`: API en `http://localhost:4000` (aplica migraciones y siembra datos de ejemplo automáticamente al iniciar).
   - `frontend`: aplicación web servida por Nginx en `http://localhost:8080`.

3. Abre **http://localhost:8080** en el navegador.

4. Verifica el endpoint de salud del backend:

   ```bash
   curl http://localhost:4000/health
   ```

   Debe responder `200 OK` con `{"status":"ok","database":"up"}` cuando la app y la base de datos están operativas.

5. Para detener y limpiar los contenedores:

   ```bash
   docker compose down -v
   ```

## Desarrollo local sin Docker

### Base de datos

Necesitas una instancia de PostgreSQL accesible (puedes usar `docker compose up db` para levantar solo la base de datos).

### Backend

```bash
cd backend
cp .env.example .env   # o exporta DATABASE_URL y PORT manualmente
npm install
npx prisma migrate dev
npm run seed
npm run dev             # http://localhost:4000
```

Scripts disponibles: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`.

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, con proxy a /api y /health del backend
```

Scripts disponibles: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build`.

## Funcionalidad

- **Crear promoción**: nombre, producto **o** categoría asociada, tipo de descuento (Porcentaje / Monto fijo), valor, fecha de inicio y fin.
- **Listar** todas las promociones con sus datos principales.
- **Cambiar estado** siguiendo el flujo `Programada → Activa → Finalizada` (no permite saltos ni retrocesos).
- **Eliminar** una promoción, solo si está en estado `Programada`.
- **Resumen**: contador de promociones por estado y cuántas están vigentes hoy (según su rango de fechas).

### Validaciones aplicadas

- Nombre, producto/categoría y valor de descuento son obligatorios.
- La fecha de fin debe ser posterior a la fecha de inicio.
- Si el tipo de descuento es Porcentaje, el valor debe estar entre 1 y 100.
- Una promoción `Finalizada` no puede modificarse (ni editarse, ni cambiar de estado, ni eliminarse).

## API

| Método | Ruta                          | Descripción                                  |
| ------ | ----------------------------- | --------------------------------------------- |
| GET    | `/health`                     | Estado de la app y la conexión a base de datos |
| GET    | `/api/promotions`              | Listar promociones                            |
| POST   | `/api/promotions`              | Crear promoción                               |
| PATCH  | `/api/promotions/:id/status`   | Cambiar estado (`SCHEDULED`/`ACTIVE`/`FINISHED`) |
| DELETE | `/api/promotions/:id`          | Eliminar (solo si está `SCHEDULED`)           |
| GET    | `/api/promotions/summary`      | Contadores por estado + vigentes hoy          |
| GET    | `/api/categories`              | Listar categorías (para el formulario)        |
| GET    | `/api/products`                | Listar productos (para el formulario)         |

## CI/CD

El flujo definido en [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) ejecuta, en etapas dependientes:

1. **Verificación de secretos**: falla explícitamente si faltan variables requeridas en GitHub Secrets.
2. **Lint**: ESLint, Prettier y `tsc --noEmit` en backend y frontend.
3. **Test**: pruebas unitarias y de integración (backend con un contenedor de servicio de PostgreSQL) y pruebas de componentes del frontend.
4. **Build**: construcción de las imágenes Docker de backend y frontend.
5. **Smoke test**: levanta la aplicación completa con `docker compose up`, espera a que los contenedores estén saludables y verifica que `/health` responda `200 OK`. Si no responde `200`, el pipeline falla.

### Secretos requeridos en GitHub

Configura estos secretos en **Settings → Secrets and variables → Actions** del repositorio:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

Ningún valor real de estas variables está presente en el repositorio; `.env.example` documenta su formato sin datos sensibles.
