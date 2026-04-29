import axios from 'axios';

const TOKEN_KEY = 'lc.owner.token';

export const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Bilinmeyen hata';
    return Promise.reject({ ...err, message: msg });
  }
);

export const auth = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'OWNER') throw new Error('Owner yetkisi gerekli');
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data.user;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
  hasToken: () => Boolean(localStorage.getItem(TOKEN_KEY)),
};

export const ownerApi = {
  doctors: (status?: string) => api.get('/owner/doctors', { params: status ? { status } : undefined }).then((r) => r.data),
  approveDoctor: (id: string) => api.post(`/owner/doctors/${id}/approve`).then((r) => r.data),
  rejectDoctor: (id: string, reason: string) => api.post(`/owner/doctors/${id}/reject`, { reason }).then((r) => r.data),

  diseases: () => api.get('/catalog/diseases').then((r) => r.data),
  diseaseSymptoms: (id: string) => api.get(`/catalog/diseases/${id}/symptoms`).then((r) => r.data),
  createDisease: (body: any) => api.post('/owner/diseases', body).then((r) => r.data),
  updateDisease: (id: string, body: any) => api.patch(`/owner/diseases/${id}`, body).then((r) => r.data),
  deleteDisease: (id: string) => api.delete(`/owner/diseases/${id}`),

  createSymptom: (body: any) => api.post('/owner/symptoms', body).then((r) => r.data),
  updateSymptom: (id: string, body: any) => api.patch(`/owner/symptoms/${id}`, body).then((r) => r.data),
  deleteSymptom: (id: string) => api.delete(`/owner/symptoms/${id}`),

  medications: () => api.get('/catalog/medications').then((r) => r.data),
  createMedication: (body: any) => api.post('/owner/medications', body).then((r) => r.data),
  updateMedication: (id: string, body: any) => api.patch(`/owner/medications/${id}`, body).then((r) => r.data),
  deleteMedication: (id: string) => api.delete(`/owner/medications/${id}`),
};
