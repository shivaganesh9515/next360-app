import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows, getStoreAccent, getStoreAccentLight, getStoreAccentDark } from '../../constants/theme';
import { useStore } from '../../lib/store';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
}

export default function WalletScreen({ navigation }: any) {
  const [balance, setBalance] = useState<number>(350); // Welcome bonus + Referral credit
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);
  const accentLight = getStoreAccentLight(storeType);
  const accentDark = getStoreAccentDark(storeType);

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'ORGANIC': return '#22FF88';
      case 'NATURAL': return '#E5A93B'; // Gold
      case 'ECO_FRIENDLY': return '#00E5FF'; // Cyan
      default: return '#22FF88';
    }
  };
  const highlightColor = getHighlightColor(storeType);
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'TXN-99812-360',
      type: 'CREDIT',
      amount: 100,
      description: 'Organic Referral Invite Bonus',
      date: '22 July 2026, 12:30 PM',
    },
    {
      type: 'DEBIT',
      amount: 150,
      description: 'Payment for Order #NEXT-88219',
      id: 'TXN-88219-360',
      date: '18 July 2026, 04:15 PM',
    },
    {
      id: 'TXN-00120-360',
      type: 'CREDIT',
      amount: 400,
      description: 'Welcome Organic Signup Credit',
      date: '15 July 2026, 09:00 AM',
    },
  ]);

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to add to your wallet.');
      return;
    }
    
    // Simulate Razorpay checkout integration
    Alert.alert(
      'Proceed to Payment',
      `Add ₹${amt} to your Next360 Wallet via Razorpay Secure Checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Securely', 
          onPress: () => {
            const newBal = balance + amt;
            setBalance(newBal);
            const newTxn: Transaction = {
              id: `TXN-${Math.floor(10000 + Math.random() * 90000)}-360`,
              type: 'CREDIT',
              amount: amt,
              description: 'Wallet Top-up via Razorpay',
              date: 'Just Now',
            };
            setTransactions([newTxn, ...transactions]);
            setTopUpAmount('');
            Alert.alert('Success', `₹${amt} successfully added to your wallet!`);
          } 
        }
      ]
    );
  };

  const selectQuickAmount = (amount: number) => {
    setTopUpAmount(amount.toString());
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1C1B17" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Next360 Wallet & Cash</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={[s.balanceCard, Shadows.raised]}>
          <View style={s.balanceHeader}>
            <Ionicons name="wallet" size={20} color={highlightColor} />
            <Text style={s.balanceLabel}>CURRENT WALLET BALANCE</Text>
          </View>
          <Text style={s.balanceValue}>₹{balance.toFixed(2)}</Text>
          <View style={s.safeBadge}>
            <Ionicons name="shield-checkmark" size={14} color={highlightColor} />
            <Text style={[s.safeBadgeText, { color: highlightColor }]}>100% Secured India-COD Wallet</Text>
          </View>
        </View>

        {/* Quick Add Cash */}
        <Text style={s.sectionHeader}>TOP UP WALLET INSTANTLY</Text>
        <View style={s.topUpCard}>
          <View style={s.inputRow}>
            <Text style={s.currencySymbol}>₹</Text>
            <TextInput
              style={s.input}
              placeholder="Enter amount"
              placeholderTextColor="#9A958A"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
          </View>

          {/* Quick Select Buttons */}
          <View style={s.quickSelectRow}>
            <TouchableOpacity 
              style={[
                s.quickSelectBtn, 
                topUpAmount === '200' && { borderColor: accent, backgroundColor: `${accent}0D` }
              ]} 
              onPress={() => selectQuickAmount(200)}
            >
              <Text style={[s.quickSelectText, { color: accent }]}>+₹200</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                s.quickSelectBtn, 
                topUpAmount === '500' && { borderColor: accent, backgroundColor: `${accent}0D` }
              ]} 
              onPress={() => selectQuickAmount(500)}
            >
              <Text style={[s.quickSelectText, { color: accent }]}>+₹500</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                s.quickSelectBtn, 
                topUpAmount === '1000' && { borderColor: accent, backgroundColor: `${accent}0D` }
              ]} 
              onPress={() => selectQuickAmount(1000)}
            >
              <Text style={[s.quickSelectText, { color: accent }]}>+₹1000</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.addBtn, { backgroundColor: highlightColor }]} onPress={handleTopUp} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={18} color="#0A0A0A" />
            <Text style={s.addBtnText}>Add Money to Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Perks */}
        <View style={[s.perksCard, { backgroundColor: `${accent}0A`, borderColor: `${accent}1A` }]}>
          <Text style={[s.perksTitle, { color: accent }]}>Wallet Member Privileges</Text>
          <View style={s.perkRow}>
            <Ionicons name="flash" size={16} color={accent} />
            <Text style={s.perkText}>⚡ **1-Click Checkout**: Skip bank redirects or OTP hassles entirely.</Text>
          </View>
          <View style={s.perkRow}>
            <Ionicons name="refresh" size={16} color={accent} />
            <Text style={s.perkText}>🔄 **Instant Refunds**: Damaged organic produce refunds land in 2 mins.</Text>
          </View>
          <View style={s.perkRow}>
            <Ionicons name="time" size={16} color={accent} />
            <Text style={s.perkText}>⏳ **Zero Expiry**: Your loaded cash has lifetime validity.</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={s.sectionHeader}>RECENT WALLET ACTIVITY</Text>
        <View style={s.transactionCard}>
          {transactions.map((txn, idx) => (
            <View key={txn.id} style={[s.txnItem, idx < transactions.length - 1 && s.txnBorder]}>
              <View style={s.txnLeft}>
                <View style={[s.txnIcon, { backgroundColor: txn.type === 'CREDIT' ? `${accent}14` : 'rgba(211, 47, 47, 0.08)' }]}>
                  <Ionicons 
                    name={txn.type === 'CREDIT' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                    size={16} 
                    color={txn.type === 'CREDIT' ? accent : '#D32F2F'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txnDesc}>{txn.description}</Text>
                  <Text style={s.txnDate}>{txn.date}</Text>
                  <Text style={[s.txnId, { color: accentDark }]}>{txn.id}</Text>
                </View>
              </View>
              <Text style={[s.txnAmount, { color: txn.type === 'CREDIT' ? accent : '#1C1B17' }]}>
                {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 23, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1C1B17' },
  content: { padding: Spacing.lg },

  /* Balance Card */
  balanceCard: {
    backgroundColor: '#1C1B17',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg + 4,
    marginBottom: Spacing.lg,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  balanceLabel: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: '#9A958A', letterSpacing: 1.5 },
  balanceValue: { fontFamily: 'Fraunces_700Bold', fontSize: 32, color: '#FFFFFF', marginVertical: 4 },
  safeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  safeBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#22FF88' },

  /* Top Up Card */
  topUpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE9DF',
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  currencySymbol: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#1C1B17', marginRight: 6 },
  input: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#1C1B17', flex: 1, padding: 0 },
  quickSelectRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: Spacing.lg },
  quickSelectBtn: {
    flex: 1,
    backgroundColor: '#EDF0E8',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(92, 107, 77, 0.1)',
  },
  quickSelectText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#5C6B4D' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22FF88',
    borderRadius: BorderRadius.md,
    height: 48,
  },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#0A0A0A' },

  /* Perks Card */
  perksCard: {
    backgroundColor: 'rgba(92, 107, 77, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(92, 107, 77, 0.12)',
    marginBottom: Spacing.lg,
  },
  perksTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#5C6B4D', marginBottom: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  perkText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#5B574E', flex: 1, lineHeight: 18 },

  sectionHeader: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: '#5B574E',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },

  /* Transactions */
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  txnBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(28, 27, 23, 0.04)' },
  txnLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  txnIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1C1B17' },
  txnDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#9A958A', marginTop: 2 },
  txnId: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: '#C9A66B', marginTop: 2 },
  txnAmount: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, fontWeight: '700' },
});
