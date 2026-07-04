import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { customerApi } from '../../lib/api';
import { Colors, Typography, Spacing } from '../../constants/theme';
import AuthTextField from '../../components/AuthTextField';
import BigButton from '../../components/BigButton';

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await customerApi.updateProfile({ name: name.trim(), phone: phone.trim() });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save changes', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.content}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>

        <AuthTextField icon="👤" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        <AuthTextField
          icon="📱"
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <View style={s.emailRow}>
          <Text style={s.emailLabel}>Email</Text>
          <Text style={s.emailValue}>{user?.email}</Text>
        </View>

        <BigButton label="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.md }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  content: { flex: 1, padding: Spacing.lg },

  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.xl,
  },
  avatarText: { ...Typography.display, color: Colors.white },

  emailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md,
  },
  emailLabel: { ...Typography.body, color: Colors.textSecondary },
  emailValue: { ...Typography.body, color: Colors.text },
});
