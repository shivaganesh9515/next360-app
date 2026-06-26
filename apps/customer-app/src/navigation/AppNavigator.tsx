import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { Colors, Spacing, Typography, getStoreAccent } from '../constants/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder screens until Task 2
function StorefrontScreen() {
  const { storeType } = useStore();
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>Storefront</Text>
      <Text style={styles.placeholderSub}>Store: {storeType}</Text>
    </View>
  );
}

function ProductsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>Products</Text>
    </View>
  );
}

function FavoritesScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>Favorites</Text>
    </View>
  );
}

function OrdersScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>Orders</Text>
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: Colors.text,
          borderRadius: 30,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          ...Typography.caption,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          ...Typography.h3,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={StorefrontScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🛍️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>❤️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📦</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.placeholder, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.brass} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  placeholderTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  placeholderSub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
