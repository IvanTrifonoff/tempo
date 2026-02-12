# 🗄 Структура базы данных (PostgreSQL)

## Таблица `users`
Хранит данные пользователей и их роли.
| Колонна | Тип | Nullable | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `text` | NO | UUID пользователя |
| `email` | `text` | NO | Электронная почта (логин) |
| `password` | `text` | NO | Хэш пароля (bcrypt) |
| `role` | `text` | NO | `admin`, `coach`, `student` |
| `coach_id` | `text` | YES | Ссылка на тренера (для студентов) |
| `is_verified` | `boolean` | YES | Статус верификации почты |
| `verification_token` | `text` | YES | Токен для подтверждения регистрации |
| `created_at` | `timestamp` | YES | Дата регистрации |

## Таблица `tracks`
Музыкальная библиотека.
| Колонна | Тип | Nullable | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `text` | NO | UUID трека |
| `title` | `text` | NO | Название |
| `artist` | `text` | NO | Исполнитель |
| `style` | `text` | YES | Танцевальное направление |
| `bpm` | `integer` | YES | Темп (ударов в минуту) |
| `url` | `text` | NO | Путь к файлу (/uploads/...) или внешний URL |
| `owner_id` | `text` | NO | UUID создателя |
| `is_public` | `boolean` | YES | Видимость для всех |
| `is_preloaded` | `boolean` | YES | Флаг системных демо-треков |

## Таблица `playlists`
Плейлисты пользователей.
| Колонна | Тип | Nullable | Описание |
| :--- | :--- | :--- | :--- |
| `id` | `text` | NO | UUID плейлиста |
| `user_id` | `text` | NO | Владелец |
| `name` | `text` | NO | Название |

## Таблица `user_favorites`
Связь "Избранное".
| Колонна | Тип | Nullable | Описание |
| :--- | :--- | :--- | :--- |
| `user_id` | `text` | NO | UUID пользователя |
| `track_id` | `text` | NO | UUID трека |

## Таблица `playlist_tracks`
Связь треков и плейлистов.
| Колонна | Тип | Nullable |
| :--- | :--- | :--- |
| `playlist_id` | `text` | NO |
| `track_id` | `text` | NO |

## Таблица `changelogs`
История версий для UI.
| Колонна | Тип | Nullable | Описание |
| :--- | :--- | :--- | :--- |
| `version` | `text` | NO | Пример: 1.0.46 |
| `release_date` | `timestamp` | YES | Дата релиза |
| `description_ru` | `text` | YES | Описание изменений на русском |
