# 🎓 Sistema de Gestión de Usuarios - UAN Barber

Una aplicación web completa para la gestión de usuarios de una barbería, desarrollada con tecnologías modernas y un enfoque educativo.

## 📋 ¿Qué es este proyecto?

Este es un sistema full-stack que combina una atractiva landing page de barbería con un panel administrativo para gestionar usuarios. Fue creado como proyecto educativo para aprender desarrollo web moderno, implementando operaciones CRUD (Crear, Leer, Eliminar) sobre una base de datos PostgreSQL.

### Características principales:
- **Landing page moderna** con tema de barbería
- **Sistema de login** para acceso administrativo credenciales: usuario:elsuperadmin password:yoeladmin852
- **Gestión completa de usuarios** (CRUD)
- **IDs consecutivos automáticos** sin huecos
- **Interfaz responsiva** y amigable

## 🏗️ Arquitectura del Sistema

### Tecnologías utilizadas:

#### Backend (Node.js/Express/TypeScript)
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Tipado estático para mayor robustez
- **PostgreSQL (Neon)** - Base de datos serverless
- **CORS** - Para comunicación frontend-backend

#### Frontend (React/Vite/TypeScript)
- **React 18** - Librería para interfaces de usuario
- **Vite** - Build tool rápido y moderno
- **TypeScript** - Desarrollo con tipado
- **Axios** - Cliente HTTP para API calls
- **CSS3** - Estilos modernos con diseño responsivo

## 🔄 Cómo funciona

### 1. **Landing Page**
- Página de presentación de la barbería UAN Barber
- Información de servicios, ubicación y contacto
- Diseño moderno con imágenes temáticas
- Botón de acceso al panel administrativo

### 2. **Sistema de Autenticación**
- Modal de login con credenciales específicas
- Usuario: `elsuperadmin`
- Contraseña: `yoeladmin852`
- Acceso seguro al panel de administración

### 3. **Panel Administrativo**
- **Vista de usuarios registrados** en tarjetas ordenadas
- **Formulario de registro** con validación completa
- **Eliminación de usuarios** con confirmación
- **IDs automáticos** consecutivos (ej: 0001, 0002, 0003...)

### 4. **Gestión de IDs**
- Los IDs se asignan automáticamente sin intervención manual
- Mantienen secuencia consecutiva sin huecos
- Formato de 4 dígitos (expansible hasta 7)
- Si eliminas el usuario 0003, el siguiente será 0003

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

## 🔌 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/usuarios` | Obtener todos los usuarios |
| POST | `/api/usuarios` | Crear nuevo usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario por ID |

## ✨ Características Técnicas

### Validaciones Implementadas
- **Campos obligatorios**: nombre, apellido, teléfono, email, contraseña
- **Formato de email** válido
- **Aceptación de términos** requerida
- **Longitud mínima de contraseña** (6 caracteres)
- **Correos únicos** en la base de datos

### Seguridad
- **Hashing de contraseñas**: No implementado (proyecto educativo)
- **Autenticación básica**: Credenciales hardcodeadas
- **Validación de entrada**: En frontend y backend
- **CORS configurado** para desarrollo local

### Diseño y UX
- **Paleta de colores**: Azules y morados modernos
- **Animaciones suaves**: Hover effects y transiciones
- **Responsive design**: Adaptable a móviles y desktop
- **Feedback visual**: Mensajes de éxito/error

## 🎯 Conceptos Aprendidos

Este proyecto educativo cubre:
- Arquitectura full-stack separada
- Consumo de APIs REST con Axios
- Manejo de estado en React (useState, useEffect)
- Operaciones CRUD completas
- Configuración de bases de datos PostgreSQL (NEON)
- Tipado con TypeScript
- Estilos modernos con CSS3
- Autenticación básica
- Validación de formularios
- IDs automáticos consecutivos





---
