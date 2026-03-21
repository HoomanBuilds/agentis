'use client';

import { Message } from '@/hooks/useAgentChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessagesProps {
  messages: Message[];
  agentName: string;
  isThinking?: boolean;
}

export function ChatMessages({ messages, agentName, isThinking = false }: ChatMessagesProps) {
  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Start a conversation
          </h3>
          <p className="text-gray-400">
            Send a message to chat with {agentName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/30 text-white'
                : 'bg-white/5 border border-white/10 text-gray-100'
            }`}
          >
            <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="rounded-lg overflow-hidden my-2 bg-black/50 border border-emerald-500/20">
                        <div className="flex items-center justify-between px-3 py-1 bg-emerald-900/20 border-b border-emerald-500/20">
                          <span className="text-xs text-emerald-400 font-mono">
                            {match[1]}
                          </span>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <code
                        className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm pl-1">{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <p className="text-xs opacity-50 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
      
      {isThinking && (
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <div className="flex space-x-1 h-6 items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
