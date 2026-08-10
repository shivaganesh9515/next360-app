import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { customerApi } from '../../lib/api';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export default function EditProfileScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      await customerApi.updateProfile({ name: name.trim(), email: email.trim() || undefined });
      Alert.alert('Profile Updated', 'Your details have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(t('editProfile.alert.saveError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const initials = name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top Navigation Bar */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.cameraBadge}>
              <Ionicons name="camera" size={14} color="#0A0A0A" />
            </View>
          </View>
          <Text style={s.avatarHint}>Verified Organic Member Account</Text>
        </View>

        {/* Input Form Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>ACCOUNT INFORMATION</Text>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Full Name</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#757575" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#9E9E9E"
              />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Email Address</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#757575" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9E9E9E"
              />
            </View>
          </View>

          {/* Locked Mobile Number Field (Zomato-style verified badge) */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mobile Number</Text>
            <View style={[s.inputWrap, s.disabledInput]}>
              <Ionicons name="call-outline" size={18} color="#9E9E9E" style={s.inputIcon} />
              <Text style={s.disabledValue}>+91 {user?.phone || 'Not linked'}</Text>
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={s.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[s.saveBtn, loading && s.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{loading ? 'Saving...' : 'Save Profile Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.text,
  },

  content: {
    padding: Spacing.lg,
  },

  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#22FF88',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: '#22FF88',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#757575',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  disabledValue: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#616161',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  verifiedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#2E7D32',
  },

  saveBtn: {
    backgroundColor: '#0A0A0A',
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22FF88',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#22FF88',
  },
});
