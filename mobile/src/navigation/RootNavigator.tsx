import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { PublicStack } from './PublicStack';
import { DoctorStack } from './DoctorStack';
import { CaregiverStack } from './CaregiverStack';
import { PendingStack } from './PendingStack';

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <PublicStack />
      ) : user.role === 'DOCTOR' ? (
        user.doctor?.status === 'APPROVED' ? (
          <DoctorStack />
        ) : (
          <PendingStack />
        )
      ) : user.role === 'CAREGIVER' ? (
        <CaregiverStack />
      ) : (
        <PublicStack />
      )}
    </NavigationContainer>
  );
}
