/**
 * Esquema de la base de datos para SQL Server.
 * Se mantiene como constantes y no como archivos .sql sueltos para que `tsc`
 * lo lleve al build sin pasos extra de copia.
 *
 * Las fechas se guardan en DATETIME2 con valor UTC; mostrarlas en
 * America/Bogotá es responsabilidad de la capa de interfaz.
 *
 * **Orden importante**: `barberias` se crea antes que `servicios`, porque la
 * segunda referencia a la primera. Lo garantiza `aplicarEsquema`.
 */
export const ESQUEMA_BARBERIAS = `
IF OBJECT_ID('dbo.barberias', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.barberias (
    id                 NVARCHAR(36)  NOT NULL,
    nombre             NVARCHAR(80)  NOT NULL,
    descripcion        NVARCHAR(500) NOT NULL CONSTRAINT DF_barberias_descripcion DEFAULT '',
    direccion          NVARCHAR(200) NOT NULL,
    ciudad             NVARCHAR(100) NOT NULL,
    telefono           NVARCHAR(20)  NOT NULL,
    correo             NVARCHAR(254) NOT NULL,
    estado             VARCHAR(30)   NOT NULL,
    motivo_suspension  NVARCHAR(500) NULL,
    registrada_en      DATETIME2(3)  NOT NULL,
    habilitada_en      DATETIME2(3)  NULL,
    actualizada_en     DATETIME2(3)  NOT NULL,
    CONSTRAINT PK_barberias        PRIMARY KEY (id),
    CONSTRAINT UQ_barberias_correo UNIQUE (correo),
    CONSTRAINT CK_barberias_estado CHECK (estado IN ('PENDIENTE_VERIFICACION','HABILITADA','SUSPENDIDA'))
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_barberias_estado' AND object_id = OBJECT_ID('dbo.barberias'))
  CREATE INDEX IX_barberias_estado ON dbo.barberias (estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_barberias_ciudad' AND object_id = OBJECT_ID('dbo.barberias'))
  CREATE INDEX IX_barberias_ciudad ON dbo.barberias (ciudad);
`;

/**
 * Catálogo de servicios (CAR-03). Cada fila pertenece a una barbería y esa
 * columna es la clave del aislamiento multiempresa (RES-02).
 *
 * Decisiones que conviene no deshacer sin pensarlo:
 *
 *  - `precio INT`: el dinero se guarda en **pesos colombianos enteros** (RES-06),
 *    nunca en FLOAT, DECIMAL ni MONEY. El peso no se fracciona, así que un tipo
 *    con decimales solo abriría la puerta a importes que no pueden cobrarse.
 *    `INT` llega hasta 2.147 millones, muy por encima del tope de $100.000.000
 *    que impone el objeto de valor `Dinero`.
 *  - `FK_servicios_barberia ... ON DELETE NO ACTION`: borrar una barbería con
 *    catálogo debe fallar. Las barberías se suspenden, no se borran.
 *  - `UQ_servicios_nombre (id_barberia, nombre)`: el nombre es único **dentro
 *    de** la barbería. La intercalación por defecto de SQL Server no distingue
 *    mayúsculas, así que «Corte clásico» y «CORTE CLÁSICO» chocan, que es
 *    justo lo que se quiere.
 *  - `CK_servicios_precio` y `CK_servicios_duracion` repiten en el motor lo que
 *    ya valida el dominio. No es desconfianza del código: es que la base se
 *    puede tocar por fuera de la aplicación y estas reglas no deben depender
 *    de que todo el mundo pase por el hexágono.
 */
export const ESQUEMA_SERVICIOS = `
IF OBJECT_ID('dbo.servicios', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.servicios (
    id                NVARCHAR(36)  NOT NULL,
    id_barberia       NVARCHAR(36)  NOT NULL,
    nombre            NVARCHAR(80)  NOT NULL,
    descripcion       NVARCHAR(300) NOT NULL CONSTRAINT DF_servicios_descripcion DEFAULT '',
    precio            INT           NOT NULL,
    duracion_minutos  INT           NOT NULL,
    estado            VARCHAR(20)   NOT NULL,
    creado_en         DATETIME2(3)  NOT NULL,
    actualizado_en    DATETIME2(3)  NOT NULL,
    CONSTRAINT PK_servicios          PRIMARY KEY (id),
    CONSTRAINT FK_servicios_barberia FOREIGN KEY (id_barberia)
      REFERENCES dbo.barberias (id) ON DELETE NO ACTION,
    CONSTRAINT UQ_servicios_nombre   UNIQUE (id_barberia, nombre),
    CONSTRAINT CK_servicios_estado   CHECK (estado IN ('ACTIVO','INACTIVO')),
    CONSTRAINT CK_servicios_precio   CHECK (precio > 0),
    CONSTRAINT CK_servicios_duracion CHECK (duracion_minutos > 0 AND duracion_minutos % 5 = 0)
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_servicios_barberia_estado' AND object_id = OBJECT_ID('dbo.servicios'))
  CREATE INDEX IX_servicios_barberia_estado ON dbo.servicios (id_barberia, estado);
`;
