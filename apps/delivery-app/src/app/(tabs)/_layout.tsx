import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryStore } from '../../store/deliveryStore';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../../constants/theme';

export default function TabLayout() {
  const { newOrders } = useDeliveryStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTitleAlign: 'left',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? Colors.white : Colors.textTertiary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="new-orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={20}
                color={focused ? Colors.white : Colors.textTertiary}
              />
            </View>
          ),
          tabBarBadge: newOrders.length > 0 ? newOrders.length : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={20}
                color={focused ? Colors.white : Colors.textTertiary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={20}
                color={focused ? Colors.white : Colors.textTertiary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? Colors.white : Colors.textTertiary}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadius.xl,
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    ...Shadow.lg,
  },
  tabBarItem: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  tabBarLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  header: {
    backgroundColor: Colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.danger,
    fontSize: 10,
    fontWeight: '700',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    top: 2,
    right: -6,
  },
});
