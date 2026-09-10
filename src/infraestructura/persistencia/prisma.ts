import { PrismaMssql } from '@prisma/adapter-mssql'
import { PrismaClient } from './generado/client'

function exigir(nombre: string): string {
  const valor = process.env[nombre]
  if (!valor) throw new Error(`Falta ${nombre} (copia .env.example a .env)`)
  return valor
}

// El adaptador de SQL Server recibe un objeto de configuración, no una URL.
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
