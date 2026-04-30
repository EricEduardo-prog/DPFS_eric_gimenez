-- ======================================================
-- DATA.SQL - Inserción de datos desde los JSON proporcionados
-- ======================================================
USE ee_platform;
-- ------------------------------------------------------
-- 1. CATEGORÍAS
-- ------------------------------------------------------
INSERT INTO categories (
        id,
        slug,
        name,
        description,
        icon,
        is_active,
        `order`,
        created_at,
        updated_at
    )
VALUES (
        'cat_001',
        'climatizacion',
        'Climatización',
        'Aires acondicionados, ventiladores, estufas y calefactores',
        '❄️',
        TRUE,
        1,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_002',
        'herramientas',
        'Herramientas',
        'Herramientas manuales, eléctricas e industriales',
        '🔧',
        TRUE,
        2,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_003',
        'ferreteria',
        'Ferretería',
        'Tornillos, bulones, anclajes y fijaciones',
        '🔩',
        TRUE,
        3,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_004',
        'iluminacion',
        'Iluminación',
        'Lámparas, spots, tiras LED y artefactos de iluminación',
        '💡',
        TRUE,
        4,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_005',
        'plomeria',
        'Plomería',
        'Cañerías, llaves de paso, termotanques y sanitarios',
        '🚿',
        TRUE,
        5,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_006',
        'electricidad',
        'Electricidad',
        'Cables, tableros, disyuntores y materiales eléctricos',
        '⚡',
        TRUE,
        6,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_007',
        'pinturas',
        'Pinturas',
        'Pinturas, esmaltes, barnices y accesorios de pintura',
        '🎨',
        TRUE,
        7,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_008',
        'construccion',
        'Construcción',
        'Cemento, ladrillos, cerámicos y materiales de obra',
        '🏗️',
        TRUE,
        8,
        '2025-01-01 00:00:00',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_009',
        'manicura',
        'Manicura',
        '"Corte de uñas"\r\n"Esmaltado"\r\n"Permanentes"',
        '💅',
        TRUE,
        9,
        '2026-04-08 22:44:58',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_010',
        'capacitaciones',
        'Capacitaciones',
        'Cursos con certificaciones brindadas por profesionales academicos expertos es su materia.',
        '👨‍🏫',
        TRUE,
        10,
        '2026-04-08 22:44:58',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_011',
        'masajista',
        'Masajista',
        'Profesionales con titulos habilitantes para desarrollar terapias corporales. Relax asegurado.',
        '💆',
        TRUE,
        11,
        '2026-04-10 15:46:41',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_012',
        'artilugios',
        'Artilugios',
        'Objetos realizados únicamente para funciones especificas.',
        '🃏',
        TRUE,
        12,
        '2026-04-14 21:54:08',
        '2026-04-27 15:02:07'
    ),
    (
        'cat_013',
        'motores',
        'Motores',
        'Motores',
        '🃏',
        TRUE,
        13,
        '2026-04-27 14:58:17',
        '2026-04-27 15:02:07'
    );
-- ------------------------------------------------------
-- 2. SERVICIOS (services)
-- ------------------------------------------------------
INSERT INTO services (
        id,
        name,
        slug,
        description,
        experience_levels,
        certification_required,
        is_featured,
        is_active,
        base_price,
        hourly_price,
        created_at,
        updated_at
    )
