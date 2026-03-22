# Helpify — Sistema Inteligente de Soporte Técnico (Backend)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-7.5.x-teal.svg)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)

Helpify es una plataforma moderna para la gestión de tickets de soporte técnico, diseñada para mejorar el conocimiento de control de calidad (QA) y pruebas. Este repositorio contiene el desarrollo del **Backend**, construido utilizando principios modernos, seguros y escalables.

## 🚀 Características Principales

1. **Gestión Completa de Tickets**: Ciclo de vida estricto (Open → In Progress → Waiting → Resolved → Closed) validadas mediante una máquina de estados determinista.
2. **Priorización Inteligente (Urgency Score)**: Fórmula algorítmica (0-100) que prioriza dinámicamente tickets dependientes del tiempo de espera, impacto, reiteraciones e historial de actividad.
3. **Escalablidad y Seguridad**:
   - Validación robusta de datos vía Zod (schemas dinámicos en base al contenido).
   - Control de archivos adjuntos mediante inspección estricta de **Magic Bytes** (MIME Validation), asegurando que falsificadores de extensión (`.exe` oculto en `.png`) sean detenidos.
   - Seguridad Web a través de Helmet.js, y gestión correcta de CORS.
4. **Pruebas (QA First)**: Completamente preparado para ser cubierto por pruebas Unitarias, de Integración, Carga, Seguridad, y E2E, usando herramientas como Jest, y Supertest.

## 🛠️ Tecnologías y Arquitectura

- **Motor Central:** Node.js (LTS), Typescript, y Express 5.
- **Base de Datos:** MySQL 8 vía Docker.  
- **Capa de Abstracción de Datos (ORM):** Prisma ORM v7 (Usando Prisma Driver Adapters `adapter-mariadb` sobre `mysql2`).
- **Pruebas y Mantenimiento:** Jest, ts-jest, Supertest.

---

## 💻 Guía de Instalación Rápida

Para correr el proyecto en modo desarrollo desde cero, asegúrate de tener instalados **Node.js (>= 20)** y **Docker Desktop**.

### 1. Clonar e inicializar dependencias

```bash
cd backend
npm install
```

### 2. Variables de Entorno

Asegúrate de copiar el archivo en `.env` (creado por defecto) y revisar que la configuración es correcta:

```bash
cp .env.example .env
```

*Por defecto, `.env` utiliza la base de datos de desarrollo definida en Docker Compose.*

### 3. Levantar la Infraestructura (Docker)

Levanta las bases de datos de **Development (3306)** y **Testing (3307)** en contenedores separados.

```bash
cd ..  # Sube al directorio principal donde está el docker-compose.yml
docker-compose up -d
cd backend # Vuelve a Backend
```

### 4. Preparar la Base de Datos

Corre las migraciones y llena (seed) la base de datos con información inicial para empezar a probar (departamentos, categorias y usuarios por defecto).

```bash
npm run db:push
npm run db:seed
```

> ⚠️ Nota en Base de Datos: Debido al nuevo prisma v7.5, se usa la comunicación de adaptador-driver directa con `prisma.config.ts`, asegúrate de tener `DATABASE_URL` válido en tu archivo `.env`.

### 5. Correr el Servidor (Desarrollo)

```bash
npm run dev
```
El servidor se levantará en `http://localhost:3001`. Accede a `http://localhost:3001/api/health` para confirmar.

---

## Tests

Cifras verificadas con Jest en el estado actual del repositorio (marzo 2026).

| Ámbito | Tests | Suites |
|--------|------:|-------:|
| Backend — unitarios | 69 | 3 |
| Backend — integración | 93 | 13 |
| Frontend | 10 | 3 |

**Total backend (unitarios + integración):** 162 tests, 16 suites — solo si la suite completa pasa (requiere MySQL de test).

### Cómo ejecutar los tests

**Backend — solo unitarios** (no requieren Docker):

```bash
cd backend
npm run test:unit
```

**Backend — integración y suite completa** (requieren MySQL de test en el puerto **3307**, según `backend/.env.test`):

Desde la raíz del repositorio (donde está `docker-compose.yml`):

```bash
docker compose up -d
cd backend
npm test
```

Opcional: `npm run test:integration` ejecuta solo las 13 suites de integración.

**Frontend:**

```bash
cd frontend
npm test
```

### Más opciones (backend)

```bash
# Cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

---

## 🧪 Pruebas y QA

Este es un proyecto altamente centrado en **Quality Assurance**. La configuración incluye Jest 100% integrado a Typescript.

### Componentes de testing (resumen)

Los números exactos están en la sección [Tests](#tests) de este README.

### Componentes de Testing Activos:

1. **`ticket-state-machine.test.ts`**: Verifica exhaustivamente la lógica determinista para estados de los tickets de soporte y evita saltos ilegales (e.g. `open -> closed` directamente).
2. **`urgency-score.test.ts`**: Mide y verifica el score de tickets bajo diferentes escenarios matemáticos para garantizar un puntaje real.
3. **`mime-validator.test.ts`**: Verifica subida de archivos seguros, con detectores basados en arrays binarios puros en lugar de cadenas de nombre falso.

---

## 📁 Estructura del Proyecto

```plaintext
/backend
├── .env                  # Variables locales de desarrollo
├── .env.test             # Variables para pruebas automatizadas (puerto docker distinto)
├── prisma.config.ts      # Configuración CLI (v7) de la ORM
├── docker-compose.yml    # Servicios limpios (Base de Datos)
├── /prisma
│   ├── schema.prisma     # Entidades de BD (Modelo MER)
│   └── seed.ts           # Datos iniciales para BD
├── /src
│   ├── app.ts            # Definición principal de Express
│   ├── server.ts         # Orquestador del servicio global HTTP
│   ├── /lib              # Dependencias empaquetadas (Prisma, Logger Winston)
│   ├── /services         # Capa de Lógica de Negocio (Estado, Puntuación matemática de tickets)
│   └── /__tests__        # Colecciones completas de pruebas bajo Jest
└── tsconfig.json         # Typings ultra-estrictos
```
