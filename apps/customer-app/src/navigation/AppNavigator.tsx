import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { Colors, Typography, getStoreAccent } from '../constants/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import StorefrontScreen from '../screens/storefront/StorefrontScreen';
import ProductListScreen from '../screens/storefront/ProductListScreen';
import ProductDetailScreen from '../screens/storefront/ProductDetailScreen';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder for tabs not yet built (Phase 6 will flesh these out)
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
    </View>
  );
}

function FavoritesScreen() {
  return <PlaceholderScreen title="Favorites" />;
}

function OrdersScreen() {
  return <PlaceholderScreen title="Orders" />;
}

function ProductsTabScreen() {
  return <PlaceholderScreen title="All Products" />;
}

function HomeStackNavigator() {
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: Typography.h3,
      }}
    >
      <HomeStack.Screen
        name="Storefront"
        component={StorefrontScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }: any) => ({
          title: route.params?.categoryName || 'Products',
          headerTintColor: accent,
        })}
      />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: '', headerTintColor: accent }}
      />
    </HomeStack.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
    </RootStack.Navigator>
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
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: Typography.h3,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsTabScreen}
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
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
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
  },
});
