export const TrackVisibility = {
    getFilter(user) {
        let filter = 'is_public = true';
        let params = [];
        if (!user) return { filter, params };
        if (user.role === 'admin') return { filter: 'true', params: [] };
        if (user.role === 'coach') {
            filter += ' OR owner_id = $1';
            params = [user.id];
        } else if (user.role === 'student' && user.coachId) {
            filter += ' OR owner_id = $1';
            params = [user.coachId];
        }
        return { filter, params };
    }
};