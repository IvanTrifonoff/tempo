export const playlistsApi = {
  async fetchPlaylists(token: string): Promise<any[]> {
    const res = await fetch('/api/playlists', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async addTrackToPlaylist(token: string, playlistId: string, trackId: string): Promise<void> {
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId }),
    });
  },

  async removeTrackFromPlaylist(token: string, playlistId: string, trackId: string): Promise<void> {
    await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};
