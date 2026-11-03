BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[BarberoServicio] (
    [barberoId] NVARCHAR(36) NOT NULL,
    [servicioId] NVARCHAR(36) NOT NULL,
    CONSTRAINT [BarberoServicio_pkey] PRIMARY KEY CLUSTERED ([barberoId],[servicioId])
);

-- AddForeignKey
ALTER TABLE [dbo].[BarberoServicio] ADD CONSTRAINT [BarberoServicio_barberoId_fkey] FOREIGN KEY ([barberoId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BarberoServicio] ADD CONSTRAINT [BarberoServicio_servicioId_fkey] FOREIGN KEY ([servicioId]) REFERENCES [dbo].[Servicio]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
