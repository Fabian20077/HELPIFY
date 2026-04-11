# Guía de Deploy: Helpify en Railway + Vercel

## 1. Configuración del Backend en Railway

### 1.1 Variables de Entorno Requeridas

En el dashboard de Railway, configura estas variables:

```env
# Base de datos (usar la URL de MySQL de Railway)
DATABASE_URL=mysql://user:password@host:3306/helpdesk_prod

# JWT (generar secretos seguros)
JWT_SECRET=genera-un-secreto-de-al-menos-32-caracteres-aqui
JWT_REFRESH_SECRET=otro-secreto-diferente-de-al-menos-32-caracteres

# Tiempos de expiración
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Entorno
NODE_ENV=production
PORT=3001

# Frontend (URL de Vercel)
FRONTEND_URL=https://helpify.vercel.app

# Tamaño máximo de archivos
MAX_FILE_SIZE_MB=10
```

### 1.2 Configurar MySQL en Railway

1. En Railway, crea un nuevo servicio MySQL
2. Obtén la URL de conexión (DATABASE_URL)
3. La base de datos se crea automáticamente

### 1.3 Ejecutar Migraciones y Seed

Una vez desplegado, necesitas ejecutar las migraciones:

**Opción A: Usar Railway CLI**
```bash
npm install -g railway
railway login
cd backend
railway link
railway run npx prisma migrate deploy
railway run npm run db:seed
```

**Opción B: Deploy script automático**

Crea un script en `backend/scripts/deploy.sh`:
```bash
#!/bin/bash
npx prisma migrate deploy
npm run db:seed
```

### 1.4 Verificar el Backend

Después de desplegar, verifica que funciona:
```bash
curl https://tu-backend.railway.app/api/health
```

Debería retornar:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

---

## 2. Configuración del Frontend en Vercel

### 2.1 Variables de Entorno

En el dashboard de Vercel, configura:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

**IMPORTANTE:** `.env.local` NO se despliega automáticamente a Vercel.

### 2.2 Dominios Permitidos

En `backend/src/app.ts`, el CORS está configurado para:
- `localhost:3000`
- `*.vercel.app`
- `*.railway.app`

Esto debería funcionar con Vercel automáticamente.

---

## 3. Solución de Problemas

### Problema: Railway retorna 404 en /api/auth/login

**Causa:** Las rutas no están registradas o el servidor no está escuchando correctamente.

**Solución:**
1. Verifica que el build fue exitoso en Railway
2. Revisa los logs de Railway para errores
3. Verifica que `npm run build` genera el archivo `dist/server.js`

### Problema: "No hay usuarios en producción"

**Causa:** Las migraciones/seed no se ejecutaron.

**Solución:**
```bash
cd backend
npx prisma migrate deploy
npm run db:seed
```

### Problema: CORS errors

**Causa:** El dominio de Vercel no está en la lista blanca.

**Solución:** Verifica que `app.ts` tiene:
```typescript
origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')
```

### Problema: Token expira inmediatamente

**Causa:** El JWT_SECRET es muy débil.

**Solución:** Usa un secreto de al menos 32 caracteres.

---

## 4. Verificación Final

1. **Backend Health:**
   ```bash
   curl https://tu-backend.railway.app/api/health
   ```

2. **Login:**
   ```bash
   curl -X POST https://tu-backend.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"tu@email.com","password":"tucontraseña"}'
   ```

3. **Frontend:**
   - Ve a https://tu-proyecto.vercel.app
   - Intenta hacer login
   - Verifica que redirige al dashboard

---

## 5. Comandos Útiles

```bash
# Ver logs de Railway
railway logs

# Abrir shell en Railway
railway shell

# Ver variables de entorno
railway variables

# Redeploy
railway up
```

---

## 6. URLs de Referencia

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Docs Railway:** https://docs.railway.app
- **Docs Vercel:** https://vercel.com/docs
