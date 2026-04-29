import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/public/WelcomeScreen';
import { LoginScreen } from '../screens/public/LoginScreen';
import { RegisterDoctorScreen } from '../screens/public/RegisterDoctorScreen';
import { RegisterCaregiverScreen } from '../screens/public/RegisterCaregiverScreen';

export type PublicStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterDoctor: undefined;
  RegisterCaregiver: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
      <Stack.Screen name="RegisterDoctor" component={RegisterDoctorScreen} options={{ title: 'Doktor Kayıt' }} />
      <Stack.Screen
        name="RegisterCaregiver"
        component={RegisterCaregiverScreen}
        options={{ title: 'Hasta Takip Kayıt' }}
      />
    </Stack.Navigator>
  );
}
