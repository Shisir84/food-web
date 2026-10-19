import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ChatMessage } from '../types/index.ts';

interface NovaChatbotProps {
  onNavigate: (path: string) => void;
}

export const NovaChatbot: React.FC<NovaChatbotProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [botName, setBotName] = useState('Nova AI Assistant');
  const [isEnabled, setIsEnabled] = useState(true);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Find me a pizza restaurant.',
    'What food can I order?',
    'Recommend something vegetarian.',
    'How do I place an order?',
    'How can I track my order?',
    'How can I contact support?',
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load public settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getChatbotPublicSettings();
        if (data) {
          setIsEnabled(data.enabled !== false);
          if (data.botName) setBotName(data.botName);
          if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
            setSuggestedPrompts(data.suggestedPrompts);
          }
          if (data.welcomeMessage && messages.length === 0) {
            setMessages([
              {
                id: 'welcome_1',
                sender: 'bot',
                text: data.welcomeMessage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        }
      } catch (e) {
        // Fallback default greeting if offline
        if (messages.length === 0) {
          setMessages([
            {
              id: 'welcome_default',
              sender: 'bot',
              text: 'Hello! I am your Nova AI Assistant. How can I assist you with restaurants, delicious dishes, or your delivery today?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      }
    }
    loadSettings();
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  if (!isEnabled) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = newMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await api.sendChatMessage({
        message: text,
        history: historyPayload,
      });

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: res.reply || "I'm here to help you find wonderful food on Nova Hunger Food!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: res.suggestedAction,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err.message || 'Unable to connect to Nova AI Assistant. Please try again or reach out to support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'bot',
        text: 'Chat history cleared. How can I assist you with restaurants or orders now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
  };

  const handleActionClick = (action: { type: string; label: string; target: string }) => {
    if (action.type === 'contact_form') {
      // Pass inquiry summary to contact page via query params without auto-submitting
      const lastUserQuestion = [...messages].reverse().find((m) => m.sender === 'user')?.text || '';
      const summaryParam = encodeURIComponent(
        `Inquiry escalated from Nova AI Assistant:\n"${lastUserQuestion}"`
      );
      onNavigate(`/contact?subject=AI+Assistant+Inquiry&message=${summaryParam}`);
      setIsOpen(false);
    } else {
      onNavigate(action.target);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#FF7900] via-[#FF9D00] to-[#8B5CF6] text-black font-extrabold text-xs shadow-2xl shadow-[#FF7900]/30 hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open Nova AI Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-black">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="tracking-wide">Ask Nova AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ${
            isMinimized
              ? 'bottom-6 right-6 w-72'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[85vh] h-[580px]'
          } rounded-3xl bg-[#151518] border border-[#2B2B30] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl`}
        >
          {/* Header */}
          <div className="p-4 bg-[#0B0B0D] border-b border-[#2B2B30] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF7900] to-[#8B5CF6] p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#151518] rounded-[10px] flex items-center justify-center text-[#FF9D00]">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-xs text-white tracking-wide">
                    {botName}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-extrabold uppercase">
                    Gemini AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Vetted Menus & Live Grounding</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#B8B8C0]">
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 hover:text-white hover:bg-[#2B2B30] rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 hover:text-white hover:bg-[#2B2B30] rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:text-white hover:bg-[#2B2B30] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                {messages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-start gap-2 max-w-[85%]">
                        {isBot && (
                          <div className="w-6 h-6 rounded-lg bg-[#FF7900]/20 text-[#FF7900] flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-3 text-xs leading-relaxed ${
                            isBot
                              ? 'bg-[#0B0B0D] border border-[#2B2B30] text-stone-200'
                              : 'bg-gradient-to-r from-[#FF7900] to-[#FF9D00] text-black font-medium'
                          }`}
                        >
                          <div className="whitespace-pre-wrap select-text">{msg.text}</div>

                          {/* Interactive Action Button */}
                          {msg.suggestedAction && (
                            <button
                              onClick={() => handleActionClick(msg.suggestedAction!)}
                              className="mt-2.5 w-full py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-colors"
                            >
                              <span>{msg.suggestedAction.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-stone-600 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#B8B8C0] py-1">
                    <div className="w-6 h-6 rounded-lg bg-[#FF7900]/20 text-[#FF7900] flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-stone-400 ml-1">Searching menus...</span>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1">
                      <span>{errorMessage}</span>
                      <button
                        onClick={() => handleSendMessage()}
                        className="block mt-1 font-bold text-[#FF9D00] hover:underline"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts Carousel */}
              {messages.length <= 3 && suggestedPrompts.length > 0 && (
                <div className="px-3 py-2 bg-[#0B0B0D]/50 border-t border-[#2B2B30] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-full bg-[#151518] hover:bg-[#FF7900]/20 hover:border-[#FF7900] border border-[#2B2B30] text-[10.5px] text-[#B8B8C0] hover:text-white whitespace-nowrap transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Field & Purple Send Button */}
              <div className="p-3 bg-[#0B0B0D] border-t border-[#2B2B30]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about pizzas, momos, tracking, dietary..."
                    disabled={isLoading}
                    className="flex-1 bg-[#151518] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF7900] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center transition-all"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-stone-500">
                  <span>Confirm allergy restrictions directly with kitchens.</span>
                  <button
                    onClick={() => {
                      onNavigate('/contact');
                      setIsOpen(false);
                    }}
                    className="hover:text-[#FF7900] flex items-center gap-0.5 underline transition-colors"
                  >
                    <span>Contact Support</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
