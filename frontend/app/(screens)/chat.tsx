import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { ChatMessage, ChatSession } from '../../types';

interface SimpleMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(
    params.sessionId as string | undefined
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [crisisDetected, setCrisisDetected] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (sessionId) {
      loadChatSession();
    } else {
      // Start new session with welcome message
      setMessages([
        {
          id: Date.now().toString(),
          text: "Hello! I'm here to support you. How are you feeling today?",
          timestamp: new Date(),
          isUser: false,
        },
      ]);
      setInitialLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadChatSession = async (): Promise<void> => {
    if (!sessionId) return;

    try {
      setInitialLoading(true);
      const response = await apiService.get<{ session: ChatSession }>(`/chat/session/${sessionId}`);
      console.log('Load session response:', response);
      
      if (response.success && response.data) {
        const session = response.data.session;
        
        const chatMessages: SimpleMessage[] = session.messages.map((msg, index) => ({
          id: `${msg.timestamp}-${index}`,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
          isUser: msg.isUser,
        }));
        
        setMessages(chatMessages);
        setCrisisDetected(session.crisisDetected);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      Alert.alert('Error', 'Failed to load chat session');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const userMessage: SimpleMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date(),
      isUser: true,
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const currentText = text;
    setText('');
    setLoading(true);

    try {
      const payload: any = {
        message: currentText.trim()
      };
      
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      console.log('Sending payload:', payload);

      const response = await apiService.post<{
        aiResponse: ChatMessage;
        crisisDetected: boolean;
        sessionId: string;
      }>('/chat/message', payload);

      console.log('Full API response:', response);

      // ✅ FIXED: Handle the response correctly
      if (response.success) {
        // response.data contains the actual backend response
        const responseData = response.data;
        
        if (responseData) {
          const { aiResponse, crisisDetected: isCrisis, sessionId: newSessionId } = responseData;
          
          console.log('AI Response:', aiResponse);
          console.log('New Session ID:', newSessionId);
          console.log('Crisis detected:', isCrisis);

          // Store the sessionId if this is a new session
          if (newSessionId && !sessionId) {
            setSessionId(newSessionId);
            console.log('Session ID updated:', newSessionId);
          }

          setCrisisDetected(isCrisis);

          const aiMessage: SimpleMessage = {
            id: (Date.now() + 1).toString(),
            text: aiResponse.text,
            timestamp: new Date(),
            isUser: false,
          };

          console.log('Adding AI message:', aiMessage);
          setMessages(prev => [...prev, aiMessage]);

          if (isCrisis) {
            showCrisisAlert();
          }
        } else {
          throw new Error('No data in response');
        }
      } else {
        console.log('API response not successful:', response);
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: SimpleMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
        timestamp: new Date(),
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const showCrisisAlert = (): void => {
    Alert.alert(
      'Support Available',
      'It sounds like you might be going through a difficult time. Remember that help is available. Would you like to see crisis resources?',
      [
        {
          text: 'See Resources',
          onPress: showCrisisResources,
          style: 'default',
        },
        {
          text: 'Continue Chat',
          style: 'cancel',
        },
      ]
    );
  };

  const showCrisisResources = (): void => {
    Alert.alert(
      'Crisis Resources',
      `National Suicide Prevention Lifeline: 988\n\nCrisis Text Line: Text HOME to 741741\n\nEmergency Services: 911\n\nYou are not alone. Please reach out for help.`,
      [
        {
          text: 'Call 988',
          onPress: () => console.log('Would call 988'),
        },
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {crisisDetected && (
        <Card style={styles.crisisBanner}>
          <Card.Content>
            <Text style={styles.crisisBannerText}>
              💙 Crisis support is available. You are not alone.
            </Text>
            <Button 
              mode="contained" 
              style={styles.crisisButton}
              onPress={showCrisisResources}
            >
              Get Help Now
            </Button>
          </Card.Content>
        </Card>
      )}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {message.text}
            </Text>
            <Text style={[
              styles.messageTime,
              message.isUser ? styles.userMessageTime : styles.aiMessageTime
            ]}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.thinkingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.thinkingText}>AI Therapist is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message here..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  crisisBanner: {
    backgroundColor: '#FFEBEE',
    margin: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  crisisBannerText: {
    color: '#C62828',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  crisisButton: {
    backgroundColor: '#F44336',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiMessageTime: {
    color: '#666',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 70,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    minHeight: 40,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  sendButtonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ChatScreen;