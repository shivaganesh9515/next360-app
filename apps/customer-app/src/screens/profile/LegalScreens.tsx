import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

export function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.paragraph}>
          At <Text style={styles.bold}>Next360</Text>, your privacy is our top priority. This Privacy Policy explains how we collect, use, and protect your information when you use our organic marketplace mobile app.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Personal Details:</Text> Name, phone number, email address, and delivery addresses provided during registration or checkout.{'\n'}
          • <Text style={styles.bold}>Location Data:</Text> GPS location accessed to determine nearby organic vendor stores and calculate exact delivery routes.{'\n'}
          • <Text style={styles.bold}>Order History:</Text> Past purchases, wallet balances, and customer support ticket details.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Information</Text>
        <Text style={styles.paragraph}>
          We use your data solely to process orders, assign hyperlocal delivery partners, send order status updates, and provide customer support.
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
    </SafeAreaView>
  );
}

export function TermsOfServiceScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: July 2026</Text>

        <Text style={styles.paragraph}>
          Welcome to <Text style={styles.bold}>Next360</Text>. By using our mobile application and services, you agree to comply with and be bound by the following Terms of Service.
        </Text>

        <Text style={styles.sectionTitle}>1. Organic Marketplace Platform</Text>
        <Text style={styles.paragraph}>
          Next360 provides a multi-vendor marketplace connecting consumers with verified organic, natural, and eco-friendly sellers. All products are subject to stock availability and vendor verification standards.
        </Text>

        <Text style={styles.sectionTitle}>2. Ordering & Payments</Text>
        <Text style={styles.paragraph}>
          Orders can be placed via Cash on Delivery (COD) up to ₹2,000 per order. Prices and delivery fees are displayed at checkout before confirmation.
        </Text>

        <Text style={styles.sectionTitle}>3. Delivery & Cancellations</Text>
        <Text style={styles.paragraph}>
          Deliveries are carried out by assigned delivery partners. Order cancellations are permitted before vendor acceptance. Returns or refund requests can be submitted under order details.
        </Text>

        <Text style={styles.sectionTitle}>4. User Conduct</Text>
        <Text style={styles.paragraph}>
          Users must provide accurate delivery information and treat delivery partners and customer service staff with respect.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text },
  content: { padding: Spacing.lg },
  lastUpdated: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  paragraph: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', lineHeight: 22, marginBottom: Spacing.sm },
  bold: { fontFamily: 'Inter_600SemiBold', color: Colors.text },
});
