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
import type {
  IslamicModule,
  MorningAdhkar,
  RuqyahContent,
  SleepRitual,
  TahajjudContent
} from '../../../../types';

export default function SleepModuleScreen() {
  const router = useRouter();
  const [modules, setModules] = useState<IslamicModule[]>([]);
  const [rituals, setRituals] = useState<SleepRitual[]>([]);
  const [morningAdhkar, setMorningAdhkar] = useState<MorningAdhkar | null>(null);
  const [tahajjud, setTahajjud] = useState<TahajjudContent | null>(null);
  const [ruqyah, setRuqyah] = useState<RuqyahContent | null>(null);
  const [selectedModule, setSelectedModule] = useState<IslamicModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mods, rits, adhkar, tah, ruq] = await Promise.all([
        islamicService.getSleepModules(),
        islamicService.getSleepRituals(),
        islamicService.getMorningAdhkar(),
        islamicService.getTahajjudContent(),
        islamicService.getRuqyahVerses()
      ]);
      setModules(mods);
      setRituals(rits);
      setMorningAdhkar(adhkar);
      setTahajjud(tah);
      setRuqyah(ruq);
    } catch (err) {
      console.error('Sleep module fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

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
                  <Ionicons name="leaf" size={20} color={COLORS.text} />
                  <Text style={styles.breathButtonText}>Open Breathing</Text>
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
        <Text style={styles.title}>Sleep & Rest</Text>
        <Text style={styles.subtitle}>What's keeping you from sleep?</Text>
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

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.expandHeader}
          onPress={() => toggleSection('rituals')}
        >
          <Text style={styles.expandTitle}>Sunnah Rituals Before Sleep</Text>
          <Ionicons
            name={expandedSection === 'rituals' ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {expandedSection === 'rituals' &&
          rituals.map((r, i) => (
            <Card key={i} style={styles.ritualCard}>
              <Text style={styles.ritualTitle}>{r.title}</Text>
              <Text style={styles.ritualDesc}>{r.description}</Text>
            </Card>
          ))}
      </View>

      {morningAdhkar && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.expandHeader}
            onPress={() => toggleSection('adhkar')}
          >
            <Text style={styles.expandTitle}>Morning Adhkar (Upon Waking)</Text>
            <Ionicons
              name={expandedSection === 'adhkar' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
          {expandedSection === 'adhkar' && (
            <Card style={styles.adhkarCard}>
              {morningAdhkar.items.map((item, i) => (
                <Text key={i} style={styles.adhkarItem}>• {item}</Text>
              ))}
              {morningAdhkar.source && (
                <Text style={styles.hadithRef}>{morningAdhkar.source}</Text>
              )}
            </Card>
          )}
        </View>
      )}

      {tahajjud && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.expandHeader}
            onPress={() => toggleSection('tahajjud')}
          >
            <Text style={styles.expandTitle}>Tahajjud / Night-Waking</Text>
            <Ionicons
              name={expandedSection === 'tahajjud' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
          {expandedSection === 'tahajjud' && (
            <Card style={styles.tahajjudCard}>
              <Text style={styles.tahajjudWhen}>{tahajjud.whenWaking}</Text>
              {tahajjud.verses?.map((v, i) => (
                <Text key={i} style={styles.verseRef}>
                  {v.surah} {v.verseRange}: {v.translation}
                </Text>
              ))}
            </Card>
          )}
        </View>
      )}

      {ruqyah && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.expandHeader}
            onPress={() => toggleSection('ruqyah')}
          >
            <Text style={styles.expandTitle}>Ruqyah Core Verses</Text>
            <Ionicons
              name={expandedSection === 'ruqyah' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
          {expandedSection === 'ruqyah' && (
            <Card style={styles.ruqyahCard}>
              {ruqyah.verses.map((v, i) => (
                <View key={i} style={styles.ruqyahRow}>
                  <Text style={styles.ruqyahRef}>{v.ref}</Text>
                  <Text style={styles.ruqyahName}>{v.name}</Text>
                  {v.hadithRef ? (
                    <Text style={styles.hadithRefSmall}>{v.hadithRef}</Text>
                  ) : null}
                </View>
              ))}
            </Card>
          )}
        </View>
      )}
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
    backgroundColor: COLORS.surface,
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
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8
  },
  expandTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
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
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginTop: 16
  },
  breathButtonText: { color: COLORS.text, fontWeight: '600', marginLeft: 8 },
  reflectionCard: { padding: 16 },
  reflectionPrompt: { fontSize: 15, color: COLORS.text, lineHeight: 24, marginBottom: 6 },
  affirmationCard: { margin: 20, padding: 20, backgroundColor: COLORS.primaryLight },
  affirmationText: { fontSize: 16, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
  ritualCard: { padding: 16, marginBottom: 10 },
  ritualTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  ritualDesc: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
  adhkarCard: { padding: 16 },
  adhkarItem: { fontSize: 14, color: COLORS.text, lineHeight: 24, marginBottom: 6 },
  tahajjudCard: { padding: 16 },
  tahajjudWhen: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 12 },
  ruqyahCard: { padding: 16 },
  ruqyahRow: { marginBottom: 12 },
  ruqyahRef: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  ruqyahName: { fontSize: 14, color: COLORS.text },
  hadithRefSmall: { fontSize: 11, color: COLORS.textLight, marginTop: 2 }
});
