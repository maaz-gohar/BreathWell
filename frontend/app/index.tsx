import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, Title, HelperText, ActivityIndicator } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const { login, biometricEnabled, biometricLogin, loading: authLoading, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(screens)/dashboard');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (biometricEnabled && !authLoading && !user) {
      handleBiometricLogin();
    }
  }, [biometricEnabled, authLoading, user]);

  const handleBiometricLogin = async (): Promise<void> => {
    const result = await biometricLogin();
    if (result.success) {
      router.replace('/(screens)/dashboard');
    }
    console.log('login result ',result)
  };

console.log('Auth loading:', authLoading, 'User:', user);

const handleLogin = async (): Promise<void> => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setLoading(true);
  const result = await login(email, password);
  setLoading(false);

  console.log('🔑 Final login result:', result);
  console.log('👤 Current user state:', user); // Check current user state

  if (result.success) {
    console.log('✅ Login successful, redirecting to dashboard...');
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      router.replace('/(screens)/dashboard');
    }, 100);
  } else {
    console.log('❌ Login failed with message:', result.message);
    Alert.alert('Login Failed', result.message || 'An error occurred');
  }
};

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasErrors = (): boolean => {
    return !validateEmail(email) || password.length < 6;
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Mindful Companion</Title>
          <Text style={styles.subtitle}>Your mental wellness journey starts here</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            error={email.length > 0 && !validateEmail(email)}
          />
          <HelperText type="error" visible={email.length > 0 && !validateEmail(email)}>
            Please enter a valid email address
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="info" visible={true}>
            Password must be at least 6 characters
          </HelperText>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || hasErrors()}
            style={styles.button}
          >
            Login
          </Button>

          {biometricEnabled && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.biometricButton}
              icon="fingerprint"
            >
              Login with Biometrics
            </Button>
          )}

          <View style={styles.footer}>
            <Text>Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  biometricButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});