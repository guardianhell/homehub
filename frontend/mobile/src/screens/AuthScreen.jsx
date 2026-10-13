import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { STRINGS } from '../locales/strings';
import api from '../services/api';

export default function AuthScreen({ onLoginSuccess, lang = 'id' }) {
  const strings = STRINGS[lang] || STRINGS.id;

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Perhatian', 'Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const res = await api.post('/auth/register', {
          name: name.trim() || 'Keluarga Baru',
          email: email.trim().toLowerCase(),
          password,
          household_name: householdName.trim() || 'Rumah Utama Keluarga',
        });
        const data = res.data?.data || res.data;
        onLoginSuccess(data.user, data.household, data.households || [data.household]);
      } else {
        const res = await api.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password,
        });
        const data = res.data?.data || res.data;
        onLoginSuccess(
          data.user,
          data.activeHousehold || data.households?.[0],
          data.households
        );
      }
    } catch (err) {
      console.warn('Backend auth failed:', err);
      const isInvalidCreds =
        err.response?.data?.errorCode === 'ERR_INVALID_CREDENTIALS' ||
        err.response?.status === 401 ||
        err.response?.data?.message?.toLowerCase().includes('email atau password salah') ||
        err.message?.toLowerCase().includes('email atau password salah');

      if (isInvalidCreds) {
        Alert.alert(
          lang === 'id' ? 'Gagal Masuk' : 'Login Failed',
          lang === 'id'
            ? 'Email atau kata sandi tidak sesuai.'
            : 'Invalid email or password.'
        );
        return;
      }

      // Fallback Demo Login if user explicitly uses demo credentials while offline
      if (email.includes('tebet') || email.includes('budi') || password === 'demo123') {
        onLoginSuccess(
          { id: 'u_demo', name: 'Budi Santoso', email },
          { id: 'tebet_free', name: 'Rumah Utama Keluarga', tier: 'FREE', role: 'OWNER' },
          [
            { id: 'tebet_free', name: 'Rumah Utama Keluarga', tier: 'FREE', role: 'OWNER' },
            { id: 'villa_pro', name: 'Villa Puncak Indah', tier: 'PRO', role: 'OWNER' },
          ]
        );
      } else {
        Alert.alert(
          lang === 'id' ? 'Koneksi Gagal' : 'Connection Failed',
          lang === 'id'
            ? 'Tidak dapat terhubung ke backend. Silakan pastikan server backend berjalan atau gunakan tombol Masuk sebagai Demo.'
            : 'Cannot connect to backend. Please ensure server is running or use Quick Demo.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    onLoginSuccess(
      { id: 'u_demo', name: 'Budi Santoso', email: 'budi.santoso@example.com' },
      { id: 'tebet_free', name: 'Rumah Utama Keluarga', tier: 'FREE', role: 'OWNER' },
      [
        { id: 'tebet_free', name: 'Rumah Utama Keluarga', tier: 'FREE', role: 'OWNER' },
        { id: 'villa_pro', name: 'Villa Puncak Indah', tier: 'PRO', role: 'OWNER' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoBadge}>
          <Text style={{ fontSize: 32 }}>🏠</Text>
        </View>
        <Text style={styles.title}>
          {isRegister
            ? (lang === 'id' ? 'Daftar Akun Baru' : 'Create Account')
            : strings.auth.loginTitle}
        </Text>
        <Text style={styles.subtitle}>{strings.auth.loginSub}</Text>

        {isRegister && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nama Lengkap"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Nama Rumah / Properti"
              placeholderTextColor="#94a3b8"
              value={householdName}
              onChangeText={setHouseholdName}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder={strings.auth.emailLabel}
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder={strings.auth.passwordLabel}
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isRegister
                ? (lang === 'id' ? 'Daftar Sekarang' : 'Sign Up')
                : strings.auth.loginBtn}
            </Text>
          )}
        </TouchableOpacity>

        {/* Quick Demo */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={handleQuickDemo}
          activeOpacity={0.8}
        >
          <Text style={styles.demoBtnText}>⚡ {strings.auth.quickDemoBtn}</Text>
        </TouchableOpacity>

        {/* Toggle Register / Login */}
        <TouchableOpacity
          style={styles.togglePrompt}
          onPress={() => setIsRegister(!isRegister)}
        >
          <Text style={styles.togglePromptText}>
            {isRegister
              ? strings.auth.loginPrompt
              : strings.auth.registerPrompt}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1322',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  demoBtn: {
    width: '100%',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  togglePrompt: {
    marginTop: 18,
  },
  togglePromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
});

