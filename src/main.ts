/**
 * Raíz de composición: el único archivo que puede importarlo todo y hacer `new` de
 * implementaciones concretas.
 *
 * Se lee de arriba abajo como una receta: crear los adaptadores, crear los casos de uso
 * inyectándoles los adaptadores, crear el servidor inyectándole los casos de uso y escuchar.
 * Las variables del `.env` ya están cargadas: las pone `--env-file` antes de ejecutar este archivo.
 */
import { RegistrarBarberia } from './aplicacion/casos-uso/RegistrarBarberia'
import { HabilitarBarberia } from './aplicacion/casos-uso/HabilitarBarberia'
import { SuspenderBarberia } from './aplicacion/casos-uso/SuspenderBarberia'
import { CrearServicio } from './aplicacion/casos-uso/CrearServicio'
import { ActualizarServicio } from './aplicacion/casos-uso/ActualizarServicio'
import { prisma } from './infraestructura/persistencia/prisma'
import { BarberiaDAOPrisma } from './infraestructura/persistencia/BarberiaDAOPrisma'
import { ServicioDAOPrisma } from './infraestructura/persistencia/ServicioDAOPrisma'
import { crearServidor } from './infraestructura/http/servidor'

const barberias = new BarberiaDAOPrisma(prisma)
const servicios = new ServicioDAOPrisma(prisma)

const app = crearServidor({
  barberias,
  servicios,
  registrarBarberia: new RegistrarBarberia(barberias),
  habilitarBarberia: new HabilitarBarberia(barberias),
  suspenderBarberia: new SuspenderBarberia(barberias),
  crearServicio: new CrearServicio(barberias, servicios),
  actualizarServicio: new ActualizarServicio(servicios),
})

/** Puerto HTTP: `PUERTO` del `.env`, o 3000 si no está definido. */
const puerto = Number(process.env['PUERTO'] ?? 3000)
app.listen(puerto, () => console.log(`KronoBarber escuchando en http://localhost:${puerto}/api (documentación en /api/docs)`))