VALUES (
        'serv_001',
        'Electricista',
        'electricista',
        'Instalación, reparación y mantenimiento de sistemas eléctricos residenciales y comerciales. Incluye tableros, cableado, disyuntores y sistemas de iluminación.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de electricidad"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Curso de seguridad eléctrica"]},{"nivel":"3-5 años","requisitos":["Matrícula habilitante","Certificado de altura"]},{"nivel":"6-10 años","requisitos":["Matrícula profesional","Especialización en alta tensión"]},{"nivel":"+10 años","requisitos":["Matrícula profesional","Certificación en gestión de proyectos"]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        NULL,
        NULL,
        '2026-01-01 00:00:00',
        '2026-04-15 15:45:59'
    ),
    (
        'serv_002',
        'Plomero / Gasista',
        'plomero-gasista',
        'Instalación y reparación de sistemas de agua fría/caliente, desagües, termotanques, calefones y redes de gas natural.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de plomería"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Curso de gasista"]},{"nivel":"3-5 años","requisitos":["Matrícula de gasista","Certificado de instalador"]},{"nivel":"6-10 años","requisitos":["Matrícula profesional","Especialización en termomecánica"]},{"nivel":"+10 años","requisitos":["Matrícula profesional","Certificación en eficiencia energética"]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        200000.00,
        50000.00,
        '2026-01-01 00:00:00',
        '2026-04-23 21:36:33'
    ),
    (
        'serv_003',
        'Técnico en climatización',
        'tecnico-climatizacion',
        'Instalación, mantenimiento y reparación de aires acondicionados, sistemas de calefacción central, bombas de calor y ventilación.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de refrigeración"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Manejo de herramientas"]},{"nivel":"3-5 años","requisitos":["Título técnico","Manejo de gases refrigerantes"]},{"nivel":"6-10 años","requisitos":["Matrícula profesional","Especialización en VRF"]},{"nivel":"+10 años","requisitos":["Certificación internacional","Gestión de proyectos HVAC"]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        250000.00,
        50000.00,
        '2026-01-01 00:00:00',
        '2026-04-23 23:49:41'
    ),
    (
        'serv_004',
        'Técnico en refrigeración',
        'tecnico-refrigeracion',
        'Mantenimiento y reparación de sistemas de refrigeración comercial e industrial: cámaras frigoríficas, heladeras, freezers y vitrinas.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de refrigeración"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Manejo de herramientas"]},{"nivel":"3-5 años","requisitos":["Título técnico","Certificación en gases refrigerantes"]},{"nivel":"6-10 años","requisitos":["Matrícula profesional","Especialización en sistemas comerciales"]},{"nivel":"+10 años","requisitos":["Certificación internacional","Gestión de equipos"]}]' AS JSON
        ),
        TRUE,
        FALSE,
        TRUE,
        NULL,
        NULL,
        '2026-01-01 00:00:00',
        '2026-04-23 21:49:10'
    ),
    (
        'serv_005',
        'Técnico electromecánico',
        'tecnico-electromecanico',
        'Mantenimiento y reparación de equipos electromecánicos: motores, bombas, generadores, sistemas de automatización y control industrial.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de electromecánica"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Manejo de instrumentos"]},{"nivel":"3-5 años","requisitos":["Título técnico","Manejo de PLC"]},{"nivel":"6-10 años","requisitos":["Matrícula profesional","Especialización en automatización"]},{"nivel":"+10 años","requisitos":["Certificación en gestión de mantenimiento","Liderazgo técnico"]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        250000.00,
        25000.00,
        '2026-01-01 00:00:00',
        '2026-04-23 21:37:34'
    ),
    (
        'serv_006',
        'Albañil / Constructor',
        'albanil-constructor',
        'Construcción, reparación y mantenimiento de estructuras civiles: mampostería, hormigón, revoques, contrapisos y refacciones.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de albañilería"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Manejo de herramientas"]},{"nivel":"3-5 años","requisitos":["Formación técnica","Lectura de planos"]},{"nivel":"6-10 años","requisitos":["Matrícula de constructor","Gestión de obras"]},{"nivel":"+10 años","requisitos":["Ingeniería o arquitectura","Dirección de obras"]}]' AS JSON
        ),
        TRUE,
        FALSE,
        TRUE,
        100000.00,
        40000.00,
        '2026-01-01 00:00:00',
        '2026-04-23 23:48:43'
    ),
    (
        'serv_007',
        'Pintor',
        'pintor',
        'Pintura de interiores y exteriores, preparación de superficies, empastado, laqueado y aplicación de revestimientos decorativos.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":["Curso básico de pintura"]},{"nivel":"1-2 años","requisitos":["Experiencia comprobable","Manejo de equipos"]},{"nivel":"3-5 años","requisitos":["Técnicas avanzadas","Manejo de colores"]},{"nivel":"6-10 años","requisitos":["Especialización en revestimientos","Presupuestación"]},{"nivel":"+10 años","requisitos":["Certificación en calidad","Gestión de proyectos"]}]' AS JSON
        ),
        TRUE,
        FALSE,
        TRUE,
        200000.00,
        50000.00,
        '2026-01-01 00:00:00',
        '2026-04-23 21:35:44'
    ),
    (
        'serv_008',
        'Masajista',
        'masajista',
        'Distintos tipos de masajes corporales.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":[]},{"nivel":"1-2 años","requisitos":[]},{"nivel":"3-5 años","requisitos":[]},{"nivel":"6-10 años","requisitos":[]},{"nivel":"+10 años","requisitos":[]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        80000.00,
        80000.00,
        '2026-04-15 01:40:35',
        '2026-04-23 21:36:23'
    ),
    (
        'serv_009',
        'Técnico Informático',
        'tecnico-informatico',
        'Profesionales capacidades y skill desde manejo de redes hasta programacion.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":[]},{"nivel":"1-2 años","requisitos":[]},{"nivel":"3-5 años","requisitos":[]},{"nivel":"6-10 años","requisitos":[]},{"nivel":"+10 años","requisitos":[]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        400000.00,
        50000.00,
        '2026-04-15 15:45:37',
        '2026-04-15 15:45:37'
    ),
    (
        'serv_010',
        'Cantante',
        'cantante',
        'Servicio solicitado por Roberto Carlos',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":[]},{"nivel":"1-2 años","requisitos":[]},{"nivel":"3-5 años","requisitos":[]},{"nivel":"6-10 años","requisitos":[]},{"nivel":"+10 años","requisitos":[]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        299999.99,
        80000.00,
        '2026-04-17 15:26:12',
        '2026-04-23 21:36:13'
    ),
    (
        'serv_011',
        'Tecnico mecanico',
        'tecnico-mecanico',
        'Arreglo de motores y instalaciones motorizadas.',
        CAST(
            '[{"nivel":"Sin experiencia","requisitos":[]},{"nivel":"1-2 años","requisitos":[]},{"nivel":"3-5 años","requisitos":[]},{"nivel":"6-10 años","requisitos":[]},{"nivel":"+10 años","requisitos":[]}]' AS JSON
        ),
        TRUE,
        TRUE,
        TRUE,
        300000.00,
        20000.00,
        '2026-04-23 23:50:09',
        '2026-04-27 15:05:15'
    );
