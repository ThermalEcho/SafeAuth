import { ThemeToggle } from '@/components/ThemeToggle';
import { router } from 'expo-router';
import { ArrowRight, Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '@/lib/auth-client';

const ROTATING_WORDS = ['secure', 'private', 'encrypted', 'protected', 'safe'];

export default function LandingScreen() {
  const [wordIndex, setWordIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      opacity.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) });
      
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        // Fade in
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

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
        return;
      }

      if (data) {
        Alert.alert('Success', 'Signed in successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to main app
              router.push('/');
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-end px-6 py-4">
        <ThemeToggle />
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 justify-center items-center">
        {/* Logo */}
        <View className="mb-8 items-center">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
            <Shield className="text-primary" size={48} strokeWidth={1.5} />
          </View>
          <Text className="text-4xl font-bold text-foreground tracking-tight">
            SafeAuth
          </Text>
        </View>

        {/* Rotating Words */}
        <View className="h-12 items-center justify-center mb-8">
          <Animated.Text style={animatedStyle} className="text-2xl text-muted-foreground font-medium text-center">
            Your data is {ROTATING_WORDS[wordIndex]}
          </Animated.Text>
        </View>

        {/* Login Form */}
        <View className="w-full gap-4 mb-8">
          <View className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-foreground"
              editable={!loading}
            />
          </View>

          <View className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              className="flex-1 text-foreground"
              editable={!loading}
            />
          </View>
        </View>

        {/* Buttons */}
        <View className="w-full gap-4">
          {/* Sign In Button (Primary) */}
          <Pressable
            className={`bg-primary rounded-xl py-4 px-6 flex-row items-center justify-center shadow-lg shadow-primary/20 ${
              loading ? 'opacity-50' : 'active:scale-95'
            }`}
            style={styles.button}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="text-primary-foreground font-semibold text-lg">
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Sign Up Button (Secondary) */}
          <Pressable
            className="bg-card border border-primary rounded-xl py-4 px-6 flex-row items-center justify-center active:scale-95"
            style={styles.button}
            onPress={() => router.push('/create-account')}
          >
            <Text className="text-primary font-semibold text-lg mr-2">
              Create Account
            </Text>
            <ArrowRight className="text-primary" size={20} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});