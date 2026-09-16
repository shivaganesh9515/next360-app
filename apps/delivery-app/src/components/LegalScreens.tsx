import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { router } from 'expo-router';

export function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.paragraph}>
          At <Text style={styles.bold}>Next360</Text>, your privacy is our top priority. This Privacy Policy explains how we collect, use, and protect your information when you use our delivery partner mobile app.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Personal Details:</Text> Name, phone number, and email address provided during registration.{'\n'}
          • <Text style={styles.bold}>Location Data:</Text> GPS location accessed to track delivery routes and provide real-time order status to customers.{'\n'}
          • <Text style={styles.bold}>Vehicle Information:</Text> Vehicle type, registration number, and driving license for KYC verification.{'\n'}
          • <Text style={styles.bold}>Earnings & Payout Data:</Text> Delivery history, earnings records, and linked bank account details for weekly payouts.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Information</Text>
        <Text style={styles.paragraph}>
          We use your data solely to assign delivery orders, calculate earnings, process weekly payouts, verify your identity for safety, and provide customer support.
        </Text>

        <Text style={styles.sectionTitle}>3. Account & Data Deletion</Text>
        <Text style={styles.paragraph}>
          You have the right to request deletion of your account and personal data at any time directly in the app under <Text style={styles.bold}>Profile &gt; Delete Account &amp; Data</Text> or by contacting support.
        </Text>

        <Text style={styles.sectionTitle}>4. Contact Support</Text>
        <Text style={styles.paragraph}>
          If you have questions regarding your data or privacy rights, please reach out to us at <Text style={styles.bold}>support@next360.com</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}

export function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.paragraph}>
          Welcome to <Text style={styles.bold}>Next360 Delivery</Text>. By using our mobile application and services, you agree to comply with and be bound by the following Terms of Service.
        </Text>

        <Text style={styles.sectionTitle}>1. Delivery Partner Agreement</Text>
        <Text style={styles.paragraph}>
          Next360 Delivery connects verified delivery partners with customers ordering organic, natural, and eco-friendly products. All deliveries must be handled with care to maintain product quality and freshness.
        </Text>

        <Text style={styles.sectionTitle}>2. Earnings & Payouts</Text>
        <Text style={styles.paragraph}>
          Earnings are calculated per completed delivery and paid out weekly to your linked bank account. Minimum payout threshold applies. Disputes regarding earnings must be raised within 7 days.
        </Text>

        <Text style={styles.sectionTitle}>3. Vehicle & KYC Requirements</Text>
        <Text style={styles.paragraph}>
          You must provide accurate vehicle information and valid driving license documents for KYC verification. Falsifying documents will result in immediate account termination.
        </Text>

        <Text style={styles.sectionTitle}>4. Conduct Standards</Text>
        <Text style={styles.paragraph}>
          Delivery partners must maintain professional conduct, handle orders with care, and communicate respectfully with customers. Violations may result in account suspension or termination.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 4 },
  headerTitle: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 18, 
    color: Colors.textPrimary 
  },
  content: { 
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  lastUpdated: { 
    fontFamily: 'Inter_500Medium', 
    fontSize: 12, 
    color: Colors.textTertiary, 
    marginBottom: Spacing.md 
  },
  sectionTitle: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 16, 
    color: Colors.textPrimary, 
    marginTop: Spacing.lg, 
    marginBottom: Spacing.xs 
  },
  paragraph: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 14, 
    color: Colors.textSecondary, 
    lineHeight: 22, 
    marginBottom: Spacing.sm 
  },
  bold: { 
    fontFamily: 'Inter_600SemiBold', 
    color: Colors.textPrimary 
  },
});
