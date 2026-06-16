# tempo.TRFNV

SaaS-платформа для тренеров бальных танцев с функциями контроля темпа (BPM) и PWA.

## 🤖 Для AI-агентов и Разработчиков

**ГЛАВНЫЙ ИСТОЧНИК ПРАВДЫ:** 👉 **[`docs/AI_CONTEXT.md`](./docs/AI_CONTEXT.md)** 👈

*Читай этот файл перед любыми действиями. В нем описана архитектура, Safe Protocol и деплой.*

## 📚 Документация

Вся документация проекта находится в [`docs/`](./docs/).

### 🤖 AI-агентам (читать перед работой)
| Документ | Описание |
| :--- | :--- |
| [`AI_CONTEXT.md`](./docs/AI_CONTEXT.md) | **Single Source of Truth** — архитектура, Safe Protocol, деплой, инструкции для агентов |
| [`AGENT_CONTEXT.md`](./docs/AGENT_CONTEXT.md) | Бортовой журнал, текущая версия 1.0.47, админка и контроль качества |
| [`AGENT_PROJECT_MAP.md`](./docs/AGENT_PROJECT_MAP.md) | Карта проекта — расположение ключевых файлов и директорий |
| [`AGENT_DEEP_DIVE.md`](./docs/AGENT_DEEP_DIVE.md) | Глубокое погружение — выбор стека, безопасность, iOS Audio, SQL-оптимизация |
| [`AGENT_OPS_AND_TESTING.md`](./docs/AGENT_OPS_AND_TESTING.md) | CI/CD пайплайн, миграции БД, локальная разработка, валидация |
| [`AGENT_SYSTEM_INTERNALS.md`](./docs/AGENT_SYSTEM_INTERNALS.md) | Системные внутренности — Audio Pipeline, State Management, Troubleshooting |
| [`GEMINI.md`](./docs/GEMINI.md) | Gemini Context — аварийный протокол, CI/CD, порядок работы с ветками |

### 🏗 Архитектура и разработка
| Документ | Описание |
| :--- | :--- |
| [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Схема взаимодействия компонентов, аудио и метроном, Docker-структура |
| [`SAFE_COMPONENTS.md`](./docs/SAFE_COMPONENTS.md) | Safe Island Components — авто-генерируемая документация компонентов и схем |
| [`API_SPEC.md`](./docs/API_SPEC.md) | API Specification — все эндпоинты /auth, /tracks, /playlists, /admin |
| [`DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | Структура таблиц PostgreSQL — users, tracks, playlists, changelogs |

### 🗺 Планы и технический долг
| Документ | Описание |
| :--- | :--- |
| [`ROADMAP.md`](./docs/ROADMAP.md) | Дорожная карта — биллинг, админка 2.0, монетизация, архитектурная чистота |
| [`TECH_DEBT.md`](./docs/TECH_DEBT.md) | Технический долг — монолитный server.js, отсутствие миграций, мониторинг |
| [`TECH_DEBT_CRUTCHES.md`](./docs/TECH_DEBT_CRUTCHES.md) | Критические костыли — миграции БД отключены, монолит PlayerUI, деплой через scp |
| [`adr/`](./docs/adr/) | Architecture Decision Records — ключевые архитектурные решения |

## 🚀 Быстрый старт

### Требования
- Node.js 20+
- PostgreSQL (или доступ к тестовой БД)

### Установка
```bash
# 1. Frontend
npm install --legacy-peer-deps

# 2. Backend
cd server
npm install
```

### Запуск (Dev Mode)
```bash
# Terminal 1 (Backend)
cd server && npm run start

# Terminal 2 (Frontend)
npm run dev
```

## 🛡 Safe Protocol
Новые функции внедряются через **Safe Island** (`components/safe-island`).
Не пишите прямой DOM-код. Используйте JSON-схемы. Подробнее в `AI_CONTEXT.md`.
