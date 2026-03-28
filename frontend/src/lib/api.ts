const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('chars_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem('chars_token', token);
  } catch {
    // Ignore storage errors (private mode / restricted storage)
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem('chars_token');
  } catch {
    // Ignore storage errors
  }
};

export const clearAuthStorage = () => {
  try {
    localStorage.removeItem('chars_token');
    localStorage.removeItem('chars_user');
  } catch {
    // Ignore storage errors
  }
};

const buildHeaders = (options?: RequestInit) => {
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }
    const message = typeof payload === 'string' ? payload : payload?.error || 'Request failed';
    const error: ApiError = {
      status: response.status,
      message,
      details: payload,
    };
    throw error;
  }

  return payload as T;
};

export const apiUpload = async <T>(path: string, formData: FormData): Promise<T> => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }
    const message = typeof payload === 'string' ? payload : payload?.error || 'Upload failed';
    const error: ApiError = {
      status: response.status,
      message,
      details: payload,
    };
    throw error;
  }

  return payload as T;
};

export const apiFetchBlob = async (path: string, options: RequestInit = {}): Promise<Blob> => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();
    const message = typeof payload === 'string' ? payload : payload?.error || 'Request failed';
    const error: ApiError = {
      status: response.status,
      message,
      details: payload,
    };
    throw error;
  }

  return response.blob();
};
