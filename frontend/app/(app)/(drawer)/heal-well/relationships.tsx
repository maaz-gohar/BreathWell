import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Card from '../../../../components/ui/Card';
import { COLORS } from '../../../../constants/Colors';
import { islamicService } from '../../../../services/islamic.service';
import type { IslamicModule } from '../../../../types';

export default function RelationshipsModuleScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<IslamicModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<IslamicModule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const mods = await islamicService.getRelationshipModules();
      setModules(mods);
    } catch (err) {
      console.error('Relationship module fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (selectedModule) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedModule(null)}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emojiLarge}>{selectedModule.emoji}</Text>
          <Text style={styles.moduleTitle}>{selectedModule.displayLabel}</Text>
        </View>

        {selectedModule.emotionalValidation && (
          <Card style={styles.card}>
            <Text style={styles.validationText}>
              {selectedModule.emotionalValidation}
            </Text>
          </Card>
        )}

        {selectedModule.verses && selectedModule.verses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quranic Verses</Text>
            {selectedModule.verses.map((v, i) => (
              <Card key={i} style={styles.verseCard}>
                <Text style={styles.verseRef}>{v.surah} {v.verseRange}</Text>
                {v.arabicText ? (
                  <Text style={styles.arabicText}>{v.arabicText}</Text>
                ) : null}
                <Text style={styles.translation}>{v.translation}</Text>
                {v.hadithRef ? (
                  <Text style={styles.hadithRef}>{v.hadithRef}</Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}

        {selectedModule.sunnahPractices && selectedModule.sunnahPractices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sunnah Practices</Text>
            {selectedModule.sunnahPractices.map((s, i) => (
              <Card key={i} style={styles.sunnahCard}>
                <Text style={styles.sunnahTitle}>{s.title}</Text>
                <Text style={styles.sunnahDesc}>{s.description}</Text>
                {s.hadithSource ? (
                  <Text style={styles.hadithRef}>{s.hadithSource}</Text>
                ) : null}
              </Card>
            ))}
          </View>
        )}

        {selectedModule.regulationLayer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Regulation</Text>
            <Card style={styles.regulationCard}>
              <Text style={styles.regulationText}>
                {selectedModule.regulationLayer.instruction}
              </Text>
              {selectedModule.regulationLayer.dhikrText && (
                <Text style={styles.dhikrText}>
                  "{selectedModule.regulationLayer.dhikrText}"
                </Text>
              )}
              {selectedModule.regulationLayer.type === 'breathing' && (
                <TouchableOpacity
                  style={styles.breathButton}
                  onPress={() => router.push('/breath')}
                >
                  <Ionicons name="leaf" size={20} color="#fff" />
                  <Text style={styles.breathButtonText}>Open Breathing</Text>
                </TouchableOpacity>
              )}
              {selectedModule.regulationLayer.type === 'journal' && (
                <TouchableOpacity
                  style={styles.breathButton}
                  onPress={() => router.push('/journal')}
                >
                  <Ionicons name="journal" size={20} color="#fff" />
                  <Text style={styles.breathButtonText}>Open Journal</Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        )}

        {selectedModule.reflectionPrompts && selectedModule.reflectionPrompts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reflection</Text>
            <Card style={styles.reflectionCard}>
              {selectedModule.reflectionPrompts.map((p, i) => (
                <Text key={i} style={styles.reflectionPrompt}>• {p}</Text>
              ))}
            </Card>
          </View>
        )}

        {selectedModule.closingAffirmation && (
          <Card style={styles.affirmationCard}>
            <Text style={styles.affirmationText}>
              {selectedModule.closingAffirmation}
            </Text>
          </Card>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Relationships</Text>
        <Text style={styles.subtitle}>How are you feeling?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Your State</Text>
        {modules.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.moduleOption}
            onPress={() => setSelectedModule(m)}
          >
            <Text style={styles.moduleEmoji}>{m.emoji}</Text>
            <Text style={styles.moduleLabel}>{m.displayLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50
  },
  backText: { fontSize: 16, color: COLORS.primary, marginLeft: 8, fontWeight: '600' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginTop: 6 },
  emojiLarge: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  moduleTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  moduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  moduleEmoji: { fontSize: 28, marginRight: 16 },
  moduleLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  card: { marginHorizontal: 20, marginBottom: 16 },
  validationText: { fontSize: 16, color: COLORS.text, lineHeight: 24 },
  verseCard: { padding: 16, marginBottom: 12 },
  verseRef: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  arabicText: { fontSize: 18, color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  translation: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  hadithRef: { fontSize: 12, color: COLORS.textLight, marginTop: 8, fontStyle: 'italic' },
  sunnahCard: { padding: 16, marginBottom: 12 },
  sunnahTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  sunnahDesc: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
  regulationCard: { padding: 16 },
  regulationText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  dhikrText: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
  breathButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    padding: 14,
    borderRadius: 12,
    marginTop: 16
  },
  breathButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  reflectionCard: { padding: 16 },
  reflectionPrompt: { fontSize: 15, color: COLORS.text, lineHeight: 24, marginBottom: 6 },
  affirmationCard: { margin: 20, padding: 20, backgroundColor: '#F0F9FF' },
  affirmationText: { fontSize: 16, fontWeight: '600', color: COLORS.primary, textAlign: 'center' }
});
