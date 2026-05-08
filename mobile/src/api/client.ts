import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { NativeModules, Platform } from 'react-native';
import { storage } from '../auth/storage';

const BACKEND_PORT = 4000;

// Metro bundler hangi host'tan serve ediyorsa backend de aynı host'ta olur (Mac).
// Wifi/hotspot/IP değişimi olsun, simulator olsun, fiziksel cihaz olsun
// otomatik doğru host'u bulur.
function inferApiBaseUrl(): string {
  if (__DEV__) {
    const scriptURL: string | undefined = (NativeModules as any).SourceCode?.scriptURL;
    console.log('[api] Metro scriptURL =', scriptURL);
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)(?::\d+)?\//);
      if (match) {
        const url = `http://${match[1]}:${BACKEND_PORT}`;
        console.log('[api] API_BASE_URL =', url);
        return url;
      }
    }
    // Fallback: simulator/emulator/cihaz default'ları
    // iOS fiziksel cihaz → Mac'in mDNS hostname'i (Bonjour ile resolve olur)
    // iOS simulator → localhost
    // Android emulator → 10.0.2.2
    let fallback: string;
    if (Platform.OS === 'android') {
      fallback = `http://10.0.2.2:${BACKEND_PORT}`;
    } else if ((Platform as any).constants?.systemName === 'iOS' || Platform.OS === 'ios') {
      // Simulator'da localhost çalışır, fiziksel cihazda Mac hostname'i gerekli.
      // İkisinde de hostname çalışır (simulator localhost'u zaten Mac'tir).
      fallback = `http://Ahmet-MacBook-Air.local:${BACKEND_PORT}`;
    } else {
      fallback = `http://localhost:${BACKEND_PORT}`;
    }
    console.log('[api] API_BASE_URL fallback =', fallback);
    return fallback;
  }
  // Production: ileride gerçek domain'e bağlanılır
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = inferApiBaseUrl();

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
