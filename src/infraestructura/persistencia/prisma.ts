import { PrismaMssql } from '@prisma/adapter-mssql'
import { PrismaClient } from './generado/client'

/**
 * Lee una variable de entorno obligatoria y falla temprano, con un mensaje que dice qué hacer,
 * en lugar de dejar pasar un `undefined` que reventaría varias capas más abajo.
 *
 * @param nombre Nombre de la variable.
 * @returns Su valor, que nunca es vacío.
 * @throws {Error} Si la variable no existe o está vacía.
 */
function exigir(nombre: string): string {
  const valor = process.env[nombre]
  if (!valor) throw new Error(`Falta ${nombre} (copia .env.example a .env)`)
  return valor
}

/**
 * Cliente de Prisma conectado a SQL Server. Es una única instancia para todo el proceso (un solo
 * pool de conexiones) y `main.ts` la inyecta en los DAO.
 *
 * El adaptador de SQL Server recibe un objeto de configuración, no una URL. Lo arma con las
 * variables `BD_*` del `.env`, las mismas que usa `prisma.config.ts` para el CLI.
 */
export const prisma = new PrismaClient({
  adapter: new PrismaMssql({
    server: exigir('BD_SERVIDOR'),
    port: Number(process.env['BD_PUERTO'] ?? 1433),
    database: exigir('BD_NOMBRE'),
    user: exigir('BD_USUARIO'),
    password: exigir('BD_CONTRASENA'),
    options: {
      encrypt: process.env['BD_CIFRADO'] !== 'false',
      trustServerCertificate: process.env['BD_CONFIAR_CERTIFICADO'] === 'true',
    },
  }),
})
