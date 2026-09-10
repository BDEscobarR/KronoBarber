import { defineConfig } from 'prisma/config'

// Node 20.12+ carga .env sin dependencias; el CLI de Prisma 7 ya no lo hace solo.
try {
  process.loadEnvFile()
} catch {
  // sin .env: se usan las variables ya presentes en el entorno
}

// El CLI habla con SQL Server por URL, mientras que la aplicación (prisma.ts) arma
// la configuración del adaptador con las mismas variables BD_*: una sola fuente.
// Las llaves protegen la contraseña si trae caracteres especiales como ; o =.
function urlSqlServer(baseDeDatos: string): string {
  const e = process.env
  return (
    `sqlserver://${e['BD_SERVIDOR']}:${e['BD_PUERTO'] ?? '1433'};database=${baseDeDatos};` +
    `user=${e['BD_USUARIO']};password={${e['BD_CONTRASENA']}};` +
    `encrypt=${e['BD_CIFRADO'] !== 'false'};trustServerCertificate=${e['BD_CONFIAR_CERTIFICADO'] === 'true'}`
  )
}

const baseDeDatos = process.env['BD_NOMBRE']

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: urlSqlServer(`${baseDeDatos}`),
    // `migrate dev` compara contra una base sombra. El login de la aplicación no puede
    // crear bases de datos en SQL Server, así que esta se crea una sola vez a mano.
    shadowDatabaseUrl: urlSqlServer(`${baseDeDatos}_sombra`),
  },
})
