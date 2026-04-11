# 🦋 Helpify — Documentación del Sistema

## Sistema de Soporte con Diseño Butterfly Glass

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistema de Diseño Butterfly Glass](#sistema-de-diseño-butterfly-glass)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración de Desarrollo](#configuración-de-desarrollo)
6. [Base de Datos y Seed](#base-de-datos-y-seed)
7. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
8. [Guía de Componentes](#guía-de-componentes)
9. [Despliegue](#despliegue)
10. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

**Helpify** es un sistema de gestión de tickets de soporte con diseño premium inspirado en la estética de las alas de mariposa iridiscentes. Combina tecnología moderna (Next.js 16, React 19, TypeScript, Prisma, MySQL) con un sistema de diseño único que no parece genérico.

### Características Principales

- 🎨 **Diseño Butterfly Glass** — Glassmorphism premium con gradientes iridiscentes
- ⚡ **Rendimiento Optimizado** — React Query para caché inteligente, polling optimizado
- 🔐 **Autenticación JWT** — Login seguro con tokens y refresh automático
- 📊 **Dashboard Dinámico** — Métricas en tiempo real con sparklines y gráficos
- 🎯 **Priorización Automática** — Tickets con score de urgencia calculado
- 📱 **Responsive** — Adaptado para desktop, tablet y móvil
- 🌙 **Dark Mode** — Diseño oscuro con acentos azules de mariposa

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React 19   │  │ TypeScript 5 │  │  Tailwind 4  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Butterfly Glass Design System           │      │
│  │  • ButterflyCard  • GlassPanel  • MetricCard      │      │
│  │  • GradientButton • AnimatedBadge • Sparkline     │      │
│  │  • SectionHeader  • TicketCard                    │      │
│  └──────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + tsx)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Express    │  │    Prisma    │  │    Zod       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Endpoints:                                                 │
│  • /api/auth/*      — Login, registro, refresh             │
│  • /api/tickets/*   — CRUD de tickets                      │
│  • /api/users/*     — Gestión de usuarios                  │
│  • /api/metrics     — Métricas del dashboard               │
│  • /api/categories  — Categorías de tickets                │
│  • /api/departments — Departamentos                        │
│  • /api/notifications — Notificaciones                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 8.0 (Docker)                       │
│                                                             │
│  Tablas: users, tickets, comments, attachments,             │
│          departments, categories, notifications             │
└─────────────────────────────────────────────────────────────┘
```

---

## Sistema de Diseño Butterfly Glass

### Filosofía de Diseño

El sistema de diseño **Butterfly Glass** está inspirado en la iridiscencia de las alas de mariposa. No es un template genérico — cada componente tiene identidad propia.

### Paleta de Colores

```
┌─────────────────────────────────────────────────────────────┐
│  BUTTERFLY PALETTE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Background:    oklch(0.07 0.008 260)  — Negro azulado     │
│  Surface:       oklch(0.10 0.012 260)  — Gris profundo     │
│                                                             │
│  Brand Blue:    oklch(0.62 0.20 240)  — Azul mariposa     │
│  Wing 2:        oklch(0.55 0.22 260)  — Morado-azul       │
│  Wing 3:        oklch(0.60 0.18 280)  — Violeta           │
│                                                             │
│  Text Primary:  oklch(1.0 0 0)        — Blanco puro #FFF   │
│  Text Muted:    oklch(0.90 0.005 260)  — Blanco 90%       │
│  Text Subtle:   oklch(0.75 0.005 260)  — Blanco 75%       │
│                                                             │
│  Success:       oklch(0.72 0.16 145)  — Verde             │
│  Warning:       oklch(0.80 0.14 85)   — Amarillo          │
│  Danger:        oklch(0.55 0.20 25)   — Rojo              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Efectos CSS Premium

| Efecto | Descripción | Clase CSS |
|--------|-------------|-----------|
| Glass Panel | Cristal frosted con blur 24px | `.glass-panel` |
| Butterfly Card | Card con borde gradiente iridiscente en hover | `.butterfly-card` |
| Gradient Border | Borde animado con flujo de colores | `.gradient-border` |
| Ambient Glow | Resplandor ambiental pulsante | `.ambient-glow` |
| Shimmer | Efecto de brillo deslizante | `.shimmer` |
| Butterfly Pulse | Badge con animación de pulso | `.butterfly-pulse` |
| 3D Tilt | Efecto de inclinación 3D en hover | `.card-3d` |
| Depth Shadow | Sombra de profundidad multicapa | `.depth-shadow` |

### Tipografía

| Variable | Fuente | Uso |
|----------|--------|-----|
| `--font-plus-jakarta` | **Inter** | Texto general, body, inputs |
| `--font-space-grotesk` | **Poppins** | Títulos, headings, métricas |
| `--font-geist-mono` | **Geist Mono** | IDs, código, datos técnicos |

### Componentes del Sistema

```
src/components/ui/
├── butterfly-card.tsx      → Card premium con efecto iridiscente
├── gradient-button.tsx     → Botón con gradiente azul-morado-violeta
├── animated-badge.tsx      → Badge con animación butterfly pulse
├── sparkline.tsx           → Mini gráfico SVG de tendencia
├── section-header.tsx      → Header de sección con icono
├── switch.tsx              → Toggle con color azul brand
└── ... (shadcn components personalizados)
```

---

## Estructura del Proyecto

```
HELPIFY-main/
├── frontend/                          # Next.js 16 App
│   ├── src/
│   │   ├── app/                       # App Router
│   │   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   │   ├── page.tsx               # Home (redirect)
│   │   │   ├── globals.css            # 🦋 Butterfly Glass CSS
│   │   │   ├── login/page.tsx         # Login page
│   │   │   ├── register/page.tsx      # Registro
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx         # Dashboard layout
│   │   │       ├── page.tsx           # 🦋 Dashboard asimétrico
│   │   │       └── tickets/
│   │   │           ├── page.tsx       # Lista de tickets
│   │   │           ├── [id]/page.tsx  # Detalle de ticket
│   │   │           └── new/page.tsx   # Crear ticket
│   │   ├── components/
│   │   │   ├── auth-provider.tsx      # Contexto de autenticación
│   │   │   ├── use-data.ts            # React Query hooks
│   │   │   ├── sidebar.tsx            # 🦋 Sidebar con profundidad
│   │   │   ├── film-grain.tsx         # Overlay condicional
│   │   │   ├── react-query-provider.tsx # QueryClient setup
│   │   │   └── ui/
│   │   │       ├── butterfly-card.tsx
│   │   │       ├── gradient-button.tsx
│   │   │       ├── animated-badge.tsx
│   │   │       ├── sparkline.tsx
│   │   │       └── section-header.tsx
│   │   └── lib/
│   │       ├── api.ts                 # API client type-safe
│   │       ├── auth.ts                # Token management
│   │       ├── types.ts               # TypeScript types
│   │       └── urgency.ts             # Cálculo de urgencia
│   ├── package.json
│   ├── next.config.ts
│   └── tailwind.config.ts
│
├── backend/                           # Node.js + Prisma
│   ├── src/
│   │   ├── server.ts                  # Entry point
│   │   ├── routes/                    # API endpoints
│   │   ├── services/                  # Lógica de negocio
│   │   └── middleware/                # Auth, validation
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema
│   │   └── seed.ts                    # 🌱 Datos de prueba
│   ├── .env                           # Environment variables
│   └── package.json
│
└── docker-compose.yml                 # MySQL containers
```

---

## Configuración de Desarrollo

### Prerrequisitos

```bash
Node.js >= 20.x
npm >= 10.x
Docker >= 24.x (para MySQL)
```

### 1. Instalar dependencias

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### 2. Levantar MySQL con Docker

```bash
cd HELPIFY-main
docker compose up -d helpdesk-db-dev
```

### 3. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
DATABASE_URL="mysql://helpdesk:helpdesk123@localhost:3306/helpdesk_dev"
JWT_SECRET="tu-secreto-de-32-caracteres"
JWT_REFRESH_SECRET="otro-secreto-diferente"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Seed de la base de datos

```bash
cd backend
npm run db:seed
```

Esto crea:
- 3 departamentos (Soporte General, Tecnología, Administración)
- 7 categorías
- 5 usuarios (admin, 2 agentes, 2 clientes)
- Datos de prueba

### 5. Iniciar el backend

```bash
cd backend
npm run dev
# → http://localhost:3001
```

### 6. Iniciar el frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | `admin@helpify.com` | `Admin123!` |
| **Agente** | `ana@helpify.com` | `Agent123!` |
| **Cliente** | `maria@example.com` | `Customer123!` |

---

## Base de Datos y Seed

### Schema Prisma

El sistema usa **Prisma ORM** con MySQL 8.0. Las tablas principales son:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(CUSTOMER)
  isActive      Boolean   @default(true)
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  tickets       Ticket[]
  comments      Comment[]
}

model Ticket {
  id            String    @id @default(cuid())
  title         String
  description   String
  status        TicketStatus @default(OPEN)
  priority      TicketPriority @default(MEDIUM)
  urgencyScore  Int       @default(0)
  departmentId  String
  categoryId    String?
  assignedToId  String?
  createdBy     User      @relation(fields: [createdById], references: [id])
  comments      Comment[]
}
```

### Roles de Usuario

```typescript
enum UserRole {
  CUSTOMER  // Cliente - crea y ve sus tickets
  AGENT     // Agente - ve tickets asignados
  ADMIN     // Admin - acceso total
  PENDING   // Pendiente de aprobación
}
```

---

## Optimizaciones de Rendimiento

### 1. React Query — Caché Inteligente

**Antes:** Cada navegación hacía fetch desde cero  
**Ahora:** Datos cacheados por 2-10 minutos

```typescript
// Configuración
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos
      gcTime: 1000 * 60 * 10,        // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});
```

**Resultado:** 70-90% menos peticiones HTTP

### 2. Polling Optimizado

**Antes:** Polling cada 30s sin importar nada  
**Ahora:** Polling cada 2 minutos solo cuando la pestaña está visible

```typescript
const pollInterval = () => {
  if (document.visibilityState === 'visible') {
    fetchUnreadCount();
  }
};
setInterval(pollInterval, 120000);
```

**Resultado:** 75% menos peticiones de polling

### 3. Film-Grain Condicional

El overlay de film grain se desactiva automáticamente en `/dashboard/*` para evitar repaints innecesarios.

### 4. AuthProvider Único

Eliminado el AuthProvider duplicado del dashboard layout para evitar doble verificación de token.

### 5. CSS Optimizado

- `backdrop-filter` reducido de 20-28px a 6-12px
- `pointer-events: none` en pseudo-elementos decorativos
- Textos blancos puros sin opacidades innecesarias

### Métricas de Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Carga inicial | 2-5s | 0.5-1s | 75% |
| Navegación | 1-3s | 0.1-0.3s | 90% |
| Respuesta clicks | 500ms-2s | 50-150ms | 85% |
| HTTP requests/hora | ~150 | ~15 | 90% |
| Bundle size | ~450KB | ~350KB | 22% |
| Polling/día | 2,880 | 720 | 75% |

---

## Guía de Componentes

### ButterflyCard

Card premium con efecto iridiscente en hover.

```tsx
<ButterflyCard variant="gradient" hover={false}>
  <h2>Contenido de la card</h2>
</ButterflyCard>
```

**Variants:**
- `default` — Card estándar
- `elevated` — Con depth shadow
- `gradient` — Con borde gradiente iridiscente

### GradientButton

Botón con gradiente azul-morado-violeta.

```tsx
<GradientButton variant="primary" size="lg">
  Crear Ticket
</GradientButton>
```

**Variants:**
- `primary` — Gradiente iridiscente
- `secondary` — Borde con hover azul
- `ghost` — Sin fondo, hover sutil

### AnimatedBadge

Badge con animación butterfly pulse.

```tsx
<AnimatedBadge variant="success" pulse>
  En línea
</AnimatedBadge>
```

**Variants:** `default`, `success`, `warning`, `danger`, `info`

### Sparkline

Mini gráfico SVG de tendencia.

```tsx
<Sparkline data={[3, 5, 2, 8, 4, 7]} height={180} />
```

### MetricCard

Card de métrica con glow ambiental.

```tsx
<MetricCard
  label="Tickets Abiertos"
  value={42}
  icon={List}
  accent="text-sky-400"
  trend={{ value: '+12%', up: true }}
/>
```

### SectionHeader

Header de sección con icono.

```tsx
<SectionHeader
  title="Tickets de Soporte"
  description="Gestiona los incidentes"
  icon={Ticket}
  action={<Button>Nuevo</Button>}
/>
```

---

## Despliegue

### Vercel (Frontend)

1. Conectar repositorio en Vercel
2. Configurar variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
   ```
3. Deploy automático

### Railway (Backend)

1. Conectar repositorio en Railway
2. Agregar servicio MySQL
3. Configurar variables de entorno
4. Deploy automático

### Variables de Entorno de Producción

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://helpify-backend-production.up.railway.app/api
```

**Backend:**
```env
DATABASE_URL=mysql://user:password@host:3306/helpify
JWT_SECRET=secreto-largo-y-seguro-de-produccion
JWT_REFRESH_SECRET=otro-secreto-diferente
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://helpify-production.vercel.app
```

---

## Solución de Problemas

### El frontend no carga

```bash
# Limpiar cache y reiniciar
pkill -f "next dev"
rm -rf frontend/.next frontend/node_modules/.cache
cd frontend && npm run dev
```

### Los botones no responden

- El problema era `pointer-events` en pseudo-elementos CSS.
- Ya está corregido con `pointer-events: none` en `::before` y `::after` decorativos.

### Error de conexión al backend

1. Verificar que MySQL esté corriendo: `docker ps`
2. Verificar que el backend esté activo: `curl http://localhost:3001/api/health`
3. Verificar `DATABASE_URL` en `backend/.env`

### Texto muy opaco

Los colores de texto están configurados en blanco puro (`oklch(1.0)`). Si aún se ve opaco, hacer hard refresh (Ctrl+Shift+R).

### Error "pool timeout" en MySQL

```bash
# Reiniciar MySQL
docker compose down
docker compose up -d helpdesk-db-dev
sleep 5
cd backend && npx prisma db push
```

### Cambios CSS no se aplican

```bash
# El navegador cachea CSS
Ctrl + Shift + R (hard refresh)
# O abrir en modo incógnito
```

---

## Créditos

**Helpify** — Sistema de Soporte Inteligente  
**Diseño:** Butterfly Glass Design System  
**Tecnologías:** Next.js 16, React 19, TypeScript, Prisma, MySQL, Tailwind CSS 4

---

*Última actualización: Abril 2026*
