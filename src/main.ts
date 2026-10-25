/**
 * Raíz de composición: el único archivo que puede importarlo todo y hacer `new` de
 * implementaciones concretas.
 *
 * Se lee de arriba abajo como una receta: crear los adaptadores, crear los casos de uso
 * inyectándoles los adaptadores, crear el servidor inyectándole los casos de uso y escuchar.
 * Las variables del `.env` ya están cargadas: las pone `--env-file` antes de ejecutar este archivo.
 */
import { RegistrarBarberia } from './aplicacion/casos-uso/RegistrarBarberia'
import { ActualizarPerfilBarberia } from './aplicacion/casos-uso/ActualizarPerfilBarberia'
import { HabilitarBarberia } from './aplicacion/casos-uso/HabilitarBarberia'
import { SuspenderBarberia } from './aplicacion/casos-uso/SuspenderBarberia'
import { ConfigurarHorarioAtencion } from './aplicacion/casos-uso/ConfigurarHorarioAtencion'
import { CrearServicio } from './aplicacion/casos-uso/CrearServicio'
import { ActualizarServicio } from './aplicacion/casos-uso/ActualizarServicio'
import { DesactivarServicio } from './aplicacion/casos-uso/DesactivarServicio'
import { ActivarServicio } from './aplicacion/casos-uso/ActivarServicio'
import { DefinirJornada } from './aplicacion/casos-uso/DefinirJornada'
import { prisma } from './infraestructura/persistencia/prisma'
import { BarberiaDAOPrisma } from './infraestructura/persistencia/BarberiaDAOPrisma'
import { ServicioDAOPrisma } from './infraestructura/persistencia/ServicioDAOPrisma'
import { HorarioAtencionDAOPrisma } from './infraestructura/persistencia/HorarioAtencionDAOPrisma'
import { UsuarioDAOPrisma } from './infraestructura/persistencia/UsuarioDAOPrisma'
import { JornadaDAOPrisma } from './infraestructura/persistencia/JornadaDAOPrisma'
import { crearServidor } from './infraestructura/http/servidor'

const barberias = new BarberiaDAOPrisma(prisma)
const servicios = new ServicioDAOPrisma(prisma)
const horarios = new HorarioAtencionDAOPrisma(prisma)
const usuarios = new UsuarioDAOPrisma(prisma)
const jornadas = new JornadaDAOPrisma(prisma)

const app = crearServidor({
  barberias,
  servicios,
  usuarios,
  jornadas,
  registrarBarberia: new RegistrarBarberia(barberias),
  actualizarPerfilBarberia: new ActualizarPerfilBarberia(barberias),
  habilitarBarberia: new HabilitarBarberia(barberias),
  suspenderBarberia: new SuspenderBarberia(barberias),
  configurarHorario: new ConfigurarHorarioAtencion(barberias, horarios),
  crearServicio: new CrearServicio(barberias, servicios),
  actualizarServicio: new ActualizarServicio(servicios),
  desactivarServicio: new DesactivarServicio(servicios),
  activarServicio: new ActivarServicio(servicios),
  definirJornada: new DefinirJornada(barberias, usuarios, horarios, jornadas),
})

/** Puerto HTTP: `PUERTO` del `.env`, o 3000 si no está definido. */
const puerto = Number(process.env['PUERTO'] ?? 3000)
app.listen(puerto, () => console.log(`KronoBarber escuchando en http://localhost:${puerto}/api (documentación en /api/docs)`))
