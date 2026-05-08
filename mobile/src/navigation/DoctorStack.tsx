import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { DoctorHomeScreen } from '../screens/doctor/DoctorHomeScreen';
import { PatientListScreen } from '../screens/doctor/PatientListScreen';
import { PatientDetailScreen } from '../screens/doctor/PatientDetailScreen';
import { AssignDiseaseScreen } from '../screens/doctor/AssignDiseaseScreen';
import { PrescriptionFormScreen } from '../screens/doctor/PrescriptionFormScreen';
import { ReportsScreen } from '../screens/doctor/ReportsScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { CatalogManageScreen } from '../screens/doctor/CatalogManageScreen';
import { AssignExerciseScreen } from '../screens/doctor/AssignExerciseScreen';

export type DoctorStackParamList = {
  Tabs: undefined;
  Home: undefined;
  Patients: undefined;
  PatientDetail: { patientDiseaseId: string };
  AssignDisease: { caregiverEmail?: string };
  PrescriptionForm: { patientDiseaseId: string };
  AssignExercise: { patientDiseaseId: string };
  Reports: undefined;
  Profile: undefined;
  CatalogManage: undefined;
};

const Stack = createNativeStackNavigator<DoctorStackParamList>();
const Tab = createBottomTabNavigator();

function tabIcon(label: string) {
  return ({ focused }: { focused: boolean }) => (
    <View accessibilityElementsHidden importantForAccessibility="no">
      <Text style={{ color: focused ? '#1F4FD9' : '#94A3B8', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 12 } }}>
      <Tab.Screen
        name="Home"
        component={DoctorHomeScreen}
        options={{ tabBarLabel: 'Ana Sayfa', tabBarIcon: tabIcon('🏠'), tabBarAccessibilityLabel: 'Ana sayfa' }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientListScreen}
        options={{ tabBarLabel: 'Hastalar', tabBarIcon: tabIcon('👥'), tabBarAccessibilityLabel: 'Hastalar listesi' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarLabel: 'Raporlar', tabBarIcon: tabIcon('📊'), tabBarAccessibilityLabel: 'Raporlar' }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{ tabBarLabel: 'Profil', tabBarIcon: tabIcon('👤'), tabBarAccessibilityLabel: 'Profil ayarları' }}
      />
    </Tab.Navigator>
  );
}

export function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Tabs" component={DoctorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Hasta Detay' }} />
      <Stack.Screen name="AssignDisease" component={AssignDiseaseScreen} options={{ title: 'Hastalık Ata' }} />
      <Stack.Screen
        name="PrescriptionForm"
        component={PrescriptionFormScreen}
        options={{ title: 'Yeni Reçete' }}
      />
      <Stack.Screen
        name="CatalogManage"
        component={CatalogManageScreen}
        options={{ title: 'Hastalık & Semptom Yönetimi' }}
      />
      <Stack.Screen
        name="AssignExercise"
        component={AssignExerciseScreen}
        options={{ title: 'Egzersiz Ata' }}
      />
    </Stack.Navigator>
  );
}
