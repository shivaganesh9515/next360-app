import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Text, View, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { useZone } from '../lib/zone';
import { Colors, Shadows } from '../constants/theme';
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerificationCodeScreen from '../screens/auth/VerificationCodeScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProductListScreen from '../screens/storefront/ProductListScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderConfirmationScreen from '../screens/cart/OrderConfirmationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrderHistoryScreen from '../screens/profile/OrderHistoryScreen';
import OrderDetailScreen from '../screens/profile/OrderDetailScreen';
import AddressListScreen from '../screens/profile/AddressListScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import PromosScreen from '../screens/promos/PromosScreen';
import SelectLocationScreen from '../screens/location/SelectLocationScreen';
import AiAssistantScreen from '../screens/ai/AiAssistantScreen';
import AiProductScannerScreen from '../screens/ai/AiProductScannerScreen';
import AiRecommendationsScreen from '../screens/ai/AiRecommendationsScreen';
import AiHealthInsightsScreen from '../screens/ai/AiHealthInsightsScreen';
import AiChatHistoryScreen from '../screens/ai/AiChatHistoryScreen';

const ONBOARDING_KEY = 'next360:hasOnboarded';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Per CLAUDE.md: floating pill nav is exactly these 4 items — Cart and Profile are
// reached via icons in the Home top bar instead of living in the persistent nav.
// Fixed neutral accent (not store-tinted) since nav is global chrome, same rule as
// Cart/Checkout/Profile never re-theming.
const TABS = [
  { name: 'Home',        label: 'Home',         iconFilled: 'home',           iconOutline: 'home-outline' },
  { name: 'AllProducts', label: 'All Products', iconFilled: 'grid',           iconOutline: 'grid-outline' },
  { name: 'Favorites',   label: 'Favorites',    iconFilled: 'heart',          iconOutline: 'heart-outline' },
  { name: 'Orders',      label: 'Orders',       iconFilled: 'receipt',        iconOutline: 'receipt-outline' },
] as const;

// ── Floating pill tab bar ─────────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[pill.outer, { bottom: insets.bottom + 16 }]}>
      <View style={[pill.container, Shadows.raised]}>
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
                <Ionicons
                  name={focused ? tab.iconFilled : tab.iconOutline}
                  size={19}
                  color={focused ? Colors.white : Colors.textSecondary}
                />
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

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: Colors.organic,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="Storefront"    component={HomeScreen}           options={{ headerShown: false }} />
      <HomeStack.Screen name="Search"        component={SearchScreen}         options={{ headerShown: false }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <HomeStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }: any) => ({ title: route.params?.categoryName || 'Products' })}
      />
      <HomeStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <HomeStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: 'Order Placed' }} />
      <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AiAssistant" component={AiAssistantScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AiScanner" component={AiProductScannerScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AiRecommendations" component={AiRecommendationsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AiHealthInsights" component={AiHealthInsightsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AiChatHistory" component={AiChatHistoryScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
      <RootStack.Screen name="VerificationCode" component={VerificationCodeScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </RootStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: Colors.organic,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <ProfileStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="AddressList" component={AddressListScreen} options={{ title: 'My Addresses' }} />
      <ProfileStack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add Address' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Promos" component={PromosScreen} options={{ headerShown: false }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"        component={HomeStackNavigator} />
      <Tab.Screen name="AllProducts" component={ProductListScreen} />
      <Tab.Screen name="Favorites"   component={WishlistScreen} />
      <Tab.Screen name="Orders"      component={OrdersStackNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { city } = useZone();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setNeedsOnboarding(value !== 'true'))
      .finally(() => setCheckingOnboarding(false));
  }, []);

  if (isLoading || checkingOnboarding) {
    return <SplashScreen />;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        onDone={() => {
          AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          setNeedsOnboarding(false);
        }}
      />
    );
  }

  if (isAuthenticated && !city) {
    return <SelectLocationScreen navigation={{ goBack: () => {} }} mandatory />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="ProfileFlow" component={ProfileStackNavigator} />
          <RootStack.Screen name="SelectLocation" component={SelectLocationScreen} />
        </>
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
    paddingVertical: 10,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  iconWrapActive: {
    backgroundColor: Colors.organic,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#9E9E9E',
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.organic,
  },
});

