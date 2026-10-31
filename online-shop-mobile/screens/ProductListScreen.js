import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://online-shop-project-gfe0.onrender.com/api/products');
      
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Gagal mengambil data produk:', error);
      setLoading(false);
    }
  };

  // Desain kartu untuk setiap produk
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      // Saat diklik, pindah ke halaman Detail sambil membawa ID produk
      onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>Rp {item.price}</Text>
    </TouchableOpacity>
  );

  // Tampilkan ikon loading selama data masih ditarik dari API
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id} // ID unik dari MongoDB
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f0f0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 8,
    elevation: 3 // Memberikan efek bayangan (shadow) di Android
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: 'green', marginTop: 5 }
});