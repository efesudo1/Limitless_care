import { AssignmentStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { conflict, notFound } from '../../lib/http';
import { normalizeEmail } from '../auth/auth.service';

export async function assignDiseaseToEmail(params: {
  doctorId: string;
  caregiverEmail: string;
  diseaseId: string;
}) {
  const email = normalizeEmail(params.caregiverEmail);

  const disease = await prisma.disease.findUnique({ where: { id: params.diseaseId } });
  if (!disease) throw notFound('Hastalık bulunamadı');

  const caregiver = await prisma.user.findUnique({ where: { email } });
  const caregiverId =
    caregiver && caregiver.role === Role.CAREGIVER ? caregiver.id : null;

  const existing = await prisma.patientDisease.findFirst({
    where: {
      diseaseId: disease.id,
      doctorId: params.doctorId,
      OR: [
        { caregiverEmail: email },
        ...(caregiverId ? [{ caregiverId }] : []),
      ],
      status: { in: [AssignmentStatus.PENDING_USER, AssignmentStatus.ACTIVE] },
    },
  });
  if (existing) throw conflict('Bu hastalık zaten atanmış');

  const assignment = await prisma.patientDisease.create({
    data: {
      caregiverEmail: email,
      caregiverId,
      diseaseId: disease.id,
      doctorId: params.doctorId,
      status: caregiverId ? AssignmentStatus.ACTIVE : AssignmentStatus.PENDING_USER,
      activatedAt: caregiverId ? new Date() : null,
    },
    include: { disease: true },
  });

  return assignment;
}
