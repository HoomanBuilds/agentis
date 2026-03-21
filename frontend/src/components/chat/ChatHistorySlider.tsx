'use client';

import { X, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface ChatSession {
  sessionId: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

interface ChatHistorySliderProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  isLoading?: boolean;
}

export default function ChatHistorySlider({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isLoading = false,
}: ChatHistorySliderProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Slider */}
      <div className="absolute left-0 top-0 h-full w-80 bg-[#0a1a1a]/95 border-r border-emerald-500/20 z-50 overflow-y-auto animate-slide-in-left">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a1a1a]/95 border-b border-emerald-500/20 p-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-emerald-200">Chat Sessions</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-emerald-500/20">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-emerald-300/30 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No chat sessions yet</p>
              <p className="text-gray-500 text-xs mt-1">
                Start a new conversation
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`group relative p-3 rounded-xl transition-all cursor-pointer ${
                    currentSessionId === session.sessionId
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                      : 'bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                  onClick={() => {
                    onSelectSession(session.sessionId);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-emerald-400">
                          {session.messageCount} messages
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {session.lastMessage || 'Empty session'}
                      </p>
                    </div>
                    {onDeleteSession && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chat session?')) {
                            onDeleteSession(session.sessionId);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
