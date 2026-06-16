export const tracksApi = {
  async fetchTracks(token: string | null): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/tracks?t=${Date.now()}`, { headers });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid tracks data');
    return data;
  },

  async addTrack(token: string, formData: FormData): Promise<any> {
    const res = await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async saveTrack(token: string, trackId: string, data: Partial<Record<string, unknown>>): Promise<void> {
    await fetch(`/api/tracks/${trackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  async deleteTrack(token: string, trackId: string): Promise<void> {
    await fetch(`/api/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  async logPlay(token: string | null, trackId: string): Promise<void> {
    if (!token) return;
    await fetch('/api/tracks/log-play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId }),
    });
  },
};
