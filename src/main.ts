// Raíz de composición: el único archivo que puede importarlo todo y hacer `new`
// de implementaciones concretas.
import { RegistrarBarberia } from './aplicacion/casos-uso/RegistrarBarberia'
import { HabilitarBarberia } from './aplicacion/casos-uso/HabilitarBarberia'
import { CrearServicio } from './aplicacion/casos-uso/CrearServicio'
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
  crearServicio: new CrearServicio(barberias, servicios),
})

const puerto = Number(process.env['PUERTO'] ?? 3000)
app.listen(puerto, () => console.log(`KronoBarber escuchando en http://localhost:${puerto}/api · docs en /api/docs`))
