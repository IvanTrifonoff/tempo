# Системные внутренности (System Internals) Tempo.TRFNV

Этот файл предназначен для глубокого понимания логики кода и взаимодействия компонентов.

## 1. Схема Аудио-графа (Audio Pipeline)

Для работы режима хлопков (Clap Control) аудио из элемента `<audio>` перенаправляется в `AudioContext`.

**Схема соединений:**
`HTMLAudioElement` -> `MediaElementAudioSourceNode` -> `AnalyserNode` (для визуализации) -> `AudioContext.destination` (динамики).

**Важные нюансы:**
*   **MediaElementSource:** Создается только один раз за жизненный цикл приложения для конкретного тега `<audio>`. Повторный вызов `createMediaElementSource` вызовет ошибку. Ссылка на ноду хранится в `musicSourceNodeRef`.
*   **Микрофон:** Поток микрофона (`micStreamRef`) подключается к отдельному `AnalyserNode` внутри компонента `ClapDetector.tsx`.

## 2. Алгоритм детекции хлопков (ClapDetector.tsx)

*   **Частотный диапазон:** Анализируются частоты от 2.5 кГц до 8 кГц (транзиенты хлопка).
*   **Логика:**
    1. Детектируется резкий скачок амплитуды (энергия выше порога `sensitivity`).
    2. Запускается окно ожидания в **800мс**.
    3. Если в это окно попадает второй хлопок — срабатывает событие `onClap`.
*   **Защита:** Алгоритм игнорирует постоянный фоновый шум и низкие частоты музыки.

## 3. Спецификация API (Payloads)

Для быстрой отладки через Postman/cURL:

### Регистрация тренера
`POST /api/auth/register`
```json
{
  "email": "coach@test.ru",
  "password": "password123"
}
```

### Регистрация ученика (по инвайту)
`POST /api/auth/register`
```json
{
  "email": "student@test.ru",
  "password": "password123",
  "inviteCode": "ID_ТРЕНЕРА"
}
```

### Обновление метаданных трека
`PATCH /api/tracks/:id` (Admin/Owner only)
```json
{
  "title": "New Title",
  "artist": "New Artist",
  "bpm": 120
}
```

## 4. Управление состоянием (State Management)

В приложении не используются Redux или Context API. Все глобальное состояние сосредоточено в `App.tsx` и передается вниз через `props`.

*   **Auth:** Токен хранится в `localStorage` под ключом `token`.
*   **User:** Информация о текущем пользователе загружается один раз при старте через `/api/auth/me`.
*   **Player:** Состояние плеера (`PlayerState`) полностью реактивно. При изменении `currentTrack` срабатывает `useEffect`, обновляющий `MediaSession`.

## 5. Распространенные ошибки (Troubleshooting)

*   **Ошибка 502 после деплоя:** Чаще всего вызвана Syntax Error в `server.js`. Проверь `docker logs tempo-test`.
*   **Ошибка "String did not match expected pattern":** Ошибка в `MediaMetadata`. Проверь, что `artwork.src` — это абсолютный URL (с доступом по https).
*   **Музыка не играет в фоне (iOS):** Проверь, не инициализировался ли `AudioContext` до взаимодействия пользователя с экраном. Контекст должен быть в состоянии `running`.
*   **Письма не уходят:** Проверь лог сервера на фразу "SMTP Connection Error". Возможно, Mail.ru заблокировал пароль приложения.
