'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  department: { id: string; name: string } | null;
  workload: number;
}

interface AgentSelectorProps {
  ticketId: string;
  currentAssignedToId: string | null;
  currentAssignedToName: string | null;
  onAssign: (agent: Agent | null) => Promise<void>;
}

function getWorkloadColor(workload: number): string {
  if (workload <= 2) return 'bg-green-500';
  if (workload <= 5) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function AgentSelector({ ticketId, currentAssignedToId, currentAssignedToName, onAssign }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>(currentAssignedToId || 'none');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const token = getToken();
        if (!token) {
          setError('Sesión no válida');
          return;
        }
        const list = await api.get<Agent[]>('/users/agents', token);
        setAgents(list);
      } catch {
        setError('Error al cargar agentes');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const handleValueChange = (newValue: string | null) => {
    const value = newValue ?? 'none';
    const newAgent = value === 'none' ? null : agents.find(a => a.id === value);
    
    if (newAgent?.id === currentAssignedToId) return;
    
    setSelectedValue(value);
    setIsAssigning(true);
    
    onAssign(newAgent ?? null)
      .catch((err: unknown) => {
        setSelectedValue(currentAssignedToId || 'none');
        setError(err instanceof Error ? err.message : 'Error al asignar');
        setTimeout(() => setError(null), 3000);
      })
      .finally(() => setIsAssigning(false));
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Cargando agentes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={selectedValue} onValueChange={handleValueChange} disabled={isAssigning}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedValue === 'none' 
              ? 'Sin asignar' 
              : agents.find(a => a.id === selectedValue)?.name || 'Sin asignar'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sin asignar</span>
            </div>
          </SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getWorkloadColor(agent.workload)}`} />
                <span>{agent.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({agent.workload})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isAssigning && (
        <p className="text-xs text-muted-foreground">Asignando...</p>
      )}
    </div>
  );
}