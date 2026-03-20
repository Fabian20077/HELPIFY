'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  TicketIcon,
  PlusCircleIcon,
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  TagIcon,
  LogOutIcon,
  MenuIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { removeToken } from '@/lib/auth';

interface SidebarProps {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
  },
  {
    label: 'Tickets',
    href: '/dashboard/tickets',
    icon: <TicketIcon className="h-4 w-4" />,
    roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
  },
  {
    label: 'Crear Ticket',
    href: '/dashboard/tickets/new',
    icon: <PlusCircleIcon className="h-4 w-4" />,
    roles: [UserRole.CUSTOMER, UserRole.AGENT],
  },
  {
    label: 'Usuarios',
    href: '/dashboard/admin/users',
    icon: <UsersIcon className="h-4 w-4" />,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Departamentos',
    href: '/dashboard/admin/departments',
    icon: <BuildingIcon className="h-4 w-4" />,
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Categorías',
    href: '/dashboard/admin/categories',
    icon: <TagIcon className="h-4 w-4" />,
    roles: [UserRole.ADMIN],
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
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

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role as UserRole),
  );

  const handleLogout = () => {
    logout();
  };

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <TicketIcon className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Helpify</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User info + logout */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {getRoleLabel(user.role as UserRole)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            title="Cerrar sesión"
          >
            <LogOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border bg-card">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="bg-card" />
            }
          >
            <MenuIcon className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            {navContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
