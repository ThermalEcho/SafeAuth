import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRight, Lock, Mail, Shield, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient, getCurrentUser } from '@/lib/auth-client';
import { router } from 'expo-router';

export default function CreateAccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign Up Error', error.message);
        return;
      }

      if (data) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          
          {/* Logo / Title */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
              <Shield className="text-primary" size={40} strokeWidth={1.5} />
            </View>

            <Text className="text-3xl font-bold text-foreground">
              Create Account
            </Text>

            <Text className="text-muted-foreground mt-2 text-center">
              Secure your identity in seconds
            </Text>
          </View>

          {/* Form Card */}
          <View className="gap-4 w-full">

            {/* Name */}
            <View className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center">
              <User size={18} className="text-muted-foreground mr-2" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor="#888"
                className="flex-1 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Email */}
            <View className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center">
              <Mail size={18} className="text-muted-foreground mr-2" />
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

            {/* Password */}
            <View className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center">
              <Lock size={18} className="text-muted-foreground mr-2" />
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

            {/* Password hint */}
            <Text className="text-xs text-muted-foreground px-1">
              Use at least 8 characters with a mix of letters and numbers
            </Text>

            {/* Create Button */}
            <Pressable
              className={`bg-primary rounded-xl py-4 flex-row items-center justify-center mt-4 ${
                loading ? 'opacity-50' : 'active:scale-95'
              }`}
              style={styles.button}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text className="text-primary-foreground font-semibold text-lg mr-2">
                {loading ? 'Creating...' : 'Create Account'}
              </Text>
              <ArrowRight className="text-primary-foreground" size={20} />
            </Pressable>

            {/* Secondary link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-muted-foreground">
                Already have an account?{' '}
              </Text>
              <Text 
                className="text-primary font-semibold"
                onPress={() => router.push('/')}
              >
                Sign In
              </Text>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
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