import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../auth/storage';

// Geliştirme:
// - Fiziksel cihazda test: Mac'in LAN/Hotspot IP'sini girin (`ipconfig getifaddr en0`).
// - iOS simulator: 'http://localhost:4000' de çalışır.
// - Android emulator: 'http://10.0.2.2:4000'.
// LAN IP yazmak hem simulator hem fiziksel cihazda çalışır, en pratik seçim.
export const API_BASE_URL = 'http://172.20.10.2:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 alındığında refresh token ile bir kez yeniden dene
let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const refresh = await storage.getRefreshToken();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken: refresh },
      { timeout: 10000 }
    );
    const user = await storage.getUser();
    await storage.setSession(data.accessToken, data.refreshToken, user ?? {});
    return data.accessToken as string;
  } catch {
    await storage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (err.response?.status === 401 && !original._retried && original.url !== '/auth/refresh') {
      original._retried = true;
      refreshing = refreshing ?? refreshAccess();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    const message =
      (err.response?.data as any)?.error ??
      (err.response?.data as any)?.message ??
      err.message ??
      'Bilinmeyen hata';
    return Promise.reject({ ...err, message });
  }
);
