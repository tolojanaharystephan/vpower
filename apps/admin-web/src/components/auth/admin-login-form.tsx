'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter } from '@/i18n/navigation';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function AdminLoginForm() {
  const t = useTranslations('login');
  const { login } = useAdminAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      className="w-full max-w-sm space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setError(null);
        try {
          await login(values.email, values.password);
          router.replace('/');
        } catch (err) {
          const message = err instanceof Error ? err.message : '';
          setError(message === 'NO_ADMIN_ACCESS' ? t('noAccess') : message || t('error'));
        }
      })}
    >
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">{t('email')}</label>
        <Input type="email" autoComplete="username" {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">{t('password')}</label>
        <PasswordInput autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
