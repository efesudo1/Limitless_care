import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'lc.access';
const REFRESH = 'lc.refresh';
const USER = 'lc.user';

export const storage = {
  async setSession(access: string, refresh: string, user: object) {
    await AsyncStorage.multiSet([
      [ACCESS, access],
      [REFRESH, refresh],
      [USER, JSON.stringify(user)],
    ]);
  },
  getAccessToken: () => AsyncStorage.getItem(ACCESS),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH),
  async getUser<T = any>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clear: () => AsyncStorage.multiRemove([ACCESS, REFRESH, USER]),
};
