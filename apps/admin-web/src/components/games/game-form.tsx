'use client';

import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { AdminGame, GameCategory, GamePayload, GameProvider, GameStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const schema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional(),
  accent: z.string().optional(),
  providerId: z.string().uuid(),
  categoryId: z.string().uuid(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  isPopular: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type FormValues = z.infer<typeof schema>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function GameForm({
  open,
  game,
  providers,
  categories,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  game: AdminGame | null;
  providers: GameProvider[];
  categories: GameCategory[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: GamePayload) => Promise<void>;
}) {
  const t = useTranslations('games');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '',
      title: '',
      description: '',
      accent: '#D4A017',
      providerId: providers[0]?.id ?? '',
      categoryId: categories[0]?.id ?? '',
      status: 'active',
      isFeatured: false,
      isNew: false,
      isPopular: false,
      sortOrder: 0,
    },
  });

  const titleValue = watch('title');

  useEffect(() => {
    if (!open) return;
    if (game) {
      reset({
        slug: game.slug,
        title: game.title,
        description: game.description ?? '',
        accent: game.accent ?? '#D4A017',
        providerId: game.providerId,
        categoryId: game.categoryId,
        status: game.status,
        isFeatured: game.isFeatured,
        isNew: game.isNew,
        isPopular: game.isPopular,
        sortOrder: game.sortOrder,
      });
    } else {
      reset({
        slug: '',
        title: '',
        description: '',
        accent: '#D4A017',
        providerId: providers[0]?.id ?? '',
        categoryId: categories[0]?.id ?? '',
        status: 'active',
        isFeatured: false,
        isNew: false,
        isPopular: false,
        sortOrder: 0,
      });
    }
  }, [open, game, providers, categories, reset]);

  useEffect(() => {
    if (!open || game) return;
    if (titleValue) setValue('slug', slugify(titleValue));
  }, [titleValue, open, game, setValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[var(--vp-border)] bg-[var(--vp-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--vp-border)] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--vp-accent)]">
              {t('formEyebrow')}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
              {game ? t('editTitle') : t('createTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--vp-muted)] transition hover:bg-white/5 hover:text-[var(--vp-fg)]"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              ...values,
              description: values.description || undefined,
              accent: values.accent || undefined,
            });
          })}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field label={t('fieldTitle')} error={errors.title?.message}>
              <Input {...register('title')} />
            </Field>
            <Field label={t('fieldSlug')} error={errors.slug?.message}>
              <Input {...register('slug')} />
            </Field>
            <Field label={t('fieldDescription')}>
              <textarea
                className="min-h-24 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-bg)] px-3 py-2 text-sm text-[var(--vp-fg)] outline-none transition focus:border-[var(--vp-accent)]"
                {...register('description')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('fieldProvider')} error={errors.providerId?.message}>
                <select
                  className="h-10 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-bg)] px-3 text-sm text-[var(--vp-fg)] outline-none focus:border-[var(--vp-accent)]"
                  {...register('providerId')}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('fieldCategory')} error={errors.categoryId?.message}>
                <select
                  className="h-10 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-bg)] px-3 text-sm text-[var(--vp-fg)] outline-none focus:border-[var(--vp-accent)]"
                  {...register('categoryId')}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('fieldStatus')}>
                <select
                  className="h-10 w-full rounded-md border border-[var(--vp-border)] bg-[var(--vp-bg)] px-3 text-sm text-[var(--vp-fg)] outline-none focus:border-[var(--vp-accent)]"
                  {...register('status')}
                >
                  {(['draft', 'active', 'inactive', 'archived'] as GameStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('fieldAccent')}>
                <Input type="text" placeholder="#D4A017" {...register('accent')} />
              </Field>
            </div>
            <Field label={t('fieldSortOrder')} error={errors.sortOrder?.message}>
              <Input type="number" {...register('sortOrder')} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm text-[var(--vp-muted)]">
                <input type="checkbox" className="accent-[var(--vp-accent)]" {...register('isFeatured')} />
                {t('flagFeatured')}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm text-[var(--vp-muted)]">
                <input type="checkbox" className="accent-[var(--vp-accent)]" {...register('isNew')} />
                {t('flagNew')}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm text-[var(--vp-muted)]">
                <input type="checkbox" className="accent-[var(--vp-accent)]" {...register('isPopular')} />
                {t('flagPopular')}
              </label>
            </div>
          </div>

          <div className="flex gap-3 border-t border-[var(--vp-border)] px-5 py-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
