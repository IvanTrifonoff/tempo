# Операции и Тестирование (Ops & Testing)

## 🐳 Docker Команды
- **Пересборка (Test):** `sudo docker compose up -d --build`
- **Просмотр логов:** `sudo docker logs -f tempo-test-pg`
- **Очистка мусора:** `sudo docker system prune -f`

## 🗄 База Данных (Миграции)
Всегда делай это внутри контейнера или через `npm run`:
- **Создать новую миграцию:** `node-pg-migrate create my_migration_name`
- **Накатить:** `npm run migrate up`
- **Откатить:** `npm run migrate down`

*Примечание:* Контейнер автоматически накатывает миграции при старте через `docker-entrypoint.sh`.

## 🧪 Тестирование
Интеграционные тесты API находятся в `server/tests/`.
- **Запуск:** `sudo docker exec -i tempo-test-pg npm test`

## 📦 Деплой (Manual)
Если CI/CD не настроен:
1. Собери архив: `tar -czf deploy.tar.gz .`
2. Отправь на сервер: `scp deploy.tar.gz admssh@82.202.141.81:~/`
3. Распакуй и перезапусти: `tar -xzf ... && docker compose up -d --build`

## 🧹 Авто-очистка
На сервере настроен крон `/etc/cron.daily/docker-cleanup`, который чистит старые образы и кэш билдов (старше 24ч).