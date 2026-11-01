import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function ProductDetailScreen({ route }) {
  // Menarik productId yang dikirim saat tombol di klik pada ProductListScreen
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/api/products/${productId}`, { timeout: 60000 })
      .then((response) => { if (active) setProduct(response.data); })
      .catch((error) => console.error('Gagal mengambil detail produk:', error.message))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]);

  // Tampilkan loading saat menunggu data API
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Tampilkan pesan ini jika API gagal membalas dengan data
  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Produk tidak ditemukan.</Text>
      </View>
    );
  }

  // ScrollView digunakan agar halaman bisa di-scroll ke bawah jika teks deskripsi panjang
  return (
    <ScrollView style={styles.container}>
      {product.image ? <Image source={{ uri: product.image }} style={styles.image} /> : null}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{rupiah(product.price)}</Text>
      <Text style={[styles.stock, product.stock <= 0 && styles.outOfStock]}>
        {product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok habis'}
      </Text>
      <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
      <Text style={styles.description}>{product.description || '-'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, resizeMode: 'contain', marginBottom: 20, backgroundColor: '#f5f5f5', borderRadius: 8 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  price: { fontSize: 22, color: 'green', marginBottom: 6 },
  stock: { fontSize: 15, color: '#555', marginBottom: 14 },
  outOfStock: { color: '#b42318' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  description: { fontSize: 16, lineHeight: 24, color: '#444', paddingBottom: 40 }
});
