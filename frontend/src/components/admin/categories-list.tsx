'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusIcon, PencilIcon, RefreshCw } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api-config';

interface Department {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  department: { name: string };
  departmentId: string;
}

interface CategoriesListProps {
  initialCategories: Category[];
  initialDepartments: Department[];
}

export function CategoriesList({ initialCategories, initialDepartments }: CategoriesListProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1', departmentId: '' });
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    try {
      const [catRes, deptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`, { headers }),
        fetch(`${API_BASE_URL}/departments`, { headers }),
      ]);
      const catData = await catRes.json();
      const deptData = await deptRes.json();
      if (catData.status === 'success') setCategories(catData.data);
      if (deptData.status === 'success') setDepartments(deptData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = departmentFilter === 'all'
    ? categories
    : categories.filter(c => c.departmentId === departmentFilter);

  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const deptName = cat.department?.name || 'Sin departamento';
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: '#6366f1', departmentId: departments[0]?.id || '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, color: cat.color, departmentId: cat.departmentId });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.departmentId) return;
    
    setSaving(true);
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    try {
      if (editingCategory) {
        const res = await fetch(`${API_BASE_URL}/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ name: formData.name, color: formData.color }),
        });
        const data = await res.json();
        if (data.status === 'success') {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...data.data } : c));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.status === 'success') {
          setCategories(prev => [...prev, { ...data.data, department: departments.find(d => d.id === formData.departmentId) }]);
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtrar por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v ?? '')}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedCategories).map(([deptName, cats]) => (
          <Card key={deptName}>
            <CardHeader>
              <CardTitle className="text-lg">{deptName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {cats.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => openEditDialog(cat)}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {cats.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin categorías</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {Object.keys(groupedCategories).length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay categorías{departmentFilter !== 'all' ? ' en este departamento' : ''}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value ?? '' }))}
                disabled={!!editingCategory}
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.departmentId 
                      ? departments.find(d => d.id === formData.departmentId)?.name || 'Seleccionar departamento'
                      : 'Seleccionar departamento'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.departmentId}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}