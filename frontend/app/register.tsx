import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const passwordsMatch = (): boolean => {
    return password === confirmPassword;
  };

  const hasErrors = (): boolean => {
    return !name || !validateEmail(email) || !validatePassword(password) || !passwordsMatch();
  };

  const handleRegister = async (): Promise<void> => {
    if (hasErrors()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(screens)/dashboard');
    } else {
      Alert.alert('Registration Failed', result.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>Join your mental wellness journey</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            error={name.length === 0}
          />
          <HelperText type="error" visible={name.length === 0}>
            Name is required
          </HelperText>

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
            error={password.length > 0 && !validatePassword(password)}
          />
          <HelperText 
            type={validatePassword(password) ? "info" : "error"} 
            visible={true}
          >
            Password must be at least 6 characters
          </HelperText>

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon 
                icon={showConfirmPassword ? "eye-off" : "eye"} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
            error={confirmPassword.length > 0 && !passwordsMatch()}
          />
          <HelperText type="error" visible={confirmPassword.length > 0 && !passwordsMatch()}>
            Passwords do not match
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading || hasErrors()}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text>Already have an account? </Text>
            <Link href="/" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
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