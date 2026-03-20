'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusIcon, PencilIcon, RefreshCw } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    users: number;
    tickets: number;
  };
}

interface DepartmentsListProps {
  initialDepartments: Department[];
}

export function DepartmentsList({ initialDepartments }: DepartmentsListProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departments', { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        const withCounts = await Promise.all(
          data.data.map(async (dept: any) => {
            const usersRes = await fetch(`/api/departments/${dept.id}`, { credentials: 'include' });
            const usersData = await usersRes.json();
            return {
              ...dept,
              _count: {
                users: usersData.data?.users?.length || 0,
                tickets: 0,
              },
            };
          })
        );
        setDepartments(withCounts);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      if (editingDepartment) {
        const res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.status === 'success') {
          setDepartments(prev => prev.map(d => d.id === editingDepartment.id ? { ...d, ...data.data } : d));
        }
      } else {
        const res = await fetch('/api/departments', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.status === 'success') {
          setDepartments(prev => [...prev, { ...data.data, _count: { users: 0, tickets: 0 } }]);
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving department:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Departamentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDepartments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Departamento
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {dept.description || 'Sin descripción'}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{dept._count?.users || 0} usuarios</span>
                <span>{dept._count?.tickets || 0} tickets</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {departments.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay departamentos registrados
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del departamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}