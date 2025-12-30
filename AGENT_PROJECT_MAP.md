# Карта проекта (Project Map)

## 1. Структура файлов

```text
tempo/extracted/tempo-main/
├── App.tsx                 # Главный компонент (UI, Роутинг, Плеер)
├── constants.tsx           # Версия приложения (APP_VERSION)
├── i18n.ts                 # Локализация (EN, RU, ES)
├── index.css               # Глобальные стили (Tailwind imports)
├── tailwind.config.js      # Конфиг стилей
├── vite.config.ts          # Сборщик
├── components/             # UI Компоненты
│   ├── EditTrackModal.tsx  # [NEW] Модалка редактирования
│   ├── UpdateNotification.tsx # [UPD] Окно обновления (тянет данные с бэка)
│   ├── AuthModal.tsx       # Вход/Регистрация
│   ├── Icons.tsx           # SVG иконки
│   └── ...
├── server/                 # Бэкенд (Node.js)
│   ├── server.js           # Точка входа (Express + PG)
│   ├── schema.sql          # [NEW] Схема БД
│   ├── email.js            # Отправка почты
│   └── tests/              # [NEW] Интеграционные тесты
│       └── api.test.js
├── scripts/                # Скрипты
│   └── ...
├── DESIGN_SYSTEM.md        # [NEW] Гайдлайны по дизайну
└── AGENT_*.md              # Документация агента
```

## 2. API Эндпоинты

*   `GET /api/tracks` - Получить список треков (фильтрация по роли).
*   `POST /api/auth/login` - Вход (возвращает User + Token).
*   `GET /api/changelog/latest` - [NEW] Получить описание последнего обновления.
*   `PATCH /api/tracks/:id` - Редактирование трека.

## 3. Инфраструктура

*   **Docker Compose:** Поднимает сервис `app`.
*   **Database:** Использует внешний контейнер `mautrix-telegram-db-1`.
*   **Volume:** `tempo-uploads` (хранение mp3 файлов).