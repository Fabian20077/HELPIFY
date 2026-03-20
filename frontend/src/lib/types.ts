// ============================================================================
// Helpify — Type System
// Mirrors backend Prisma models exactly. Zero `any` types.
// ============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  ADMIN = 'admin',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationType {
  TICKET_ASSIGNED = 'ticket_assigned',
  STATUS_CHANGED = 'status_changed',
  COMMENTED = 'commented',
  RESOLVED = 'resolved',
}

// ── State Machine (mirrors backend VALID_TRANSITIONS) ────────────────────────

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [],
};

// ── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  users?: Pick<User, 'id' | 'name' | 'role'>[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  departmentId: string;
  department?: { name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  editedAt: string | null;
  createdAt: string;
  author?: Pick<User, 'name' | 'role'>;
}

export interface Attachment {
  id: string;
  ticketId: string;
  uploadedBy: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changer?: Pick<User, 'name'>;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: string;
  assignedToId: string | null;
  departmentId: string | null;
  categoryId: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  urgencyScore?: number;
  createdBy?: Pick<User, 'name' | 'email'>;
  assignedTo?: Pick<User, 'name' | 'email'> | null;
  department?: Pick<Department, 'name'> | null;
  category?: Pick<Category, 'name'> | null;
  comments?: Comment[];
  attachments?: Attachment[];
  history?: TicketHistory[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  ticketId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  results?: number;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    prev?: number;
    next?: number;
  };
}

export interface AuthResponse {
  token: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'departmentId'>;
}

// ── Session (decoded from JWT in middleware) ──────────────────────────────────

export interface SessionPayload {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

export interface TicketListSearchParams {
  page?: string;
  limit?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  departmentId?: string;
}

// ── Metrics Types ────────────────────────────────────────────────────────────────

export interface MetricsByStatus {
  open: number;
  in_progress: number;
  waiting: number;
  resolved: number;
  closed: number;
}

export interface MetricsRecentTicket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  urgencyScore: number;
}

export interface CustomerMetrics {
  total: number;
  byStatus: MetricsByStatus;
  recentTickets: MetricsRecentTicket[];
}

export interface AgentMetrics {
  totalAssigned: number;
  byStatus: MetricsByStatus;
  recentAssigned: MetricsRecentTicket[];
}

export interface AdminMetrics {
  total: number;
  unassigned: number;
  byStatus: MetricsByStatus;
  avgResolutionHours: number;
  resolvedCount: number;
}

export type MetricsData = CustomerMetrics | AgentMetrics | AdminMetrics;
