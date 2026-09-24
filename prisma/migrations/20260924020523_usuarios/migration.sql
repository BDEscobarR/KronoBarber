BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] NVARCHAR(36) NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [correo] NVARCHAR(254) NOT NULL,
    [claveHash] VARCHAR(255) NOT NULL,
    [rol] VARCHAR(30) NOT NULL,
    [barberiaId] NVARCHAR(36),
    [activo] BIT NOT NULL CONSTRAINT [Usuario_activo_df] DEFAULT 1,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Usuario_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Usuario_correo_key] UNIQUE NONCLUSTERED ([correo])
);

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_barberiaId_fkey] FOREIGN KEY ([barberiaId]) REFERENCES [dbo].[Barberia]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
