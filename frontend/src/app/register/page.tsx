'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Inter } from 'next/font/google';
import {
  User,
  Mail,
  Loader2,
  ArrowRight,
  HeadphonesIcon,
  ShieldCheckIcon,
  TicketIcon,
  Clock,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
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

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Por favor ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

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

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const levels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength - 1] : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength <= 1 ? 'text-red-400' : strength <= 2 ? 'text-yellow-400' : 'text-green-400'
      }`}>
        {levels[strength - 1] || ''}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = form.watch('password');

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar la cuenta');
      }

      setRegisteredEmail(data.email);
      setRegistered(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al solicitar registro');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success State ──────────────────────────────────────────────
  if (registered) {
    return (
      <div
        className={`min-h-screen flex flex-col lg:flex-row ${inter.variable}`}
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        {/* Left panel */}
        <div className="relative flex flex-col lg:w-[45%] bg-[#020817] px-8 lg:px-12 py-8">
          <header className="flex items-center gap-2.5">
            <img src="/helpify-logo.webp" alt="Helpify" className="h-7 w-auto" width={28} height={28} />
            <span className="text-sm font-semibold text-white tracking-tight">Helpify</span>
          </header>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-[400px] text-center">
              {/* Success icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Solicitud enviada
              </h1>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Hemos registrado tu solicitud de acceso para{' '}
                <span className="text-white font-medium">{registeredEmail}</span>
              </p>

              <div className="mt-8 space-y-4 text-left">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Pendiente de aprobación</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Un administrador revisará tu solicitud y habilitará tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Próximos pasos</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Una vez aprobada, podrás crear tickets y dar seguimiento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white tracking-wide shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:shadow-orange-500/40 active:scale-[0.98]"
              >
                Ir al inicio de sesión
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <footer className="flex items-center justify-center gap-4 pt-6">
            <a href="#" className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors">
              <HeadphonesIcon className="h-3 w-3" /> Soporte
            </a>
            <span className="text-slate-700 text-xs">·</span>
            <a href="#" className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors">
              <ShieldCheckIcon className="h-3 w-3" /> Privacidad
            </a>
          </footer>
        </div>

        {/* Right panel */}
        <div className="relative hidden lg:flex lg:flex-1 flex-col items-center justify-center px-12 py-16 bg-[#0f172a] dot-grid-bg overflow-hidden">
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-md w-full">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl animate-fade-in-up w-full">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-500/10">
                <ShieldCheckIcon className="h-12 w-12 text-orange-500" />
              </div>
            </div>
            <div className="animate-fade-in-up-delay">
              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Acceso controlado{' '}
                <span className="text-orange-500">por seguridad</span>
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed animate-fade-in-up-delay-2">
                Cada cuenta es verificada por un administrador para mantener la integridad del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Register Form ──────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${inter.variable}`}
      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      {/* ══════════════════════════════════════════
          PANEL IZQUIERDO — Formulario de Registro
      ══════════════════════════════════════════ */}
      <div className="relative flex flex-col lg:w-[45%] bg-[#020817] px-8 lg:px-12 py-8">
        {/* Logo */}
        <header className="flex items-center gap-2.5">
          <img src="/helpify-logo.webp" alt="Helpify" className="h-7 w-auto" width={28} height={28} />
          <span className="text-sm font-semibold text-white tracking-tight">Helpify</span>
        </header>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Solicita tu acceso
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Completa el formulario y un administrador habilitará tu cuenta
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                        Nombre completo
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon icon={<User className="h-4 w-4" />}>
                          <input
                            placeholder="Juan Pérez"
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

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                        Correo corporativo
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
                      <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                        Contraseña
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            placeholder="Mínimo 8 caracteres"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 transition-all outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthBar password={watchPassword || ''} />
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                        Confirmar contraseña
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <ShieldCheckIcon className="h-4 w-4" />
                          </div>
                          <input
                            placeholder="Repite tu contraseña"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 transition-all outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                {/* CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 w-full overflow-hidden rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white tracking-wide shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando solicitud...
                    </>
                  ) : (
                    <>
                      Solicitar acceso
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </Form>

            {/* Link to login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-orange-500 hover:text-orange-400 hover:underline transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-4 pt-6">
          <a href="#" className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors">
            <HeadphonesIcon className="h-3 w-3" /> Soporte
          </a>
          <span className="text-slate-700 text-xs">·</span>
          <a href="#" className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 transition-colors">
            <ShieldCheckIcon className="h-3 w-3" /> Privacidad
          </a>
        </footer>
      </div>

      {/* ══════════════════════════════════════════
          PANEL DERECHO — Escaparate Visual
      ══════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:flex-1 flex-col items-center justify-center px-12 py-16 bg-[#0f172a] dot-grid-bg overflow-hidden">
        {/* Radial gradient glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-md w-full">
          {/* Feature cards */}
          <div className="w-full space-y-3 animate-fade-in-up">
            {[
              { icon: TicketIcon, title: 'Crea tickets', desc: 'Reporta incidencias y da seguimiento en tiempo real', color: 'text-orange-500' },
              { icon: Clock, title: 'Resolución rápida', desc: 'Priorización inteligente basada en urgencia', color: 'text-blue-500' },
              { icon: Bell, title: 'Notificaciones', desc: 'Recibe alertas de cada actualización', color: 'text-emerald-500' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Copy */}
          <div className="animate-fade-in-up-delay">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Todo el poder del soporte{' '}
              <span className="text-orange-500">en un solo lugar</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Tu solicitud será revisada por un administrador para garantizar un acceso seguro y controlado.
            </p>
          </div>

          {/* Security badge */}
          <div className="animate-fade-in-up-delay-2 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 backdrop-blur-sm text-sm">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Verificación manual</span> — cada cuenta es aprobada personalmente para mantener la seguridad del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
