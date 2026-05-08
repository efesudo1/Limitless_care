import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error';
import authRoutes from './modules/auth/auth.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import doctorExercisesRoutes from './modules/doctor/exercises.routes';
import caregiverRoutes from './modules/caregiver/caregiver.routes';
import mentalRoutes from './modules/caregiver/mental.routes';
import physicalRoutes from './modules/caregiver/physical.routes';
import chronicRoutes from './modules/caregiver/chronic.routes';
import ownerRoutes from './modules/owner/owner.routes';
import reportsRoutes from './modules/reports/reports.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import { startPredictiveScheduler } from './modules/predictive/predictive.cron';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/catalog', catalogRoutes);
app.use('/doctor', doctorRoutes);
app.use('/doctor', doctorExercisesRoutes);
app.use('/me', caregiverRoutes);
app.use('/me/mental', mentalRoutes);
app.use('/me/physical', physicalRoutes);
app.use('/me/chronic', chronicRoutes);
app.use('/owner', ownerRoutes);
app.use('/reports', reportsRoutes);
app.use('/alerts', alertsRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[backend] listening on http://localhost:${config.port}`);
  startPredictiveScheduler();
});
