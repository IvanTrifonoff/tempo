import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, isApiError, getErrorMessage, logApiError, handleApiError } from '../errors';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ApiError', () => {
  it('создаёт ошибку с operation и status', () => {
    const err = new ApiError('Not found', 'fetchTracks', 404);
    expect(err.message).toBe('Not found');
    expect(err.operation).toBe('fetchTracks');
    expect(err.status).toBe(404);
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('создаёт ошибку без status', () => {
    const err = new ApiError('Something broke', 'saveTrack');
    expect(err.message).toBe('Something broke');
    expect(err.operation).toBe('saveTrack');
    expect(err.status).toBeUndefined();
  });
});

describe('isApiError', () => {
  it('возвращает true для ApiError', () => {
    expect(isApiError(new ApiError('msg', 'op'))).toBe(true);
  });

  it('возвращает false для обычной Error', () => {
    expect(isApiError(new Error('msg'))).toBe(false);
  });

  it('возвращает false для строки', () => {
    expect(isApiError('error')).toBe(false);
  });

  it('возвращает false для null', () => {
    expect(isApiError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('возвращает message из ApiError', () => {
    expect(getErrorMessage(new ApiError('custom', 'op'))).toBe('custom');
  });

  it('возвращает message из Error', () => {
    expect(getErrorMessage(new Error('something failed'))).toBe('something failed');
  });

  it('возвращает строку как есть', () => {
    expect(getErrorMessage('direct error')).toBe('direct error');
  });

  it('возвращает fallback для unknown', () => {
    expect(getErrorMessage(42)).toBe('An unknown error occurred');
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    expect(getErrorMessage({ foo: 'bar' })).toBe('An unknown error occurred');
  });
});

describe('logApiError', () => {
  it('логирует ApiError с контекстом', () => {
    logApiError(new ApiError('Not found', 'fetchTracks', 404), 'fetch');
    expect(console.error).toHaveBeenCalledWith(
      '[API:fetch] fetchTracks failed (404):',
      'Not found',
    );
  });

  it('логирует ApiError с unknown status', () => {
    logApiError(new ApiError('Unknown', 'op'));
    expect(console.error).toHaveBeenCalledWith(
      '[API] op failed (no status):',
      'Unknown',
    );
  });

  it('логирует Error со стеком', () => {
    const err = new Error('Boom');
    logApiError(err, 'test');
    expect(console.error).toHaveBeenCalledWith(
      '[API:test]',
      'Boom',
      err.stack,
    );
  });

  it('логирует произвольное значение', () => {
    logApiError('just a string');
    expect(console.error).toHaveBeenCalledWith('[API]', 'just a string');
  });
});

describe('handleApiError', () => {
  it('логирует ошибку', () => {
    handleApiError(new Error('test error'), { operation: 'test' });
    expect(console.error).toHaveBeenCalled();
  });

  it('показывает alert при showAlert = true', () => {
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    handleApiError(new Error('User visible error'), {
      operation: 'saveTrack',
      showAlert: true,
    });
    expect(globalThis.alert).toHaveBeenCalledWith('User visible error');
  });

  it('не показывает alert при showAlert = false', () => {
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    handleApiError(new Error('Silent error'), {
      operation: 'fetchTracks',
    });
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  it('использует alertMessage если передан', () => {
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    handleApiError(new Error('original'), {
      showAlert: true,
      alertMessage: 'Custom message',
    });
    expect(globalThis.alert).toHaveBeenCalledWith('Custom message');
  });
});
