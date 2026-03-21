'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PaymentRequiredInfo } from '@/components/chat/PaymentModal';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseAgentChatOptions {
  agentId: number;
  tokenUri?: string;
  userPublicKey?: string;
  isOwner?: boolean;
  sessionId?: string;  // Allow external session ID control
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Hook for chatting with an AI agent
 * 
 * Features:
 * - Sends messages to the chat API
 * - Streams responses
 * - Persists messages to ChromaDB
 * - Loads chat history on mount
 * - 402 Payment Required handling
 */
export function useAgentChat({ 
  agentId, 
  tokenUri, 
  userPublicKey, 
  isOwner = false,
  sessionId: externalSessionId,
}: UseAgentChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<PaymentRequiredInfo | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  // Session management
  const [sessionId, setSessionId] = useState<string>(() => 
    externalSessionId || generateSessionId()
  );
  
  // Track if history was loaded
  const historyLoadedRef = useRef(false);

  /**
   * Load chat history from ChromaDB
   */
  const loadHistory = useCallback(async (targetSessionId?: string) => {
    if (!userPublicKey || !agentId) return;
    
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        agentId: String(agentId),
        userAddress: userPublicKey,
        limit: '50',
      });
      
      if (targetSessionId) {
        params.set('sessionId', targetSessionId);
      }
      
      const response = await fetch(`/api/chat/history?${params}`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [agentId, userPublicKey]);

  /**
   * Load history on mount if user is connected
   */
  useEffect(() => {
    if (userPublicKey && agentId && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory(sessionId);
    }
  }, [userPublicKey, agentId, sessionId, loadHistory]);

  /**
   * Save a message to ChromaDB
   */
  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ) => {
    if (!userPublicKey) return;
    
    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          userAddress: userPublicKey,
          role,
          content,
          sessionId,
        }),
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }, [agentId, userPublicKey, sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (!userPublicKey) {
      setError('Please connect your wallet to chat');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaymentRequired(null);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const chatHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          tokenUri,
          message: content.trim(),
          chatHistory,
          userPublicKey,
          isOwner,
          sessionId,  // Pass sessionId for persistence
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle 402 Payment Required
        if (response.status === 402 && data.paymentRequired) {
          setPendingMessage(content.trim());
          setPaymentRequired(data.paymentRequired as PaymentRequiredInfo);
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
        
        if (data.code === 'INSUFFICIENT_CREDITS') {
          setPaymentRequired({
            type: 'owner-credits',
            agentId,
            cost: '0.1',
            currency: 'STRK',
            description: data.error,
          });
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || 'Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Add empty assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream the response
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullText,
          };
          return newMessages;
        });
      }

      // Save assistant response to ChromaDB after streaming completes
      if (fullText) {
        saveMessage('assistant', fullText);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);

      const errorMsg: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, tokenUri, userPublicKey, isOwner, sessionId, messages, isLoading, saveMessage]);

  const retryAfterPayment = useCallback(() => {
    if (pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage(null);
      setPaymentRequired(null);
      sendMessage(msg);
    }
  }, [pendingMessage, sendMessage]);

  const dismissPaymentModal = useCallback(() => {
    setPaymentRequired(null);
    setPendingMessage(null);
  }, []);

  /**
   * Clear messages and start a new session
   */
  const startNewSession = useCallback(() => {
    setMessages([]);
    setError(null);
    setPaymentRequired(null);
    setPendingMessage(null);
    setSessionId(generateSessionId());
    historyLoadedRef.current = false;
  }, []);

  /**
   * Switch to a different session
   */
  const switchSession = useCallback((newSessionId: string) => {
    setMessages([]);
    setSessionId(newSessionId);
    historyLoadedRef.current = false;
    loadHistory(newSessionId);
  }, [loadHistory]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    paymentRequired,
    pendingMessage,
    sessionId,
    sendMessage,
    retryAfterPayment,
    dismissPaymentModal,
    startNewSession,
    switchSession,
    loadHistory,
  };
}
