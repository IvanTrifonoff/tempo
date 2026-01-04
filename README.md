# tempo.TRFNV

SaaS-платформа для тренеров бальных танцев с функциями контроля темпа (BPM) и PWA.

## 🤖 Для AI-агентов и Разработчиков

**ГЛАВНЫЙ ИСТОЧНИК ПРАВДЫ:** 👉 **[`AI_CONTEXT.md`](./AI_CONTEXT.md)** 👈

*Читай этот файл перед любыми действиями. В нем описана архитектура, Safe Protocol и деплой.*

## 🚀 Быстрый старт

### Требования
- Node.js 20+
- PostgreSQL (или доступ к тестовой БД)

### Установка
```bash
# 1. Frontend
npm install --legacy-peer-deps

# 2. Backend
cd server
npm install
```

### Запуск (Dev Mode)
```bash
# Terminal 1 (Backend)
cd server && npm run start

# Terminal 2 (Frontend)
npm run dev
```

## 🛡 Safe Protocol
Новые функции внедряются через **Safe Island** (`components/safe-island`).
Не пишите прямой DOM-код. Используйте JSON-схемы. Подробнее в `AI_CONTEXT.md`.
