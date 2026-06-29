# PROJECT_RULES.md — Reglas duras de este proyecto

> Reglas **innegociables y específicas** de ESTE proyecto. Tienen prioridad sobre las
> convenciones generales (`conventions/`). Completá los espacios `<...>` y borrá lo que
> no aplique. Cuanto más claras y concretas, mejor.
>
> Formato sugerido: cada regla en una línea, en imperativo. Si una regla tiene un
> "por qué" importante, agregalo entre paréntesis.

## ✅ Siempre

- Responder en español.
- <Ej: usar TypeScript estricto (`strict: true`) en todo el backend.>
- <Ej: validar TODOS los inputs de la API con DTOs + class-validator.>
- <...>

## ⛔ Nunca

- <Ej: nunca commitear secretos ni archivos `.env`.>
- <Ej: nunca usar `any` salvo justificación escrita en el código.>
- <Ej: nunca correr migraciones destructivas sin confirmación.>
- <...>

## 🌿 Git y ramas

- Estrategia de ramas: <Ej: trunk-based / git-flow / GitHub flow>
- Nombre de ramas: <Ej: `feat/...`, `fix/...`, `chore/...`>
- Mensajes de commit: <Ej: Conventional Commits (`feat:`, `fix:`, ...)>

## 🚀 Entornos y deploy

- Entornos: <Ej: local / staging / producción>
- Target de deploy: <Ej: Vercel (front) + Railway (back) + Supabase (DB)>
- Variables de entorno: <Dónde se definen y quién las gestiona>

## 🔐 Datos y seguridad

- Datos sensibles del proyecto: <Ej: PII de usuarios, tokens de pago>
- Reglas específicas: <Ej: RLS activado en Supabase para todas las tablas>
- <...>

## 📦 Dependencias

- Gestor de paquetes: <Ej: npm / pnpm / yarn>
- Política de dependencias: <Ej: no agregar libs nuevas sin justificar>

## 🧩 Otras reglas del proyecto

- <...>
