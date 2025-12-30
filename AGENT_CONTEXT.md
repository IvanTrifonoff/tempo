# Контекст разработки Tempo.TRFNV (Agent Handoff)

**Актуальная версия:** 1.0.32
**Дата обновления:** 30 декабря 2025
**Статус:** PROD (Stable)

## 1. Обзор проекта
**Tempo.TRFNV** — SaaS-платформа для тренеров бальных танцев.
*   **Функции:** Плеер, изменение BPM, автопилот, управление хлопками (Clap Control), метроном, личные библиотеки и плейлисты.
*   **Сущности:**
    *   **Admin:** Полный доступ, управление пользователями, общедоступный контент.
    *   **Coach:** Личные треки, плейлисты, приглашение учеников.
    *   **Student:** Доступ к общему контенту и контенту своего тренера.

## 2. Архитектура Данных (db.json)

### Users
*   `role`: 'admin', 'coach', 'student'.
*   `coachId`: (для учеников) привязка к тренеру.
*   `isVerified`: (для тренеров) подтверждение через email.
*   `verificationToken`: токен для ссылки активации.
*   `favorites`: массив ID треков.

### Tracks
*   `ownerId`: ID загрузившего пользователя.
*   `isPublic`: если `true`, трек виден всем. Если `false`, виден только владельцу и его ученикам.

## 3. Логика Доступа и Инвайтов

*   **Фильтрация:** Эндпоинт `GET /api/tracks` фильтрует контент на уровне сервера. Гости видят только `isPublic`, ученики — общее + тренера.
*   **Инвайты:** Ссылка формата `https://tempo.trfnv.ru/?invite=COACH_ID`. При регистрации по ней создается `student`, привязанный к тренеру.
*   **Email:** Используется `nodemailer` через SMTP Mail.ru (`tempo@trfnv.ru`). Ссылка верификации: `/verify?token=...`.

## 4. Аудио-движок (КРИТИЧНО)

**Проблема iOS Safari:** Создание `AudioContext` при загрузке ломает фоновое воспроизведение.
*   **Решение:** Используется ленивая инициализация. `AudioContext` создается только при активации функций тренера (метроном/хлопки) через функцию `initAudioCtx`.
*   **Фоновый режим:** Работает через `Media Session API` и `latencyHint: 'playback'`. 
*   **Стриминг:** Включен `preload="metadata"` для быстрого старта.

## 5. Сборка и PWA
*   **Tailwind v3:** Локальная сборка через PostCSS. Файл `constants.tsx` должен быть в `content`, иначе PurgeCSS удалит цвета жанров.
*   **PWA:** Режим `autoUpdate`. Проверка обновлений каждые 60с. Реализованы Push-уведомления (включаются в настройках).

## 6. Процесс Деплоя

### Deploy to TEST (tempotest.trfnv.ru, port 3006)
```bash
cd tempo/extracted/tempo-main && \
tar -czf ../tempo-deploy-test.tar.gz -C ../ tempo-main && \
scp -o StrictHostKeyChecking=no ../tempo-deploy-test.tar.gz admssh@82.202.141.81:~/ && \
ssh -o StrictHostKeyChecking=no admssh@82.202.141.81 "tar -xzf tempo-deploy-test.tar.gz && cd tempo-main && sudo docker stop tempo-test || true && sudo docker rm tempo-test || true && sudo docker build -t tempo-test . && sudo docker run -d --name tempo-test -p 127.0.0.1:3006:3000 --restart always -v tempo-uploads-test:/app/server/uploads -v tempo-data-test:/app/server/data tempo-test"
```

### Deploy to PROD (tempo.trfnv.ru, port 3005)
```bash
cd tempo/extracted/tempo-main && \
tar -czf ../tempo-deploy.tar.gz -C ../ tempo-main && \
scp -o StrictHostKeyChecking=no ../tempo-deploy.tar.gz admssh@82.202.141.81:~/ && \
ssh -o StrictHostKeyChecking=no admssh@82.202.141.81 "tar -xzf tempo-deploy.tar.gz && cd tempo-main && sudo docker stop tempo-app || true && sudo docker rm tempo-app || true && sudo docker build -t tempo-app . && sudo docker run -d --name tempo-app -p 127.0.0.1:3005:3000 --restart always -v tempo-uploads:/app/server/uploads -v tempo-data:/app/server/data tempo-app"
```

## 7. Правила разработки для Агента

1.  **Версионирование:** При каждом функциональном изменении поднимать версию в `package.json` и `constants.tsx` (`APP_VERSION`).
2.  **Ветки:** Разработка в `dev` -> Тест -> Слияние в `main` -> Прод.
3.  **Безопасность:** Не выводить пароли и токены в логи.
4.  **Миграции:** Сервер делает миграцию ролей автоматически при старте (`getDb()` в `app.listen`).

## 8. Технический долг / Backlog
*   Вынести секреты (JWT, SMTP) в `.env`.
*   Рефакторинг: вынести модальные окна в `components/modals/`.
*   Добавить обработку ошибок (UI notifications) для всех fetch-запросов.
*   Admin UI: добавить просмотр и редактирование плейлистов всех пользователей.
