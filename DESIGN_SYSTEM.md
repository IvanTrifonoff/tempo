# Дизайн-система Tempo.TRFNV

Этот документ фиксирует стандарты дизайна для обеспечения визуальной целостности приложения.

## 1. Цветовая палитра (Color Palette)

Приложение использует "Dark Luxury" тему: глубокий черный фон с яркими золотыми акцентами.

| Роль | Tailwind Class | HEX | Примечание |
| :--- | :--- | :--- | :--- |
| **Primary (Акцент)** | `bg-yellow-500` | `#eab308` | Основные кнопки, активные тогглы, прогресс-бары. |
| **Background (Фон)** | `bg-[#0a0a0a]` | `#0a0a0a` | Глобальный фон `body`. |
| **Surface (Карточки)**| `bg-[#141414]` | `#141414` | Карточки треков. |
| **Surface (Модалки)**| `bg-[#1a1a1a]` | `#1a1a1a` | Всплывающие окна, панели настроек. |
| **Border (Границы)** | `border-white/10` | - | Стандартный разделитель (10% opacity). |
| **Text (Основной)** | `text-white` | `#ffffff` | Заголовки. |
| **Text (Вторичный)**| `text-gray-400` | `#9ca3af` | Описания, неактивные иконки. |

### ⚠️ Проблема несоответствия (To Fix)
В `index.css` для скроллбара используется цвет `#d4af37` (Old Gold), а в Tailwind — `yellow-500` (Vivid Gold).
**Решение:** Заменить `#d4af37` на `#eab308` в `index.css` для единообразия.

## 2. Типографика (Typography)

*   **Заголовки (H1-H2):** `font-serif` (Playfair Display). Придает "премиальность".
*   **Интерфейс (Body):** `font-sans` (Inter). Читаемость.
*   **Цифры (BPM/Timer):** `font-mono`. Табличный вывод.

## 3. UI Компоненты (Правила)

### Кнопки (Buttons)
1.  **Primary (Действие):**
    *   Цвет: `bg-yellow-500 text-black hover:bg-yellow-400`.
    *   Шрифт: `font-bold uppercase tracking-wider text-xs`.
    *   Скругление: `rounded-xl`.
    *   Тень: `shadow-lg`.
2.  **Icon Button (Тогглы):**
    *   Цвет: `bg-white/5 hover:bg-white/10` (неактив) / `bg-yellow-500 text-black` (актив).
    *   Скругление: `rounded-full`.
3.  **Secondary (Отмена):**
    *   Цвет: `text-gray-400 hover:text-white`.

### Модальные окна (Modals)
*   Фон: `bg-[#1a1a1a] backdrop-blur-2xl`.
*   Скругление: **Единообразно `rounded-[2rem]`** (сейчас встречается разброс от 2xl до 2.5rem).
*   Граница: `border border-white/10`.
*   Анимация: `animate-in fade-in zoom-in-95`.

### Поля ввода (Inputs)
*   Стиль: `bg-white/5 border border-white/10 rounded-xl px-4 py-3`.
*   Фокус: `focus:border-yellow-500 outline-none`.
*   Шрифт: `text-white placeholder:text-gray-600`.

## 4. План ревизии (Action Items)

1.  [ ] **CSS:** Заменить `#d4af37` на `#eab308` в `index.css`.
2.  [ ] **Tailwind Config:** Добавить цвета `surface` (`#1a1a1a`) и `app-bg` (`#0a0a0a`) в `extend.colors` для избавления от хардкода.
3.  [ ] **Components:** Пройтись по модалкам (`EditTrackModal`, `TrainingModal`) и привести `rounded` к единому значению `rounded-[2rem]`.
