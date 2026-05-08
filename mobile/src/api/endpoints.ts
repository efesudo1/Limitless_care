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
  patientMedicalCard: (patientDiseaseId: string) =>
    api.get(`/doctor/patients/${patientDiseaseId}/medical-card`).then((r) => r.data),
  exercises: () => api.get('/doctor/exercises').then((r) => r.data),
  createExercise: (body: { name: string; description: string; durationMin: number; videoUrl?: string }) =>
    api.post('/doctor/exercises', body).then((r) => r.data),
  patientExercisePlans: (patientDiseaseId: string) =>
    api.get(`/doctor/patients/${patientDiseaseId}/exercise-plans`).then((r) => r.data),
  createExercisePlan: (body: { patientDiseaseId: string; exerciseId: string; scheduleTimes: string[] }) =>
    api.post('/doctor/exercise-plans', body).then((r) => r.data),
  setExercisePlanActive: (id: string, active: boolean) =>
    api.patch(`/doctor/exercise-plans/${id}`, { active }).then((r) => r.data),
};

// Caregiver
export const caregiverApi = {
  profile: () => api.get('/me/profile').then((r) => r.data),
  updateProfile: (body: { disabilityCategory?: 'MENTAL' | 'PHYSICAL' | 'SENSORY' | 'CHRONIC' }) =>
    api.patch('/me/profile', body).then((r) => r.data),
  updateMetrics: (heightCm: number, weightKg: number) =>
    api.patch('/me/metrics', { heightCm, weightKg }).then((r) => r.data),
  diseases: () => api.get('/me/diseases').then((r) => r.data),
  today: () => api.get('/me/today').then((r) => r.data),
  logSymptom: (body: { patientDiseaseId: string; symptomId: string; severity: 'MILD' | 'MODERATE' | 'SEVERE'; note?: string }) =>
    api.post('/me/symptom-logs', body).then((r) => r.data),
  checkDose: (id: string, body: { takenAt?: string; note?: string } = {}) =>
    api.post(`/me/dose-events/${id}/check`, body).then((r) => r.data),
  refillStock: (prescriptionId: string, addedCount: number) =>
    api.patch(`/me/prescriptions/${prescriptionId}/refill-stock`, { addedCount }).then((r) => r.data),
  history: (patientDiseaseId: string) =>
    api.get(`/me/diseases/${patientDiseaseId}/history`).then((r) => r.data),
};

// Emergency / Acil Durum
export const emergencyApi = {
  contacts: () => api.get('/me/emergency-contacts').then((r) => r.data),
  createContact: (body: { name: string; phone: string; relation: string; priority?: number }) =>
    api.post('/me/emergency-contacts', body).then((r) => r.data),
  updateContact: (id: string, body: Partial<{ name: string; phone: string; relation: string; priority: number }>) =>
    api.patch(`/me/emergency-contacts/${id}`, body).then((r) => r.data),
  deleteContact: (id: string) => api.delete(`/me/emergency-contacts/${id}`).then((r) => r.data),
  getMedicalCard: () => api.get('/me/medical-card').then((r) => r.data),
  updateMedicalCard: (body: {
    bloodType?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    medicalNotes?: string | null;
    emergencyMessage?: string | null;
  }) => api.patch('/me/medical-card', body).then((r) => r.data),
  recordEvent: (body: {
    latitude?: number | null;
    longitude?: number | null;
    sentToContactIds: string[];
    note?: string;
  }) => api.post('/me/emergency-events', body).then((r) => r.data),
  recentEvents: (days = 30) => api.get('/me/emergency-events', { params: { days } }).then((r) => r.data),
};

