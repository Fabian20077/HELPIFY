import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/sidebar';
import { UserRole } from '@/lib/types';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders customer links and hides admin links', () => {
    render(<Sidebar user={{ id: '1', name: 'Cust', email: 'c@c.com', role: UserRole.CUSTOMER }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Crear Ticket')).toBeInTheDocument();
    
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Departamentos')).not.toBeInTheDocument();
  });

  it('renders admin links and hides customer-only links', () => {
    render(<Sidebar user={{ id: '2', name: 'Admin', email: 'a@a.com', role: UserRole.ADMIN }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Departamentos')).toBeInTheDocument();
    expect(screen.getByText('Categorías')).toBeInTheDocument();
    
    expect(screen.queryByText('Crear Ticket')).not.toBeInTheDocument();
  });

  it('displays user initials in avatar', () => {
    render(<Sidebar user={{ id: '1', name: 'John Doe', email: 'j@d.com', role: UserRole.CUSTOMER }} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
