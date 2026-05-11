# APP E-E

**Todo para tu hogar o negocio**

Plataforma de e-commerce y servicios donde los usuarios pueden **encomendar productos** y **encargar servicios** para su hogar o negocio. Un marketplace agregador similar a Easy (mejoramiento del hogar) combinado con Uber (servicios), ofreciendo productos por categorías (muebles, electrodomésticos, herramientas, baños, cocinas, construcción, pisos, jardín, puertas y ventanas) y servicios de instalación y mantenimiento (climatización, plomería, armado de muebles, etc.).

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express 4 (Arquitectura MVC) |
| **Frontend (sitio principal)** | EJS templates (renderizado del lado del servidor) |
| **Frontend (dashboard admin)** | React 19 + Vite 8 (SPA) |
| **Base de datos** | MySQL con Sequelize ORM v6 |
| **Autenticación** | bcrypt + express-session + session-file-store |
| **Validaciones** | express-validator |
| **HTTP** | morgan, cookie-parser, method-override, cors |

---

## Estructura del proyecto

```
├── app.js                       # Punto de entrada Express (middleware, rutas, sesión, errores)
├── package.json                 # Dependencias y scripts
├── bin/www                      # Servidor HTTP (puerto 3000)
│
├── controllers/                 # Lógica de negocio (10 controladores)
├── routes/                      # Definiciones de rutas Express (11 archivos)
├── models/                      # Modelos Sequelize (legado)
│
├── database/                    # Capa de base de datos (Sequelize ORM)
│   ├── config/config.json       # Credenciales de base de datos
│   ├── models/                  # Modelos Sequelize (8 modelos)
│   └── seeders/initial-data.js  # Datos iniciales
│
├── services/                    # Capa de servicios (auth, checkout, inventory, professional, reserve)
├── middlewares/                  # Middlewares (authMiddleware)
├── validations/                 # Reglas de validación con express-validator (7 archivos)
│
├── views/                       # Plantillas EJS
│   ├── layout.ejs               # Layout principal
│   ├── partials/                # Componentes reutilizables (header, navbar, admin/)
│   └── pages/                   # Páginas específicas (inicio, categorías, productos, usuarios, admin)
│
├── public/                      # Archivos estáticos
│   ├── css/                     # Estilos globales, componentes y páginas
│   ├── js/                      # Scripts del cliente (login, register, reserve, tema, admin/)
│   └── images/                  # Imágenes
│
├── dashboard/                   # Dashboard administrador en React + Vite (SPA)
│   ├── src/
│   │   ├── App.jsx              # Router (login, dashboard protegido)
│   │   ├── api.js               # Cliente API
│   │   └── components/          # Componentes React
│   └── package.json
│
├── data/                        # Archivos JSON legacy
├── DER/                         # Documentación de la base de datos (DER.pdf, structure.sql, data.sql)
├── design/                      # Assets de diseño (tipografía y colores)
└── wireframes/                  # Wireframes de la interfaz
```

---

## Base de datos (MySQL)

Base de datos: `ee_platform` en `localhost:3306`

| Tabla | Propósito |
|-------|-----------|
| `users` | Cuentas de usuario (nombre, email, contraseña hash, teléfono, dirección JSON) |
| `categories` | Categorías de productos (slug, nombre, descripción, icono, orden) |
| `products` | Productos (SKU, categoría, descripción, características JSON, imágenes JSON, colores JSON, talles JSON, precio) |
| `services` | Servicios ofrecidos (slug, descripción, niveles de experiencia, precio base, precio por hora) |
| `professionals` | Profesionales (nombre, licencia, profesión, certificación, disponibilidad JSON) |
| `bookings` | Reservas/órdenes (usuario o sesión de invitado) |
| `booking_items` | Items dentro de una reserva (tipo: producto/servicio/combo, cantidad, precio unitario, fecha de instalación) |
| `service_requests` | Solicitudes de servicio de profesionales (estado: pendiente/aprobado/rechazado) |

---

## Rutas

### Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `GET /` | Página de inicio (últimos 6 productos, 6 categorías) |
| `GET /search` | Búsqueda de productos por consulta/categoría |
| `GET /categorias` | Listado de categorías |
| `GET /productos` | Listado de productos (filtrable) |
| `GET /detail/:id` | Detalle de producto |
| `GET /login` | Formulario de inicio de sesión |
| `POST /register` | Registro de usuario |
| `POST /login` | Inicio de sesión |
| `GET /logout` | Cerrar sesión |
| `GET /usuarios/perfil` | Perfil de usuario |
| `GET /reserva` | Carrito/reserva |
| `GET /api/*` | API REST (solo lectura, paginada) |

### Rutas de administración (`/admin/*`)

| Ruta | Descripción |
|------|-------------|
| `/admin/productos` | CRUD de productos |
| `/admin/categorias` | CRUD de categorías |
| `/admin/profesionales` | CRUD de profesionales |
| `/admin/usuarios` | CRUD de usuarios |
| `/admin/servicios` | CRUD de servicios |
| `/admin/validaciones` | Validación de profesionales |
| `/admin/disponibilidad` | Gestión de disponibilidad |

### API REST (`/api/`)

Endpoints de solo lectura con paginación:
- `GET /api/categories`, `/api/categories/:id`
- `GET /api/products`, `/api/products/:id`
- `GET /api/users`, `/api/users/:id`
- `GET /api/services`, `/api/services/:id`
- `GET /api/professionals`, `/api/professionals/:id`

---

## Roles de usuario

| Rol | Descripción |
|-----|-------------|
| `guest` | Usuario no autenticado (puede navegar y agregar al carrito) |
| `user` | Usuario autenticado (puede reservar, ver perfil) |
| `admin` | Administrador (acceso a panel de administración) |

---

## Instalación y ejecución

### Requisitos previos

- Node.js 18+
- MySQL 8+
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/EricEduardo-prog/DPFS_eric_gimenez.git
cd DPFS_eric_gimenez

# 2. Instalar dependencias
npm install

# 3. Configurar la base de datos
#    - Crear la base de datos 'ee_platform' en MySQL
#    - Ejecutar DER/structure.sql para crear las tablas
#    - Ejecutar DER/data.sql para los datos de ejemplo
#    - Configurar database/config/config.json con tus credenciales

# 4. Iniciar el servidor
npm start

# 5. (Opcional) Iniciar el dashboard de administración en React
cd dashboard
npm install
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor con node |
| `npm run dev` | Inicia el servidor con nodemon (recarga automática) |
| `cd dashboard && npm run dev` | Inicia el dashboard de React en modo desarrollo |
| `cd dashboard && npm run build` | Compila el dashboard de React para producción |

---

## Diseño y UX

- **Colores:** Negro `#000000` (primario), Azul `#0077B6` (secundario), Blanco `#FFFFFF` (fondo principal), Gris claro `#F5F5F5` (fondo secundario)
- **Tipografía:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Estilo:** Minimalista y moderno, inspirado en Uber, Shop.app y Easy.com.ar
- **Características:** Toggle de tema claro/oscuro, barra de navegación inferior responsiva, selector de ubicación, búsqueda con filtro por categoría

---

## Enlaces

- **Trello:** https://trello.com/b/Yr4BqLi1/app-e-e
- **Repositorio GitHub:** https://github.com/EricEduardo-prog/DPFS_eric_gimenez
- **Sitios de inspiración:** Instagram, Shop.app, Dribbble, Uber, YPF, Easy Argentina, ASLO, Soluciones del Hogar, Wikipedia