// Mental (Faz 4A)
export const mentalApi = {
  moodLogs: (days = 30) => api.get('/me/mental/mood-logs', { params: { days } }).then((r) => r.data),
  createMood: (body: {
    mood: 'HAPPY' | 'CALM' | 'ANXIOUS' | 'SAD' | 'ANGRY';
    intensity: number;
    note?: string;
  }) => api.post('/me/mental/mood-logs', body).then((r) => r.data),
  routines: () => api.get('/me/mental/routines').then((r) => r.data),
  createRoutine: (body: { label: string; scheduleTimes?: string[] }) =>
    api.post('/me/mental/routines', body).then((r) => r.data),
  updateRoutine: (id: string, body: Partial<{ label: string; scheduleTimes: string[]; active: boolean }>) =>
    api.patch(`/me/mental/routines/${id}`, body).then((r) => r.data),
  deleteRoutine: (id: string) => api.delete(`/me/mental/routines/${id}`).then((r) => r.data),
  completeRoutine: (id: string, note?: string) =>
    api.post(`/me/mental/routines/${id}/complete`, { note }).then((r) => r.data),
  behaviorEvents: (days = 30) =>
    api.get('/me/mental/behavior-events', { params: { days } }).then((r) => r.data),
  createBehaviorEvent: (body: {
    type: 'TANTRUM' | 'REPETITIVE' | 'AGGRESSION' | 'WITHDRAWAL' | 'OTHER';
    durationMin?: number;
    trigger?: string;
    note?: string;
  }) => api.post('/me/mental/behavior-events', body).then((r) => r.data),
};

// Physical (Faz 4B)
export const physicalApi = {
  exercisePlans: () => api.get('/me/physical/exercise-plans').then((r) => r.data),
  completeExercise: (planId: string, note?: string) =>
    api.post(`/me/physical/exercise-plans/${planId}/complete`, { note }).then((r) => r.data),
  pressureChecks: (days = 7) =>
    api.get('/me/physical/pressure-checks', { params: { days } }).then((r) => r.data),
  createPressureCheck: (body: {
    position: 'LEFT_SIDE' | 'RIGHT_SIDE' | 'SUPINE' | 'PRONE' | 'SITTING';
    note?: string;
  }) => api.post('/me/physical/pressure-checks', body).then((r) => r.data),
};

// Chronic (Faz 4D)
export const chronicApi = {
  seizures: (days = 30) => api.get('/me/chronic/seizures', { params: { days } }).then((r) => r.data),
  createSeizure: (body: {
    durationSeconds: number;
    type: 'TONIC_CLONIC' | 'ABSENCE' | 'MYOCLONIC' | 'FOCAL' | 'OTHER';
    trigger?: string;
    postIctalNotes?: string;
    severity?: 'MILD' | 'MODERATE' | 'SEVERE';
  }) => api.post('/me/chronic/seizures', body).then((r) => r.data),
  seizureStats: (days = 30) =>
    api.get('/me/chronic/seizures/stats', { params: { days } }).then((r) => r.data),
};

// Predictive Alerts (Faz 7)
export const alertsApi = {
  myAlerts: (unreadOnly = true) =>
    api.get('/alerts/me', { params: { unreadOnly } }).then((r) => r.data),
  doctorAlerts: (unreadOnly = true) =>
    api.get('/alerts/doctor', { params: { unreadOnly } }).then((r) => r.data),
  markCaregiverRead: (id: string) => api.post(`/alerts/me/${id}/read`).then((r) => r.data),
  markDoctorRead: (id: string) => api.post(`/alerts/doctor/${id}/read`).then((r) => r.data),
  runJobs: () => api.post('/alerts/run').then((r) => r.data),
};

// Reports
export const reportsApi = {
  generate: (body: { patientDiseaseId: string; periodStart: string; periodEnd: string; format: 'PDF' | 'EXCEL' }) =>
    api.post('/reports', body).then((r) => r.data),
  list: () => api.get('/reports').then((r) => r.data),
  weekly: (patientDiseaseId: string, weekStart?: string) =>
    api.post('/reports/weekly', { patientDiseaseId, weekStart }).then((r) => r.data),
  // Download URL — frontend Linking.open ile token korumalı endpoint'e gider
};
