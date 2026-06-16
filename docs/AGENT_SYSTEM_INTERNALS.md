# Системные внутренности (System Internals) Tempo.TRFNV

Этот файл предназначен для глубокого понимания логики кода и взаимодействия компонентов.

## 1. Схема Аудио-графа (Audio Pipeline)

Для работы режима хлопков (Clap Control) аудио из элемента `<audio>` перенаправляется в `AudioContext`.

**Схема соединений:**
`HTMLAudioElement` -> `MediaElementAudioSourceNode` -> `AnalyserNode` (для визуализации) -> `AudioContext.destination` (динамики).

**Реализация:**
Логика инициализации и маршрутизации вынесена в хук **`hooks/useAudioContext.ts`**.
*   **MediaElementSource:** Создается единожды. Ссылка на ноду хранится в `musicSourceNodeRef`.
*   **Микрофон:** Поток микрофона обрабатывается в `ClapDetector.tsx`.

## 2. Алгоритм детекции хлопков (ClapDetector.tsx)

*   **Частотный диапазон:** Анализируются частоты от 2.5 кГц до 8 кГц.
*   **Логика:** Скачок амплитуды -> Окно ожидания 800мс -> Второй хлопок -> `onClap`.

## 3. Спецификация API (Payloads)

Для быстрой отладки через Postman/cURL:

### Регистрация
`POST /api/auth/register`
```json
{ "email": "...", "password": "...", "inviteCode": "OPTIONAL" }
```

### Редактирование трека
`PATCH /api/tracks/:id` (Требуется токен Admin или Owner)
```json
{ "title": "New", "artist": "New", "bpm": 120, "style": "Rumba" }
```

## 4. Управление состоянием (State Management)

В версии 1.0.33 логика `App.tsx` декомпозирована на кастомные хуки:

*   **`hooks/usePlayer.ts`**: Управляет воспроизведением, очередью, `MediaSession API` и автопилотом. Возвращает объект `player` и методы управления.
*   **`hooks/useAudioContext.ts`**: Отвечает за `AudioContext` (критично для iOS).
*   **`hooks/useMetronome.ts`**: Генерирует звук (Oscillator) и управляет таймингом метронома.

## 5. Распространенные ошибки (Troubleshooting)

*   **Ошибка 502:** Проверь логи `tempo-app` и статус Postgres (`mautrix-telegram-db-1`).
*   **Музыка не играет в фоне (iOS):** Проверь, что `initAudioCtx` вызывается только по user gesture (в `usePlayer` это обработано).
*   **Changelog пустой:** Проверь таблицу `changelogs` в БД.