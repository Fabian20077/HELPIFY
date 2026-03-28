'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Inter } from 'next/font/google';
import { Mail, Lock, Loader2, ArrowRight, HeadphonesIcon, ShieldCheckIcon } from 'lucide-react';
import { setToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

const loginSchema = z.object({
  email: z.string().email('Por favor ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        {icon}
      </div>
      <div className="[&_input]:pl-10">{children}</div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Credenciales inválidas');
      if (result.data?.token) setToken(result.data.token);
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    setForgotMsg('Funcionalidad próximamente disponible');
    setTimeout(() => setForgotMsg(null), 3000);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  Email corporativo
                </FormLabel>
                <FormControl>
                  <InputWithIcon icon={<Mail className="h-4 w-4" />}>
                    <input
                      placeholder="juan@empresa.com"
                      type="email"
                      autoComplete="email"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                      {...field}
                    />
                  </InputWithIcon>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                    Contraseña
                  </FormLabel>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-slate-500 hover:text-orange-400 transition-colors"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <FormControl>
                  <InputWithIcon icon={<Lock className="h-4 w-4" />}>
                    <input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                      {...field}
                    />
                  </InputWithIcon>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
                {forgotMsg && (
                  <p className="text-xs text-blue-400 mt-1">{forgotMsg}</p>
                )}
              </FormItem>
            )}
          />

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-2 w-full overflow-hidden rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white tracking-wide shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                Entrar al sistema
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </Form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${inter.variable}`}
      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      {/* ══════════════════════════════════════════
          PANEL IZQUIERDO — Motor de Autenticación
      ══════════════════════════════════════════ */}
      <div className="relative flex flex-col lg:w-[45%] bg-[#020817] px-8 lg:px-12 py-8">
        {/* Logo — firma, no protagonista */}
        <header className="flex items-center gap-2.5">
          <img
            src="/helpify-logo.webp"
            alt="Helpify"
            className="h-7 w-auto"
            width={28}
            height={28}
          />
          <span className="text-sm font-semibold text-white tracking-tight">Helpify</span>
        </header>

        {/* Formulario centrado verticalmente */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">
            {/* Titulares */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Bienvenido de vuelta
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-4 pt-6">
          <a
            href="#"
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
          >
            <HeadphonesIcon className="h-3 w-3" />
            Soporte
          </a>
          <span className="text-slate-700 text-xs">·</span>
          <a
            href="#"
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
          >
            <ShieldCheckIcon className="h-3 w-3" />
            Privacidad
          </a>
        </footer>
      </div>

      {/* ══════════════════════════════════════════
          PANEL DERECHO — Escaparate Visual
      ══════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:flex-1 flex-col items-center justify-center px-12 py-16 bg-[#0f172a] dot-grid-bg overflow-hidden">
        {/* Radial gradient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(249,115,22,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Glassmorphism card con ilustración */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-md w-full">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl animate-fade-in-up w-full">
            <img
              src="/helpify-illustration.webp"
              alt="Helpify — gestión de soporte"
              className="w-full max-w-[300px] h-auto mx-auto object-contain"
              width={300}
              height={300}
            />
          </div>

          {/* Copy estratégico */}
          <div className="animate-fade-in-up-delay">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Gestión de tickets impulsada{' '}
              <span className="text-orange-500">por datos</span>, no por suposiciones.
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed animate-fade-in-up-delay-2">
              Tickets, prioridades y equipos en un solo lugar. Respondido a tiempo, resuelto con calidad.
            </p>
          </div>

          {/* Stats badge */}
          <div className="animate-fade-in-up-delay-2 flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-sm text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-white">94%</p>
              <p className="text-xs text-slate-400">Tasa de resolución</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">&lt; 1.5h</p>
              <p className="text-xs text-slate-400">Tiempo de respuesta</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-orange-500">+24</p>
              <p className="text-xs text-slate-400">Tickets activos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
