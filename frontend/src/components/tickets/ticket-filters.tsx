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
function useDebounce(callback: (term: string) => void, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  return useCallback((term: string) => {
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      callback(term);
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tickets..."
          className="pl-9 w-full rounded-xl"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <Select
        value={currentStatus}
        onValueChange={(value: string | null) => handleFilterChange('status', value === 'all' || !value ? '' : value)}
      >
        <SelectTrigger className="w-[130px] rounded-xl">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
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
        <SelectTrigger className="w-[130px] rounded-xl">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value={TicketPriority.LOW}>Baja</SelectItem>
          <SelectItem value={TicketPriority.MEDIUM}>Media</SelectItem>
          <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
          <SelectItem value={TicketPriority.CRITICAL}>Crítica</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