-- ------------------------------------------------------
-- 3. USUARIOS (users)
-- ------------------------------------------------------
INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        phone,
        address,
        terms_accepted,
        is_active,
        registered_at,
        updated_at
    )
VALUES (
        'usr_001',
        'María García',
        'maria.garcia@gmail.com',
        '$2b$10$UxlAiezHOJlcWuO4aZbHr.l3DC8YIzev.FEayIQJ7GCLhYqE5tpXi',
        '+54 9 223 411-2233',
        CAST(
            '{"calle":"Av. Colón","numero":"1234","piso":"3","depto":"B","ciudad":"Mar del Plata","provincia":"Buenos Aires","codigoPostal":"7600"}' AS JSON
        ),
        TRUE,
        TRUE,
        '2025-01-10 09:30:00',
        '2026-04-14 22:18:22'
    ),
    (
        'usr_002',
        'Carlos Fernández',
        'carlosfernandez@hotmail.com',
        '$2b$10$abcXYZ123abcXYZ123abcXabcXYZ123abcXYZ123abcXYZ123abcX',
        '+54 9 223 533-4455',
        CAST(
            '{"calle":"Belgrano","numero":"3456","piso":"","depto":"","ciudad":"Mar del Plata","provincia":"Buenos Aires","codigoPostal":"7600"}' AS JSON
        ),
        TRUE,
        TRUE,
        '2025-01-25 14:15:00',
        '2025-02-10 11:00:00'
    ),
    (
        'usr_003',
        'Lucía Ramírez',
        'lucia.ramirez@outlook.com',
        '$2b$10$ZZZ999ZZZ999ZZZ999ZZZoZZZ999ZZZ999ZZZ999ZZZ999ZZZ999Z',
        '',
        CAST(
            '{"calle":"San Martín","numero":"890","piso":"1","depto":"A","ciudad":"Mar del Plata","provincia":"Buenos Aires","codigoPostal":"7600"}' AS JSON
        ),
        TRUE,
        TRUE,
        '2025-02-03 18:45:00',
        '2026-04-14 22:18:29'
    ),
    (
        'usr_004',
        'Eric El Mas PRo',
        'ericpro@gmail.com',
        '$2b$10$a7BlJaRgfSAbqQsx2ZrSaOjQi6veayGcdBSKh5ktxUjqZoaZX60K2',
        '',
        CAST(
            '{"calle":"","numero":"123","piso":"","depto":"","ciudad":"","provincia":"","codigoPostal":""}' AS JSON
        ),
        TRUE,
        TRUE,
        '2026-04-14 13:39:45',
        '2026-04-18 02:58:36'
    ),
    (
        'usr_005',
        'Jose Garcia',
        'josegarcia@invento.com',
        '$2b$10$Th5S1Ex2cUwCsiAMCk6l9eGU2dadlRDON9BXbgnRIoCGH9mjSL/LK',
        '',
        CAST(
            '{"calle":"","numero":"","piso":"","depto":"","ciudad":"Chubut","provincia":"","codigoPostal":"8900"}' AS JSON
        ),
        TRUE,
        TRUE,
        '2026-04-14 22:19:27',
        '2026-04-14 22:19:27'
    ),
    (
        'usr_006',
        'Pablo Campazo',
        'pablo@invento.com',
        '$2b$10$6knI.I0rKI0bhnnsHJ.jE.IH5Mqhfoq8sb863zJ68YephNnOVgP8K',
        '',
        CAST(
            '{"calle":"","numero":"","piso":"","depto":"","ciudad":"","provincia":"","codigoPostal":""}' AS JSON
        ),
        TRUE,
        TRUE,
        '2026-04-14 22:22:24',
        '2026-04-14 22:22:24'
    ),
    (
        'usr_007',
        'James Bond',
        'admin@ee.com',
        '$2b$10$6knI.I0rKI0bhnnsHJ.jE.IH5Mqhfoq8sb863zJ68YephNnOVgP8K',
        '123123123',
        CAST(
            '{"calle":"","numero":"","piso":"","depto":"","ciudad":"","provincia":"","codigoPostal":""}' AS JSON
        ),
        TRUE,
        TRUE,
        '2026-04-14 22:22:24',
        '2026-04-27 18:53:06'
    );
