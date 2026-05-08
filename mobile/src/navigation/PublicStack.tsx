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
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerTitle: '',
        headerTintColor: '#118C8A',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true }} />
      <Stack.Screen
        name="RegisterDoctor"
        component={RegisterDoctorScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="RegisterCaregiver"
        component={RegisterCaregiverScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
}
