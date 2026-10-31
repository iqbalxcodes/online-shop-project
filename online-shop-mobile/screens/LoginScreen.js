import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      
      const response = await axios.post('https://online-shop-project-gfe0.onrender.com/api/users/login', {
        email: email,
        password: password
      });

      const token = response.data.token; 
      
      if (token) {
        // Simpan token JWT ke memori HP
        await AsyncStorage.setItem('userToken', token);
        Alert.alert('Sukses', 'Login Berhasil!');
        
        // Pindah ke halaman daftar produk
        navigation.navigate('ProductList');
      } else {
        Alert.alert('Gagal', 'Token tidak ditemukan');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal login. Cek email/password atau koneksi internet.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Silakan Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true} // Menyembunyikan teks password
      />
      
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});