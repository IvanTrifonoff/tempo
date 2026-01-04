# Карта проекта (Project Map)

## 1. Структура файлов

```text
tempo/extracted/tempo-main/
├── App.tsx                 # Точка входа UI (собирает хуки и компоненты)
├── constants.tsx           # Версия приложения (APP_VERSION)
├── i18n.ts                 # Локализация (EN, RU, ES)
├── vite.config.ts          # Сборщик (включен PWA)
├── hooks/                  # [NEW] Кастомные хуки
│   ├── useAudioContext.ts  # Логика AudioContext (iOS fix)
│   ├── usePlayer.ts        # Состояние плеера
│   └── useMetronome.ts     # Генерация звука метронома
├── server/                 # Бэкенд (Node.js + Express)
│   ├── server.js           # Точка входа (Express setup only)
│   ├── docker-entrypoint.sh # Скрипт запуска (Migrate -> Start)
│   ├── config/             # Конфигурация
│   │   └── logger.js       # Winston Logger
│   ├── db/                 # База данных
│   │   └── index.js        # PG Pool
│   ├── middleware/         # Middleware
│   │   ├── auth.js         # JWT Auth
│   │   ├── errorHandler.js # Central Error Handling
│   │   └── upload.js       # Multer
│   ├── controllers/        # Бизнес-логика
│   │   ├── authController.js
│   │   ├── tracksController.js
│   │   ├── playlistsController.js
│   │   └── usersController.js
│   ├── routes/             # Маршрутизация
│   │   └── ...
│   └── migrations/         # Миграции БД (node-pg-migrate)
├── .github/workflows/      # CI/CD
│   └── deploy.yml          # GitHub Actions Pipeline
└── TECH_DEBT.md            # Технический долг
```

## 2. API Эндпоинты

Все маршруты начинаются с `/api/`.
*   **Auth:** `/auth/login`, `/auth/register`, `/auth/me`
*   **Tracks:** `/tracks` (GET, POST, PATCH, DELETE)
*   **Playlists:** `/playlists`
*   **Users:** `/admin/users`

## 3. Инфраструктура

*   **Docker:** 
    *   Образ на базе `node:20-alpine`.
    *   Пользователь `node` (non-root).
    *   Автоматические миграции при старте.
*   **Database:** PostgreSQL.
*   **Logging:** Winston (JSON format).
*   **Optimization:** Gzip compression, Static Caching (1y).