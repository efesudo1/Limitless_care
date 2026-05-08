import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { TodayScreen } from '../screens/caregiver/TodayScreen';
import { DiseaseDetailScreen } from '../screens/caregiver/DiseaseDetailScreen';
import { CaregiverProfileScreen } from '../screens/caregiver/CaregiverProfileScreen';
import { EditMetricsScreen } from '../screens/caregiver/EditMetricsScreen';
import { SelectDisabilityCategoryScreen } from '../screens/caregiver/SelectDisabilityCategoryScreen';
import { EmergencyContactsScreen } from '../screens/caregiver/EmergencyContactsScreen';
import { MedicalCardScreen } from '../screens/caregiver/MedicalCardScreen';
import { AccessibilitySettingsScreen } from '../screens/caregiver/AccessibilitySettingsScreen';
import { MoodLogScreen } from '../screens/caregiver/mental/MoodLogScreen';
import { RoutineScreen } from '../screens/caregiver/mental/RoutineScreen';
import { BehaviorEventsScreen } from '../screens/caregiver/mental/BehaviorEventsScreen';
import { ExercisePlanScreen } from '../screens/caregiver/physical/ExercisePlanScreen';
import { PressureSoreScreen } from '../screens/caregiver/physical/PressureSoreScreen';
import { SeizureLogScreen } from '../screens/caregiver/chronic/SeizureLogScreen';
import { SeizureStatsScreen } from '../screens/caregiver/chronic/SeizureStatsScreen';
import { useAuth } from '../auth/AuthContext';

export type CaregiverStackParamList = {
  Tabs: undefined;
  Today: undefined;
  DiseaseDetail: { patientDiseaseId: string };
  Profile: undefined;
  EditMetrics: undefined;
  SelectDisabilityCategory: undefined;
  EmergencyContacts: undefined;
  MedicalCard: undefined;
  AccessibilitySettings: undefined;
  MoodLog: undefined;
  Routine: undefined;
  BehaviorEvents: undefined;
  ExercisePlan: undefined;
  PressureSore: undefined;
  SeizureLog: undefined;
  SeizureStats: undefined;
};

const Stack = createNativeStackNavigator<CaregiverStackParamList>();
const Tab = createBottomTabNavigator();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <View accessibilityElementsHidden importantForAccessibility="no">
      <Text style={{ color: focused ? '#118C8A' : '#94A3B8', fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}

function CaregiverTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarLabel: 'Bugün', tabBarIcon: tabIcon('📅'), tabBarAccessibilityLabel: 'Bugünün görevleri' }}
      />
      <Tab.Screen
        name="Profile"
        component={CaregiverProfileScreen}
        options={{ tabBarLabel: 'Profil', tabBarIcon: tabIcon('👤'), tabBarAccessibilityLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

export function CaregiverStack() {
  const { user } = useAuth();
  const needsCategory = !user?.caregiver?.disabilityCategory;

  if (needsCategory) {
    return (
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen
          name="SelectDisabilityCategory"
          component={SelectDisabilityCategoryScreen}
          options={{ title: 'Kategori Seçimi', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Tabs" component={CaregiverTabs} options={{ headerShown: false }} />
      <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ title: 'Hastalık Detayı' }} />
      <Stack.Screen name="EditMetrics" component={EditMetricsScreen} options={{ title: 'Ölçüm Güncelle' }} />
      <Stack.Screen
        name="SelectDisabilityCategory"
        component={SelectDisabilityCategoryScreen}
        options={{ title: 'Kategori Değiştir' }}
      />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ title: 'Acil Durum Kontakları' }}
      />
      <Stack.Screen name="MedicalCard" component={MedicalCardScreen} options={{ title: 'Tıbbi Kartım' }} />
      <Stack.Screen
        name="AccessibilitySettings"
        component={AccessibilitySettingsScreen}
        options={{ title: 'Erişilebilirlik' }}
      />
      <Stack.Screen name="MoodLog" component={MoodLogScreen} options={{ title: 'Duygu Durumu' }} />
      <Stack.Screen name="Routine" component={RoutineScreen} options={{ title: 'Günlük Rutin' }} />
      <Stack.Screen
        name="BehaviorEvents"
        component={BehaviorEventsScreen}
        options={{ title: 'Davranış Olayları' }}
      />
      <Stack.Screen name="ExercisePlan" component={ExercisePlanScreen} options={{ title: 'Egzersizlerim' }} />
      <Stack.Screen
        name="PressureSore"
        component={PressureSoreScreen}
        options={{ title: 'Pozisyon Değiştirme' }}
      />
      <Stack.Screen name="SeizureLog" component={SeizureLogScreen} options={{ title: 'Nöbet Kaydı' }} />
      <Stack.Screen
        name="SeizureStats"
        component={SeizureStatsScreen}
        options={{ title: 'Nöbet İstatistikleri' }}
      />
    </Stack.Navigator>
  );
}
