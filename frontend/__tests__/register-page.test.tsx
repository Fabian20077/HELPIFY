import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from '@/app/register/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock fetch
global.fetch = jest.fn();

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form', () => {
    render(<RegisterPage />);
    
    expect(screen.getByText('Solicita tu acceso')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('juan@empresa.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repite tu contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar acceso/i })).toBeInTheDocument();
  });

  it('shows pending approval message after successful registration', async () => {
    const mockResponse = {
      status: 'success',
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.',
      data: {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'pending',
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RegisterPage />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('juan@empresa.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), {
      target: { value: 'password123' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }));

    await waitFor(() => {
      expect(screen.getByText('Solicitud enviada')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Pendiente de aprobación/i)).toBeInTheDocument();
      expect(screen.getByText(/Ir al inicio de sesión/i)).toBeInTheDocument();
    });
  });

  it('shows error message when registration fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'El correo electrónico ya está registrado' }),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Existing User' },
    });
    fireEvent.change(screen.getByPlaceholderText('juan@empresa.com'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico ya está registrado')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<RegisterPage />);

    // Submit with short password
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('juan@empresa.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }));

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('juan@empresa.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /enviando solicitud/i }).length).toBeGreaterThan(0);
    });
  });
});
