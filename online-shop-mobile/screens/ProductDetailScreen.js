import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import axios from 'axios';

export default function ProductDetailScreen({ route }) {
  // Menarik productId yang dikirim saat tombol di klik pada ProductListScreen
  const { productId } = route.params; 
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetail();
  }, []);

  const fetchProductDetail = async () => {
    try {
      const response = await axios.get(`https://online-shop-project-gfe0.onrender.com/api/products/${productId}`);
      
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Gagal mengambil detail produk:', error);
      setLoading(false);
    }
  };

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
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>Rp {product.price}</Text>
      <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
      <Text style={styles.description}>{product.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, resizeMode: 'contain', marginBottom: 20 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  price: { fontSize: 22, color: 'green', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  description: { fontSize: 16, lineHeight: 24, color: '#444' }
});