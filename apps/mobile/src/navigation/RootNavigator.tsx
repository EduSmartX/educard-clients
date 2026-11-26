import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useShipmentLink } from '@/lib/app-links';
import { useAuthStore } from '@/lib/auth-store';
import { requestStartupPermissions } from '@/lib/permissions';
import ForcePasswordChangeScreen from '@/screens/auth/ForcePasswordChangeScreen';
import ShipmentLinkScreen from '@/screens/shared/store/ShipmentLinkScreen';

import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { navigationRef } from './navigation-service';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  },
};

export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const role = useAuthStore(state => state.user?.role ?? null);
  const forcePasswordReset = useAuthStore(
    state => state.user?.force_password_reset ?? false,
  );
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    void requestStartupPermissions();
  }, []);

  // A scanned shipment QR opened the app: show that shipment (signed in or not).
  const shipmentLink = useShipmentLink();
  const [navReady, setNavReady] = useState(false);
  const { token: linkToken, clear: clearLink } = shipmentLink;
  useEffect(() => {
    if (linkToken && navReady && navigationRef.isReady()) {
      navigationRef.navigate('ShipmentLink', { token: linkToken });
      clearLink();
    }
  }, [linkToken, navReady, clearLink]);

  if (!isInitialized) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => setNavReady(true)}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : forcePasswordReset ? (
          <Stack.Screen
            name="ForcePasswordChange"
            component={ForcePasswordChangeScreen}
          />
        ) : (
          <Stack.Screen name="Main">
            {() => <MainStackNavigator role={role} />}
          </Stack.Screen>
        )}
        <Stack.Screen
          name="ShipmentLink"
          component={ShipmentLinkScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});
