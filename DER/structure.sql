-- ======================================================
-- 1. CREACIÓN DE LA BASE DE DATOS (MySQL)
-- ======================================================
CREATE DATABASE IF NOT EXISTS ee_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ee_platform;
-- ======================================================
-- 2. TABLAS (sin FK aún para evitar orden, se agregarán al final)
-- ======================================================
-- Tabla categories
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla services
CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    experience_levels JSON,
    -- MySQL JSON type
    certification_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    base_price DECIMAL(10, 2),
    hourly_price DECIMAL(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla products (referencia categories y services)
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id VARCHAR(50) NOT NULL,
    description TEXT,
    characteristics JSON,
    image VARCHAR(500),
    images JSON ,
    colors JSON ,
    sizes JSON ,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) DEFAULT 0.00,
    installation_available BOOLEAN NOT NULL DEFAULT FALSE,
    installation_service_id VARCHAR(50),
    rating_value DECIMAL(2, 1) DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla users
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address JSON,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla professionals (requiere services, pero FK después)
CREATE TABLE professionals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    profession VARCHAR(100),
    service_id VARCHAR(50),
    custom_service VARCHAR(255),
    service_status ENUM('aprobado', 'rechazado', 'pendiente') DEFAULT 'pendiente',
    experience_years INT DEFAULT 0,
    certification_url VARCHAR(500),
    certification_verified BOOLEAN DEFAULT FALSE,
    validation_date TIMESTAMP NULL,
    validated_by VARCHAR(100),
    admin_observation TEXT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    availability JSON,
    rating_value DECIMAL(2, 1) DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    jobs_completed INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla bookings
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabla booking_items (requiere bookings, products, services, professionals)
-- Definimos ENUM para type y para installation_time
CREATE TABLE booking_items (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    type ENUM('product', 'service', 'combo') NOT NULL,
    product_id VARCHAR(50),
    service_id VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10 , 2 ) NOT NULL,
    name VARCHAR(255) NOT NULL,
    professional_id VARCHAR(50),
    installation_date DATE,
    installation_time ENUM('manana', 'tarde'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    
);
-- Tabla service_requests
CREATE TABLE service_requests (
    id VARCHAR(50) PRIMARY KEY,
    professional_id VARCHAR(50),
    requested_service VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    response_admin VARCHAR(100)
);
-- ======================================================
-- 3. ADICIÓN DE CLAVES FORÁNEAS (después de crear todas las tablas)
-- ======================================================
ALTER TABLE products
ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE products
ADD CONSTRAINT fk_products_installation_service FOREIGN KEY (installation_service_id) REFERENCES services(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE professionals
ADD CONSTRAINT fk_professionals_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE booking_items
ADD CONSTRAINT fk_booking_items_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE booking_items
ADD CONSTRAINT fk_booking_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE booking_items
ADD CONSTRAINT fk_booking_items_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE booking_items
ADD CONSTRAINT fk_booking_items_professional FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE service_requests
ADD CONSTRAINT fk_service_requests_professional FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE
SET NULL ON UPDATE CASCADE;
-- ======================================================
-- 4. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ======================================================
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories(`order`);
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_service ON products(installation_service_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_professionals_service ON professionals(service_id);
CREATE INDEX idx_professionals_email ON professionals(email);
CREATE INDEX idx_professionals_license ON professionals(license_number);
CREATE INDEX idx_professionals_status ON professionals(service_status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_created ON bookings(created_at);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_product ON booking_items(product_id);
CREATE INDEX idx_booking_items_service ON booking_items(service_id);
CREATE INDEX idx_booking_items_professional ON booking_items(professional_id);
CREATE INDEX idx_booking_items_dates ON booking_items(installation_date);
CREATE INDEX idx_service_requests_professional ON service_requests(professional_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
-- ======================================================
-- 5. (OPCIONAL) TRIGGERS PARA validaciones extra
-- Nota: MySQL no necesita trigger para updated_at si usamos ON UPDATE CURRENT_TIMESTAMP,
-- pero si se prefiere, se puede crear. Ya lo hemos incluido en las definiciones de columna.
-- ======================================================
-- Ejemplo de trigger alternativo para updated_at (no necesario con la definición anterior)
-- DELIMITER $$
-- CREATE TRIGGER update_categories_updated_at 
-- BEFORE UPDATE ON categories
-- FOR EACH ROW
-- BEGIN
--     SET NEW.updated_at = CURRENT_TIMESTAMP;
-- END$$
-- DELIMITER ;
-- (Se puede aplicar a todas, pero no es obligatorio)
-- ======================================================
-- FIN DEL SCRIPT DE ESTRUCTURA
-- ======================================================