'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TicketStatus, TicketPriority } from '@/lib/types';
import { SearchIcon, Loader2 } from 'lucide-react';

// Helper custom hook for debouncing
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimer(newTimer);
  }, [callback, delay, timer]);
}

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset to page 1 always when filters change
      params.delete('page');
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString(name, value)}`);
    });
  };

  const handleSearch = useDebounce((term: string) => {
    handleFilterChange('search', term);
  }, 400);

  const currentStatus = searchParams.get('status') ?? '';
  const currentPriority = searchParams.get('priority') ?? '';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tickets por título o descripción..."
          className="pl-9 w-full"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Select 
          value={currentStatus} 
          onValueChange={(value: string | null) => handleFilterChange('status', value === 'all' || !value ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Estado (Todos)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value={TicketStatus.OPEN}>Abierto</SelectItem>
            <SelectItem value={TicketStatus.IN_PROGRESS}>En Progreso</SelectItem>
            <SelectItem value={TicketStatus.WAITING}>En Espera</SelectItem>
            <SelectItem value={TicketStatus.RESOLVED}>Resuelto</SelectItem>
            <SelectItem value={TicketStatus.CLOSED}>Cerrado</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={currentPriority} 
          onValueChange={(value: string | null) => handleFilterChange('priority', value === 'all' || !value ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Prioridad (Todas)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las priori.</SelectItem>
            <SelectItem value={TicketPriority.LOW}>Baja</SelectItem>
            <SelectItem value={TicketPriority.MEDIUM}>Media</SelectItem>
            <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
            <SelectItem value={TicketPriority.CRITICAL}>Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
