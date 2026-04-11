'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole, type User } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  Ticket,
  Plus,
  Home,
  Users,
  Building,
  Tag,
  LogOut,
  List,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: Home, roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN] },
  { label: 'Tickets', href: '/dashboard/tickets', icon: List, roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN] },
  { label: 'Usuarios', href: '/dashboard/admin/users', icon: Users, roles: [UserRole.ADMIN] },
  { label: 'Departamentos', href: '/dashboard/admin/departments', icon: Building, roles: [UserRole.ADMIN] },
  { label: 'Categorías', href: '/dashboard/admin/categories', icon: Tag, roles: [UserRole.ADMIN] },
];

const QUICK_VIEWS = [
  { label: 'Abiertos', href: '/dashboard/tickets?status=open', icon: List, count: 3, color: 'text-sky-400' },
  { label: 'Urgentes', href: '/dashboard/tickets?priority=high', icon: AlertTriangle, count: 1, color: 'text-danger' },
  { label: 'Espera', href: '/dashboard/tickets?status=waiting', icon: Clock, count: 2, color: 'text-warning' },
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleLabel(role: UserRole): string {
  const m: Record<UserRole, string> = {
    [UserRole.CUSTOMER]: 'Cliente',
    [UserRole.AGENT]: 'Agente',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.PENDING]: 'Pendiente',
  };
  return m[role];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const items = NAV_ITEMS.filter(i => i.roles.includes(user.role as UserRole));
  const showNewTicket = user.role === UserRole.CUSTOMER || user.role === UserRole.AGENT;

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20">
          <img src="/helpify-logo.webp" alt="Helpify" className="h-5 w-5" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-white tracking-tight">Helpify</p>
          <p className="text-[10px] text-white/70 tracking-widest uppercase">Support</p>
        </div>
      </div>

      {/* CTA */}
      {showNewTicket && (
        <div className="px-3 pb-3">
          <button
            onClick={() => { router.push('/dashboard/tickets/new'); setMobileOpen(false); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-wing-2 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all hover:shadow-brand/40 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ticket
          </button>
        </div>
      )}

      {/* Quick Views */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest px-3 mb-2">
          Vistas
        </p>
        <div className="space-y-0.5">
          {QUICK_VIEWS.map(qv => (
            <Link
              key={qv.label}
              href={qv.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/80 transition-all hover:bg-surface-hover hover:text-white group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface group-hover:bg-brand/10 transition-colors">
                  <qv.icon className={`h-3.5 w-3.5 ${qv.color}`} />
                </div>
                <span>{qv.label}</span>
              </div>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-surface text-[11px] font-medium text-foreground-subtle">
                {qv.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-4 my-2 h-px bg-border-subtle" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand/10 text-white'
                  : 'text-white/60 hover:bg-surface-hover hover:text-white/90'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      {/* Help */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-white/70 transition-colors hover:bg-surface-hover cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs">Help Center</span>
        </div>
      </div>

      {/* User Footer */}
      <div className="mx-3 mt-auto rounded-xl border border-border/30 bg-surface p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-brand/5 text-[11px] font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/60">{getRoleLabel(user.role as UserRole)}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="shrink-0 rounded-lg p-1.5 text-foreground-subtle hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col h-screen sticky top-0">
        <div className="flex-1 border-r border-border/30 bg-sidebar/95 backdrop-blur-xl depth-shadow">
          {navContent}
        </div>
      </aside>

      {/* Mobile */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="rounded-lg glass px-2.5 py-2 text-foreground-subtle hover:text-foreground">
            <List className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-r-0 bg-transparent [&>button]:hidden">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <div className="h-full glass-strong rounded-xl shadow-glass-lg overflow-hidden">
              {navContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
