import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Plus, Loader2, Bot, User, MessageSquare } from 'lucide-react';
import { aiApi } from '../lib/api';
import { getOpenAIKey } from '../lib/localBackend';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasApiKey = !!getOpenAIKey();

  useEffect(() => {
    aiApi.conversations().then(({ data }) => setConversations(data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await aiApi.chat({
        conversationId: conversationId || undefined,
        message: userMessage.content,
      });

      if (!conversationId) {
        setConversationId(data.conversationId);
        // Refresh conversation list
        aiApi.conversations().then(({ data: convs }) => setConversations(convs)).catch(() => {});
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const loadConversation = async (id: string) => {
    try {
      const { data } = await aiApi.messages(id);
      setMessages(data.map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })));
      setConversationId(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] animate-fade-in">
      {/* Sidebar - conversations */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col rounded-l-xl">
        <div className="p-3 border-b border-gray-100">
          <button onClick={startNewConversation} className="btn-primary w-full text-sm py-2">
            <Plus className="w-4 h-4 mr-2" />
            {t('chat.newConversation')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-8">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors truncate ${
                  conversationId === conv.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 inline-block mr-2 opacity-50" />
                {conv.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-r-xl">
        {/* API key notice */}
        {!hasApiKey && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-700 flex items-center justify-between">
            <span>No OpenAI API key configured. AI responses are limited. Add your key in Settings.</span>
            <a href="/settings" className="font-medium underline ml-2">Go to Settings</a>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-gray-600">SiteCloud AI</h3>
              <p className="text-sm mt-1">Ask me anything. I&apos;m here to help.</p>
              {!hasApiKey && (
                <p className="text-xs mt-3 text-amber-600 max-w-sm text-center">
                  Add your OpenAI API key in Settings to enable full GPT-4 powered responses.
                </p>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary px-4 py-2.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
