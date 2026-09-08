/**
 * Esquema de la tabla de barberías para SQL Server.
 * Se mantiene como constante y no como archivo .sql suelto para que `tsc`
 * lo lleve al build sin pasos extra de copia.
 *
 * Las fechas se guardan en DATETIME2 con valor UTC; mostrarlas en
 * America/Bogotá es responsabilidad de la capa de interfaz.
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