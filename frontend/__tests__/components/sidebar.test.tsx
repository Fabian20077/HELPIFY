import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/sidebar';
import { UserRole } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    logout: jest.fn(),
  })),
}));

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => children,
  SheetContent: ({ children }: { children: React.ReactNode }) => children,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => children,
  SheetTitle: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders customer links and hides admin links', () => {
    render(<Sidebar user={{ id: '1', name: 'Cust', email: 'c@c.com', role: UserRole.CUSTOMER }} />);
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tickets').length).toBeGreaterThan(0);

    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Departamentos')).not.toBeInTheDocument();
  });

  it('renders admin links and hides customer-only links', () => {
    render(<Sidebar user={{ id: '2', name: 'Admin', email: 'a@a.com', role: UserRole.ADMIN }} />);
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tickets').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Usuarios').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Departamentos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Categorías').length).toBeGreaterThan(0);
  });

  it('displays user initials in avatar', () => {
    render(<Sidebar user={{ id: '1', name: 'John Doe', email: 'j@d.com', role: UserRole.CUSTOMER }} />);
    expect(screen.getAllByText('JD').length).toBeGreaterThan(0);
  });
});
