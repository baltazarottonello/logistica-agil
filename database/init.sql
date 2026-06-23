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
    CONSTRAINT fk_chofer_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE RESTRICT
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
-- CATEGORIAS DE PRODUCTOS (CON COLUMNA DE CONTROL TÉRMICO)
-- =====================================================
CREATE TABLE categorias_producto (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    requiere_frio BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- ESTADOS DEL PEDIDO
-- =====================================================
CREATE TABLE estados_pedido (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO estados_pedido(nombre) VALUES ('Pendiente'), ('En Ruta'), ('Entregado'), ('Cancelado'), ('Asignado');

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
-- TRIGGERS
-- =====================================================
DELIMITER $$

CREATE DEFINER=`root`@`%` TRIGGER `usuarios_AFTER_UPDATE` 
AFTER UPDATE ON `usuarios` 
FOR EACH ROW 
BEGIN
    IF OLD.activo <> NEW.activo THEN
        UPDATE choferes 
        SET activo = NEW.activo 
        WHERE id_usuario = NEW.id_usuario;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- SCRIPT COMPLETO DE CARGA DE DATOS (MÉTODO SEGURO AUTO_INCREMENT)
-- =====================================================

-- -----------------------------------------------------
-- 1. ROLES Y CATEGORÍAS (Tablas Maestras Estáticas)
-- -----------------------------------------------------
-- NOTA: Si ya tienes estos datos, MySQL los ignorará o puedes dejarlos pasar.
INSERT IGNORE INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'Administrador', 'Acceso total al sistema y configuración'),
(2, 'Operador', 'Gestión de pedidos, clientes y asignación de hojas de ruta'),
(3, 'Chofer', 'Visualización de rutas asignadas y registro de entregas');

INSERT INTO categorias_producto (nombre, descripcion, requiere_frio) VALUES
('Electrónica', 'Dispositivos, componentes y tecnología', 0),
('Medicamentos', 'Requiere control de temperatura y cuidado extremo', 1),
('Alimentos Perecederos', 'Productos que requieren refrigeración constante', 1),
('Bazar y Hogar', 'Productos generales no frágiles', 0);

-- Capturamos IDs de categorías para relaciones posteriores
SET @cat_electronica = (SELECT id_categoria FROM categorias_producto WHERE nombre = 'Electrónica' LIMIT 1);
SET @cat_meds        = (SELECT id_categoria FROM categorias_producto WHERE nombre = 'Medicamentos' LIMIT 1);
SET @cat_alimentos   = (SELECT id_categoria FROM categorias_producto WHERE nombre = 'Alimentos Perecederos' LIMIT 1);
SET @cat_bazar       = (SELECT id_categoria FROM categorias_producto WHERE nombre = 'Bazar y Hogar' LIMIT 1);


-- -----------------------------------------------------
-- 2. CLIENTES (Remitentes y Destinatarios)
-- -----------------------------------------------------
INSERT INTO clientes (razon_social, cuit, telefono, email, direccion, codigo_postal, activo) VALUES
('Distribuidora Mayorista S.A.', '30-12345678-9', '011-4555-0100', 'ventas@distribuidoramay.com', 'Av. Córdoba 2500, CABA', 'C1120AAF', 1),
('TecnoTienda SRL', '30-87654321-9', '011-4666-0200', 'compras@tecnotienda.com', 'Calle Florida 500, CABA', 'C1005AAT', 1),
('Farmacia Nueva Córdoba', '27-44555666-2', '0351-422-3344', 'contacto@farmacianuevacor.com', 'Av. Colón 450, Córdoba', 'X5000AAR', 1),
('Supermercados Al Costo', '30-99888777-5', '0341-488-9900', 'logistica@alcosto.com', 'Bv. Oroño 1200, Rosario', 'S2000DDF', 1),
('Hipermercados Norte', '30-55566677-9', '011-4300-9900', 'logistica@norte.com', 'Av. Mitre 450, Avellaneda', 'B1870AAT', 1),
('Laboratorios Argentinos S.A.', '30-44433322-1', '011-4700-1111', 'despacho@labarg.com', 'Av. San Martín 3200, CABA', 'C1417EER', 1),
('Logística Express Rosario', '30-99911122-3', '0341-420-5500', 'recepcion@logexpress.com', 'Pellegrini 2400, Rosario', 'S2000QWE', 1),
('Frigorífico del Sur', '30-11122233-4', '0291-455-6600', 'expedicion@frigosur.com', 'Ruta 3 Km 680, Bahía Blanca', 'B8000XYZ', 1);

-- Mapeo manual de variables de clientes para evitar fallas por IDs movidos
SET @cli_distribuidora = (SELECT id_cliente FROM clientes WHERE razon_social = 'Distribuidora Mayorista S.A.' LIMIT 1);
SET @cli_tecno        = (SELECT id_cliente FROM clientes WHERE razon_social = 'TecnoTienda SRL' LIMIT 1);
SET @cli_farmacia     = (SELECT id_cliente FROM clientes WHERE razon_social = 'Farmacia Nueva Córdoba' LIMIT 1);
SET @cli_super        = (SELECT id_cliente FROM clientes WHERE razon_social = 'Supermercados Al Costo' LIMIT 1);
SET @cli_norte        = (SELECT id_cliente FROM clientes WHERE razon_social = 'Hipermercados Norte' LIMIT 1);
SET @cli_lab          = (SELECT id_cliente FROM clientes WHERE razon_social = 'Laboratorios Argentinos S.A.' LIMIT 1);
SET @cli_log_ros      = (SELECT id_cliente FROM clientes WHERE razon_social = 'Logística Express Rosario' LIMIT 1);
SET @cli_frigo        = (SELECT id_cliente FROM clientes WHERE razon_social = 'Frigorífico del Sur' LIMIT 1);


-- -----------------------------------------------------
-- 3. VEHÍCULOS FLOTA
-- -----------------------------------------------------
INSERT INTO vehiculos (patente, marca, modelo, apto_refrigeracion, capacidad_kg, capacidad_m3, activo) VALUES
('AF123JK', 'Mercedes-Benz', 'Sprinter', 1, 1500.00, 10.50, 1),
('AE987LL', 'Ford', 'Transit', 0, 1200.00, 8.00, 1),
('AG456OP', 'Iveco', 'Daily', 1, 3500.00, 18.00, 1),
('AG789PP', 'Scania', 'P310 Heavy', 0, 12000.00, 45.00, 1),
('AF654RR', 'Mercedes-Benz', 'Accelo 1016', 1, 5000.00, 22.00, 1),
('AE111AA', 'Renault', 'Kangoo', 0, 750.00, 3.20, 1);

SET @v_sprinter = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AF123JK' LIMIT 1);
SET @v_transit  = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AE987LL' LIMIT 1);
SET @v_daily    = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AG456OP' LIMIT 1);
SET @v_scania   = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AG789PP' LIMIT 1);
SET @v_accelo   = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AF654RR' LIMIT 1);
SET @v_kangoo   = (SELECT id_vehiculo FROM vehiculos WHERE patente = 'AE111AA' LIMIT 1);


-- -----------------------------------------------------
-- 4. USUARIOS, ROLES Y CHOFERES (Bloque Sincronizado)
-- -----------------------------------------------------

-- Usuario: Carlos (Admin)
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Carlos', 'Gómez', 'carlos.admin@logistica.com', '1234', 1);
SET @u_carlos = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_carlos, 1);

