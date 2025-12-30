# Контекст разработки Tempo.TRFNV (Agent Handoff)

**Актуальная версия:** 1.0.32
**Дата обновления:** 30 декабря 2025
**Статус:** PROD (Stable)

## 1. Обзор проекта
**Tempo.TRFNV** — SaaS-платформа для тренеров бальных танцев.
*   **Сущности:**
    *   **Admin:** Полный доступ, управление пользователями, загрузка общедоступных треков (`isPublic: true`).
    *   **Coach:** Саморегистрация с подтверждением по Email. Загрузка личных треков, создание плейлистов, генерация инвайт-ссылок для учеников.
    *   **Student:** Регистрация только по ссылке тренера. Видит общедоступные треки и треки своего тренера. Не может загружать контент.

## 2. Архитектура и Ключевые решения

### Аудио-движок
*   **Фоновый режим:** Используется `Media Session API` и `latencyHint: 'playback'`.
*   **Стриминг:** Включен `preload="metadata"` для ускорения запуска воспроизведения.
*   **Lazy Loading:** `AudioContext` инициализируется только при активации функций тренера, чтобы не ломать нативное поведение аудио в фоне на iOS.

### Система ролей и Безопасность
*   **JWT:** Токен теперь содержит `role` и `coachId`.
*   **Фильтрация:** Эндпоинт `/api/tracks` фильтрует контент на уровне БД в зависимости от роли пользователя в токене.
*   **Email:** Используется `nodemailer` через SMTP Mail.ru (`tempo@trfnv.ru`).

### Сборка и Стили
*   **Tailwind:** Проект полностью автономен. Используется Tailwind v3 с локальной сборкой (PostCSS). 
*   **Важно:** Файл `constants.tsx` включен в сканирование Tailwind (`content`), так как содержит динамические классы цветов для жанров.

## 3. Процесс Деплоя

### Команды (Шаблоны)

**Deploy to PROD:**
```bash
cd tempo/extracted/tempo-main && \
tar -czf ../tempo-deploy.tar.gz -C ../ tempo-main && \
scp -o StrictHostKeyChecking=no ../tempo-deploy.tar.gz admssh@82.202.141.81:~/ && \
ssh -o StrictHostKeyChecking=no admssh@82.202.141.81 "tar -xzf tempo-deploy.tar.gz && cd tempo-main && sudo docker stop tempo-app || true && sudo docker rm tempo-app || true && sudo docker build -t tempo-app . && sudo docker run -d --name tempo-app -p 127.0.0.1:3005:3000 --restart always -v tempo-uploads:/app/server/uploads -v tempo-data:/app/server/data tempo-app"
```

## 4. Правила для Агента
1.  **Миграции:** Сервер автоматически проверяет и дополняет роли пользователей в `db.json` при старте (`getDb()` в `app.listen`).
2.  **Редактирование:** Inline-редактирование в списке треков доступно только через иконки карандаша (предотвращение случайных срабатываний при клике для проигрывания).
3.  **Логи:** Проверяй логи контейнера (`docker logs`) для отладки SMTP (выводится "SMTP Ready").

