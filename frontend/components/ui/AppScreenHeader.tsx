import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/Colors';
import { LAYOUT, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useOpenDrawer } from '../../hooks/useOpenDrawer';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AppScreenHeader({ title, subtitle }: AppScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const openDrawer = useOpenDrawer();

  return (
    <View
      style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
