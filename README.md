# 🦋 Helpify — Soporte Inteligente

> Sistema de gestión de tickets con diseño premium Butterfly Glass y priorización automática.

![Next.js](https://img.shields.io/badge/Next.js-16-blue)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Características

- 🎨 **Diseño Butterfly Glass** — Glassmorphism premium con gradientes iridiscentes inspirados en alas de mariposa
- ⚡ **Ultra Rápido** — React Query para caché inteligente, navegación instantánea (<300ms)
- 🔐 **Autenticación JWT** — Login seguro con tokens y refresh automático
- 📊 **Dashboard Dinámico** — Métricas en tiempo real con sparklines y gráficos SVG
- 🎯 **Priorización Inteligente** — Score de urgencia calculado automáticamente
- 📱 **Responsive** — Adaptado para desktop, tablet y móvil
- 🌙 **Dark Mode** — Diseño oscuro con texto blanco puro y acentos azules

---

## 🚀 Inicio Rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/HELPIFY-main.git
cd HELPIFY-main

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Levantar MySQL

```bash
docker compose up -d helpdesk-db-dev
```

### 3. Configurar entorno

**Backend** (`backend/.env`):
```env
DATABASE_URL="mysql://helpdesk:helpdesk123@localhost:3306/helpdesk_dev"
JWT_SECRET="tu-secreto-de-32-caracteres"
JWT_REFRESH_SECRET="otro-secreto-diferente"
NODE_ENV="development"
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Seed de datos

```bash
cd backend && npm run db:seed
```

### 5. Iniciar

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

Abrir **http://localhost:3000**

### Credenciales

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@helpify.com` | `Admin123!` |
| Agente | `ana@helpify.com` | `Agent123!` |
| Cliente | `maria@example.com` | `Customer123!` |

---

## 🎨 Diseño Butterfly Glass

Un sistema de diseño único inspirado en la iridiscencia de las alas de mariposa:

### Paleta de Colores

| Color | Valor | Uso |
|-------|-------|-----|
| Background | `oklch(0.07 0.008 260)` | Fondo principal negro azulado |
| Brand Blue | `oklch(0.62 0.20 240)` | Azul mariposa iridiscente |
| Wing Gradient | Azul → Morado → Violeta | Gradientes premium |
| Text Primary | `oklch(1.0)` | Blanco puro `#FFFFFF` |

### Componentes Premium

- **`ButterflyCard`** — Card con borde gradiente iridiscente en hover
- **`GradientButton`** — Botón con gradiente azul-morado-violeta
- **`AnimatedBadge`** — Badge con animación butterfly pulse
- **`Sparkline`** — Mini gráfico SVG de tendencia
- **`MetricCard`** — Métrica con glow ambiental
- **`SectionHeader`** — Header con icono y acción

### Efectos CSS

| Efecto | Clase |
|--------|-------|
| Glass Panel | `.glass-panel` |
| Butterfly Card | `.butterfly-card` |
| Gradient Border | `.gradient-border` |
| Ambient Glow | `.ambient-glow` |
| Shimmer | `.shimmer` |
| Butterfly Pulse | `.butterfly-pulse` |
| 3D Tilt | `.card-3d` |
| Depth Shadow | `.depth-shadow` |

---

## 📁 Estructura

```
HELPIFY-main/
├── frontend/              # Next.js 16 App
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/
│   │   │   ├── ui/        # 🦋 Butterfly Glass Components
│   │   │   └── ...
│   │   └── lib/           # API, types, utils
│   └── package.json
├── backend/               # Node.js + Prisma
│   ├── src/               # API endpoints
│   ├── prisma/            # Schema + Seed
│   └── package.json
└── docker-compose.yml     # MySQL
```

---

## ⚡ Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Carga inicial | 2-5s | 0.5-1s | **75%** |
| Navegación | 1-3s | 0.1-0.3s | **90%** |
| Respuesta clicks | 500ms-2s | 50-150ms | **85%** |
| HTTP requests/hora | ~150 | ~15 | **90%** |
| Bundle size | ~450KB | ~350KB | **22%** |
| Polling/día | 2,880 | 720 | **75%** |

### Optimizaciones Implementadas

1. **React Query** — Caché inteligente de 2-10 minutos
2. **Polling optimizado** — Solo cuando la pestaña está visible
3. **Film-grain condicional** — Desactivado en dashboard
4. **AuthProvider único** — Sin duplicados
5. **CSS optimizado** — Backdrop-filter reducido 60%
6. **Librería de iconos unificada** — Solo lucide-react
7. **Textos blancos puros** — Máxima legibilidad

---

## 🛠️ Scripts

### Frontend

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # ESLint
npm run test     # Jest tests
```

### Backend

```bash
npm run dev      # Desarrollo con tsx watch
npm run db:seed  # Seed de datos de prueba
npx prisma studio # GUI de base de datos
```

---

## 📚 Documentación

La documentación completa está en [`DOCUMENTACION.md`](DOCUMENTACION.md):

- Arquitectura del sistema
- Sistema de diseño Butterfly Glass
- Guía de componentes
- Base de datos y schema
- Optimizaciones de rendimiento
- Despliegue en Vercel/Railway
- Solución de problemas

---

## 🚀 Despliegue

### Frontend → Vercel
1. Conectar repositorio en Vercel
2. Configurar `NEXT_PUBLIC_API_URL`
3. Deploy automático

### Backend → Railway
1. Conectar repositorio en Railway
2. Agregar servicio MySQL
3. Configurar variables de entorno
4. Deploy automático

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| Frontend no carga | `pkill -f "next dev" && rm -rf .next && npm run dev` |
| Botones no responden | Hard refresh: `Ctrl+Shift+R` |
| Error MySQL | `docker compose up -d helpdesk-db-dev` |
| Texto opaco | Hard refresh (cache del navegador) |
| Pool timeout | Reiniciar MySQL container |

---

## 📄 Licencia

MIT

---

*Hecho con 🦋 por el equipo de Helpify*
