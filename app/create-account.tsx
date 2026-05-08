import { ThemeToggle } from '@/components/ThemeToggle';
import { Button, ButtonText } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!password) {
      Alert.alert('Missing Password', 'Please enter a password');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return false;
    }

    return true;
  };

   const handleSignUp = async () => {
     console.log('Form values:', { name, email, password });
     console.log('Name trim check:', `"${name.trim()}"`, `length: ${name.trim().length}`);
     
     if (!validateForm()) {
       return;
     }

     setLoading(true);
     setStatusMessage('Creating account...');

      // Safety timeout - ensure loading clears after 185 seconds even if request hangs
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        setStatusMessage('');
        Alert.alert(
          'Timeout',
          'Request took too long. Please check your internet connection and try again.'
        );
      }, 185000);

     try {
       // Attempt to create account
       setStatusMessage('Creating account...');
       
       const requestData = {
         name: name.trim(),
         email: email.trim().toLowerCase(),
         password,
         callbackURL: '/',
       };
       console.log('Sending request data:', requestData);
       
       const { data, error } = await authClient.signUp.email(requestData, {
         onRequest: (ctx) => {
           setStatusMessage('Sending request...');
         },
         onSuccess: (ctx) => {
           clearTimeout(safetyTimeout);
           setLoading(false);
           setStatusMessage('');
           
           // Account created - show verification message
           Alert.alert(
             'Account Created!',
             `A verification email has been sent to ${email}. Please check your inbox and click the link to verify your account.`,
             [
               {
                 text: 'OK',
                 onPress: () => {
                   // Clear form and return to sign in
                   setName('');
                   setEmail('');
                   setPassword('');
                   router.replace('/');
                 },
               },
             ]
           );
         },
         onError: (ctx) => {
           clearTimeout(safetyTimeout);
           setLoading(false);
           setStatusMessage('');
           
           const errorMessage = ctx?.error?.message || 'Failed to create account';
           console.error('Sign up error:', ctx?.error);
           Alert.alert('Sign Up Error', errorMessage);
         },
       });

       // Fallback: Handle direct return values
       if (error) {
         clearTimeout(safetyTimeout);
         setLoading(false);
         setStatusMessage('');
         
         let errorMessage = error.message || 'Failed to create account';
         
         // Handle specific error types
         if (typeof error === 'object' && error.message) {
           if (error.message.includes('email')) {
             errorMessage = 'This email is already in use. Please try another.';
           } else if (error.message.includes('network') || error.message.includes('Network')) {
             errorMessage = 'Network error. Please check your connection and try again.';
           }
         }
         
         Alert.alert('Error', errorMessage);
         return;
       }

       if (data) {
         clearTimeout(safetyTimeout);
         setLoading(false);
         setStatusMessage('');
         
         Alert.alert(
           'Account Created!',
           `A verification email has been sent to ${email}. Please check your inbox and click the link to verify your account.`,
           [
             {
               text: 'OK',
               onPress: () => {
                 // Clear form and return to sign in
                 setName('');
                 setEmail('');
                 setPassword('');
                 router.replace('/');
               },
             },
           ]
         );
       }
     } catch (error: any) {
       clearTimeout(safetyTimeout);
       setLoading(false);
       setStatusMessage('');
       
       console.error('Sign up error:', error);
       
       // Determine error message based on error type
       let message = 'Failed to create account';
       
       if (error.name === 'AbortError') {
         message = 'Request was aborted. This often happens when switching screens too quickly. Please try again and stay on this screen until the process completes.';
       } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED')) {
         message = 'Cannot reach the server. Make sure the backend is running and accessible at ' + 
                   (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');
       } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
         message = 'Request timeout. Please check your internet connection and try again.';
       } else if (error?.message?.includes('Network')) {
         message = 'Network error. Make sure the backend is running before signing up. Start it with npm run start:server, then retry.';
       } else if (error?.message) {
         message = error.message;
       }
       
       Alert.alert('Error', message);
     }
   };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background-0">
      <View className="flex-row justify-end px-6 py-4">
        <ThemeToggle />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-primary-500/10 items-center justify-center mb-3">
              <Image
                source={require('@/assets/images/Logo.png')}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-3xl font-bold text-typography-900">
              Create Account
            </Text>

            <Text className="text-typography-500 mt-2 text-center">
              Secure your identity in seconds
            </Text>
          </View>

          <View className="gap-4 w-full">

            <View className="bg-background-50 border border-outline-200 rounded-xl px-4 py-3 flex-row items-center">
              <User size={18} className="text-typography-500 mr-2" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor="#888"
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <View className="bg-background-50 border border-outline-200 rounded-xl px-4 py-3 flex-row items-center">
              <Mail size={18} className="text-typography-500 mr-2" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <View className="bg-background-50 border border-outline-200 rounded-xl px-4 py-3 flex-row items-center">
              <Lock size={18} className="text-typography-500 mr-2" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                className="flex-1 text-typography-900"
                editable={!loading}
              />
            </View>

            <Text className="text-xs text-typography-500 px-1">
              Use at least 8 characters with a mix of letters and numbers
            </Text>

            {statusMessage ? (
              <Text className="text-sm text-primary-500 text-center py-2">
                {statusMessage}
              </Text>
            ) : null}

            <Button
              variant="solid"
              size="lg"
              action="primary"
              className="mt-4"
              isDisabled={loading}
              onPress={handleSignUp}
            >
              <ButtonText>
                {loading ? 'Creating...' : 'Create Account'}
              </ButtonText>
            </Button>

            <View className="flex-row justify-center mt-6">
              <Text className="text-typography-500">
                Already have an account?{' '}
              </Text>
              <Text 
                className="text-primary-500 font-semibold"
                onPress={() => router.push('/')}
              >
                Sign In
              </Text>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

}