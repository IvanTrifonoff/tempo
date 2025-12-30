# Карта проекта (Project Map)

## 1. Структура файлов

```text
tempo/extracted/tempo-main/
├── App.tsx                 # Точка входа UI (собирает хуки и компоненты)
├── constants.tsx           # Версия приложения (APP_VERSION)
├── i18n.ts                 # Локализация (EN, RU, ES)
├── index.css               # Глобальные стили (Tailwind imports)
├── tailwind.config.js      # Конфиг стилей
├── vite.config.ts          # Сборщик
├── hooks/                  # [NEW] Кастомные хуки
│   ├── useAudioContext.ts  # Логика AudioContext (iOS fix)
│   ├── usePlayer.ts        # Состояние плеера, MediaSession
│   └── useMetronome.ts     # Генерация звука метронома
├── components/             # UI Компоненты
│   ├── EditTrackModal.tsx  # Модалка редактирования
│   ├── UpdateNotification.tsx # Окно обновления
│   ├── AuthModal.tsx       # Вход/Регистрация
│   ├── Icons.tsx           # SVG иконки
│   └── ...
├── server/                 # Бэкенд (Node.js)
│   ├── server.js           # Точка входа (Express + PG)
│   ├── schema.sql          # Схема БД
│   ├── email.js            # Отправка почты (SMTP)
│   └── tests/              # Интеграционные тесты
│       └── api.test.js
├── DESIGN_SYSTEM.md        # Гайдлайны по дизайну
└── AGENT_*.md              # Документация агента
```

## 2. API Эндпоинты

*   `GET /api/tracks` - Список треков.
*   `GET /api/playlists` - Список плейлистов (оптимизированный запрос).
*   `POST /api/auth/login` - Вход (User + Token).
*   `GET /api/changelog/latest` - Описание обновления.
*   `PATCH /api/tracks/:id` - Редактирование трека.

## 3. Инфраструктура

*   **Docker:** Контейнер запускается от пользователя `node` (non-root).
*   **Database:** PostgreSQL (`mautrix-telegram-db-1`).
*   **Environment:** Все секреты в `.env`.
