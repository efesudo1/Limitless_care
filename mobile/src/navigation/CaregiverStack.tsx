import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { TodayScreen } from '../screens/caregiver/TodayScreen';
import { DiseaseDetailScreen } from '../screens/caregiver/DiseaseDetailScreen';
import { CaregiverProfileScreen } from '../screens/caregiver/CaregiverProfileScreen';
import { EditMetricsScreen } from '../screens/caregiver/EditMetricsScreen';

export type CaregiverStackParamList = {
  Tabs: undefined;
  Today: undefined;
  DiseaseDetail: { patientDiseaseId: string };
  Profile: undefined;
  EditMetrics: undefined;
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
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Tabs" component={CaregiverTabs} options={{ headerShown: false }} />
      <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ title: 'Hastalık Detayı' }} />
      <Stack.Screen name="EditMetrics" component={EditMetricsScreen} options={{ title: 'Ölçüm Güncelle' }} />
    </Stack.Navigator>
  );
}
