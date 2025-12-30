# Контекст разработки Tempo.TRFNV (Agent Handoff)

**Актуальная версия:** 1.0.21
**Дата обновления:** 29 декабря 2025
**Статус:** PROD (Stable)

## 1. Обзор проекта
**Tempo.TRFNV** — это PWA-приложение для тренеров бальных танцев.
*   **Функции:** Плеер музыки, изменение темпа (BPM), автопилот (смена треков), управление хлопками (Clap Detection), метроном.
*   **Стек Frontend:** React 19, Vite, TailwindCSS, PWA (vite-plugin-pwa).
*   **Стек Backend:** Node.js + Express.
*   **База данных:** Локальный JSON файл (`server/data/db.json`).
*   **Деплой:** Docker контейнеры на VPS (Ubuntu).

## 2. Архитектура и Ключевые решения

### Аудио-движок (КРИТИЧНО)
Реализация аудио сложная из-за ограничений iOS Safari на фоновое воспроизведение и Web Audio API.
*   **Базовое воспроизведение:** Используется нативный HTML5 `<audio>` элемент.
*   **Фоновый режим:** Для работы в фоне на iOS используется `Media Session API`.
*   **Web Audio API (AudioContext):**
    *   Используется **только** для Метронома и Детекции хлопков (анализ спектра).
    *   **Lazy Initialization:** `AudioContext` создается только при активации функций тренера (свисток/метроном). Если они выключены — контекст не трогаем, чтобы iOS не убивал процесс в фоне.
    *   **Latency:** Используется `latencyHint: 'playback'`, чтобы система считала это музыкальным процессом, а не игрой (interactive убивается в фоне).

### PWA и Обновления
*   **Стратегия:** `generateSW` + `autoUpdate`.
*   **Проверка:** Приложение проверяет обновления каждые 60 секунд (`setInterval` в `App.tsx`).
*   **Уведомления:** Реализованы системные Push-уведомления через `Notification API`. Включаются вручную в настройках.

### UI/UX Паттерны
*   **Разделение настроек:**
    *   ⚙️ **Шестеренка:** Технические настройки (Язык, Уведомления, О программе).
    *   🎷 **Свисток:** Режим тренера (Автопилот, Хлопки, Микрофон).
*   **Редактирование:** Inline-редактирование названий и BPM прямо в карточке (только для админа).
*   **Компактность:** Интерфейс оптимизирован под мобильные экраны, минимум отступов.

## 3. Процесс Деплоя (Deployment Flow)

Используется ручной CI/CD через SSH команды.

### Контуры (Environments)
1.  **PRODUCTION:**
    *   URL: `https://tempo.trfnv.ru`
    *   Port: `3005`
    *   Container: `tempo-app`
    *   Volumes: `tempo-data`, `tempo-uploads`
2.  **TEST:**
    *   URL: `https://tempotest.trfnv.ru`
    *   Port: `3006`
    *   Container: `tempo-test`
    *   Volumes: `tempo-data-test`, `tempo-uploads-test`

### Команды деплоя (Шаблоны)

**Deploy to TEST:**
```bash
cd tempo/extracted/tempo-main && \
tar -czf ../tempo-deploy-test.tar.gz -C ../ tempo-main && \
scp -o StrictHostKeyChecking=no ../tempo-deploy-test.tar.gz admssh@82.202.141.81:~/ && \
ssh -o StrictHostKeyChecking=no admssh@82.202.141.81 "tar -xzf tempo-deploy-test.tar.gz && cd tempo-main && sudo docker stop tempo-test || true && sudo docker rm tempo-test || true && sudo docker build -t tempo-test . && sudo docker run -d --name tempo-test -p 127.0.0.1:3006:3000 --restart always -v tempo-uploads-test:/app/server/uploads -v tempo-data-test:/app/server/data tempo-test"
```

**Deploy to PROD:**
```bash
cd tempo/extracted/tempo-main && \
tar -czf ../tempo-deploy.tar.gz -C ../ tempo-main && \
scp -o StrictHostKeyChecking=no ../tempo-deploy.tar.gz admssh@82.202.141.81:~/ && \
ssh -o StrictHostKeyChecking=no admssh@82.202.141.81 "tar -xzf tempo-deploy.tar.gz && cd tempo-main && sudo docker stop tempo-app || true && sudo docker rm tempo-app || true && sudo docker build -t tempo-app . && sudo docker run -d --name tempo-app -p 127.0.0.1:3005:3000 --restart always -v tempo-uploads:/app/server/uploads -v tempo-data:/app/server/data tempo-app"
```

## 4. Правила разработки для Агента

1.  **Версионирование:** При каждом функциональном изменении поднимать версию в `package.json` и `constants.tsx` (константа `APP_VERSION`).
2.  **Ветки:**
    *   `dev` — для активной разработки и деплоя на TEST.
    *   `feature/...` — для крупных фич.
    *   Слияние в основную ветку только после проверки на TEST.
3.  **Аудио:** БУДЬ ОСТОРОЖЕН с `AudioContext`. Не инициализируй его глобально при старте. Это ломает фон на iPhone.
4.  **Стили:** Используй Tailwind. Придерживайся цветовой схемы: Black background (`#0a0a0a`), Yellow accent (`text-yellow-500`).

## 5. Известные проблемы / Backlog
*   При включенном "Режиме тренера" (хлопки) iOS может агрессивнее выгружать приложение из фона из-за использования микрофона. Это компромисс.
*   Синхронизация данных между PROD и TEST делается вручную (копированием томов).
