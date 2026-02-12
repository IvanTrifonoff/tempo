# 🧠 AI_CONTEXT.md — Single Source of Truth

> **SYSTEM INSTRUCTION FOR AGENTS:**
> This file is your primary knowledge base. You MUST read this before starting any task.
> You MUST update this file if you change architecture, add dependencies, or modify deployment logic.

---

## 1. Project Identity
- **Name:** Tempo.TRFNV (Dance Coach Pro)
- **Type:** PWA / SaaS
- **Live URL:** `https://tempo.trfnv.ru`
- **Repo:** `tempo/extracted/tempo-main`

## 2. Tech Stack (Verified)
- **Frontend:** React 19, Vite, Tailwind CSS v3, TypeScript.
- **Backend:** Node.js (Express), CommonJS.
- **Database:** PostgreSQL (Migrated from JSON). Shared instance with `mautrix-telegram`.
- **Infrastructure:** Docker Compose, Nginx Reverse Proxy.
- **Key Libs:** `zod` (Validation), `i18next` (Locales), `multer` (Uploads).

## 3. Architecture & Patterns

### A. Monolithic Core (Legacy)
- **App.tsx:** Contains most global state (`player`, `user`, `tracks`).
- **Data Flow:** Props drilling + Local State.
- **Audio:** Custom `hooks/useAudioContext` handling iOS restrictions.

### B. Tempo Safe Protocol (New Standard)
*Architecture for rendering dynamic AI-generated UI safely.*

- **Goal:** Isolate dynamic features from core styling/logic crashes.
- **Location:** `components/safe-island/`
- **Components:**
  - `SafeIsland.tsx`: Wrapper with ErrorBoundary and Isolation logic.
  - `SafeRenderer.tsx`: Recursive engine converting JSON -> React.
  - `schema.ts`: **Strict Zod Schema**. The only source of allowed styles/components.
  - **Docs:** [`docs/SAFE_COMPONENTS.md`](./docs/SAFE_COMPONENTS.md) (Auto-generated).
  - **ADRs:** [`docs/adr/001-safe-island.md`](./docs/adr/001-safe-island.md).
- **Usage:**
  - DO NOT manipulate DOM directly.
  - DO NOT use global CSS classes indiscriminately.
  - GENERATE JSON adhering to `SafeManifestSchema`.

## 4. Directory Map
```text
/tempo/extracted/tempo-main/
├── components/
│   ├── safe-island/     # [SAFE] Protocol implementation
│   ├── AdminPanel.tsx   # Legacy Admin UI
│   └── ...
├── server/
│   ├── db/              # PG Connection & Queries
│   ├── migrations/      # node-pg-migrate files
│   └── server.js        # Entry point
├── public/              # Static assets
└── ...
```

## 5. Deployment & Environment
- **Server:** `82.202.141.81` (User: `admssh`)
- **Path:** `/home/admssh/tempo-pg-prod`
- **Docker Network:** `mautrix-telegram_default` (External)
- **Volumes:** `tempo-uploads` (Assets).

## 🤖 Agent Maintenance Protocol (Post-Task Hook)

When you finish a task, you MUST check this list:
1.  [ ] **Docs:** Did I change the architecture? -> Update `AI_CONTEXT.md`.
2.  [ ] **Schema:** Did I add a new UI component? -> Update `schema.ts` FIRST.
3.  [ ] **Safety:** Did I use `dangerouslySetInnerHTML`? -> **REVERT immediately**. Use Safe Protocol.
4.  [ ] **Tests:** Did I verify the build (`npm run build`)?

---
*Last Updated: 2026-01-04 (Safe Island Implementation)*

---

## 🏁 Session Summary (2026-01-04)
- **Completed:** Full implementation of "Safe Island" (SDUI sandbox).
- **Core Change:** Shifted from "Direct DOM/CSS edits" to "Schema-First UI Development".
- **Added:** Zod-based validation, Auto-docs script, ADR logging.

## 🚀 Next Steps for the Next Agent:
1.  **Read `AI_CONTEXT.md` and `docs/adr/001-safe-island.md`** to understand WHY we don't use `document.createElement`.
2.  **Verify the Sandbox:** Check if the "Safe Protocol Active" banner is visible in the UI.
3.  **To add a new UI feature:**
    - Update `components/safe-island/schema.ts` to include your new component/props.
    - Update `components/safe-island/SafeRenderer.tsx` to handle the new type.
    - Run `node scripts/update-safe-docs.js` to refresh documentation.
    - **Never bypass the schema.** Direct edits to `App.tsx` styling are discouraged for new features.
4.  **Audio Warning:** Do NOT change anything in `App.tsx` related to `AudioContext` or `useEffect` hooks without testing on a physical iOS device.

---

## 🔄 UPDATE: Final Versioning & Automated Ops (2026-01-04)
- **Playlists Restored:** Бэкенд для плейлистов восстановлен в ветке `dev` (было потеряно в предыдущих сессиях). Ветки `main` и `dev` синхронизированы.
- **Changelog Recovery:** История изменений полностью восстановлена из Git-археологии (ранее была стерта).
- **Automated Ops:**
  - Внедрен скрипт `server/scripts/syncChangelog.js`, который автоматически обновляет таблицу `changelogs` в БД при старте сервера, считывая `CHANGELOG.md`.
  - В CI/CD (`deploy.yml`) добавлена блокирующая проверка `scripts/check-version.js`: деплой невозможен, если версия в `constants.tsx` и `CHANGELOG.md` не совпадает.
- **Version Bump:** Проект обновлен до версии **`1.0.36`**.
- **UI Clean:** Демонстрационный баннер Safe Island удален из основного интерфейса `App.tsx` (архитектура осталась и готова к использованию).

### ⚠️ ИНСТРУКЦИЯ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА:
1. **SHARED DATABASE:** Prod и Test используют **одну базу данных** на сервере `82.202.141.81`. Любое удаление треков/пользователей на тесте затронет прод!
2. **Mandatory Changelog:** Перед любым коммитом в `main` или `dev` ОБЯЗАТЕЛЬНО добавь описание изменений в `CHANGELOG.md` и обнови версию в `constants.tsx`, иначе CI/CD упадет.
3. **Deployment:** При ручном деплое используй `docker compose up -d --build`, так как `CHANGELOG.md` и `constants.tsx` теперь копируются внутрь образа для работы авто-синхронизации.
