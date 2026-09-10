'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Bot, Send } from 'lucide-react';
import { chatSupportBot, type BotChatReply } from '@/lib/api';
import { Button } from '@/components/ui/button';

type ChatLine = { role: 'user' | 'bot'; text: string; meta?: BotChatReply };

export function SupportBotPanel({
  accessToken,
  preferredLang: _preferredLang,
  onTalkToAgent,
}: {
  accessToken: string;
  preferredLang: string;
  onTalkToAgent: () => void;
}) {
  const t = useTranslations('supportBot');
  const locale = useLocale();
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<ChatLine[]>([{ role: 'bot', text: t('welcome') }]);

  const chatMutation = useMutation({
    mutationFn: () =>
      chatSupportBot(accessToken, { message: input.trim(), locale }),
    onSuccess: (reply) => {
      setLines((prev) => [
        ...prev,
        { role: 'user', text: input.trim() },
        { role: 'bot', text: reply.answer, meta: reply },
      ]);
      setInput('');
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
        <Button type="button" variant="secondary" className="w-full" onClick={onTalkToAgent}>
          {t('talkToHuman')}
        </Button>
      </div>
    </div>
  );
}
