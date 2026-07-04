import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Typography } from '../constants/theme';

interface AuthTextFieldProps extends TextInputProps {
  icon: string;
  isPassword?: boolean;
  error?: string;
}

export default function AuthTextField({ icon, isPassword, error, style, ...rest }: AuthTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!isPassword);

  return (
    <View style={s.wrapper}>
      <View style={[s.field, focused && s.fieldFocused, !!error && s.fieldError]}>
        <Text style={s.icon}>{icon}</Text>
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={Colors.textSecondary}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure((v) => !v)} hitSlop={10}>
            <Text style={s.icon}>{secure ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    gap: 10,
  },
  fieldFocused: {
    borderColor: Colors.organic,
  },
  fieldError: {
    borderColor: Colors.error,
  },
  icon: { fontSize: 16 },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 20,
  },
});