-- Usuario: Laura (Operador)
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Laura', 'Rodríguez', 'laura.ops@logistica.com', '1234', 1);
SET @u_laura = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_laura, 2);

-- Usuario: Mariana (Operador Masivo)
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Mariana', 'Paz', 'mariana.ops@logistica.com', '1234', 1);
SET @u_mariana = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_mariana, 2);

-- Chofer 1: Juan
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Juan', 'Pérez', 'juan.chofer@logistica.com', '1234', 1);
SET @u_juan = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_juan, 3);
INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES (@u_juan, '34111222', 'L-ABC-12345', '+54 11 4444-5555', 'juan.chofer@logistica.com', 1);
SET @ch_juan = LAST_INSERT_ID();

-- Chofer 2: Martín
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Martín', 'Silva', 'martin.chofer@logistica.com', '1234', 1);
SET @u_martin = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_martin, 3);
INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES (@u_martin, '36333444', 'L-XYZ-98765', '+54 11 4444-6666', 'martin.chofer@logistica.com', 1);
SET @ch_martin = LAST_INSERT_ID();

-- Chofer 3: Elena (Inactiva)
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Elena', 'Fernández', 'elena.chofer@logistica.com', '1234', 0);
SET @u_elena = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_elena, 3);
INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES (@u_elena, '32555666', 'L-DEF-45678', '+54 11 4444-7777', 'elena.chofer@logistica.com', 0);
SET @ch_elena = LAST_INSERT_ID();

