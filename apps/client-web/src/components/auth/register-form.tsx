'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { registerUser } from '@/lib/api';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/auth/session-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type RegisterFormProps = {
  embedded?: boolean;
  onSwitch?: () => void;
  onSuccess?: () => void;
};

export function RegisterForm({ embedded, onSwitch, onSuccess }: RegisterFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setSession } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      await setSession(data.accessToken, data.refreshToken);
      onSuccess?.();
      router.push('/games');
    },
    onError: (err: Error) => {
      setError('root', { message: err.message || t('errorGeneric') });
    },
  });

  return (
    <form className="w-full space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      {!embedded && (
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--vp-fg)]">
          {t('registerTitle')}
        </h1>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
            {t('firstName')}
          </label>
          <Input {...register('firstName')} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
            {t('lastName')}
          </label>
          <Input {...register('lastName')} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
          {t('email')}
        </label>
        <Input type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-[var(--vp-muted)]">
          {t('password')}
        </label>
        <PasswordInput autoComplete="new-password" {...register('password')} />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>
      {errors.root && <p className="text-sm text-red-400">{errors.root.message}</p>}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {t('submitRegister')}
      </Button>
      <p className="text-sm text-[var(--vp-muted)]">
        {t('hasAccount')}{' '}
        {onSwitch ? (
          <button
            type="button"
            className="cursor-pointer text-[var(--vp-accent)] hover:underline"
            onClick={onSwitch}
          >
            {t('submitLogin')}
          </button>
        ) : (
          <Link href="/login" className="text-[var(--vp-accent)] hover:underline">
            {t('submitLogin')}
          </Link>
        )}
      </p>
    </form>
  );
}
