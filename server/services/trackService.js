/**
 * Сервис управления видимостью треков
 */
export const TrackVisibility = {
    /**
     * Возвращает SQL-фильтр для выборки треков
     * @param {Object} user - Объект пользователя
     * @returns {Object} { filter: string, params: Array }
     */
    getFilter(user) {
        // База: Публичные треки видны всем
        let filter = 'is_public = true';
        let params = [];

        if (!user) return { filter, params };

        if (user.role === 'admin') {
            // Админ видит всё
            return { filter: 'true', params: [] };
        }

        if (user.role === 'coach') {
            // Тренер видит Публичные + Свои
            filter += ' OR owner_id = $1';
            params = [user.id];
        } else if (user.role === 'student' && user.coachId) {
            // Ученик видит Публичные + Треки своего тренера
            filter += ' OR owner_id = $1';
            params = [user.coachId];
        }

        return { filter, params };
    }
};
