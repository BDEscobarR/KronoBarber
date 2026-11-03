BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Ausencia] (
    [id] NVARCHAR(36) NOT NULL,
    [barberoId] NVARCHAR(36) NOT NULL,
    [tipo] VARCHAR(30) NOT NULL,
    [desde] DATETIME2 NOT NULL,
    [hasta] DATETIME2 NOT NULL,
    [anulada] BIT NOT NULL CONSTRAINT [Ausencia_anulada_df] DEFAULT 0,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Ausencia_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Ausencia_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ausencia_barberoId_desde_idx] ON [dbo].[Ausencia]([barberoId], [desde]);

-- AddForeignKey
ALTER TABLE [dbo].[Ausencia] ADD CONSTRAINT [Ausencia_barberoId_fkey] FOREIGN KEY ([barberoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
