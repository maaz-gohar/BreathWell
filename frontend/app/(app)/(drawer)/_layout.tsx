import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../constants/Colors';
import { SPACING, TYPOGRAPHY } from '../../../constants/theme';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user } = useAuth();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoRow}>
          <Ionicons name="leaf" size={28} color={COLORS.primary} />
          <Text style={styles.appName}>BreathWell</Text>
        </View>
        {user?.name && (
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
        )}
      </View>
      <View style={styles.drawerDivider} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerScroll: { flexGrow: 1 },
  drawerHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl + 8,
    paddingBottom: SPACING.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appName: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.text,
  },
  userName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});

export default function DrawerLayout() {
  return (
    <Drawer
      id="Drawer"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textLight,
        drawerStyle: { backgroundColor: COLORS.surface },
        drawerLabelStyle: { fontSize: 16, fontWeight: '500' },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 12, marginVertical: 4 },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="mood"
        options={{
          drawerLabel: 'Mood',
          title: 'Mood',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="happy" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="journal"
        options={{
          drawerLabel: 'Journal',
          title: 'Journal',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="journal" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="habits"
        options={{
          drawerLabel: 'Habits',
          title: 'Habits',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          drawerLabel: 'Analytics',
          title: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="heal-well"
        options={{
          drawerLabel: 'Heal Well',
          title: 'Heal Well',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="moon" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profile',
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
