# Карта проекта и Навигация (Project Map)

Этот файл поможет быстро ориентироваться в файловой структуре и логических связях приложения.

## 1. Структура файлов (Манифест)

### Frontend (Root)
*   `App.tsx` — **Центральный хаб**. Содержит 90% логики состояния, плеер, фильтры и рендеринг всех модальных окон.
*   `constants.tsx` — Конфигурация: список начальных треков (legacy), цвета жанров и глобальная версия `APP_VERSION`.
*   `types.ts` — Все TypeScript интерфейсы (User, Track, PlayerState и др.).
*   `i18n.ts` — Конфигурация локализации (RU, EN, ES).
*   `index.css` — Глобальные стили и Tailwind директивы.

### Components (`/components`)
*   `Icons.tsx` — Библиотека всех SVG иконок проекта.
*   `AuthModal.tsx` — Логика входа, регистрации тренера/ученика и обработки инвайтов.
*   `AdminPanel.tsx` — Форма загрузки новых треков (только для Admin/Coach).
*   `UserManagementModal.tsx` — Панель управления пользователями (только для Admin).
*   `ClapDetector.tsx` — Изолированный компонент анализа аудио-потока с микрофона.
*   `UpdateNotification.tsx` — Модалка "Что нового", завязанная на `APP_VERSION`.
*   `ReloadPrompt.tsx` — Логика PWA: проверка обновлений и кнопка "Обновить".

### Backend (`/server`)
*   `server.js` — Express сервер, API эндпоинты, JWT-middleware и статическая раздача `/uploads` и `/dist`.
*   `email.js` — Сервис отправки почты через SMTP.
*   `data/db.json` — "База данных" (хранится в Docker Volume).

## 2. Логика Авторизации (Handshake)

1.  **Login/Register:** `AuthModal` отправляет запрос на сервер -> Сервер генерирует JWT (содержит `id`, `role`, `coachId`) -> Возвращает объект `user` и `token`.
2.  **Persistence:** Фронтенд сохраняет токен в `localStorage.setItem('token', ...)`.
3.  **Hydration:** При загрузке страницы `App.tsx` берет токен из хранилища и делает запрос `GET /api/auth/me` с заголовком `Authorization: Bearer <token>`.
4.  **API Calls:** Все защищенные запросы (загрузка треков, плейлисты) прикрепляют токен в хедеры.

## 3. Иерархия компонентов (UI Tree)

```text
App (Layout)
├── Header
│   ├── Metronome Toggle
│   ├── Whistle (Coach Mode)
│   ├── Gear (Settings)
│   ├── User Management (Admin only)
│   └── Login/Logout
├── Filters (Styles & Playlists)
├── Track Grid
│   └── Track Card (Inline Edit & Play overlay)
├── Floating Player (Bottom)
└── Modals (Conditional Render)
    ├── AuthModal
    ├── AdminPanel
    ├── UserManagementModal
    ├── SettingsModal (showSettings)
    ├── TrainingModal (showTrainingPanel)
    └── UpdateNotification
```

## 4. Специфические правила сборки

*   **Tailwind:** В проекте НЕТ внешних CSS файлов, кроме `index.css`. Все стили пишутся через классы Tailwind прямо в компонентах.
*   **Docker:** Мы не используем `docker-compose`. Все манипуляции (stop, rm, build, run) выполняются одной цепочкой команд через `&&`. Это гарантирует атомарность обновления контейнера.
*   **Volumes:** При деплое ОБЯЗАТЕЛЬНО прокидывать два тома:
    1. `tempo-data:/app/server/data` (база)
    2. `tempo-uploads:/app/server/uploads` (файлы mp3)
