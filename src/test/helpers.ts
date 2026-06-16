/**
 * Create a persistent localStorage mock and assign it to globalThis.
 * Returns the mock object so tests can directly inspect or modify storage.
 *
 * Usage:
 *   // In beforeEach:
 *   const ls = setupLocalStorage();
 *   ls.setItem('token', 'abc');
 *
 *   // With initial token:
 *   const ls = setupLocalStorage('my-token');
 *   expect(ls.getItem('token')).toBe('my-token');
 */
export function setupLocalStorage(token?: string): Storage {
  const store: Record<string, string> = {};
  if (token) store.token = token;

  const mock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };

  (globalThis as unknown as Record<string, unknown>).localStorage = mock;
  return mock;
}
