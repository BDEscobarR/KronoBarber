BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Jornada] (
    [id] NVARCHAR(36) NOT NULL,
    [barberoId] NVARCHAR(36) NOT NULL,
    [diaSemana] VARCHAR(10) NOT NULL,
    [horaInicio] VARCHAR(5) NOT NULL,
    [horaFin] VARCHAR(5) NOT NULL,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Jornada_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Jornada_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Jornada_barberoId_diaSemana_idx] ON [dbo].[Jornada]([barberoId], [diaSemana]);

-- AddForeignKey
ALTER TABLE [dbo].[Jornada] ADD CONSTRAINT [Jornada_barberoId_fkey] FOREIGN KEY ([barberoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
