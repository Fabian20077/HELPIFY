# 📋 DOCUMENTACIÓN DE ERRORES - HELPIFY
## Estado: Proyecto en Mantenimiento / Necesita Debugging

---

## 🔧 Estado Actual del Proyecto

### ✅ Funcionando
- **Backend en Railway**: https://helpify-production.up.railway.app
- **Login/autenticación**: Funciona correctamente
- **Base de datos MySQL**: Conectada y con datos seedeados
- **API endpoints**: Login, logout, crear tickets, listar tickets (probado con curl)

### ❌ No Funcionando
- **Frontend en Vercel**: https://helpify-pi.vercel.app
- **Creación de tickets**: Error 500
- **Build de Vercel**: Falla inconsistentemente

---

## 🔍 Problemas Identificados

### 1. Error de Build en Vercel

**Síntoma**: Vercel muestra `Command "npm install && npm run build" exited with 1`

**Posibles causas**:
- Conflicto con `package-lock.json` en la raíz del proyecto
- El `rootDirectory` de Vercel puede estar mal configurado
- El `vercel.json` no se está aplicando correctamente

**Estructura del proyecto**:
```
HELPIFY/
├── vercel.json                    ← Configuración de Vercel
├── frontend/                      ← Código Next.js (USA ESTE)
│   ├── package.json
│   ├── package-lock.json
│   └── src/
├── backend/                       ← Código Express (desplegado en Railway)
├── deployments.json               ← Historial de despliegues Railway
└── railway.json                   ← Config de Railway
```

**SOLUCIÓN**: En Vercel Dashboard → Settings → General → Root Directory = `frontend`

### 2. Error 500 al Crear Tickets

**Síntoma**: `POST /dashboard/tickets/new 500 (Internal Server Error)`

**Análisis realizado**:
- El login funciona porque hace `fetch` directo del navegador → Railway
- La creación de tickets fue cambiada a llamadas directas del cliente → Railway
- **Los logs de Railway NO muestran solicitudes entrantes** cuando se crean tickets desde Vercel

**Hipótesis**: 
1. Vercel no ha desplegado los últimos cambios
2. Railway no ha redesplegado con el código actualizado
3. Puede haber un problema de CORS o conectividad entre Vercel y Railway

---

## 📁 Archivos Críticos para Analizar

### Configuración de Despliegue

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `vercel.json` | Config de build de Vercel | ⚠️ Puede no estar funcionando |
| `frontend/.env.local` | Variables de entorno frontend | ✅ Configurado con URL de Railway |
| `backend/.env.production` | Variables de entorno backend | ✅ Configurado en Railway |

### Frontend - Llamadas API

| Archivo | Línea | Descripción |
|---------|-------|-------------|
| `frontend/src/lib/api.ts` | 9 | `API_BASE_URL` usa `NEXT_PUBLIC_API_URL` |
| `frontend/src/lib/api-config.ts` | - | Constantes de endpoints API |
| `frontend/src/components/tickets/ticket-form.tsx` | - | Formulario de creación de tickets (USA llamadas directas) |
| `frontend/src/components/tickets/comment-form.tsx` | - | Formulario de comentarios |
| `frontend/src/components/tickets/status-controls.tsx` | - | Controles de estado de tickets |
| `frontend/src/components/admin/users-list.tsx` | 60, 79 | Lista de usuarios (corregido para usar URL completa) |
| `frontend/src/app/actions/ticket.actions.ts` | - | Server actions (NO se usan actualmente) |

### Backend - Railway

| Archivo | Propósito |
|---------|-----------|
| `backend/src/server.ts` | Servidor Express escuchando en 0.0.0.0:8080 |
| `backend/src/app.ts` | Configuración de Express (CORS, logging) |
| `backend/src/routes/ticket.routes.ts` | Rutas de tickets con validación Zod |
| `backend/src/validators/ticket.validator.ts` | Validación: `priority` debe ser `low\|medium\|high\|critical` (minúsculas) |
| `backend/railway.json` | Config de despliegue Railway |

