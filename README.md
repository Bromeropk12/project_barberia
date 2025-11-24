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

## Estructura del Proyecto

```
project_barberia/
├── backend/                    # API REST con Node.js
│   ├── src/
│   │   ├── index.ts           # Servidor Express principal
│   │   ├── database.ts        # Conexión a PostgreSQL
│   │   └── init.sql           # Script de creación de BD
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── App.tsx            # Componente principal
│   │   ├── App.css            # Estilos de la aplicación
│   │   ├── assets/            # Imágenes y recursos
│   │   └── main.tsx           # Punto de entrada React
│   ├── index.html
│   └── package.json
├── .env.local                 # Credenciales de base de datos
└── README.md                  # Esta documentación
```

## Instalación y Ejecución

### Prerrequisitos
- Node.js (v18+)
- Cuenta en [Neon](https://neon.tech) para PostgreSQL

### 1. Configurar Base de Datos
1. Crea una cuenta en Neon
2. Crea una nueva base de datos
3. Ejecuta el script `backend/src/init.sql` en el SQL Editor de Neon
4. Copia la URL de conexión al archivo `.env.local`

### 2. Configurar Backend
```bash
cd backend
npm install
npm run dev
```
Servidor corriendo en: `http://localhost:3000`

### 3. Configurar Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplicación corriendo en: `http://localhost:5173`

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

## ⚙️ Características Técnicas

### Seguridad
- **JWT Authentication** con expiración de 24h
- **Hashing de contraseñas** con bcrypt (10 salt rounds)
- **Roles de usuario**: cliente, barbero, super_admin
- **Validación de entrada** en frontend y backend
- **CORS configurado** para desarrollo

### Base de Datos
- **PostgreSQL (Neon)** con índices optimizados
- **Transacciones** para operaciones críticas
- **Relaciones complejas** entre usuarios, reservas, servicios
- **Horarios dinámicos** con slots de 30 minutos

### Notificaciones
- **Emails automáticos** (confirmación, cancelación, recordatorios)
- **Sistema de notificaciones web** integrado
- **Recordatorios diarios** programados con node-cron

### UI/UX
- **Diseño moderno** con CSS3 y animaciones
- **Completamente responsivo** para móviles y desktop
- **Componentes reutilizables** con TypeScript
- **Estados de carga** y manejo de errores

## 📚 Conceptos Aprendidos

Este proyecto avanzado cubre:
- **Arquitectura full-stack** completa con separación de responsabilidades
- **Autenticación JWT** con roles y permisos
- **Gestión de estado compleja** en React con múltiples contextos
- **APIs RESTful** con validación y middleware
- **Base de datos relacional** con PostgreSQL y optimizaciones
- **Sistema de notificaciones** (email y web)
- **Programación de tareas** con node-cron
- **Transacciones de BD** para integridad de datos
- **UI/UX moderna** con componentes reutilizables
- **TypeScript avanzado** con tipos complejos





---
