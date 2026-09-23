import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '@/screens/auth/VerifyOtpScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import ProfileSelectScreen from '@/screens/auth/ProfileSelectScreen';

import type { AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="ProfileSelect" component={ProfileSelectScreen} />
    </AuthStack.Navigator>
  );
}
