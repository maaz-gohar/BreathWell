import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  onIconPress?: () => void;
}

export default function Input({
  label,
  error,
  icon,
  onIconPress,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        {icon && !secureTextEntry && (
          <TouchableOpacity onPress={onIconPress} style={styles.iconButton}>
            <Ionicons name={icon as any} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  iconButton: {
    padding: 8,
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
});