-- Chofer 4: Roberto (Masivo)
INSERT INTO usuarios (nombre, apellido, email, password_hash, activo) VALUES ('Roberto', 'Sánchez', 'roberto.chofer@logistica.com', '1234', 1);
SET @u_roberto = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (@u_roberto, 3);
INSERT INTO choferes (id_usuario, dni, licencia_conducir, telefono, email, activo) VALUES (@u_roberto, '38222333', 'L-BBB-55443', '+54 11 5555-0001', 'roberto.chofer@logistica.com', 1);
SET @ch_roberto = LAST_INSERT_ID();


-- -----------------------------------------------------
-- 5. PEDIDOS (Insertados uno a uno para amarrar variables)
-- -----------------------------------------------------
-- Pedido 1
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_distribuidora, @cli_tecno, 2, @u_laura, 'Calle Florida 500, CABA', 1.50, 45.00, 'Entregar en planta baja, preguntar por depósito.');
SET @p1 = LAST_INSERT_ID();

-- Pedido 2
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_distribuidora, @cli_super, 1, @u_laura, 'Bv. Oroño 1200, Rosario', 5.20, 320.00, 'Paletizado. Requiere orden de compra física.');
SET @p2 = LAST_INSERT_ID();

-- Pedido 3
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_farmacia, @cli_distribuidora, 3, @u_laura, 'Av. Córdoba 2500, CABA', 0.80, 12.50, 'Devolución de mercadería fallada.');
SET @p3 = LAST_INSERT_ID();

-- Pedido 4
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_tecno, @cli_super, 4, @u_carlos, 'Bv. Oroño 1200, Rosario', 2.10, 80.00, 'Cancelado por el cliente antes del despacho.');
SET @p4 = LAST_INSERT_ID();

-- Pedido 5 (Requiere Frío ❄️)
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_distribuidora, @cli_farmacia, 5, @u_laura, 'Av. Colón 450, Córdoba', 2.10, 150.00, 'Carga crítica de farmacia. Mantener refrigeración estricta.');
SET @p5 = LAST_INSERT_ID();

-- Pedido 6
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_distribuidora, @cli_tecno, 5, @u_laura, 'Calle Florida 500, CABA', 0.90, 60.00, 'Entrega en horario comercial.');
SET @p6 = LAST_INSERT_ID();

-- Pedido 7 (Requiere Frío ❄️)
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_super, @cli_distribuidora, 5, @u_laura, 'Av. Córdoba 2500, CABA', 3.40, 410.00, 'Enviar directo a cámaras de frío al recibir.');
SET @p7 = LAST_INSERT_ID();

