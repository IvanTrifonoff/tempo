# Дополнительный технический контекст Tempo.TRFNV

Этот файл дополняет `AGENT_CONTEXT.md` и содержит глубокие технические подробности.

## 1. Специфика iOS (PWA & Audio)

### Формы и клавиатура:
*   **Font-size:** Для всех `input` в CSS/Tailwind установлен шрифт **16px**. Это критично для iOS, иначе браузер делает принудительный зум при фокусе, что ломает верстку PWA.
*   **Z-index:** Модальные окна имеют `z-[9999]`, чтобы перекрывать нативные элементы и фиксированный плеер.

### Bluetooth и Качество звука:
*   Активация микрофона (для Clap Control) в Safari переводит Bluetooth-устройства в режим **HFP (Hands-Free Profile)**, что резко снижает качество звука. 
*   **Решение:** Мы используем единый `AudioContext` для микрофона и музыки, чтобы минимизировать переключения, но лучше предупреждать пользователя, что Clap Control может снизить качество звука в наушниках.

## 2. Полная схема Базы Данных (db.json)

### Объект `users`:
```json
{
  "id": "string (timestamp)",
  "email": "string",
  "password": "string (bcrypt hash)",
  "role": "admin | coach | student",
  "coachId": "string | null (id тренера для ученика)",
  "isVerified": "boolean",
  "verificationToken": "string | null",
  "favorites": ["track_id", ...],
  "isSubscribed": "boolean (legacy)"
}
```

### Объект `tracks`:
```json
{
  "id": "string (timestamp)",
  "title": "string",
  "artist": "string",
  "style": "string (DanceStyle enum)",
  "bpm": "number",
  "url": "string (path to /uploads/...)",
  "ownerId": "string (user_id)",
  "isPublic": "boolean",
  "isPreloaded": "boolean (legacy)"
}
```

## 3. Детальная логика фильтрации (Backend)

При запросе `GET /api/tracks`:
1.  Если `token` отсутствует -> `tracks.filter(t => t.isPublic)`.
2.  Если `role === 'student'` -> `tracks.filter(t => t.isPublic || t.ownerId === user.coachId)`.
3.  Если `role === 'coach'` -> `tracks.filter(t => t.isPublic || t.ownerId === user.id)`.
4.  Если `role === 'admin'` -> `tracks` (все без фильтра).

## 4. Технический долг

*   **Env variables:** Секреты (JWT_SECRET, SMTP_PASS) сейчас в коде. Требуется переезд на `process.env`.
*   **Error UI:** Нужно внедрить тосты (напр. `react-hot-toast`) для отображения ошибок API, сейчас многие ошибки пишутся только в консоль.
*   **Cleanup:** При удалении трека из БД файл в `uploads` удаляется, но при удалении пользователя его треки и файлы сейчас остаются "сиротами". Нужен каскадный клинап.
*   **Shared Playlists:** Сейчас ученик видит ВСЕ плейлисты своего тренера. Нужно добавить флаг `isShared` в объект плейлиста.