-- ------------------------------------------------------
-- 4. PRODUCTOS (products)
-- ------------------------------------------------------
INSERT INTO products (
        id,
        name,
        sku,
        category_id,
        description,
        characteristics,
        image,
        images,
        colors,
        sizes,
        price,
        original_price,
        installation_available,
        installation_service_id,
        rating_value,
        rating_count,
        is_active,
        created_at,
        updated_at
    )
VALUES (
        'prod_001',
        'Aire Acondicionado Split 4500 Frigorías',
        'AC-4500-SIL',
        'cat_001',
        'Aire acondicionado split de 4500 frigorías, ideal para ambientes de 20-25 m² con eficiencia energética A++ y función frío/calor.',
        CAST('[]' AS JSON),
        'https://ejemplo.com/productos/ac-4500.jpg',
        CAST('[]' AS JSON),
        CAST('["Blanco,Negro"]' AS JSON),
        CAST('["3000 BTU,4500 BTU,6000 BTU"]' AS JSON),
        199999.00,
        235000.00,
        TRUE,
        'serv_003',
        4.5,
        128,
        TRUE,
        '2025-01-15 10:00:00',
        '2026-04-24 04:30:25'
    ),
    (
        'prod_002',
        'Taladro Percutor Inalámbrico 20V',
        'TAL-20V-INA',
        'cat_002',
        'Taladro percutor inalámbrico de 20V con batería de litio de larga duración. Incluye maletín, 2 baterías y cargador rápido.',
        CAST(
            '["Motor brushless de alta eficiencia","20V batería de ión litio 4Ah","2 velocidades: 0-450 / 0-1800 rpm","Par máximo 65 Nm","Portabrocas 13mm con bloqueo automático","Luz LED de trabajo","Incluye 2 baterías + cargador rápido + maletín"]' AS JSON
        ),
        'https://ejemplo.com/productos/taladro-20v.jpg',
        CAST(
            '["https://ejemplo.com/productos/taladro-20v-frente.jpg","https://ejemplo.com/productos/taladro-20v-maleta.jpg"]' AS JSON
        ),
        CAST(
            '["Negro/Verde","Negro/Rojo","Azul/Negro"]' AS JSON
        ),
        CAST('[]' AS JSON),
        109999.00,
        110000.00,
        FALSE,
        NULL,
        4.8,
        64,
        TRUE,
        '2025-01-20 11:00:00',
        '2026-04-11 02:56:44'
    ),
    (
        'prod_003',
        'Kit Lámparas LED GU10 6W Luz Cálida x10',
        'LED-GU10-6W-CX10',
        'cat_004',
        'Pack de 10 lámparas LED GU10 de 6W con luz cálida 3000K. Reemplazo directo de dicroicas halógenas de 50W. Vida útil 25.000 horas.',
        CAST(
            '["Potencia: 6W (equivale a 50W halógena)","Temperatura de color: 3000K (luz cálida)","Flujo luminoso: 500 lm","Vida útil: 25.000 horas","Base GU10 estándar","No requiere transformador","Apto para exterior cubierto"]' AS JSON
        ),
        'https://ejemplo.com/productos/led-gu10.jpg',
        CAST(
            '["https://ejemplo.com/productos/led-gu10-pack.jpg","https://ejemplo.com/productos/led-gu10-instalada.jpg"]' AS JSON
        ),
        CAST('[]' AS JSON),
        CAST('["3000K cálida","6500K fría"]' AS JSON),
        12999.00,
        0.00,
        TRUE,
        'serv_001',
        4.2,
        211,
        TRUE,
        '2025-02-01 08:30:00',
        '2026-04-24 04:31:04'
    ),
    (
        'prod_004',
        'Termotanque Eléctrico 80L',
        'TT-ELEC-80L',
        'cat_005',
        'Termotanque eléctrico de 80 litros con cuba de acero vitrificado y ánodo de magnesio. Apto para 3-4 personas.',
        CAST(
            '["Capacidad: 80 litros","Potencia: 1500W / 220V","Cuba de acero vitrificado de alta resistencia","Ánodo de magnesio anticorrosión","Termostato regulable 35°C - 75°C","Válvula de seguridad incluida","Garantía 5 años en La matanza"]' AS JSON
        ),
        'https://ejemplo.com/productos/termotanque-80l.jpg',
        CAST(
            '["https://ejemplo.com/productos/termotanque-80l-frente.jpg","https://ejemplo.com/productos/termotanque-80l-instalado.jpg"]' AS JSON
        ),
        CAST('["Blanco"]' AS JSON),
        CAST('["50L","80L","100L"]' AS JSON),
        149999.00,
        175000.00,
        TRUE,
        'serv_002',
        4.6,
        47,
        TRUE,
        '2025-02-10 13:00:00',
        '2026-04-24 04:30:52'
    ),
    (
        'prod_005',
        'Ceramicos Porcelanato 25x25',
        'CP-01-12302',
        'cat_008',
        'Ceramicos para piso, ideal para:\r\nCocinas\r\nComedores\r\nLiving\r\nSala de Estar',
        CAST('[]' AS JSON),
        '-',
        CAST('[]' AS JSON),
        CAST(
            '["Rojo y Negro","Negro y Rojo","Celeste y Blanco"]' AS JSON
        ),
        CAST('["x100Unidades","x500Unidades"]' AS JSON),
        1000.00,
        5000.00,
        TRUE,
        'serv_006',
        0.0,
        0,
        TRUE,
        '2026-04-10 21:59:36',
        '2026-04-24 04:31:15'
    ),
    (
        'prod_006',
        'Lampara Oveja',
        'ME-123-12312',
        'cat_004',
        'Lampara con forma de oveja, ideal para habitaciones infantiles. Puede hablar.',
        CAST(
            '["Textura con materiales reciclados.","Ideal para habitaciones infantiles","Puede hablar."]' AS JSON
        ),
        '.',
        CAST('[]' AS JSON),
        CAST('["Negra","blanca","Rojo"]' AS JSON),
        CAST('["12.000Volts"]' AS JSON),
        425211.00,
        1000.00,
        FALSE,
        NULL,
        0.0,
        0,
        TRUE,
        '2026-04-10 22:02:33',
        '2026-04-12 05:39:03'
    ),
    (
        'prod_007',
        'Descontracturante de espalda.',
        'MD-012-1232',
        'cat_011',
        'Descontracturante de espalda usando las manos u herramientas para la correcta y reconformante experiencia al usuario.',
        CAST('[]' AS JSON),
        '.',
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        150000.00,
        0.00,
        TRUE,
        'serv_008',
        0.0,
        0,
        TRUE,
        '2026-04-12 05:45:21',
        '2026-04-24 04:32:09'
    ),
    (
        'prod_008',
        'Como hacer helado',
        'Cu-01-1232',
        'cat_010',
        'Elaboracion y explicaciones tecnicas de los procesos para la leaboracion de helado artesanal.',
        CAST('[]' AS JSON),
        '.',
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        150000.00,
        200000.00,
        TRUE,
        'serv_010',
        0.0,
        0,
        TRUE,
        '2026-04-12 05:49:31',
        '2026-04-24 04:32:29'
    ),
    (
        'prod_009',
        'Aspirador de Gatos',
        'CAT-123-12312',
        'cat_012',
        'Revolucionario e innovador aspirador de gatos super silencioso.',
        CAST('[]' AS JSON),
        '.',
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        50000.00,
        100000.00,
        FALSE,
        NULL,
        0.0,
        0,
        TRUE,
        '2026-04-14 22:56:11',
        '2026-04-24 03:04:50'
    ),
    (
        'prod_010',
        'Inodoro Bari Largo',
        'AK-12-12331',
        'cat_005',
        'Elegí el Inodoro Bari Largo de Ferrum y transformá tu baño en un espacio elegante y funcional. Su diseño moderno y sus características te brindan la comodidad y el estilo que buscás en tu casa.',
        CAST('[]' AS JSON),
        'https://blaistenio.vtexassets.com/arquivos/ids/155598-1600-1600?v=638342802419600000&width=1600&height=1600&aspect=true',
        CAST('[]' AS JSON),
        CAST('["Blanco"]' AS JSON),
        CAST('["S"]' AS JSON),
        1890.09,
        25000.00,
        TRUE,
        'serv_002',
        0.0,
        0,
        TRUE,
        '2026-04-23 20:47:09',
        '2026-04-27 14:59:50'
    ),
    (
        'prod_011',
        'Ferrum ECO - Bacha Persis con esmalte reciclado',
        'PRS-BH-022-12',
        'cat_005',
        'Innovación en la utilización de esmalte reciclado. Se recomienda el uso de griferías FV.',
        CAST('[]' AS JSON),
        'https://ferrum.com/pub/media/catalog/product/cache/723de03bc8ecfa836485d5b2e3f2ed4a/b/a/bacha-apoyo-persis-ferrum-bacha-esmalte-reciclado-satinado-prs-bh-022-vp-b_copia_1.jpg',
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        124000.00,
        200000.00,
        TRUE,
        'serv_002',
        0.0,
        0,
        TRUE,
        '2026-04-24 02:57:42',
        '2026-04-24 04:32:48'
    ),
    (
        'prod_012',
        'Calefactor Coppens',
        'ED6346',
        'cat_005',
        'Calefactor Coppens C40BIPAM 4000TB 4000Kcal para espacios de hasta 30 m², con salida lateral izquierda, combina rendimiento y eficiencia para mantener el ambiente cálido de forma constante.',
        CAST('[]' AS JSON),
        'https://cetrogar.vtexassets.com/arquivos/ids/163439-768-auto/Calefactor-C40BIPAM-4000TB-4000Kcal-30m2-izquierda.webp?v=639113902119800000&quality=8',
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        CAST('[]' AS JSON),
        30910.99,
        32710.99,
        TRUE,
        'serv_002',
        0.0,
        0,
        TRUE,
        '2026-04-27 15:01:34',
        '2026-04-27 15:02:07'
    );
