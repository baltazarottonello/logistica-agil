SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
DROP DATABASE IF EXISTS logistica_agil;
CREATE DATABASE logistica_agil;
USE logistica_agil;


-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- =====================================================
-- USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RELACION N:M USUARIO - ROL
-- =====================================================
CREATE TABLE usuario_rol (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
);

-- =====================================================
-- CLIENTES
-- =====================================================
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    cuit VARCHAR(20) UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(100),
    direccion VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- CHOFERES
-- =====================================================
CREATE TABLE choferes (
    id_chofer INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    licencia_conducir VARCHAR(50) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_chofer_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =====================================================
-- VEHICULOS
-- =====================================================
CREATE TABLE vehiculos (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    patente VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    apto_refrigeracion BOOLEAN DEFAULT FALSE,
    capacidad_kg DECIMAL(10,2),
    capacidad_m3 DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- CATEGORIAS DE PRODUCTOS
-- =====================================================
CREATE TABLE categorias_producto (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- =====================================================
-- ESTADOS DEL PEDIDO
-- =====================================================
CREATE TABLE estados_pedido (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO estados_pedido(nombre) VALUES ('Pendiente'), ('En Ruta'), ('Entregado'), ('Cancelado');

-- =====================================================
-- ESTADOS DE HOJA DE RUTA
-- =====================================================
CREATE TABLE estados_hoja_ruta (
    id_estado_hoja INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO estados_hoja_ruta(nombre) VALUES ('Planificada'), ('En Curso'), ('Finalizada'), ('Cancelada');

-- =====================================================
-- ESTADOS DE ENTREGA
-- =====================================================
CREATE TABLE estados_entrega (
    id_estado_entrega INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO estados_entrega(nombre) VALUES ('Pendiente'), ('Entregado'), ('Rechazado'), ('Ausente');

-- =====================================================
-- PEDIDOS
-- =====================================================
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente_remitente INT NOT NULL,
    id_cliente_destinatario INT NOT NULL,
    id_estado INT NOT NULL,
    id_usuario_creador INT NOT NULL,
    direccion_entrega VARCHAR(255) NOT NULL,
    volumen_m3 DECIMAL(10,2),
    peso_kg DECIMAL(10,2),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    CONSTRAINT fk_pedido_remitente FOREIGN KEY (id_cliente_remitente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_pedido_destinatario FOREIGN KEY (id_cliente_destinatario) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_pedido_estado FOREIGN KEY (id_estado) REFERENCES estados_pedido(id_estado),
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_clientes_distintos CHECK (id_cliente_remitente <> id_cliente_destinatario)
);

-- =====================================================
-- RELACION N:M PEDIDO - CATEGORIA
-- =====================================================
CREATE TABLE pedido_categoria (
    id_pedido INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_pedido, id_categoria),
    CONSTRAINT fk_pc_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pc_categoria FOREIGN KEY (id_categoria) REFERENCES categorias_producto(id_categoria)
);
    
-- =====================================================
-- HOJAS DE RUTA
-- =====================================================
CREATE TABLE hojas_ruta (
    id_hoja_ruta INT AUTO_INCREMENT PRIMARY KEY,
    id_chofer INT NOT NULL,
    id_vehiculo INT NOT NULL,
    id_estado_hoja INT NOT NULL,
    fecha_salida DATETIME NOT NULL,
    fecha_estimada_regreso DATETIME,
    observaciones TEXT,
    CONSTRAINT fk_ruta_chofer FOREIGN KEY (id_chofer) REFERENCES choferes(id_chofer),
    CONSTRAINT fk_ruta_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo),
    CONSTRAINT fk_ruta_estado FOREIGN KEY (id_estado_hoja) REFERENCES estados_hoja_ruta(id_estado_hoja)
);

-- =====================================================
-- RELACION HOJA RUTA - PEDIDO
-- =====================================================
CREATE TABLE hoja_ruta_pedido (
    id_hoja_ruta INT NOT NULL,
    id_pedido INT NOT NULL,
    orden_visita INT NOT NULL,
    hora_estimada DATETIME,
    PRIMARY KEY (id_hoja_ruta, id_pedido),
    CONSTRAINT fk_hrp_hoja FOREIGN KEY (id_hoja_ruta) REFERENCES hojas_ruta(id_hoja_ruta) ON DELETE CASCADE,
    CONSTRAINT fk_hrp_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    UNIQUE(id_hoja_ruta, orden_visita)
);

-- =====================================================
-- ENTREGAS
-- =====================================================
CREATE TABLE entregas (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE,
    id_estado_entrega INT NOT NULL,
    fecha_entrega DATETIME,
    recibido_por VARCHAR(150),
    firma_digital LONGBLOB,
    observaciones TEXT,
    recibo_emitido BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_entrega_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_entrega_estado FOREIGN KEY (id_estado_entrega) REFERENCES estados_entrega(id_estado_entrega)
);

-- =====================================================
-- CARGA DE DATOS DE PRUEBA
-- =====================================================

INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema y configuración'),
('Operador', 'Gestión de pedidos, clientes y asignación de hojas de ruta'),
('Chofer', 'Visualización de rutas asignadas y registro de entregas');

INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES
('Carlos', 'Gómez', 'carlos.admin@logistica.com', '$2b$12$EixZaYVK1VatWRX...', 1),
('Laura', 'Rodríguez', 'laura.ops@logistica.com', '$2b$12$EixZaYVK1VatWRX...', 1),
('Juan', 'Pérez', 'juan.chofer@logistica.com', '$2b$12$EixZaYVK1VatWRX...', 1),
('Martín', 'Silva', 'martin.chofer@logistica.com', '$2b$12$EixZaYVK1VatWRX...', 1),
('Elena', 'Fernández', 'elena.chofer@logistica.com', '$2b$12$EixZaYVK1VatWRX...', 0);

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (1, 1), (2, 2), (3, 3), (4, 3), (5, 3);

INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES
(3, '34111222', 'L-ABC-12345', '+54 11 4444-5555', 'juan.chofer@logistica.com', 1),
(4, '36333444', 'L-XYZ-98765', '+54 11 4444-6666', 'martin.chofer@logistica.com', 1),
(5, '32555666', 'L-DEF-45678', '+54 11 4444-7777', 'elena.chofer@logistica.com', 0);

INSERT INTO clientes (razon_social, cuit, telefono, email, direccion, codigo_postal, activo) VALUES
('Distribuidora Mayorista S.A.', '30-12345678-9', '011-4555-0100', 'ventas@distribuidoramay.com', 'Av. Córdoba 2500, CABA', 'C1120AAF', 1),
('TecnoTienda SRL', '30-87654321-9', '011-4666-0200', 'compras@tecnotienda.com', 'Calle Florida 500, CABA', 'C1005AAT', 1),
('Farmacia Nueva Córdoba', '27-44555666-2', '0351-422-3344', 'contacto@farmacianuevacor.com', 'Av. Colón 450, Córdoba', 'X5000AAR', 1),
('Supermercados Al Costo', '30-99888777-5', '0341-488-9900', 'logistica@alcosto.com', 'Bv. Oroño 1200, Rosario', 'S2000DDF', 1);

INSERT INTO vehiculos (patente, marca, modelo, apto_refrigeracion, capacidad_kg, capacidad_m3, activo) VALUES
('AF123JK', 'Mercedes-Benz', 'Sprinter', 1, 1500.00, 10.50, 1),
('AE987LL', 'Ford', 'Transit', 0, 1200.00, 8.00, 1),
('AG456OP', 'Iveco', 'Daily', 1, 3500.00, 18.00, 1);

INSERT INTO categorias_producto (nombre, descripcion) VALUES
('Electrónica', 'Dispositivos, componentes y tecnología'),
('Medicamentos', 'Requiere control de temperatura y cuidado extremo'),
('Alimentos Perecederos', 'Productos que requieren refrigeración constante'),
('Bazar y Hogar', 'Productos generales no frágiles');

INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(1, 2, 2, 2, 'Calle Florida 500, CABA', 1.50, 45.00, 'Entregar en planta baja, preguntar por depósito.'),
(1, 4, 1, 2, 'Bv. Oroño 1200, Rosario', 5.20, 320.00, 'Paletizado. Requiere orden de compra física.'),
(3, 1, 3, 2, 'Av. Córdoba 2500, CABA', 0.80, 12.50, 'Devolución de mercadería fallada.'),
(2, 4, 4, 1, 'Bv. Oroño 1200, Rosario', 2.10, 80.00, 'Cancelado por el cliente antes del despacho.');

INSERT INTO pedido_categoria (id_pedido, id_categoria) VALUES (1, 1), (2, 3), (2, 4), (3, 2), (4, 1);

INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(1, 2, 2, '2026-06-16 08:00:00', '2026-06-16 14:00:00', 'Ruta corta zona Centro/CABA.'),
(2, 1, 1, '2026-06-17 06:00:00', '2026-06-17 18:00:00', 'Viaje a Rosario con refrigeración activa.');

INSERT INTO hoja_ruta_pedido (id_hoja_ruta, id_pedido, orden_visita, hora_estimada) VALUES (1, 1, 1, '2026-06-16 10:30:00'), (2, 2, 1, '2026-06-17 11:15:00');

INSERT INTO entregas (id_pedido, id_estado_entrega, fecha_entrega, recibido_por, firma_digital, observaciones, recibo_emitido) VALUES
(3, 2, '2026-06-15 16:45:00', 'Ricardo Luz', X'41424344', 'Todo recibido en orden. Caja sellada.', 1);