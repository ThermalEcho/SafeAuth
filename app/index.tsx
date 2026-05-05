import { ThemeToggle } from '@/components/ThemeToggle';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { authClient } from '@/lib/auth-client';
import { Button, ButtonText } from '@/components/ui/button';

const ROTATING_WORDS = ['secure', 'private', 'encrypted', 'protected', 'safe'];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const [wordIndex, setWordIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) });
      
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        opacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleSignIn = async () => {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      setLoading(true);

      // Safety timeout - ensure loading clears after 30 seconds even if request hangs
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        Alert.alert('Timeout', 'Request took too long. Please check your internet connection and try again.');
      }, 30000);

      try {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        }, {
          onRequest: (ctx) => {
            // Show loading state
            setLoading(true);
          },
          onSuccess: (ctx) => {
            // Sign in successful
            clearTimeout(safetyTimeout);
            setLoading(false);
            Alert.alert('Success', 'Signed in successfully!', [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/(tabs)/home');
                },
              },
            ]);
          },
          onError: (ctx) => {
            clearTimeout(safetyTimeout);
            setLoading(false);
            // Handle sign in error
            Alert.alert('Sign In Error', ctx.error.message || 'Failed to sign in');
          },
        });

        // Handle direct return values as fallback
        if (error) {
          clearTimeout(safetyTimeout);
          setLoading(false);
          Alert.alert('Sign In Error', error.message);
          return;
        }

        if (data) {
          clearTimeout(safetyTimeout);
          setLoading(false);
          Alert.alert('Success', 'Signed in successfully!', [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(tabs)/home');
              },
            },
          ]);
        }
      } catch (error: any) {
        clearTimeout(safetyTimeout);
        setLoading(false);
        console.error('Sign in error:', error);
        Alert.alert('Error', error.message || 'Failed to sign in. Make sure the backend server is running.');
      }
    };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background-0">
      <View className="flex-row justify-end px-6 py-4">
        <ThemeToggle />
      </View>

      <View className="flex-1 px-6 justify-center items-center">
        <View className="mb-8 items-center">
          <View className="w-24 h-24 rounded-full bg-primary-500/10 items-center justify-center mb-4">
            <Image
              source={require('@/assets/images/Logo.png')}
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-bold text-typography-900 tracking-tight">
            SafeAuth
          </Text>
          <Text className="text-typography-500 text-sm mt-1">
            Secure Authentication
          </Text>
        </View>

        <View className="h-12 items-center justify-center mb-8">
          <Animated.Text style={animatedStyle} className="text-2xl text-typography-600 font-medium text-center">
            Your data is {ROTATING_WORDS[wordIndex]}
          </Animated.Text>
        </View>

        <View className="w-full gap-4 mb-8">
          <View className="bg-background-50 border border-outline-200 rounded-xl px-4 py-3 flex-row items-center">
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
        </View>

        <View className="w-full gap-4">
          <Button
            variant="solid"
            size="lg"
            action="primary"
            className="mt-4"
            isDisabled={loading}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ButtonText>Sign In</ButtonText>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            action="primary"
            className="mt-2"
            onPress={() => router.push('/create-account')}
          >
            <ButtonText>Create Account</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );
}