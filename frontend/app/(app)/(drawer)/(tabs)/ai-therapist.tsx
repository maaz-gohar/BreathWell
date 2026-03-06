import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Button from '../../../components/ui/Button';
// import Card from '../../../components/ui/Card';
import Loading from '../../../../components/ui/Loading';
import { COLORS } from '../../../../constants/Colors';
import { SPACING } from '../../../../constants/theme';
import { useAuth } from '../../../../context/AuthContext';
import { chatService } from '../../../../services/chat.service';
import { Formatters } from '../../../../utils/formatters';

interface Message {
  _id?: string;
  user: string;
  message: string;
  response?: string;
  createdAt: string;
  isUser: boolean;
}

export default function AiTherapistScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  // const [sessions, setSessions] = useState<any[]>([]);
  // const [activeSession, setActiveSession] = useState<string | null>(null);
  // const [loadingSessions, setLoadingSessions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // useEffect(() => {
  //   fetchSessions();
  // }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // const fetchSessions = async () => {
  //   try {
  //     setLoadingSessions(true);
  //     const data = await chatService.getChatSessions();
  //     console.log('Fetched sessions:', data);
  //     setSessions(data || []);
  //   } catch (error) {
  //     console.error('Failed to fetch chat sessions:', error);
  //     setSessions([]);
  //   } finally {
  //     setLoadingSessions(false);
  //   }
  // };

  // const loadSession = async (sessionId: string) => {
  //   try {
  //     setLoading(true);
  //     const session = await chatService.getChatSession(sessionId);
  //     console.log('Loaded session:', session);
      
  //     // Check if session has messages property
  //     const sessionMessages = session?.messages || [];
  //     setMessages(
  //       sessionMessages.map((msg: any) => ({
  //         ...msg,
  //         isUser: msg.user === user?._id,
  //       }))
  //     );
  //     setActiveSession(sessionId);
  //   } catch (error: any) {
  //     console.error('Failed to load chat session:', error);
  //     Alert.alert('Error', error.message || 'Failed to load chat session');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      _id: Date.now().toString(),
      user: user?._id || '',
      message: inputText,
      createdAt: new Date().toISOString(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      console.log('Sending message:', { 
        message: inputText, 
        // sessionId: activeSession,
        userId: user?._id 
      });
      
      // Send message without session (create new session automatically)
      const response = await chatService.sendMessage(inputText, undefined);
      console.log('Received response:', response);
      
      const aiMessage: Message = {
        _id: response._id,
        user: 'ai',
        message: inputText,
        response: response.response,
        createdAt: response.createdAt,
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // // If this was a new session, update sessions list
      // if (!activeSession && response.sessionId) {
      //   if (typeof response.sessionId === 'string') {
      //     setActiveSession(response.sessionId);
      //   } else {
      //     // fallback: ensure we pass a string to the setter
      //     setActiveSession(String(response.sessionId));
      //   }
      //   fetchSessions();
      // }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        _id: Date.now().toString(),
        user: 'system',
        message: 'Error',
        response: error.message || 'Failed to send message. Please try again.',
        createdAt: new Date().toISOString(),
        isUser: false,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // const startNewSession = () => {
  //   setMessages([]);
  //   setActiveSession(null);
  // };

  // if (loadingSessions) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Loading fullScreen text="Loading chat sessions..." />
  //     </View>
  //   );
  // }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets?.top ?? 0) + SPACING.xl }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>AI Therapist</Text>
            <Text style={styles.subtitle}>Islamic-guided conversations for healing</Text>
          </View>
        </View>
      </View>

      {/* Chat Area */}
      <View style={styles.chatCard}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatTitle}>
              New Conversation
            </Text>
            <Text style={styles.chatSubtitle}>
              Type your message below to start chatting
            </Text>
            <Text style={styles.disclaimer}>
              Guidance is based on Islamic principles. For serious concerns, consult a professional and a qualified scholar.
            </Text>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContentContainer}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Start a Conversation</Text>
              <Text style={styles.emptySubtitle}>
                Your Islamic-guided AI therapist is here to listen and help
              </Text>
              <Text style={styles.emptyHint}>
                Share your thoughts and feelings
              </Text>
              <Text style={styles.emptyDisclaimer}>
                Guidance is based on Islamic principles. For serious concerns, consult a professional and a qualified scholar.
              </Text>
            </View>
          ) : (
            messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text style={message.isUser ? styles.userMessageText : styles.aiMessageText}>
                    {message.isUser ? message.message : message.response}
                  </Text>
                  <Text style={message.isUser ? styles.userMessageTime : styles.aiMessageTime}>
                    {Formatters.time(message.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <Loading size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="send"
                size={24}
                color={inputText.trim() ? COLORS.primary : COLORS.textLight}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    paddingTop: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  chatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  chatSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },
  chatArea: {
    flex: 1,
  },
  chatContentContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  emptyDisclaimer: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userMessageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiMessageText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  userMessageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiMessageTime: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: COLORS.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});