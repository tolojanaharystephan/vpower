'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bot, Send } from 'lucide-react';
import {
  chatSupportBot,
  escalateSupportBot,
  type BotChatReply,
} from '@/lib/api';
import { Button } from '@/components/ui/button';

type ChatLine = { role: 'user' | 'bot'; text: string; meta?: BotChatReply };

export function SupportBotPanel({
  accessToken,
  preferredLang,
  onEscalated,
}: {
  accessToken: string;
  preferredLang: string;
  onEscalated: (ticketId: string) => void;
}) {
  const t = useTranslations('supportBot');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([
    { role: 'bot', text: t('welcome') },
  ]);
  const [lastBot, setLastBot] = useState<BotChatReply | null>(null);
  const [lastUserMsg, setLastUserMsg] = useState('');

  const chatMutation = useMutation({
    mutationFn: () =>
      chatSupportBot(accessToken, { message: input.trim(), locale }),
    onSuccess: (reply) => {
      setLines((prev) => [
        ...prev,
        { role: 'user', text: input.trim() },
        { role: 'bot', text: reply.answer, meta: reply },
      ]);
      setLastUserMsg(input.trim());
      setLastBot(reply);
      setInput('');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () =>
      escalateSupportBot(accessToken, {
        message: lastUserMsg || input.trim() || t('escalateDefault'),
        preferredLang,
        botAnswer: lastBot?.answer,
        subject: t('escalateSubject'),
      }),
    onSuccess: async (ticket) => {
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onEscalated(ticket.id);
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--vp-border)] px-4 py-3.5">
        <span className="help-card-icon h-10 w-10">
          <Bot className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--vp-fg)]">{t('title')}</p>
          <p className="text-[11px] text-[var(--vp-muted)]">{t('subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4">
        <div className="support-bot-welcome">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-accent)]">
            {t('welcomeTitle')}
          </p>
          <p>{t('welcome')}</p>
        </div>
        {lines.slice(1).map((line, i) => (
          <div
            key={`${i}-${line.role}`}
            className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                line.role === 'user'
                  ? 'bg-[rgba(46,163,242,0.18)]'
                  : 'border border-[var(--vp-border)] bg-black/20'
              }`}
            >
              {line.text}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-[var(--vp-border)] p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || chatMutation.isPending) return;
            chatMutation.mutate();
          }}
        >
          <input
            className="h-10 flex-1 rounded-xl border border-[var(--vp-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--vp-accent)]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
          />
          <Button type="submit" size="sm" disabled={chatMutation.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={escalateMutation.isPending}
          onClick={() => escalateMutation.mutate()}
        >
          {escalateMutation.isPending ? t('escalating') : t('talkToHuman')}
        </Button>
      </div>
    </div>
  );
}
