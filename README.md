# Cuentitas

Dashboard personal de finanzas para uso familiar. Multiusuario con aislamiento estricto de datos.

## Stack

- **Backend:** NestJS 10 + TypeORM + PostgreSQL 16
- **Frontend:** Vue 3 + Vite + Pinia
- **Infraestructura:** Docker Compose (API + Web + DB)

---

## Desarrollo local

### Requisitos

- Node 20 LTS
- pnpm (`npm i -g pnpm`)
- Docker Desktop (solo para la base de datos local)

### Pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores (JWT_SECRET, ADMIN_PASS, etc.)

# 3. Levantar solo la base de datos
docker compose up db -d

# 4. Correr la API en modo desarrollo
pnpm run dev:api

# 5. En otra terminal, correr el frontend
pnpm run dev:web

# 6. Sembrar datos de prueba (primera vez)
pnpm run seed
```

El frontend queda en `http://localhost:5173` con proxy a la API en `http://localhost:3000`.

---

## Deploy en VPS (Hostinger)

### Requisitos en el servidor

- Docker y Docker Compose Plugin instalados
- Puerto 8080 abierto en el firewall

### Pasos

```bash
# 1. Clonar el código en el servidor
git clone <repo> /opt/cuentitas
cd /opt/cuentitas

# 2. Crear el archivo .env
cp .env.example .env
nano .env  # completar JWT_SECRET, POSTGRES_PASSWORD, ADMIN_PASS

# 3. Build y levantar
docker compose up -d --build

# 4. Sembrar datos iniciales (solo la primera vez)
docker compose exec api node apps/api/dist/seed.js
```

La app queda disponible en `http://<IP-VPS>:8080`.

### Cuando tengas el dominio

Copiá el contenido de `Caddyfile.snippet` al Caddyfile de Caddy, reemplazando `tudominio.com`, y recargá:

```bash
docker exec <caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

---

## Backups

```bash
# Manual
bash scripts/backup.sh

# Cron diario (agregar al crontab del servidor)
0 3 * * * cd /opt/cuentitas && bash scripts/backup.sh >> /var/log/cuentitas-backup.log 2>&1
```

Los backups se guardan en `./backups/` y se retienen 30 días por defecto.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `POSTGRES_DB` | Nombre de la base de datos |
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL (obligatoria) |
| `DATABASE_URL` | URL completa de conexión (auto en docker-compose) |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mínimo 32 chars) |
| `ADMIN_USER` | Username del usuario admin inicial |
| `ADMIN_PASS` | Contraseña del admin (obligatoria) |
| `APP_PORT` | Puerto de la API (default: 3000) |
| `TZ` | Zona horaria (default: America/Argentina/Buenos_Aires) |
| `DOLAR_API` | URL base de la API del dólar |
| `DOMINIO` | Dominio del frontend (habilita CORS de producción) |

> Stack base: **NestJS/Node/TS** · **Vue 3/Tailwind** · **React Native/Expo (SDK 54)** ·
> **MySQL/PostgreSQL/Supabase/Firebase**. Idioma: español.

## 📂 Estructura

```
.
├── CLAUDE.md              # Instrucciones permanentes (se cargan solas cada sesión)
├── CONTEXT.md             # Estado actual del proyecto (se mantiene con /context)
├── PROJECT_RULES.md       # Reglas duras y específicas del proyecto (completar)
├── CONVENTIONS.md         # Índice de convenciones por capa
├── conventions/           # Convenciones: backend, frontend, mobile, design, database
├── knowledge/             # Base de errores y soluciones (un archivo por entrada)
├── docs/                  # Documentación de la plantilla (leer para entender todo)
└── .claude/
    ├── settings.json      # Permisos + registro de hooks
    ├── commands/          # /feature /context /knowledge /commit /prettier /security
    ├── skills/            # Skills vendorizados (grilling, diagnosing-bugs, mcp-builder, etc.)
    ├── agents/            # PM, architect, tech-lead, code/security-reviewer, deployment, version-control
    └── hooks/             # format / notify / load-context (PowerShell)
```

> Nota: `caveman` y `canvas-design` se instalan a nivel **global** (`~/.claude/skills/`),
> no en este repo. Ver [`docs/06-extender-skills-mcp.md`](docs/06-extender-skills-mcp.md).

## 🧩 Las piezas

| Pieza | Qué hace |
|---|---|
| **Contexto en capas** | `CLAUDE.md` (reglas permanentes), `CONTEXT.md` (estado), `PROJECT_RULES.md` (reglas duras), `conventions/` (estilo por capa). |
| **knowledge/** | Registro vivo de errores resueltos para no repetirlos. |
| **Hooks** | Formateo automático al editar, notificación al terminar, carga de `CONTEXT.md` al iniciar. |
| **Comandos** | `/feature`, `/context`, `/knowledge`, `/commit`, `/prettier`, `/security`. |
| **Skills** | Vendorizados en `.claude/skills/`: `grilling`, `diagnosing-bugs`, `mcp-builder`, `web-design-guidelines`, `brand-guidelines`. |
| **Subagentes** | Equipo: PM → Architect → Tech-lead → Code/Security review, + `deployment` y `version-control`. |

## 🚀 Cómo empezar

1. **Completá `PROJECT_RULES.md`** con las reglas reales del proyecto.
2. **Cargá el estado** en `CONTEXT.md` (a mano o con `/context`).
3. Para una feature nueva grande, usá **`/feature <idea>`** y dejá que el equipo
   (PM → Architect → Tech-lead) la planifique antes de codear.
4. A medida que resolvés errores difíciles, registralos con **`/knowledge`**.

> ⚠️ Los hooks y settings se cargan **al iniciar la sesión**. Si cambiás algo en
> `.claude/`, reiniciá Claude Code para que tome efecto.

## 📚 Documentación

- [`docs/01-tools-y-mcp.md`](docs/01-tools-y-mcp.md) — qué son tools, MCP, skills, subagentes y hooks (y cuándo usar cada uno).
- [`docs/02-hooks.md`](docs/02-hooks.md) — los hooks incluidos y cómo activarlos/crearlos.
- [`docs/03-comandos.md`](docs/03-comandos.md) — los comandos y cómo crear nuevos.
- [`docs/04-subagentes.md`](docs/04-subagentes.md) — el equipo de subagentes y el flujo.
- [`docs/05-migrar-plantilla.md`](docs/05-migrar-plantilla.md) — cómo llevar esto a otro proyecto.
- [`docs/06-extender-skills-mcp.md`](docs/06-extender-skills-mcp.md) — cómo sumar skills/MCP y dónde (plantilla / global / por proyecto). Ver también [`Especificos.txt`](Especificos.txt).

## 📝 Notas

- **Sin Git** por ahora (decisión de proyecto). Si lo agregás, ignorá
  `.claude/settings.local.json`, `.env` y `.env.*`.
- Los hooks están en **PowerShell** (Windows). Para macOS/Linux habría que portarlos a `.sh`.
- **MCP**: todavía sin configurar (decisión deliberada). Ver `docs/01-tools-y-mcp.md` para
  decidir si sumás alguno (ej. Supabase/PostgreSQL o GitHub).
