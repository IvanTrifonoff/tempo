# 🗺 Карта проекта (Project Map)

## 📂 Корень проекта
- `App.tsx` — Главный компонент фронтенда (логика плеера, тренировок, UI).
- `constants.tsx` — Константы, цвета стилей и **APP_VERSION**.
- `types.ts` — TypeScript интерфейсы всего проекта.
- `CHANGELOG.md` — История изменений (источник данных для уведомлений).
- `Dockerfile` & `docker-compose.yml` — Конфигурация развертывания.

## 📂 `server/` (Backend)
- `server.js` — Основной файл сервера.
- `controllers/` — Обработчики запросов (auth, tracks, playlists).
- `routes/` — Определение API эндпоинтов.
- `middleware/` — Защита (auth.js) и загрузка файлов (upload.js).
- `db/` — Конфигурация PostgreSQL.
- `migrations/` — Миграции структуры базы данных.
- `scripts/` — Утилиты (синхронизация чейнджлога).
- `uploads/` — Директория для хранения MP3 файлов.

## 📂 `components/` (UI)
- `AdminPanel.tsx` — Управление треками и пользователями.
- `AuthModal.tsx` — Логин и регистрация.
- `EditTrackModal.tsx` — Редактирование метаданных треков.
- `Icons.tsx` — Библиотека SVG иконок.

## 📂 `docs/` (Knowledge Base)
- `ARCHITECTURE.md` — Как это работает под капотом.
- `API_SPEC.md` — Описание эндпоинтов.
- `DATABASE_SCHEMA.md` — Структура таблиц БД.
- `AGENT_CONTEXT.md` — Бортовой журнал и техдолг.
