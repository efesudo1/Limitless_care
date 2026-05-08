-- CreateEnum
CREATE TYPE "DisabilityCategory" AS ENUM ('MENTAL', 'PHYSICAL', 'SENSORY', 'CHRONIC');

-- CreateEnum
CREATE TYPE "EmergencyEventKind" AS ENUM ('PANIC');

-- CreateEnum
CREATE TYPE "FoodRequirement" AS ENUM ('ANY', 'BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL');

-- CreateEnum
CREATE TYPE "MoodKind" AS ENUM ('HAPPY', 'CALM', 'ANXIOUS', 'SAD', 'ANGRY');

-- CreateEnum
CREATE TYPE "BehaviorEventType" AS ENUM ('TANTRUM', 'REPETITIVE', 'AGGRESSION', 'WITHDRAWAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SeizureType" AS ENUM ('TONIC_CLONIC', 'ABSENCE', 'MYOCLONIC', 'FOCAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BodyPosition" AS ENUM ('LEFT_SIDE', 'RIGHT_SIDE', 'SUPINE', 'PRONE', 'SITTING');

-- CreateEnum
CREATE TYPE "PredictiveAlertKind" AS ENUM ('LOW_STOCK', 'COMPLIANCE_DROP', 'SYMPTOM_SPIKE', 'SEIZURE_INCREASE');

-- AlterTable
ALTER TABLE "CaregiverProfile" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "chronicConditions" TEXT,
ADD COLUMN     "disabilityCategory" "DisabilityCategory",
ADD COLUMN     "medicalNotes" TEXT;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "foodRequirement" "FoodRequirement" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "lastStockUpdate" TIMESTAMP(3),
ADD COLUMN     "stockAlertThreshold" INTEGER,
ADD COLUMN     "stockCount" INTEGER;

-- CreateTable
CREATE TABLE "MoodLog" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "mood" "MoodKind" NOT NULL,
    "intensity" INTEGER NOT NULL,
    "note" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineItem" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scheduleTimes" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineCompletion" (
    "id" TEXT NOT NULL,
    "routineItemId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "RoutineCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorEvent" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "type" "BehaviorEventType" NOT NULL,
    "durationMin" INTEGER,
    "trigger" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT,
    "durationMin" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExercisePlan" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "scheduleTimes" TEXT[],
    "assignedByDoctorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExercisePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseCompletion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ExerciseCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressureSoreCheck" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "position" "BodyPosition" NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "PressureSoreCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeizureEvent" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER NOT NULL,
    "type" "SeizureType" NOT NULL,
    "trigger" TEXT,
    "postIctalNotes" TEXT,
    "severity" "Severity",

    CONSTRAINT "SeizureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyEvent" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "EmergencyEventKind" NOT NULL DEFAULT 'PANIC',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sentToContactIds" TEXT[],
    "note" TEXT,

    CONSTRAINT "EmergencyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveAlert" (
    "id" TEXT NOT NULL,
    "patientDiseaseId" TEXT NOT NULL,
    "kind" "PredictiveAlertKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MODERATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT NOT NULL,
    "readByDoctor" BOOLEAN NOT NULL DEFAULT false,
    "readByCaregiver" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PredictiveAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoodLog_caregiverId_loggedAt_idx" ON "MoodLog"("caregiverId", "loggedAt");

-- CreateIndex
CREATE INDEX "RoutineItem_caregiverId_active_idx" ON "RoutineItem"("caregiverId", "active");

-- CreateIndex
CREATE INDEX "RoutineCompletion_routineItemId_completedAt_idx" ON "RoutineCompletion"("routineItemId", "completedAt");

-- CreateIndex
CREATE INDEX "BehaviorEvent_caregiverId_occurredAt_idx" ON "BehaviorEvent"("caregiverId", "occurredAt");

-- CreateIndex
CREATE INDEX "ExercisePlan_caregiverId_active_idx" ON "ExercisePlan"("caregiverId", "active");

-- CreateIndex
CREATE INDEX "ExerciseCompletion_planId_completedAt_idx" ON "ExerciseCompletion"("planId", "completedAt");

-- CreateIndex
CREATE INDEX "PressureSoreCheck_caregiverId_checkedAt_idx" ON "PressureSoreCheck"("caregiverId", "checkedAt");

-- CreateIndex
CREATE INDEX "SeizureEvent_caregiverId_occurredAt_idx" ON "SeizureEvent"("caregiverId", "occurredAt");

-- CreateIndex
CREATE INDEX "EmergencyContact_caregiverId_priority_idx" ON "EmergencyContact"("caregiverId", "priority");

-- CreateIndex
CREATE INDEX "EmergencyEvent_caregiverId_triggeredAt_idx" ON "EmergencyEvent"("caregiverId", "triggeredAt");

-- CreateIndex
CREATE INDEX "PredictiveAlert_patientDiseaseId_createdAt_idx" ON "PredictiveAlert"("patientDiseaseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PredictiveAlert_patientDiseaseId_dedupeKey_key" ON "PredictiveAlert"("patientDiseaseId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "MoodLog" ADD CONSTRAINT "MoodLog_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineCompletion" ADD CONSTRAINT "RoutineCompletion_routineItemId_fkey" FOREIGN KEY ("routineItemId") REFERENCES "RoutineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorEvent" ADD CONSTRAINT "BehaviorEvent_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercisePlan" ADD CONSTRAINT "ExercisePlan_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercisePlan" ADD CONSTRAINT "ExercisePlan_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseCompletion" ADD CONSTRAINT "ExerciseCompletion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ExercisePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressureSoreCheck" ADD CONSTRAINT "PressureSoreCheck_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeizureEvent" ADD CONSTRAINT "SeizureEvent_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyEvent" ADD CONSTRAINT "EmergencyEvent_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "CaregiverProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveAlert" ADD CONSTRAINT "PredictiveAlert_patientDiseaseId_fkey" FOREIGN KEY ("patientDiseaseId") REFERENCES "PatientDisease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
