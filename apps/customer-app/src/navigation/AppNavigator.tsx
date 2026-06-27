import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Text, View, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { Colors, Typography } from '../constants/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductListScreen from '../screens/storefront/ProductListScreen';
import ProductDetailScreen from '../screens/storefront/ProductDetailScreen';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GREEN      = '#2A7A4B';
const GREEN_DARK = '#1A5C35';
const GREEN_PILL = '#E8F5EE';

// ── Inline icons (no external dep) ───────────────────────────────────────────
// Using well-supported Unicode symbols that render cleanly on iOS & Android
const ICONS = {
  home:    { filled: '⌂',  outline: '⌂'  },   // we style active/inactive by color+weight
  orders:  { filled: '⊠',  outline: '⊡'  },
  heart:   { filled: '♥',  outline: '♡'  },
  person:  { filled: '●',  outline: '○'  },
} as const;

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'Home',     label: 'Home',    iconFilled: '🏠', iconOutline: '🏠' },
  { name: 'Cart',     label: 'Cart',    iconFilled: '🛒', iconOutline: '🛒' },
  { name: 'Wishlist', label: 'Wishlist',iconFilled: '❤', iconOutline: '🤍' },
  { name: 'Profile',  label: 'Profile', iconFilled: '👤', iconOutline: '👤' },
] as const;

// ── Floating pill tab bar ─────────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const { cartCount } = useStore();

  return (
    <View style={[pill.outer, { bottom: insets.bottom + 16 }]}>
      <View style={pill.container}>
        {TABS.map((tab, index) => {
          const focused = state.index === index;
          const route   = state.routes[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.7}
              style={pill.tab}
            >
              <View style={[pill.iconWrap, focused && pill.iconWrapActive]}>
                <Text style={[pill.iconText, focused && pill.iconTextActive]}>
                  {focused ? tab.iconFilled : tab.iconOutline}
                </Text>
                {tab.name === 'Cart' && cartCount > 0 && (
                  <View style={pill.badge}>
                    <Text style={pill.badgeTxt}>
                      {cartCount > 9 ? '9+' : String(cartCount)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[pill.label, focused && pill.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={s.placeholder}>
      <Text style={s.placeholderTitle}>{title}</Text>
    </View>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: GREEN_DARK,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="Storefront"    component={HomeScreen}           options={{ headerShown: false }} />
      <HomeStack.Screen name="Search"        component={() => <PlaceholderScreen title="Search" />}        options={{ title: 'Search' }} />
      <HomeStack.Screen name="Notifications" component={() => <PlaceholderScreen title="Notifications" />} options={{ title: 'Notifications' }} />
      <HomeStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }: any) => ({ title: route.params?.categoryName || 'Products' })}
      />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '' }} />
    </HomeStack.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <RootStack.Screen name="Login"  component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
    </RootStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeStackNavigator} />
      <Tab.Screen name="Cart"     component={() => <PlaceholderScreen title="Cart" />} />
      <Tab.Screen name="Wishlist" component={() => <PlaceholderScreen title="Wishlist" />} />
      <Tab.Screen name="Profile"  component={() => <PlaceholderScreen title="Profile" />} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={s.placeholder}>
        <ActivityIndicator size="large" color={GREEN} />
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

// ── Styles ────────────────────────────────────────────────────────────────────
const pill = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 48,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  iconWrapActive: {
    backgroundColor: GREEN_PILL,
  },
  iconText: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconTextActive: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: {
    fontSize: 9,
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 12,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#9E9E9E',
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: GREEN_DARK,
  },
});

const s = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  placeholderTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
});
