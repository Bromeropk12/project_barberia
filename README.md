# ✂️ Sistema de Reservas de Barbería - UAN Barber

Una aplicación web completa para gestión de barbería con sistema de reservas en línea, desarrollada con arquitectura modular y mejores prácticas de desarrollo.

## 🚀 ¿Qué es este proyecto?

Sistema full-stack enterprise-ready que incluye:
- **Landing page moderna** con servicios y barberos
- **Sistema de reservas** con horarios en tiempo real
- **Panel administrativo** completo para gestión
- **Autenticación con roles** (cliente, barbero, admin)
- **Notificaciones por email** y recordatorios automáticos
- **Arquitectura modular** con componentes reutilizables
- **Código DRY** (Don't Repeat Yourself) optimizado

## 🏗️ Arquitectura del Sistema

### Tecnologías utilizadas:

#### Backend (Node.js/Express/TypeScript)
- **Node.js v18+** - Entorno de ejecución JavaScript
- **Express 4.18** - Framework web minimalista con middleware
- **TypeScript 5.3** - Tipado estático avanzado
- **PostgreSQL (Neon)** - Base de datos serverless con índices optimizados
- **JWT Authentication** - Autenticación segura con expiración
- **bcrypt** - Hashing de contraseñas (10 salt rounds)
- **node-cron** - Programación de tareas automáticas
- **nodemailer** - Sistema de emails SMTP
- **CORS** - Configuración segura para comunicación frontend-backend

#### Frontend (React/Vite/TypeScript)
- **React 18** - Librería para interfaces con hooks modernos
- **Vite 4.5** - Build tool ultrarrápido con HMR
- **TypeScript 5.2** - Desarrollo con tipado estricto
- **React Router DOM 7.9** - Navegación SPA avanzada
- **Axios 1.6** - Cliente HTTP con interceptores
- **ESLint + TypeScript** - Linting y calidad de código
- **CSS3 Modules** - Estilos modulares y responsivos
- **Componentes reutilizables** con arquitectura DRY

##  Cómo funciona

### 1. **Landing Page**
- Página de presentación de la barbería UAN Barber
- Información de servicios, ubicación y contacto
- Diseño moderno con imágenes temáticas
- Botón de acceso al panel administrativo

### 2. **Sistema de Reservas**
- Registro/login de clientes
- Selección de servicio y barbero disponible
- Visualización de horarios en tiempo real (slots de 30 min)
- Confirmación con notificación por email

### 3. **Panel Administrativo**
- **Estadísticas**: Ingresos totales, reservas por mes, top barberos/servicios
- **Gestión de barberos**: Crear, editar, desactivar perfiles
- **Servicios**: CRUD completo con precios y duración
- **Reservas**: Ver todas, cancelar, completar citas
- **Usuarios**: Gestión de roles y permisos

## 📁 Estructura del Proyecto

```
project_barberia/
├── backend/                          # 🖥️ API REST modular con Node.js
│   ├── src/
│   │   ├── routes/                   # 🛣️ Rutas modulares organizadas
│   │   │   ├── auth.ts              # Autenticación JWT
│   │   │   ├── users.ts             # Gestión de usuarios
│   │   │   ├── services.ts          # CRUD servicios
│   │   │   ├── barbers.ts           # Gestión barberos
│   │   │   ├── schedules.ts         # Horarios dinámicos
│   │   │   ├── reservations.ts      # Sistema de reservas
│   │   │   ├── payments.ts          # Procesamiento pagos
│   │   │   ├── notifications.ts     # Notificaciones
│   │   │   └── stats.ts             # Estadísticas admin
│   │   ├── auth.ts                  # Middleware autenticación
│   │   ├── database.ts              # Conexión PostgreSQL
│   │   ├── emailService.ts          # Servicio emails SMTP
│   │   ├── reminderService.ts       # Recordatorios automáticos
│   │   ├── index.ts                 # 🚀 Servidor Express (38 líneas)
│   │   └── init.sql                 # 🗄️ Schema base de datos
│   ├── dist/                        # Build compilado
│   ├── package.json
│   └── tsconfig.json
├── frontend/                         # ⚛️ Aplicación React SPA
│   ├── src/
│   │   ├── components/               # 🧩 Componentes modulares
│   │   │   ├── hooks/               # 🎣 Hooks personalizados
│   │   │   │   └── useTabNavigation.ts
│   │   │   ├── FormModal.tsx        # 🔄 Modal genérico DRY
│   │   │   ├── CreateBarberModal.tsx # 👤 Modal barberos (refactorizado)
│   │   │   ├── CreateServiceModal.tsx # ✂️ Modal servicios (refactorizado)
│   │   │   ├── DashboardAdmin.tsx   # 📊 Admin panel (optimizado)
│   │   │   ├── DashboardCliente.tsx # 👤 Cliente dashboard
│   │   │   ├── DashboardBarbero.tsx # 💇 Barbero dashboard
│   │   │   ├── LandingPage.tsx      # 🏠 Página principal
│   │   │   ├── ReservaFlow.tsx      # 📅 Flujo reservas
│   │   │   ├── ModernMetrics.tsx    # 📈 Métricas modernas
│   │   │   ├── Skeleton.tsx         # ⏳ Loaders
│   │   │   ├── ProtectedRoute.tsx   # 🔒 Rutas protegidas
│   │   │   └── types.ts             # 📝 Definiciones TypeScript
│   │   ├── api.ts                   # 🌐 Cliente API centralizado
│   │   ├── App.tsx                  # 🎯 Componente raíz
│   │   ├── main.tsx                 # 🚀 Punto entrada React
│   │   └── vite-env.d.ts            # ⚙️ Tipos Vite
│   ├── public/                      # 📦 Assets estáticos
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
├── documentos/                      # 📚 Documentación proyecto
├── .env.local                       # 🔐 Variables entorno
├── vercel.json                      # ☁️ Config deployment
└── README.md                        # 📖 Esta documentación
```

## 🚀 Instalación y Ejecución

### 📋 Prerrequisitos
- **Node.js** v18.0.0 o superior
- **Cuenta en [Neon](https://neon.tech)** para PostgreSQL serverless
- **Git** para clonar el repositorio
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

### 🗄️ 1. Configurar Base de Datos PostgreSQL
1. **Crear cuenta en Neon**: Regístrate en [neon.tech](https://neon.tech)
2. **Crear proyecto**: Dashboard → "Create a project"
3. **Configurar base de datos**:
   - Nombre: `uan_barber_db` (o tu preferencia)
   - Región: Selecciona la más cercana
4. **Ejecutar schema inicial**:
   - Ve al SQL Editor en Neon
   - Copia y pega el contenido de `backend/src/init.sql`
   - Ejecuta el script para crear tablas e índices
5. **Obtener connection string**:
   - Dashboard → Connection Details
   - Copia la "Connection string" completa

### ⚙️ 2. Configurar Variables de Entorno
Crea el archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos PostgreSQL (Neon)
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# JWT Secret (genera uno seguro)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_min_32_caracteres

# Email configuración (opcional - usa tu proveedor SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# Frontend URL (para CORS)
VITE_API_BASE_URL=http://localhost:3000/api
```

### 🖥️ 3. Configurar Backend
```bash
# Instalar dependencias
cd backend
npm install

# Desarrolllo con hot-reload
npm run dev

# O para producción
npm run build
npm start
```
✅ **Servidor corriendo en**: `http://localhost:3000`

### ⚛️ 4. Configurar Frontend
```bash
# Instalar dependencias
cd ../frontend
npm install

# Desarrollo con Vite (hot-reload)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```
✅ **Aplicación corriendo en**: `http://localhost:5173`

### 🔍 5. Verificar Instalación
1. **Backend**: Visita `http://localhost:3000/api` - deberías ver respuesta JSON
2. **Frontend**: Visita `http://localhost:5173` - landing page debería cargar
3. **Base de datos**: Verifica conexión ejecutando queries de prueba



## 🔄 Próximos Pasos y Mejoras

### 🚀 Features Pendientes
- [ ] **Sistema de pagos** integrado (Stripe/PayPal)
- [ ] **Notificaciones push** en tiempo real
- [ ] **App móvil** con React Native
- [ ] **Multi-idioma** (i18n)
- [ ] **Dashboard analytics** avanzado

### 🧪 Testing y Calidad
- [ ] **Unit tests** con Jest/Vitest
- [ ] **Integration tests** con Supertest
- [ ] **E2E tests** con Playwright/Cypress
- [ ] **CI/CD pipeline** con GitHub Actions

### 📈 Optimizaciones
- [ ] **Caching** con Redis
- [ ] **CDN** para assets estáticos
- [ ] **Database optimization** con índices compuestos
- [ ] **Monitoring** con Sentry/LogRocket

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **Neon** por la base de datos PostgreSQL serverless
- **Vercel** por el hosting y deployment
- **React & TypeScript** comunidades por documentación excelente
- **Open source** libraries que hicieron posible este proyecto

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**

## 🔌 API Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticación de usuarios |
| POST | `/api/auth/register` | Registro de nuevos clientes |
| GET | `/api/servicios` | Listar servicios disponibles |
| GET | `/api/barberos` | Listar barberos activos |
| GET | `/api/horarios/:barberoId/:fecha` | Horarios disponibles |
| POST | `/api/reservas` | Crear nueva reserva |
| GET | `/api/reservas/mis` | Reservas del cliente |
| GET | `/api/estadisticas` | Estadísticas (admin) |

## ⚙️ Características Técnicas Avanzadas

### 🛡️ Seguridad Enterprise
- **JWT Authentication** con expiración configurable (24h)
- **Hashing de contraseñas** con bcrypt (10 salt rounds)
- **Roles de usuario**: cliente, barbero, super_admin con middleware
- **Validación de entrada** en múltiples capas (frontend/backend)
- **CORS configurado** con origen específico para producción
- **Protección de rutas** con guards de autenticación

### 🗄️ Base de Datos Optimizada
- **PostgreSQL (Neon)** con índices optimizados y constraints
- **Transacciones ACID** para operaciones críticas
- **Relaciones complejas** con foreign keys y cascadas
- **Horarios dinámicos** con slots de 30 minutos generados proceduralmente
- **Queries optimizadas** con JOINs eficientes

### 📧 Sistema de Notificaciones
- **Emails automáticos** (confirmación, cancelación, recordatorios)
- **Templates HTML** para emails profesionales
- **Sistema de colas** para envío masivo
- **Recordatorios diarios** programados con node-cron
- **Notificaciones web** integradas con la UI

### 🎨 UI/UX Moderna y Accesible
- **Diseño system-first** con CSS3 avanzado y animaciones
- **Completamente responsivo** (mobile-first approach)
- **Componentes reutilizables** con arquitectura DRY
- **Estados de carga** con skeletons y spinners
- **Manejo de errores** con feedback visual
- **Accesibilidad WCAG** con ARIA labels y navegación por teclado

### 🔧 Arquitectura y Calidad de Código
- **Principio DRY** aplicado con componentes genéricos
- **Separación de responsabilidades** clara
- **TypeScript estricto** con tipos complejos
- **ESLint + Prettier** para calidad consistente
- **Testing-ready** con estructura modular
- **Documentación inline** en español

---

## 📚 Conceptos Avanzados Aprendidos

Este proyecto enterprise-ready cubre tecnologías y patrones avanzados:

### 🏛️ Arquitectura y Patrones de Diseño
- **Arquitectura modular** con separación clara de responsabilidades
- **Principio DRY** aplicado con componentes genéricos reutilizables
- **Hooks personalizados** para lógica compartida (useTabNavigation)
- **Componentes de orden superior** para funcionalidad común
- **Inyección de dependencias** en el backend modular

### 🔐 Seguridad y Autenticación
- **JWT Authentication** con middleware y guards de rutas
- **Hashing seguro** con bcrypt y salt rounds configurables
- **Roles y permisos** con autorización granular
- **Validación en múltiples capas** (frontend/backend/database)
- **Protección contra ataques comunes** (CORS, input validation)

### 🗄️ Base de Datos y Optimización
- **PostgreSQL avanzado** con índices, constraints y transacciones
- **Queries optimizadas** con JOINs eficientes y prepared statements
- **Migraciones seguras** con scripts versionados
- **Relaciones complejas** con foreign keys y cascadas
- **Pooling de conexiones** para rendimiento

### ⚛️ React y TypeScript Avanzado
- **React moderno** con hooks, context y efectos
- **TypeScript estricto** con tipos genéricos y utility types
- **Componentes reutilizables** con props interfaces bien definidas
- **Gestión de estado** compleja con múltiples fuentes
- **Optimización de rendimiento** con memoización

### 🔧 DevOps y Calidad
- **Build tools modernos** (Vite, TypeScript compiler)
- **Linting y formateo** (ESLint, Prettier)
- **Configuración de TypeScript** optimizada
- **Scripts de automatización** (build, dev, lint)
- **Estructura de proyecto** escalable y mantenible

### 📧 Integraciones y APIs
- **APIs RESTful** con documentación implícita
- **Cliente HTTP** con interceptores y error handling
- **Sistema de emails** con templates y colas
- **Tareas programadas** con cron jobs
- **Notificaciones en tiempo real** integradas

### 🎨 UI/UX y Accesibilidad
- **Diseño system-first** con CSS moderno
- **Responsive design** mobile-first
- **Animaciones y transiciones** smooth
- **Accesibilidad WCAG** con mejores prácticas
- **Estados de carga** y manejo de errores visual





---
