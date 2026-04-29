import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PendingApprovalScreen } from '../screens/public/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

export function PendingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pending" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
}
