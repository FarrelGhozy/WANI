'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Send,
  MessageSquare,
  Bot,
  User,
  Wifi,
  WifiOff,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  status: string;
  lastMessageAt: string | null;
  customer: { id: string; name: string; phone: string };
  messages?: Message[];
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ChatsPageWrapper() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatsPage />
    </Suspense>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-80 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="flex-1 w-full" />
      </div>
    </div>
  );
}

function ChatsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('id') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const res = await api.get<{ data: Conversation[] }>('/conversations?limit=50');
    if (res.success) setConversations(res.data.data);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!conversationId || !conversations.length) return;
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) selectConversation(conv);
  }, [conversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setLoadingMessages(true);
    router.push(`/dashboard/chats?id=${conv.id}`, { scroll: false });
    const res = await api.get<{ data: Message[] }>(`/conversations/${conv.id}/messages`);
    if (res.success) setMessages(res.data.data || []);
    else setMessages([]);
    setLoadingMessages(false);
  }

  async function sendMessage() {
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    const res = await api.post(`/conversations/${selectedConv.id}/messages`, {
      content: replyText,
      role: 'HUMAN',
    });
    if (res.success) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'HUMAN', content: replyText, createdAt: new Date().toISOString() }]);
      setReplyText('');
    }
    setSending(false);
  }

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !searchQuery || c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer.phone.includes(searchQuery);
    if (!matchSearch) return false;
    if (filter === 'ai') return c.status === 'ACTIVE';
    if (filter === 'human') return c.status === 'ESCALATED';
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-80 shrink-0 flex flex-col">
        <h1 className="text-lg font-bold text-surface-900 mb-3">Chat</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Cari pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-surface-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2 mb-3">
          {(['all', 'ai', 'human'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                filter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {f === 'all' ? 'Semua' : f === 'ai' ? '🤖 AI' : '👤 Human'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingList ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : filteredConversations.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada percakapan</p>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  'w-full text-left rounded-lg p-3 transition-colors',
                  selectedConv?.id === conv.id ? 'bg-primary-50' : 'hover:bg-surface-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-200 text-sm font-semibold text-surface-600">
                    {conv.customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-900">{conv.customer.name}</p>
                    <p className="truncate text-xs text-surface-400">
                      {conv.messages?.[conv.messages.length - 1]?.content || 'Belum ada pesan'}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-surface-400">
                    {conv.lastMessageAt ? relativeTime(conv.lastMessageAt) : ''}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border border-surface-200 bg-white">
        {!selectedConv ? (
          <div className="flex flex-1 items-center justify-center text-surface-400">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 mb-3" />
              <p className="text-sm">Pilih percakapan untuk mulai</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-sm font-semibold text-surface-600">
                  {selectedConv.customer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-surface-900">{selectedConv.customer.name}</p>
                  <p className="text-xs text-surface-400">{selectedConv.customer.phone}</p>
                </div>
              </div>
              <Badge variant={selectedConv.status === 'ACTIVE' ? 'success' : 'warning'}>
                {selectedConv.status === 'ACTIVE' ? 'AI Active' : 'Human Mode'}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-10 w-1/2 ml-auto" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-surface-400 py-8">Belum ada pesan</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2 max-w-[80%]',
                      msg.role === 'CUSTOMER' ? '' : 'ml-auto flex-row-reverse',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                        msg.role === 'CUSTOMER' ? 'bg-surface-200' : msg.role === 'BOT' ? 'bg-blue-100' : 'bg-green-100',
                      )}
                    >
                      {msg.role === 'CUSTOMER' ? <User className="h-4 w-4" /> : msg.role === 'BOT' ? <Bot className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-green-600" />}
                    </div>
                    <div>
                      <div
                        className={cn(
                          'rounded-xl px-4 py-2 text-sm',
                          msg.role === 'CUSTOMER' ? 'bg-surface-100 text-surface-800' : msg.role === 'BOT' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800',
                        )}
                      >
                        {msg.content}
                      </div>
                      <p className="mt-1 text-xs text-surface-400">{relativeTime(msg.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-surface-200 p-4">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Ketik pesan..."
                  rows={1}
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
                />
                <Button onClick={sendMessage} disabled={!replyText.trim() || sending} loading={sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
