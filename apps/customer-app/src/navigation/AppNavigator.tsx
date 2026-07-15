import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Text, View, StyleSheet, TouchableOpacity, Animated, Image,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { useZone } from '../lib/zone';
import { useStore } from '../lib/store';
import { useFlyToCart } from '../lib/flyToCart';
import { useCartSheet } from '../lib/cartSheet';
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
import OrderTrackingScreen from '../screens/profile/OrderTrackingScreen';
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
import ExpandingSearchDock from '../components/ExpandingSearchDock';

const ONBOARDING_KEY = 'next360:hasOnboarded';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Per CLAUDE.md: floating pill nav — icon-only (no labels). Orders lives inside
// Profile ("My Orders") rather than getting its own tab; Cart has no persistent
// icon at all, it only appears as the MiniCartBar above once the cart has items.
// Profile no longer gets a pill either — it opens as a popup (ProfileSheet) from
// a small top-left trigger on Home instead, same "popup, not a page" treatment
// as Cart. The "Profile" tab/stack is still registered below (unchanged) so
// nested navigation targets like navigate('Profile', {screen:'Support'}) keep
// resolving — it's just not rendered as a pill button anymore.
// The expanding search dock (moved down from the Home hero) sits detached beside
// the pill, same slot the Apple Store app reference uses for its search button.
// Fixed neutral accent (not store-tinted) since nav is global chrome, same rule as
// Cart/Checkout/Profile never re-theming.
const TABS = [
  { name: 'Home',        iconFilled: 'home',    iconOutline: 'home-outline' },
  { name: 'AllProducts', iconFilled: 'grid',    iconOutline: 'grid-outline' },
  { name: 'Favorites',   iconFilled: 'heart',   iconOutline: 'heart-outline' },
] as const;

const TAB_PILL_H_PADDING = 6;