-- Pedido 8 (Masivo Larga Distancia Frío ❄️)
INSERT INTO pedidos (id_cliente_remitente, id_cliente_destinatario, id_estado, id_usuario_creador, direccion_entrega, volumen_m3, peso_kg, observaciones) VALUES
(@cli_frigo, @cli_norte, 1, @u_mariana, 'Av. Mitre 450, Avellaneda', 12.00, 2200.00, 'Lote masivo lácteos y embutidos. Control térmico.');
SET @p8 = LAST_INSERT_ID();


-- -----------------------------------------------------
-- 6. ASIGNACIÓN CATEGORÍAS DE PRODUCTO
-- -----------------------------------------------------
INSERT INTO pedido_categoria (id_pedido, id_categoria) VALUES 
(@p1, @cat_electronica), 
(@p2, @cat_alimentos), 
(@p2, @cat_bazar), 
(@p3, @cat_meds), 
(@p4, @cat_electronica),
(@p5, @cat_meds),        
(@p6, @cat_bazar),       
(@p7, @cat_alimentos),
(@p8, @cat_alimentos);


-- -----------------------------------------------------
-- 7. HOJAS DE RUTA (Rutas Planificadas y Activas)
-- -----------------------------------------------------
-- Hoja 1
INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(@ch_juan, @v_transit, 2, '2026-06-16 08:00:00', '2026-06-16 14:00:00', 'Ruta corta zona Centro/CABA.');
SET @hr1 = LAST_INSERT_ID();

-- Hoja 2
INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(@ch_martin, @v_sprinter, 1, '2026-06-17 06:00:00', '2026-06-17 18:00:00', 'Viaje a Rosario con refrigeración activa.');
SET @hr2 = LAST_INSERT_ID();

-- Hoja 3 (Apto Frío - Camión Iveco Daily)
INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(@ch_juan, @v_daily, 1, '2026-06-20 05:00:00', '2026-06-21 20:00:00', 'Despacho de larga distancia hacia Córdoba con frío activo.');
SET @hr3 = LAST_INSERT_ID();

-- Hoja 4
INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(@ch_martin, @v_transit, 1, '2026-06-18 08:30:00', '2026-06-18 15:00:00', 'Reparto urbano sin requerimientos térmicos.');
SET @hr4 = LAST_INSERT_ID();

-- Hoja 5 (Ruta pesada refrigerada masiva)
INSERT INTO hojas_ruta (id_chofer, id_vehiculo, id_estado_hoja, fecha_salida, fecha_estimada_regreso, observaciones) VALUES
(@ch_roberto, @v_accelo, 2, '2026-06-18 04:00:00', '2026-06-19 22:00:00', 'Tránsito interprovincial refrigerado pesado.');
SET @hr5 = LAST_INSERT_ID();


-- -----------------------------------------------------
-- 8. ASIGNACIÓN HOJA DE RUTA - PEDIDO
-- -----------------------------------------------------
INSERT INTO hoja_ruta_pedido (id_hoja_ruta, id_pedido, orden_visita, hora_estimada) VALUES 
(@hr1, @p1, 1, '2026-06-16 10:30:00'), 
(@hr2, @p2, 1, '2026-06-17 11:15:00'),
(@hr3, @p5, 1, '2026-06-20 14:00:00'), 
(@hr3, @p7, 2, '2026-06-21 09:30:00'), 
(@hr4, @p6, 1, '2026-06-18 10:00:00'),
(@hr5, @p8, 1, '2026-06-18 08:30:00');


-- -----------------------------------------------------
-- 9. ENTREGAS
-- -----------------------------------------------------
INSERT INTO entregas (id_pedido, id_estado_entrega, fecha_entrega, recibido_por, firma_digital, observaciones, recibo_emitido) VALUES
(@p3, 2, '2026-06-15 16:45:00', 'Ricardo Luz', '41424344', 'Todo recibido en orden. Caja sellada.', 1);