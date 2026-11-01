import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../config';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Data belum lengkap', 'Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/users/login`,
        { email: email.trim(), password },
        { timeout: 60000 } // server gratis Render bisa butuh ±1 menit untuk aktif
      );

      const token = response.data.token;
      if (!token) {
        Alert.alert('Gagal', 'Token tidak ditemukan');
        return;
      }

      // Simpan token JWT ke penyimpanan perangkat
      await AsyncStorage.setItem(TOKEN_KEY, token);

      // replace: tombol back tidak kembali ke halaman login
      navigation.replace('ProductList');
    } catch (error) {
      const message = error.response?.data?.error
        || 'Gagal login. Cek koneksi internet lalu coba lagi.';
      Alert.alert('Login gagal', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FC Bayern Store</Text>
      <Text style={styles.title}>Silakan Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <Text style={styles.hint}>Belum punya akun? Daftar lewat versi web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  brand: { fontSize: 16, color: '#dc052d', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 14, borderRadius: 8, fontSize: 16 },
  button: { backgroundColor: '#222', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#666', marginTop: 16 }
});
