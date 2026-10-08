BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[HorarioAtencion] (
    [id] NVARCHAR(36) NOT NULL,
    [barberiaId] NVARCHAR(36) NOT NULL,
    [diaSemana] VARCHAR(10),
    [fecha] DATE,
    [horaInicio] VARCHAR(5),
    [horaFin] VARCHAR(5),
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [HorarioAtencion_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [HorarioAtencion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HorarioAtencion_barberiaId_diaSemana_idx] ON [dbo].[HorarioAtencion]([barberiaId], [diaSemana]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HorarioAtencion_barberiaId_fecha_idx] ON [dbo].[HorarioAtencion]([barberiaId], [fecha]);

-- AddForeignKey
ALTER TABLE [dbo].[HorarioAtencion] ADD CONSTRAINT [HorarioAtencion_barberiaId_fkey] FOREIGN KEY ([barberiaId]) REFERENCES [dbo].[Barberia]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
