import { DiseaseCategory } from '@prisma/client';

export type SeedSymptom = {
  name: string;
  description: string;
  iconKey?: string;
};

export type SeedDisease = {
  name: string;
  category: DiseaseCategory;
  description: string;
  iconKey?: string;
  symptoms: SeedSymptom[];
};

export type SeedMedication = {
  name: string;
  defaultUnit: string;
  description?: string;
};
