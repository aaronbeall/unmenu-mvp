import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useGoogleAuth } from '@/lib/auth/google';
import { signInWithApple, isAppleAuthAvailable } from '@/lib/auth/apple';
import { signInWithEmail, signUpWithEmail, signInWithMagicLink } from '@/lib/auth/email';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useState(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        Alert.alert('Success', 'Account created! Please check your email to verify.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setLoading(true);
      await signInWithMagicLink(email);
      Alert.alert('Success', 'Check your email for the magic link!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.logo}>🍽️</Text>
            <Text style={styles.title}>UnMenu</Text>
            <Text style={styles.subtitle}>
              Scan any menu and get instant translations, descriptions, and allergen information
            </Text>

            <View style={styles.formContainer}>
              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, !isSignUp && styles.activeTab]}
                  onPress={() => setIsSignUp(false)}
                  disabled={loading}
                >
                  <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isSignUp && styles.activeTab]}
                  onPress={() => setIsSignUp(true)}
                  disabled={loading}
                >
                  <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.magicLinkButton]}
                onPress={handleMagicLink}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Send Magic Link</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.divider}>OR</Text>

              <TouchableOpacity
                style={[styles.button, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <AntDesign name="google" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Continue with Google</Text>
                </View>
              </TouchableOpacity>

              {appleAvailable && Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.button, styles.appleButton]}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                >
                  <View style={styles.buttonContent}>
                    <AntDesign name="apple1" size={20} color="#fff" />
                    <Text style={[styles.buttonText, styles.appleButtonText]}>
                      Continue with Apple
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#4285F4',
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  divider: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 16,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
    paddingHorizontal: 24,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
  },
  magicLinkButton: {
    backgroundColor: '#9333EA',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#fff',
  },
  terms: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
