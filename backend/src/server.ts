import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error';
import authRoutes from './modules/auth/auth.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import caregiverRoutes from './modules/caregiver/caregiver.routes';
import ownerRoutes from './modules/owner/owner.routes';
import reportsRoutes from './modules/reports/reports.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/catalog', catalogRoutes);
app.use('/doctor', doctorRoutes);
app.use('/me', caregiverRoutes);
app.use('/owner', ownerRoutes);
app.use('/reports', reportsRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[backend] listening on http://localhost:${config.port}`);
});