-- ------------------------------------------------------
-- 5. PROFESIONALES (professionals)
-- ------------------------------------------------------
INSERT INTO professionals (
        id,
        name,
        license_number,
        profession,
        service_id,
        custom_service,
        service_status,
        experience_years,
        certification_url,
        certification_verified,
        validation_date,
        validated_by,
        admin_observation,
        email,
        phone,
        availability,
        rating_value,
        rating_count,
        jobs_completed,
        is_active,
        created_at,
        updated_at
    )
VALUES (
        'prof_001',
        'Juan Carlos Rodríguez',
        'MP-04578',
        'Técnico en climatización',
        'serv_003',
        NULL,
        'aprobado',
        8,
        '/uploads/certificados/mp-04578_climatizacion.pdf',
        TRUE,
        '2025-01-15 10:00:00',
        'admin@ee.com',
        'Certificación válida y experiencia comprobada.',
        'jcrodriguez@gmail.com',
        '+54 9 223 456-7890',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        4.8,
        23,
        23,
        TRUE,
        '2025-01-10 09:00:00',
        '2026-04-14 21:43:00'
    ),
    (
        'prof_002',
        'Roberto Sánchez',
        'MN-12345',
        'Electricista',
        'serv_001',
        NULL,
        'aprobado',
        5,
        '/uploads/certificados/mn-12345_electricista.pdf',
        TRUE,
        '2026-04-27 15:04:08',
        'admin@ee.com',
        NULL,
        'roberto.sanchez@outlook.com',
        '+54 9 223 567-8901',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        4.5,
        15,
        15,
        TRUE,
        '2025-01-18 10:00:00',
        '2026-04-27 15:04:08'
    ),
    (
        'prof_003',
        'Alejandro López',
        'MP-09871',
        'Plomero / Gasista',
        'serv_002',
        NULL,
        'aprobado',
        11,
        '/uploads/certificados/mp-09871_plomeria.pdf',
        TRUE,
        '2026-04-23 00:59:31',
        'admin@ee.com',
        NULL,
        'alopez.plomeria@gmail.com',
        '+54 9 223 678-9012',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        4.9,
        38,
        38,
        TRUE,
        '2024-12-01 08:00:00',
        '2026-04-23 00:59:31'
    ),
    (
        'prof_004',
        'Marcela Torres',
        'MP-33210',
        'Técnico en refrigeración',
        'serv_004',
        NULL,
        'aprobado',
        3,
        '/uploads/certificados/mp-33210_refrigeracion.pdf',
        TRUE,
        '2026-04-15 15:42:40',
        'admin@ee.com',
        'Certificacion adecuada.\r\nSe da de alta solicitud de nuevo servicio.',
        'marcela.torres.tec@gmail.com',
        '',
        CAST(
            '{"lunes":{"manana":false,"tarde":true},"martes":{"manana":false,"tarde":false},"miercoles":{"manana":true,"tarde":false},"jueves":{"manana":true,"tarde":false},"viernes":{"manana":false,"tarde":true}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2025-02-28 14:00:00',
        '2026-04-15 15:42:40'
    ),
    (
        'prof_005',
        'Marta Stuart',
        'MN-02938',
        'Pintor',
        NULL,
        'Pintura artística y decorativa',
        'rechazado',
        6,
        NULL,
        FALSE,
        '2026-04-17 15:26:55',
        'admin@ee.com',
        'Marta es cantante.',
        'marta@stuart.org',
        '',
        CAST(
            '{"lunes":{"manana":true,"tarde":false},"martes":{"manana":true,"tarde":false},"miercoles":{"manana":true,"tarde":false},"jueves":{"manana":true,"tarde":false},"viernes":{"manana":true,"tarde":false}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2026-04-14 21:47:51',
        '2026-04-17 15:26:55'
    ),
    (
        'prof_006',
        'Raul Obrero',
        'MP-12523',
        '',
        'serv_002',
        NULL,
        'aprobado',
        3,
        NULL,
        TRUE,
        '2026-04-24 22:53:56',
        'admin@ee.com',
        NULL,
        'raulpc@gmail.com',
        '',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2026-04-15 15:31:21',
        '2026-04-24 22:53:56'
    ),
    (
        'prof_007',
        'Roberto Carlos',
        'MN-00938',
        '',
        'serv_010',
        NULL,
        'aprobado',
        16,
        NULL,
        TRUE,
        '2026-04-24 22:41:07',
        'admin@ee.com',
        NULL,
        'robertocarlos@gmail.com',
        '',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2026-04-17 15:14:47',
        '2026-04-24 22:41:07'
    ),
    (
        'prof_008',
        'Mario Pergolini',
        'MP-541232',
        '',
        'serv_001',
        NULL,
        'aprobado',
        5,
        NULL,
        TRUE,
        '2026-04-24 22:53:36',
        'admin@ee.com',
        NULL,
        'marito@hmotm.com',
        '',
        CAST(
            '{"lunes":{"manana":true,"tarde":true},"martes":{"manana":true,"tarde":true},"miercoles":{"manana":true,"tarde":true},"jueves":{"manana":true,"tarde":true},"viernes":{"manana":true,"tarde":true}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2026-04-24 22:45:05',
        '2026-04-24 22:53:36'
    ),
    (
        'prof_009',
        'Jorge Castro',
        'MN-02931',
        '',
        'serv_011',
        NULL,
        'aprobado',
        4,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        'castro@gmail.com',
        '',
        CAST(
            '{"lunes":{"manana":true,"tarde":false},"martes":{"manana":true,"tarde":false},"miercoles":{"manana":true,"tarde":false},"jueves":{"manana":true,"tarde":false},"viernes":{"manana":true,"tarde":false}}' AS JSON
        ),
        0.0,
        0,
        0,
        TRUE,
        '2026-04-27 15:03:47',
        '2026-04-27 15:03:47'
    );
-- ------------------------------------------------------
-- 6. BOOKINGS (reservas cabecera)
-- ------------------------------------------------------
INSERT INTO bookings (id, user_id, session_id, created_at, updated_at)
VALUES (
        'res_001',
        NULL,
        'obhopuKGczM9xkdLHbx-YMqKOZ0dCFgf',
        '2026-04-21 14:19:40',
        '2026-04-21 14:19:40'
    ),
    (
        'res_002',
        'usr_007',
        NULL,
        '2026-04-21 18:41:40',
        '2026-04-28 16:57:47'
    ),
    (
        'res_003',
        'usr_004',
        NULL,
        '2026-04-29 11:55:39',
        '2026-04-29 17:39:35'
    );
-- ------------------------------------------------------
-- 7. BOOKING ITEMS (detalle)
-- ------------------------------------------------------
INSERT INTO booking_items (
        id,
        booking_id,
        type,
        product_id,
        service_id,
        quantity,
        unit_price,
        name,
        professional_id,
        installation_date,
        installation_time,
        created_at,
        updated_at
    )
VALUES -- res_001: ítem de producto
    (
        'item_1776781180643_ojvy',
        'res_001',
        'product',
        'prod_004',
        NULL,
        1,
        149999.00,
        'Termotanque Eléctrico 80L',
        NULL,
        NULL,
        NULL,
        '2026-04-21 14:19:40',
        '2026-04-21 14:19:40'
    ),
    -- res_002: ítem de servicio (profesional, fecha, horario)
    (
        'item_1777304072011_aema',
        'res_002',
        'service',
        NULL,
        'serv_002',
        3,
        0.00,
        'Plomero / Gasista',
        'prof_006',
        '2026-04-22',
        'manana',
        '2026-04-21 18:41:40',
        '2026-04-28 16:57:47'
    ),
    -- res_003: ítem combo
    (
        'item_1777484375775_dgt3',
        'res_003',
        'combo',
        'prod_001',
        'serv_003',
        1,
        449999.00,
        'Aire Acondicionado Split 4500 Frigorías + Servicio (Técnico en climatización)',
        'prof_001',
        '2026-04-30',
        'manana',
        '2026-04-29 11:55:39',
        '2026-04-29 17:39:35'
    );
-- ------------------------------------------------------
-- 8. SERVICE REQUESTS (solicitudes)
-- ------------------------------------------------------
INSERT INTO service_requests (
        id,
        professional_id,
        requested_service,
        description,
        status,
        request_date,
        response_date,
        response_admin
    )
VALUES (
        'sol_001',
        'prof_005',
        'Instalador de paneles solares',
        'Especialista en energía solar fotovoltaica',
        'rechazado',
        '2026-04-14 10:00:00',
        '2026-04-15 15:41:36',
        'admin@ee.com'
    ),
    (
        'sol_002',
        'prof_006',
        'Reparador de PC',
        'Instalación de Software, arreglos de hardware.',
        'rechazado',
        '2026-04-15 15:31:21',
        '2026-04-17 14:47:45',
        'admin@ee.com'
    ),
    (
        'sol_003',
        'prof_007',
        'Cantante',
        'Cantante para eventos.',
        'aprobado',
        '2026-04-17 15:14:28',
        '2026-04-17 15:26:13',
        'admin@ee.com'
    ),
    (
        'sol_004',
        NULL,
        'Cantante',
        'Cantante para eventos.',
        'pendiente',
        '2026-04-17 15:14:47',
        NULL,
        NULL
    );
-- ------------------------------------------------------
-- FIN DEL SCRIPT data.sql
-- ------------------------------------------------------