---

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@helpify.com` | `Admin123!` |
| Agent | `ana@helpify.com` | `Agent123!` |
| Customer | `maria@example.com` | `Customer123!` |

---

## 🧪 Pruebas Realizadas

### Login (funciona):
```bash
curl -X POST https://helpify-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpify.com","password":"Admin123!"}'
# Respuesta: {"status":"success","data":{"token":"eyJ..."}}
```

### Crear ticket (funciona con curl):
```bash
# Primero obtener token
TOKEN=$(curl -s -X POST https://helpify-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpify.com","password":"Admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Crear ticket
curl -X POST https://helpify-production.up.railway.app/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test","description":"Test desc","priority":"medium","departmentId":"106c1bc5-03ec-4b25-90f7-b71fee35dd50"}'
# Respuesta: {"status":"success","data":{"id":"..."}}
```

### Health check:
```bash
curl https://helpify-production.up.railway.app/api/health
# Respuesta: {"status":"ok"}
```

### Listar agentes:
```bash
curl https://helpify-production.up.railway.app/api/users/agents \
  -H "Authorization: Bearer $TOKEN"
# Respuesta: {"status":"success","results":3,"data":[...]}
```

---

## 📊 URLs de Producción

| Servicio | URL | Estado |
|----------|-----|--------|
| Frontend (Vercel) | https://helpify-pi.vercel.app | ⚠️ Build problem |
| Backend (Railway) | https://helpify-production.up.railway.app | ✅ Funcionando |
| Dashboard Railway | https://railway.app | - |
| Dashboard Vercel | https://vercel.com/dashboard | - |

---

## 🎯 Recomendaciones para Debugging

### 1. Fix de Vercel Build
```bash
# Opción A: Configurar en Dashboard
# Settings → General → Root Directory = "frontend"

# Opción B: Mover código del frontend a la raíz (más simple)
# Requiere mover contenido de frontend/ a la raíz y eliminar carpeta frontend/
```

### 2. Fix de Creación de Tickets
- El código actual ya usa llamadas directas del cliente a Railway (no server actions)
- Verificar que Vercel desplegó la versión correcta
- Revisar logs de Vercel Functions para ver errores específicos
- Posible agregar `console.log` en el frontend para debugging

### 3. Comandos de Debug
```bash
# Ver logs de Railway (requiere CLI de Railway)
railway service logs --tail 100

# Test local del frontend
cd frontend && npm run dev

# Build local del frontend
cd frontend && npm run build

# Deploy manual a Railway
cd backend && railway up

# Verificar variables de Railway
cd backend && railway variables
```

---

## 📝 Archivos Modificados Recientemente (orden cronológico)

```
Commits en main:
├── 74cc904 - fix: use full API URL instead of relative paths in users-list
├── 410b0bd - fix: use direct API calls instead of server actions
├── 0ee981a - debug: add logging to ticket action
├── 3b818a8 - add: request logging for debugging
├── 366336a - fix: API auth headers and frontend components
├── 1c2dd04 - fix: pass token from client to server actions
└── b94cd31 - fix: update vercel.json for frontend root directory
```

### Cambios específicos:

**ticket-form.tsx**: 
- Antes usaba `createTicketAction` (server action)
- Ahora usa `api.post()` directamente

**comment-form.tsx**:
- Antes usaba `addCommentAction` (server action)
- Ahora usa `api.post()` directamente

**status-controls.tsx**:
- Antes usaba `updateTicketStatusAction` (server action)
- Ahora usa `api.patch()` directamente

**users-list.tsx**:
- Antes usaba rutas relativas `/api/users`
- Ahora usa `${API_BASE_URL}/users`

---

## 🚨 Checklist de Troubleshooting

- [ ] Root Directory de Vercel configurado como `frontend`
- [ ] Vercel desplegó el último commit
- [ ] Railway redesplegó con los cambios de logging
- [ ] Logs de Vercel Functions disponibles
- [ ] Logs de Railway muestran solicitudes entrantes
- [ ] Prueba local del frontend funciona
- [ ] Prueba con curl del backend funciona

---

## 📞 Información de Contacto/Proyecto

- **Repositorio**: https://github.com/Fabian20077/HELPIFY
- **Usuario GitHub**: Fabian20077
- **Proyecto Vercel**: helpify-pi
- **Proyecto Railway**: helpify-backend / perfect-reflection

---

## 🔧 Posibles Soluciones Rápidas

### Opción 1: Configurar correctamente Vercel
1. Dashboard Vercel → Settings → General
2. Root Directory = `frontend`
3. Redeploy

### Opción 2: Mover frontend a raíz
1. Mover todo el contenido de `frontend/` a la raíz del proyecto
2. Eliminar la carpeta `frontend/`
3. Actualizar `vercel.json`
4. Deployar de nuevo

### Opción 3: Usar Railway para frontend
1. Desplegar el frontend Next.js también en Railway
2. Unificar todos los servicios en Railway
3. Eliminar Vercel

---

*Documentación creada: 2026-03-21*
*Última actualización: 2026-03-21*
