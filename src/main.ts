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
import { prisma } from './infraestructura/persistencia/prisma'
import { BarberiaDAOPrisma } from './infraestructura/persistencia/BarberiaDAOPrisma'
import { ServicioDAOPrisma } from './infraestructura/persistencia/ServicioDAOPrisma'
import { HorarioAtencionDAOPrisma } from './infraestructura/persistencia/HorarioAtencionDAOPrisma'
import { ClavesBcrypt } from './infraestructura/seguridad/ClavesBcrypt'
import { TokensJwt } from './infraestructura/seguridad/TokensJwt'
import { crearServidor } from './infraestructura/http/servidor'

/** Secreto de firma de las sesiones (CAR-17). Sin él la aplicación no arranca. */
const secretoJwt = process.env['JWT_SECRET']
if (!secretoJwt) throw new Error('Falta JWT_SECRET (copia .env.example a .env)')

const barberias = new BarberiaDAOPrisma(prisma)
const servicios = new ServicioDAOPrisma(prisma)
const horarios = new HorarioAtencionDAOPrisma(prisma)
// Todavía no los usa ningún caso de uso: entran con el registro y el inicio de sesión. Se crean ya
// para que un JWT_SECRET ausente o débil impida arrancar desde ahora.
const claves = new ClavesBcrypt()
const tokens = new TokensJwt(secretoJwt)

const app = crearServidor({
  barberias,
  servicios,
  registrarBarberia: new RegistrarBarberia(barberias),
  actualizarPerfilBarberia: new ActualizarPerfilBarberia(barberias),
  habilitarBarberia: new HabilitarBarberia(barberias),
  suspenderBarberia: new SuspenderBarberia(barberias),
  configurarHorario: new ConfigurarHorarioAtencion(barberias, horarios),
  crearServicio: new CrearServicio(barberias, servicios),
  actualizarServicio: new ActualizarServicio(servicios),
  desactivarServicio: new DesactivarServicio(servicios),
  activarServicio: new ActivarServicio(servicios),
})

/** Puerto HTTP: `PUERTO` del `.env`, o 3000 si no está definido. */
const puerto = Number(process.env['PUERTO'] ?? 3000)
app.listen(puerto, () => console.log(`KronoBarber escuchando en http://localhost:${puerto}/api (documentación en /api/docs)`))
