import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// La regla que sostiene todo: infraestructura depende de aplicacion, y aplicacion de
// dominio; nunca al revés.
// Se escribe como prueba, y no como un `grep` en package.json, para que corra igual
// en Windows, Mac y CI (npm ejecuta los scripts con cmd.exe en Windows).

const REGLAS = [
  { capa: 'src/dominio', prohibido: /from\s+['"]([^'"]*(infraestructura|aplicacion)|express|@prisma\/)/ },
  { capa: 'src/aplicacion', prohibido: /from\s+['"]([^'"]*infraestructura|express|@prisma\/)/ },
]

function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta, { recursive: true, encoding: 'utf8' })
    .filter((ruta) => ruta.endsWith('.ts'))
    .map((ruta) => join(carpeta, ruta))
}

describe('regla de dependencias', () => {
  for (const { capa, prohibido } of REGLAS) {
    it(`${capa} solo depende hacia adentro`, () => {
      const culpables = archivosDe(capa).filter((archivo) => prohibido.test(readFileSync(archivo, 'utf8')))
      expect(culpables).toEqual([])
    })
  }
})
