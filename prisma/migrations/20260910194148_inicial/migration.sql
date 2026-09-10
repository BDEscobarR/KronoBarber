BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Barberia] (
    [id] NVARCHAR(36) NOT NULL,
    [nombre] NVARCHAR(80) NOT NULL,
    [descripcion] NVARCHAR(500) NOT NULL CONSTRAINT [Barberia_descripcion_df] DEFAULT '',
    [direccion] NVARCHAR(200) NOT NULL,
    [ciudad] NVARCHAR(100) NOT NULL,
    [telefono] NVARCHAR(20) NOT NULL,
    [correo] NVARCHAR(254) NOT NULL,
    [estado] VARCHAR(30) NOT NULL CONSTRAINT [Barberia_estado_df] DEFAULT 'PENDIENTE_VERIFICACION',
    [motivoSuspension] NVARCHAR(500),
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Barberia_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Barberia_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Barberia_correo_key] UNIQUE NONCLUSTERED ([correo])
);

-- CreateTable
CREATE TABLE [dbo].[Servicio] (
    [id] NVARCHAR(36) NOT NULL,
    [barberiaId] NVARCHAR(36) NOT NULL,
    [nombre] NVARCHAR(80) NOT NULL,
    [descripcion] NVARCHAR(300) NOT NULL CONSTRAINT [Servicio_descripcion_df] DEFAULT '',
    [precio] INT NOT NULL,
    [duracionMinutos] INT NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [Servicio_activo_df] DEFAULT 1,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Servicio_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Servicio_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Servicio_barberiaId_nombre_key] UNIQUE NONCLUSTERED ([barberiaId],[nombre])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Barberia_estado_ciudad_idx] ON [dbo].[Barberia]([estado], [ciudad]);

-- AddForeignKey
ALTER TABLE [dbo].[Servicio] ADD CONSTRAINT [Servicio_barberiaId_fkey] FOREIGN KEY ([barberiaId]) REFERENCES [dbo].[Barberia]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
