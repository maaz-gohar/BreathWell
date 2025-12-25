import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../constants/Colors';
import { Formatters } from '../../utils/formatters';
import Card from '../ui/Card';

interface Journal {
  createdAt: string;
  mood?: keyof typeof COLORS.mood;
  audioFile?: any;
  text?: string;
  tags?: string[];
  [key: string]: any;
}

interface JournalCardProps {
  journal: Journal;
  onDelete: () => void;
}

export default function JournalCard({ journal, onDelete }: JournalCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>
              {Formatters.date(journal.createdAt, 'MMM dd')}
            </Text>
            <Text style={styles.time}>
              {Formatters.time(journal.createdAt)}
            </Text>
          </View>
          
          <View style={styles.moodContainer}>
            {journal.mood && (
              <View style={[styles.moodBadge, { backgroundColor: COLORS.mood[journal.mood] }]}>
                <Text style={styles.moodEmoji}>
                  {Formatters.moodEmoji(journal.mood)}
                </Text>
              </View>
            )}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textLight}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {journal.audioFile ? (
            <View style={styles.audioContainer}>
              <Ionicons name="mic" size={24} color={COLORS.primary} />
              <Text style={styles.audioText}>Voice Recording</Text>
              <TouchableOpacity style={styles.playButton}>
                <Ionicons name="play-circle" size={24} color={COLORS.success} />
                <Text style={styles.playText}>Play</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.journalText}>{journal.text}</Text>
          )}

          {journal.tags && journal.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {journal.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash" size={18} color={COLORS.error} />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {},
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 20,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
  },
  audioText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
  },
  playText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: 6,
  },
  journalText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: 6,
  },
});