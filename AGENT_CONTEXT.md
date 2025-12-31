# Контекст Агента (Agent Context) — tempo.TRFNV

## 🎯 Обзор Проекта
Tempo.TRFNV — это профессиональный музыкальный плеер для тренеров бальных танцев. 
**Текущая версия:** 1.0.33+ (Modular Backend & Postgres Edition)

## 🏗 Архитектура
Проект перешел от монолитного прототипа к масштабируемой модульной архитектуре.

### Бэкенд (Node.js + Express + PostgreSQL)
- **Модульность:** Код разделен на `routes`, `controllers`, `services` и `middleware`.
- **База данных:** PostgreSQL (заменяет устаревший `db.json`).
- **Миграции:** Схема управляется через `node-pg-migrate`.
- **Безопасность:** JWT-авторизация, шифрование паролей (bcrypt), запуск Docker от non-root пользователя.
- **Логирование:** Структурированные логи Winston (JSON).

### Фронтенд (React + TypeScript + Vite)
- **Компоненты:** UI разбит на функциональные части (`components/`).
- **Хуки:** Вся логика плеера и аудио вынесена в `hooks/` (`usePlayer`, `useAudioContext`, `useMetronome`).
- **Стили:** Tailwind CSS.
- **PWA:** Полная поддержка офлайн-режима и установки на экран.

## 🚀 Окружение и Деплой
- **PROD:** `https://tempo.trfnv.ru` (Port 3005)
- **TEST:** `https://tempotest.trfnv.ru` (Port 3006)
- **CI/CD:** GitHub Actions подготовлен (`.github/workflows/deploy.yml`).

## 🛑 Важные правила для Агента
1. **Не меняй БД вручную:** Используй `node-pg-migrate`.
2. **Используй asyncHandler:** В контроллерах не пиши `try-catch` вручную.
3. **iOS Audio:** Помни, что `AudioContext` должен стартовать только после клика пользователя.
4. **Безопасность:** Никогда не хардкодь секреты. Используй `process.env`.