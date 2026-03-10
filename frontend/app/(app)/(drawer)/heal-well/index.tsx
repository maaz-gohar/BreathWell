import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreenHeader from '../../../../components/ui/AppScreenHeader';
import Card from '../../../../components/ui/Card';
import { COLORS } from '../../../../constants/Colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';

export default function HealWellHub() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppScreenHeader
        title="Heal Well"
        subtitle="Quranic guidance & Sunnah practices for emotional healing"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Path</Text>
        <Text style={styles.sectionDesc}>
          Select an area where you need support. Each module offers emotional
          validation, Quranic verses, Sunnah practices, and reflection prompts.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/heal-well/sleep')}
        >
          <Card style={styles.moduleCard}>
            <View style={[styles.moduleIcon, { backgroundColor: COLORS.surfaceVariant }]}>
              <Ionicons name="moon" size={40} color={COLORS.text} />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Sleep & Rest</Text>
              <Text style={styles.moduleDesc}>
                Struggling with insomnia, anxiety, nightmares, or overthinking at
                night? Find verses, Sunnah rituals, and breathing dhikr for peaceful
                sleep.
              </Text>
              <View style={styles.moduleMeta}>
                <Text style={styles.moduleMetaText}>5 emotional states</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/heal-well/relationships')}
        >
          <Card style={styles.moduleCard}>
            <View style={[styles.moduleIcon, { backgroundColor: COLORS.info }]}>
              <Ionicons name="heart" size={40} color={COLORS.text} />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Relationships</Text>
              <Text style={styles.moduleDesc}>
                Anger, feeling unloved, emotional neglect, or resentment? Explore
                Quranic wisdom and Prophetic guidance for healing.
              </Text>
              <View style={styles.moduleMeta}>
                <Text style={styles.moduleMetaText}>8 emotional states</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Based on authentic Qur'an and Hadith. Healing starts from emotion.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 40
  },
  header: {
    padding: SPACING.xxl,
    paddingTop: SPACING.xxxl + 2,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  title: {
    ...TYPOGRAPHY.heading1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
  section: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  moduleCard: {
    flexDirection: 'row',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  moduleIcon: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  moduleContent: {
    flex: 1
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6
  },
  moduleDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 12
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  moduleMetaText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600'
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center'
  }
});
