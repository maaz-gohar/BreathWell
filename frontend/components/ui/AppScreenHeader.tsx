import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/Colors';
import { SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useOpenDrawer } from '../../hooks/useOpenDrawer';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AppScreenHeader({ title, subtitle }: AppScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const openDrawer = useOpenDrawer();

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight]}
      style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={28} color="#fff" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
    color: '#fff',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
});
