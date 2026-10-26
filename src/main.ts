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
import { ConsultarHorarioAtencion } from './aplicacion/casos-uso/ConsultarHorarioAtencion'
import { CrearServicio } from './aplicacion/casos-uso/CrearServicio'
import { ActualizarServicio } from './aplicacion/casos-uso/ActualizarServicio'
import { DesactivarServicio } from './aplicacion/casos-uso/DesactivarServicio'
import { ActivarServicio } from './aplicacion/casos-uso/ActivarServicio'
import { RegistrarAusencia } from './aplicacion/casos-uso/RegistrarAusencia'

import { prisma } from './infraestructura/persistencia/prisma'
import { BarberiaDAOPrisma } from './infraestructura/persistencia/BarberiaDAOPrisma'
import { ServicioDAOPrisma } from './infraestructura/persistencia/ServicioDAOPrisma'
import { HorarioAtencionDAOPrisma } from './infraestructura/persistencia/HorarioAtencionDAOPrisma'
import { AusenciaDAOPrisma } from './infraestructura/persistencia/AusenciaDAOPrisma'
import { UsuarioDAOPrisma } from './infraestructura/persistencia/UsuarioDAOPrisma'

import { crearServidor } from './infraestructura/http/servidor'

const barberias = new BarberiaDAOPrisma(prisma)
const servicios = new ServicioDAOPrisma(prisma)
const horarios = new HorarioAtencionDAOPrisma(prisma)
const ausencias = new AusenciaDAOPrisma(prisma)
const usuarios = new UsuarioDAOPrisma(prisma)

const app = crearServidor({
  barberias,
  servicios,
  registrarBarberia: new RegistrarBarberia(barberias),
  actualizarPerfilBarberia: new ActualizarPerfilBarberia(barberias),
  habilitarBarberia: new HabilitarBarberia(barberias),
  suspenderBarberia: new SuspenderBarberia(barberias),
  configurarHorario: new ConfigurarHorarioAtencion(barberias, horarios),
  consultarHorario: new ConsultarHorarioAtencion(barberias, horarios),
  crearServicio: new CrearServicio(barberias, servicios),
  actualizarServicio: new ActualizarServicio(servicios),
  desactivarServicio: new DesactivarServicio(servicios),
  activarServicio: new ActivarServicio(servicios),
  registrarAusencia: new RegistrarAusencia(ausencias, usuarios),
})

/** Puerto HTTP: `PUERTO` del `.env`, o 3000 si no está definido. */
const puerto = Number(process.env['PUERTO'] ?? 3000)
app.listen(puerto, () => console.log(`KronoBarber escuchando en http://localhost:${puerto}/api (documentación en /api/docs)`))