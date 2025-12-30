# Техническое погружение (Deep Dive)

## 1. Схема Базы Данных (PostgreSQL)

Вместо JSON мы используем реляционную БД. Схема описана в `server/schema.sql`.

### Основные таблицы:
*   `users`: (id TEXT, email, role, is_verified, ...)
*   `tracks`: (id TEXT, title, artist, bpm, style, owner_id, is_public)
*   `playlists`: (id TEXT, user_id, name)
*   `playlist_tracks`: (playlist_id, track_id) - связь M2M
*   `changelogs`: (version, description_ru, description_en) - история версий

*Примечание:* ID пока остаются текстовыми (timestamp string) для совместимости с легаси фронтендом.

## 2. Переменные окружения (.env)

При деплое необходимо создать файл `.env` в папке с `docker-compose.yml`.

```env
PORT=3006  # 3006 для Теста, 3005 для Прода
DATABASE_URL=postgres://tempo:tempo_secure_password@mautrix-telegram-db-1:5432/tempo
JWT_SECRET=... # Длинная случайная строка
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=tempo@trfnv.ru
SMTP_PASS=... # Пароль приложения
```

*Важно:* `mautrix-telegram-db-1` резолвится, потому что сеть `mautrix-telegram_default` подключена как `external` в `docker-compose.yml`.

## 3. Фронтенд и Дизайн
См. `DESIGN_SYSTEM.md` для правил верстки.
*   Используем `rounded-[2rem]` для модалок.
*   Цвет акцента `#eab308` (Yellow-500).
*   Локализация через `i18n.ts` (namespaces: `app`, `auth`, `edit`, `admin`...).

## 4. Ролевая модель (isAdmin fix)
Бэкенд возвращает поле `isAdmin: true` для пользователей с ролью `admin` в ответе `/api/auth/login` и `/api/auth/me`. Это нужно для корректной работы легаси-проверок на фронтенде (`user?.isAdmin`).