// ── Mini cart bar — hidden until the cart has items, then slides up above the
// nav pill showing the item that was just added; tap jumps straight into the
// Cart screen (nested inside the Home stack, reached via a cross-navigator
// deep navigate). Reports its own on-screen position to FlyToCartProvider so
// the fly-to-cart ghost lands exactly here instead of a guessed point, and
// bumps in sync the moment that ghost actually arrives. Swiping it reveals a
// "Remove" action for the item that was just added — a quick undo.
function MiniCartBar() {
  const { cartItems, cartCount, lastAddedProductId, removeCartItem } = useStore();
  const { registerCartTarget, subscribeLand } = useFlyToCart();
  const { open: openCartSheet } = useCartSheet();
  const anim = useRef(new Animated.Value(0)).current;
  const bump = useRef(new Animated.Value(1)).current;
  const iconWrapRef = useRef<View>(null);
  const swipeableRef = useRef<Swipeable>(null);

  // Hide MiniCartBar on screens where it conflicts (Cart, Checkout, etc.)
  const nestedRouteName = useNavigationState((state) => {
    if (!state) return '';
    const homeTab = state.routes.find((r: any) => r.name === 'Home');
    if (!homeTab?.state) return '';
    const stackState = homeTab.state;
    const currentStackRoute = stackState.routes[stackState.index ?? 0];
    return currentStackRoute?.name || '';
  });
  const hideMiniCart = nestedRouteName === 'Cart' || nestedRouteName === 'Checkout' || nestedRouteName === 'OrderConfirmation';

  useEffect(() => {
    Animated.spring(anim, {
      toValue: cartCount > 0 ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 80,
    }).start();
  }, [cartCount > 0]);

  // Bar's own position, reported once visible — cleared on hide so a stale
  // point from a previous session never lingers as a target.
  useEffect(() => {
    if (cartCount === 0) {
      registerCartTarget(null);
      return;
    }
    const raf = requestAnimationFrame(() => {
      iconWrapRef.current?.measureInWindow((x, y, w, h) => {
        registerCartTarget({ x: x + w / 2, y: y + h / 2 });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [cartCount > 0]);

  // Bump pulse timed to the moment a fly-to-cart ghost actually lands, so the
  // two animations read as one connected event instead of coincidental timing.
  useEffect(() => subscribeLand(() => {
    Animated.sequence([
      Animated.spring(bump, { toValue: 1.08, useNativeDriver: true, friction: 6, tension: 300 }),
      Animated.spring(bump, { toValue: 1, useNativeDriver: true, friction: 6, tension: 300 }),
    ]).start();
  }), [subscribeLand]);

  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const marginBottom = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  // Falls back to the last item that actually resolved to a real product —
  // `incrementCart`'s bare optimistic placeholder (pushed before addToCart's
  // network round-trip resolves) has no `product`, so it should never win this
  // fallback and show a blank/generic bar during that brief window.
  const lastItem = cartItems.find((item) => item.productId === lastAddedProductId)
    || [...cartItems].reverse().find((item) => item.product);

  const handleRemove = () => {
    if (!lastItem) return;
    swipeableRef.current?.close();
    removeCartItem(lastItem.id);
  };

  const renderRightActions = () => (
    <TouchableOpacity style={miniCart.removeAction} onPress={handleRemove} activeOpacity={0.85}>
      <Ionicons name="trash-outline" size={18} color={Colors.white} />
      <Text style={miniCart.removeActionText}>Remove</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      pointerEvents={cartCount > 0 && !hideMiniCart ? 'auto' : 'none'}
      style={{ width: '100%', height: hideMiniCart ? 0 : height, marginBottom: hideMiniCart ? 0 : marginBottom, opacity: hideMiniCart ? 0 : anim, overflow: 'hidden', transform: [{ translateY }] }}
    >
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
        <Animated.View style={{ transform: [{ scale: bump }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[miniCart.bar, Shadows.raised]}
            onPress={openCartSheet}
          >
            <View ref={iconWrapRef} collapsable={false} style={miniCart.iconWrap}>
              {lastItem?.product?.images?.[0] ? (
                <Image source={{ uri: lastItem.product.images[0] }} style={miniCart.iconImage} />
              ) : (
                <Ionicons name="bag-handle" size={16} color={Colors.white} />
              )}
              {cartCount > 1 && (
                <View style={miniCart.countBadge}>
                  <Text style={miniCart.countBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={miniCart.text} numberOfLines={1}>
              {lastItem?.product?.name ? `${lastItem.product.name} added` : `${cartCount} items added`}
            </Text>
            <View style={miniCart.viewCartRow}>
              <Text style={miniCart.viewCartText}>View Cart</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
}

// Each tab owns its own bounce: icon springs up in scale and crossfades from
// muted gray to the active near-black + accent-organic tone on selection.
function TabButton({
  tab, focused, onPress,
}: {
  tab: (typeof TABS)[number];
  focused: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 6, tension: 260 }),
    ]).start();
  }, [focused]);

  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1.05] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={pill.tab}>
      <Animated.View style={[pill.iconWrap, { transform: [{ scale }] }]}>
        <Ionicons
          name={focused ? tab.iconFilled : tab.iconOutline}
          size={20}
          color={focused ? Colors.organic : Colors.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Floating pill tab bar ─────────────────────────────────────────────────────
// Active tab is marked by one shared frosted-glass pill that slides/springs
// between tab slots (BlurView, not a per-tab background) while that tab's own
// icon bounces and crossfades color — since a WebGL glass shader (the reference
// asked for) can't run in Expo React Native, this is the native-RN equivalent:
// real optical blur via expo-blur + spring physics via core Animated.
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  // Profile is still a registered Tab.Screen (for nested `navigate('Profile',
  // {screen: ...})` targets from ProfileSheet) but no longer has a pill button
  // — its route index (3) falls outside TABS' own index range (0-2), so it
  // must be clamped here or the indicator's interpolation would extrapolate
  // past the last tab's slot while a Profile-stack screen is active.
  const isOnHiddenTab = state.index >= TABS.length;
  const clampedIndex = Math.min(state.index, TABS.length - 1);
  const indicatorAnim = useRef(new Animated.Value(clampedIndex)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: clampedIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [clampedIndex]);

  const tabWidth = containerWidth > 0 ? (containerWidth - TAB_PILL_H_PADDING * 2) / TABS.length : 0;
  const indicatorX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
  });

  return (
    <View style={[pill.outer, { bottom: insets.bottom + 16 }]}>
      <MiniCartBar />
      <View style={pill.row}>
        <View
          style={[pill.container, Shadows.raised]}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {tabWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                pill.indicator,
                { width: tabWidth, opacity: isOnHiddenTab ? 0 : 1, transform: [{ translateX: indicatorX }] },
              ]}
            >
              <BlurView intensity={40} tint="light" style={pill.indicatorBlur} />
            </Animated.View>
          )}

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

            return <TabButton key={tab.name} tab={tab} focused={focused} onPress={onPress} />;
          })}
        </View>

        <ExpandingSearchDock
          dockBg={Colors.text}
          navigation={navigation}
          onSearch={(q) => navigation.navigate('Home', { screen: 'Search', params: { initialQuery: q } })}
        />
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
      <HomeStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: 'Order Placed' }} />
      <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
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
      <ProfileStack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
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
      screenOptions={{ headerShown: false, animation: 'shift' }}
    >
      <Tab.Screen name="Home"        component={HomeStackNavigator} />
      <Tab.Screen name="AllProducts" component={ProductListScreen} />
      <Tab.Screen name="Favorites"   component={WishlistScreen} />
      <Tab.Screen name="Profile"     component={ProfileStackNavigator} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: TAB_PILL_H_PADDING,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  // Shared active-tab marker — a real frosted-glass blur (expo-blur), springs
  // between tab slots instead of each tab owning its own static background.
  indicator: {
    position: 'absolute',
    top: 8, bottom: 8, left: TAB_PILL_H_PADDING,
    borderRadius: 24,
    overflow: 'hidden',
  },
  indicatorBlur: {
    flex: 1,
    backgroundColor: 'rgba(92,107,77,0.16)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
});

const miniCart = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    width: '100%',
    backgroundColor: Colors.text,
    borderRadius: 26,
    paddingLeft: 8,
    paddingRight: 16,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: Colors.white,
  },
  text: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.white,
  },
  viewCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewCartText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.white,
  },
  // Revealed by swiping the bar right-to-left — removes the item that was
  // just added, a quick undo for a mis-tap.
  removeAction: {
    width: 84,
    height: 52,
    borderRadius: 26,
    marginLeft: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  removeActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.white,
  },
});

