import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../config';

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setError('');
      const response = await axios.get(`${API_URL}/api/products`, { timeout: 60000 });
      setProducts(response.data);
    } catch (err) {
      console.error('Gagal mengambil data produk:', err.message);
      setError('Gagal memuat produk. Tarik ke bawah untuk mencoba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Tombol logout di pojok kanan atas: hapus token lalu kembali ke login
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem(TOKEN_KEY);
            navigation.replace('Login');
          }}
        >
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      // Saat diklik, pindah ke halaman Detail sambil membawa ID produk
      onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
    >
      {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={styles.thumb} />}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>{rupiah(item.price)}</Text>
        <Text style={[styles.stock, item.stock <= 0 && styles.outOfStock]}>
          {item.stock > 0 ? `Stok ${item.stock}` : 'Stok habis'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.muted}>Memuat produk...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id} // ID unik dari MongoDB
        renderItem={renderItem}
        ListEmptyComponent={!error ? <Text style={styles.muted}>Belum ada produk.</Text> : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f0f0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 3 // Memberikan efek bayangan (shadow) di Android
  },
  thumb: { width: 72, height: 72, borderRadius: 6, backgroundColor: '#eee', marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 15, color: 'green', marginTop: 4 },
  stock: { fontSize: 13, color: '#666', marginTop: 2 },
  outOfStock: { color: '#b42318' },
  muted: { color: '#666', textAlign: 'center', marginTop: 12 },
  error: { color: '#b42318', textAlign: 'center', marginBottom: 10 },
  logout: { color: '#dc052d', fontWeight: 'bold', fontSize: 15 }
});
