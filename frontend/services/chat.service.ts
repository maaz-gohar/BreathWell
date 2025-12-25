import { API_CONFIG } from '../constants/API';
import type { ChatMessage, ChatSession } from '../types';
import api from './api';

// Define interfaces based on your actual backend response
interface ChatBackendResponse {
  sessionId?: string;
  aiResponse?: {
    text: string;
    isUser: boolean;
    sentiment: string;
    _id?: string;
    timestamp?: string;
  };
  crisisDetected?: boolean;
  messages?: Array<{
    text: string;
    isUser: boolean;
    sentiment: string;
    _id?: string;
    timestamp?: string;
  }>;
}

interface SessionsBackendResponse {
  _id?: string;
  id?: string;
  title?: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const chatService = {
  async sendMessage(message: string, sessionId?: string): Promise<ChatMessage> {
    try {
      console.log('Sending message to backend:', { message, sessionId });
      const response = await api.post<ChatBackendResponse>(
        API_CONFIG.ENDPOINTS.CHAT.MESSAGE, 
        { message, sessionId }
      );
      
      console.log('Backend response:', response.data);
      const apiResponse = response.data as ChatBackendResponse;
      
      // Convert backend response to ChatMessage format
      const chatMessage: ChatMessage = {
        _id: apiResponse.aiResponse?._id || Date.now().toString(),
        user: 'ai',
        message: message,
        sessionId: !!sessionId,
        response: apiResponse.aiResponse?.text || 'No response from AI',
        createdAt: apiResponse.aiResponse?.timestamp || new Date().toISOString(),
      };
      
      return chatMessage;
    } catch (error: any) {
      console.error('Send message error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.get<SessionsBackendResponse[]>(
        API_CONFIG.ENDPOINTS.CHAT.SESSIONS
      );
      
      console.log('Get sessions response:', response.data);
      const apiResponse = response.data as SessionsBackendResponse[];
      
      if (!Array.isArray(apiResponse)) {
        return [];
      }
      
      return apiResponse.map(session => ({
        _id: session._id || session.id || '',
        title: session.title || 'Untitled Session',
        lastMessage: session.lastMessage || 'No messages yet',
        messageCount: session.messageCount || 0,
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
        messages: [],
      }));
    } catch (error: any) {
      console.error('Get sessions error:', error.response?.data || error.message);
      return [];
    }
  },

  async getChatSession(id: string): Promise<ChatSession> {
    try {
      const response = await api.get<ChatBackendResponse>(
        `${API_CONFIG.ENDPOINTS.CHAT.SESSION}/${id}`
      );
      
      console.log('Get session response:', response.data);
      const apiResponse = response.data as ChatBackendResponse;
      
      // Convert backend response to ChatSession format
      const messages: ChatMessage[] = (apiResponse.messages || []).map(msg => ({
        _id: msg._id || '',
        user: msg.isUser ? 'user' : 'ai',
        message: msg.text,
        sessionId: !!id,
        response: !msg.isUser ? msg.text : undefined,
        createdAt: msg.timestamp || new Date().toISOString(),
      }));
      
      return {
        _id: id,
        title: `Session ${id.slice(-6)}`,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].message : 'No messages',
        messageCount: messages.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: messages,
      };
    } catch (error: any) {
      console.error('Get session error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get chat session');
    }
  },

  async deleteChatSession(id: string): Promise<void> {
    try {
      await api.delete(
        `${API_CONFIG.ENDPOINTS.CHAT.SESSION}/${id}`
      );
    } catch (error: any) {
      console.error('Delete session error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete chat session');
    }
  }
};