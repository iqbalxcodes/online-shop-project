import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import { TOKEN_KEY } from './config';

const Stack = createNativeStackNavigator();

// Cek apakah token JWT masih valid (belum lewat waktu "exp")
function tokenIsValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // Login otomatis: kalau token di perangkat masih valid, langsung ke daftar produk
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY)
      .then((token) => setInitialRoute(tokenIsValid(token) ? 'ProductList' : 'Login'))
      .catch(() => setInitialRoute('Login'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Daftar Produk' }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detail Produk' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
