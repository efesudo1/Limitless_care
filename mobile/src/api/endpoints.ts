import { api } from './client';

// Catalog
export const catalogApi = {
  diseases: (category?: string) =>
    api.get('/catalog/diseases', { params: category ? { category } : undefined }).then((r) => r.data),
  diseaseSymptoms: (id: string) => api.get(`/catalog/diseases/${id}/symptoms`).then((r) => r.data),
  medications: () => api.get('/catalog/medications').then((r) => r.data),
};

// Auth
export const authApi = {
  registerDoctor: (body: any) => api.post('/auth/register/doctor', body).then((r) => r.data),
  registerCaregiver: (body: any) => api.post('/auth/register/caregiver', body).then((r) => r.data),
};

// Doctor
export const doctorApi = {
  me: () => api.get('/doctor/me').then((r) => r.data),
  patients: () => api.get('/doctor/patients').then((r) => r.data),
  timeline: (patientDiseaseId: string, from?: string, to?: string) =>
    api.get(`/doctor/patients/${patientDiseaseId}/timeline`, { params: { from, to } }).then((r) => r.data),
  assign: (caregiverEmail: string, diseaseId: string) =>
    api.post('/doctor/assignments', { caregiverEmail, diseaseId }).then((r) => r.data),
  createPrescription: (body: any) => api.post('/doctor/prescriptions', body).then((r) => r.data),
  endPrescription: (id: string) => api.post(`/doctor/prescriptions/${id}/end`).then((r) => r.data),
  createDisease: (body: any) => api.post('/doctor/diseases', body).then((r) => r.data),
  addSymptom: (diseaseId: string, body: any) =>
    api.post(`/doctor/diseases/${diseaseId}/symptoms`, body).then((r) => r.data),
};

// Caregiver
export const caregiverApi = {
  profile: () => api.get('/me/profile').then((r) => r.data),
  updateMetrics: (heightCm: number, weightKg: number) =>
    api.patch('/me/metrics', { heightCm, weightKg }).then((r) => r.data),
  diseases: () => api.get('/me/diseases').then((r) => r.data),
  today: () => api.get('/me/today').then((r) => r.data),
  logSymptom: (body: { patientDiseaseId: string; symptomId: string; severity: 'MILD' | 'MODERATE' | 'SEVERE'; note?: string }) =>
    api.post('/me/symptom-logs', body).then((r) => r.data),
  checkDose: (id: string, body: { takenAt?: string; note?: string } = {}) =>
    api.post(`/me/dose-events/${id}/check`, body).then((r) => r.data),
  history: (patientDiseaseId: string) =>
    api.get(`/me/diseases/${patientDiseaseId}/history`).then((r) => r.data),
};

// Reports
export const reportsApi = {
  generate: (body: { patientDiseaseId: string; periodStart: string; periodEnd: string; format: 'PDF' | 'EXCEL' }) =>
    api.post('/reports', body).then((r) => r.data),
  list: () => api.get('/reports').then((r) => r.data),
  // Download URL — frontend Linking.open ile token korumalı endpoint'e gider
};
