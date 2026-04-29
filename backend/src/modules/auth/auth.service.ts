import { AssignmentStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { conflict, unauthorized } from '../../lib/http';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

type DoctorRegisterInput = {
  fullName: string;
  email: string;
  password: string;
  diplomaNumber: string;
  title: string;
  specialty: string;
};

type CaregiverRegisterInput = {
  fullName: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string;
  heightCm: number;
  weightKg: number;
};

export async function registerDoctor(input: DoctorRegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('Bu e-posta zaten kayıtlı');
  const dupDiploma = await prisma.doctorProfile.findUnique({ where: { diplomaNumber: input.diplomaNumber } });
  if (dupDiploma) throw conflict('Bu doktor kimliği zaten kayıtlı');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.DOCTOR,
      doctor: {
        create: {
          fullName: input.fullName,
          diplomaNumber: input.diplomaNumber,
          title: input.title,
          specialty: input.specialty,
        },
      },
    },
    include: { doctor: true },
  });
  return { user };
}

export async function registerCaregiver(input: CaregiverRegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('Bu e-posta zaten kayıtlı');

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: Role.CAREGIVER,
        caregiver: {
          create: {
            fullName: input.fullName,
            gender: input.gender,
            birthDate: new Date(input.birthDate),
            metrics: {
              create: {
                heightCm: input.heightCm,
                weightKg: input.weightKg,
              },
            },
          },
        },
      },
      include: { caregiver: true },
    });

    await tx.patientDisease.updateMany({
      where: { caregiverEmail: email, status: AssignmentStatus.PENDING_USER },
      data: {
        caregiverId: created.id,
        status: AssignmentStatus.ACTIVE,
        activatedAt: new Date(),
      },
    });

    return created;
  });

  return { user };
}

export async function login(emailRaw: string, password: string) {
  const email = normalizeEmail(emailRaw);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctor: true, caregiver: true },
  });
  if (!user) throw unauthorized('E-posta veya şifre hatalı');
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw unauthorized('E-posta veya şifre hatalı');

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      doctor: user.doctor && {
        fullName: user.doctor.fullName,
        title: user.doctor.title,
        specialty: user.doctor.specialty,
        status: user.doctor.status,
      },
      caregiver: user.caregiver && {
        fullName: user.caregiver.fullName,
        gender: user.caregiver.gender,
        birthDate: user.caregiver.birthDate,
      },
    },
  };
}
