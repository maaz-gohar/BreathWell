import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const Formatters = {
  date: (date: string | Date | null | undefined, formatString: string = 'MMM dd, yyyy'): string => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
      
      if (!isValid(dateObj)) {
        return 'N/A';
      }
      
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  },

  time: (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
      
      if (!isValid(dateObj)) {
        return 'N/A';
      }
      
      return format(dateObj, 'hh:mm a');
    } catch (error) {
      console.error('Time formatting error:', error);
      return 'N/A';
    }
  },

  relativeTime: (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
      
      if (!isValid(dateObj)) {
        return 'N/A';
      }
      
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return 'N/A';
    }
  },

  moodEmoji: (mood: string): string => {
    const emojis: Record<string, string> = {
      excellent: '😊',
      good: '🙂',
      okay: '😐',
      poor: '😔',
      terrible: '😢'
    };
    return emojis[mood] || '😐';
  },

  capitalize: (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
};