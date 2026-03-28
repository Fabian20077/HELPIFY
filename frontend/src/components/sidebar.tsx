'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import type { User } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  TicketIcon,
  PlusCircleIcon,
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  TagIcon,
  LogOutIcon,
  MenuIcon,
  HelpCircleIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  InboxIcon,
  ClockIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';

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
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboardIcon,
    roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
  },
  {
    label: 'All Tickets',
    href: '/dashboard/tickets',
    icon: TicketIcon,
    roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
  },
  {
    label: 'Usuarios',
    href: '/dashboard/admin/users',
    icon: UsersIcon,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Departamentos',
    href: '/dashboard/admin/departments',
    icon: BuildingIcon,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Categorías',
    href: '/dashboard/admin/categories',
    icon: TagIcon,
    roles: [UserRole.ADMIN],
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.CUSTOMER]: 'Cliente',
    [UserRole.AGENT]: 'Agente',
    [UserRole.ADMIN]: 'Administrador',
  };
  return labels[role];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role as UserRole),
  );

  const showNewTicket =
    user.role === UserRole.CUSTOMER || user.role === UserRole.AGENT;

  const navContent = (
    <div className="flex h-full flex-col bg-[#0f172a] border-r border-slate-800">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
          <img
            src="/helpify-logo.webp"
            alt="Helpify"
            className="h-5 w-5 object-contain"
            width={20}
            height={20}
          />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-white tracking-tight">Helpify</p>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">Support Engine</p>
        </div>
      </div>

      {/* ── New Ticket CTA ── */}
      {showNewTicket && (
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => { router.push('/dashboard/tickets/new'); setMobileOpen(false); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 active:scale-[0.97]"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Nuevo Ticket
          </button>
        </div>
      )}

      {/* ── Quick Views ── */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
          Vistas Rápidas
        </p>
        <div className="space-y-1">
          <Link
            href="/dashboard/tickets?status=open"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <InboxIcon className="h-4 w-4 text-slate-500" />
              <span>Mis Abiertos</span>
            </div>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] font-medium text-slate-400">
              3
            </span>
          </Link>
          <Link
            href="/dashboard/tickets?priority=high"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-red-500" />
              <span>Urgentes</span>
            </div>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[11px] font-medium text-red-400">
              1
            </span>
          </Link>
          <Link
            href="/dashboard/tickets?status=waiting"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-yellow-500" />
              <span>En Espera</span>
            </div>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500/10 px-1.5 text-[11px] font-medium text-yellow-400">
              2
            </span>
          </Link>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white border-l-2 border-orange-500 pl-[10px]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent pl-[10px]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRightIcon className="h-3 w-3 text-orange-500/60" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Help Center ── */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-slate-500 hover:text-slate-400 hover:bg-slate-800/30 transition-colors cursor-pointer">
          <HelpCircleIcon className="h-4 w-4" />
          <span className="text-xs">Help Center</span>
        </div>
      </div>

      {/* ── User footer ── */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{getRoleLabel(user.role as UserRole)}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <button className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white transition-colors" />
            }
          >
            <MenuIcon className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-r border-slate-800">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            {navContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
