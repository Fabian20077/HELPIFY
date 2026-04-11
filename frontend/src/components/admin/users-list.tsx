'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, RefreshCw, UserCheck, UserX, Trash2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: { id: string; name: string } | null;
  departmentId: string | null;
  createdAt: string;
}

export interface UsersListProps {
  initialUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    department: { id: string; name: string } | null | undefined;
    departmentId: string | null;
    createdAt: string;
  }>;
}

const roleColors: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const roleLabels: Record<string, string> = {
  customer: 'Cliente',
  agent: 'Agente',
  admin: 'Admin',
  pending: 'Pendiente',
};

export function UsersList({ initialUsers }: UsersListProps) {
  const router = useRouter();
  type UserRow = UsersListProps['initialUsers'][number];
  const [users, setUsers] = useState<UsersListProps['initialUsers']>(initialUsers);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all'); // 'all', 'pending', 'processed'
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Dialogs state
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [approveRole, setApproveRole] = useState<string>('customer');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      if (userStatusFilter !== 'all') params.set('status', userStatusFilter);

      const res = await fetch(`${API_BASE_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [roleFilter, statusFilter, userStatusFilter]);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    setUpdatingId(userId);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.data } : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUser(userId, { role: newRole });
  };

  const handleDepartmentChange = (userId: string, value: string) => {
    const newDeptId = value === 'unassigned' ? null : value;
    const dept = departments.find(d => d.id === newDeptId) || null;
    updateUser(userId, {
      departmentId: newDeptId,
      department: dept ? { id: dept.id, name: dept.name } : null
    });
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { isActive: !currentStatus });
  };

  const handleApprove = async () => {
    if (!approveDialog.user) return;
    setUpdatingId(approveDialog.user.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${approveDialog.user.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: approveRole }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(prev => prev.map(u => u.id === approveDialog.user!.id ? { ...u, ...data.data } : u));
        setApproveDialog({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.user) return;
    setUpdatingId(rejectDialog.user.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${rejectDialog.user.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(prev => prev.filter(u => u.id !== rejectDialog.user!.id));
        setRejectDialog({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setUpdatingId(deleteDialog.user.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${deleteDialog.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(prev => prev.filter(u => u.id !== deleteDialog.user!.id));
        setDeleteDialog({ open: false, user: null });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pendingUsers = users.filter(u => u.role === 'pending');
  const processedUsers = users.filter(u => u.role !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && userStatusFilter !== 'processed' && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Solicitudes Pendientes ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Registrado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={roleColors.pending}>{roleLabels.pending}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setApproveRole('customer');
                              setApproveDialog({ open: true, user });
                            }}
                            disabled={updatingId === user.id}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-brand hover:text-brand-hover hover:bg-brand/10"
                            onClick={() => setRejectDialog({ open: true, user })}
                            disabled={updatingId === user.id}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v ?? 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Solo pendientes</SelectItem>
                  <SelectItem value="processed">Solo procesados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? '')} disabled={userStatusFilter === 'pending'}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? '')} disabled={userStatusFilter === 'pending'}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed Users Table */}
      {processedUsers.length > 0 && userStatusFilter !== 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios Activos ({processedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Departamento</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Registrado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {processedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value ?? '')}
                          disabled={updatingId === user.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="agent">Agente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.department?.id || 'unassigned'}
                          onValueChange={(value) => handleDepartmentChange(user.id, value || 'unassigned')}
                          disabled={updatingId === user.id || loadingDepts}
                        >
                          <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800 text-slate-300">
                            <SelectValue>
                              {loadingDepts
                                ? "Cargando..."
                                : user.department?.name || "Sin asignar"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="unassigned" className="text-slate-500 italic">Sin asignar</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                            disabled={updatingId === user.id}
                          />
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-brand hover:text-brand-hover hover:bg-brand/10"
                          onClick={() => setDeleteDialog({ open: true, user })}
                          disabled={updatingId === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {processedUsers.length === 0 && userStatusFilter !== 'pending' && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron usuarios
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open: boolean) => !open && setApproveDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Usuario</DialogTitle>
            <DialogDescription>
              Estás por aprobar la cuenta de <strong>{approveDialog.user?.name}</strong> ({approveDialog.user?.email}).
              Selecciona el rol que se le asignará.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rol a asignar</label>
              <Select value={approveRole} onValueChange={(value) => value && setApproveRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, user: null })}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={updatingId === approveDialog.user?.id}>
              {updatingId === approveDialog.user?.id ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aprobando...</>
              ) : (
                <><UserCheck className="h-4 w-4 mr-2" />Aprobar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open: boolean) => !open && setRejectDialog({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Solicitud</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas rechazar la solicitud de <strong>{rejectDialog.user?.name}</strong> ({rejectDialog.user?.email})?
              Esta acción eliminará la cuenta del sistema y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-brand hover:bg-brand-hover"
              disabled={updatingId === rejectDialog.user?.id}
            >
              {updatingId === rejectDialog.user?.id ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rechazando...</>
              ) : (
                <><UserX className="h-4 w-4 mr-2" />Rechazar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => !open && setDeleteDialog({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Eliminar Usuario
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteDialog.user?.name}</strong> ({deleteDialog.user?.email})?
              <br /><br />
              <span className="text-warning font-medium">Esta acción no se puede deshacer.</span>
              <br />
              Sus tickets serán reasignados al administrador y sus comentarios se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-brand hover:bg-brand-hover"
              disabled={updatingId === deleteDialog.user?.id}
            >
              {updatingId === deleteDialog.user?.id ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Eliminando...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
