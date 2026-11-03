import { describe, expect, it } from 'vitest'
import { ConfigurarHorarioAtencion } from '../../src/aplicacion/casos-uso/ConfigurarHorarioAtencion'
import {
  BarberoDesvinculado,
  BarberoNoEncontrado,
  DefinirJornada,
  JornadaFueraDeHorario,
  JornadaInvalida,
} from '../../src/aplicacion/casos-uso/DefinirJornada'
import { BarberiaNoEncontrada, HabilitarBarberia } from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { RegistrarBarberia, type RegistroBarberiaDTO } from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import { SuspenderBarberia } from '../../src/aplicacion/casos-uso/SuspenderBarberia'
import { estaContenida, type Franja, type FranjaSemanal } from '../../src/dominio/modelo/HorarioAtencion'
import type { UsuarioNuevo } from '../../src/dominio/modelo/Usuario'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { HorarioAtencionDAOEnMemoria } from '../dobles/HorarioAtencionDAOEnMemoria'
import { JornadaDAOEnMemoria } from '../dobles/JornadaDAOEnMemoria'
import { UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'

const MANANA: Franja = { inicio: '08:00', fin: '12:00' }
const TARDE: Franja = { inicio: '14:00', fin: '18:00' }

describe('estaContenida', () => {
  it('cabe una franja dentro de otra, también si coincide con sus extremos', () => {
    expect(estaContenida({ inicio: '09:00', fin: '11:00' }, [MANANA])).toBe(true)
    expect(estaContenida({ ...MANANA }, [MANANA])).toBe(true)
  })

  it('no cabe una franja que empieza antes o termina después', () => {
    expect(estaContenida({ inicio: '07:30', fin: '11:00' }, [MANANA])).toBe(false)
    expect(estaContenida({ inicio: '09:00', fin: '12:30' }, [MANANA])).toBe(false)
  })

  it('con jornada partida, no cabe una franja que cruza el cierre del mediodía (RES-07)', () => {
    expect(estaContenida({ inicio: '10:00', fin: '15:00' }, [TARDE, MANANA])).toBe(false)
    expect(estaContenida({ inicio: '14:00', fin: '17:00' }, [TARDE, MANANA])).toBe(true)
  })

  it('las franjas contiguas cuentan como una sola: la barbería no cierra entre ellas', () => {
    const corrida: Franja = { inicio: '12:00', fin: '18:00' }

    expect(estaContenida({ inicio: '10:00', fin: '14:00' }, [corrida, MANANA])).toBe(true)
  })

  it('no cabe nada en un día sin franjas', () => {
    expect(estaContenida(MANANA, [])).toBe(false)
  })
})

const EL_CLASICO: RegistroBarberiaDTO = {
  nombre: 'Barbería El Clásico',
  descripcion: '',
  direccion: 'Calle 65 # 23-10',
  ciudad: 'Manizales',
  telefono: '6068871234',
  correo: 'contacto@elclasico.co',
}

/**
 * Cuenta de un barbero activo, lista para `UsuarioDAO.guardar`.
 *
 * @param barberiaId Barbería a la que pertenece.
 * @param correo Correo de la cuenta, único.
 */
const barbero = (barberiaId: string, correo: string): UsuarioNuevo => ({
  nombre: 'Andrés Barbero',
  correo,
  claveHash: '$2a$10$hashDePrueba',
  rol: 'BARBERO',
  barberiaId,
  activo: true,
})

const lunes = (franja: Franja): FranjaSemanal => ({ diaSemana: 'LUNES', ...franja })

/** El Clásico atiende los lunes con jornada partida, de 08:00 a 12:00 y de 14:00 a 18:00, y tiene a Andrés. */
async function armar() {
  const barberias = new BarberiaDAOEnMemoria()
  const usuarios = new UsuarioDAOEnMemoria()
  const horarios = new HorarioAtencionDAOEnMemoria()
  const jornadas = new JornadaDAOEnMemoria()
  const clasico = await new RegistrarBarberia(barberias).ejecutar({ ...EL_CLASICO })
  await new ConfigurarHorarioAtencion(barberias, horarios).ejecutar({
    barberiaId: clasico.id,
    franjas: [lunes(MANANA), lunes(TARDE)],
    cierres: [],
  })
  const andres = await usuarios.guardar(barbero(clasico.id, 'andres@elclasico.co'))
  return {
    barberias,
    usuarios,
    jornadas,
    clasico,
    andres,
    definir: new DefinirJornada(barberias, usuarios, horarios, jornadas),
  }
}

describe('DefinirJornada', () => {
  it('registra la jornada dentro del horario de atención y la devuelve por día y hora', async () => {
    const { definir, jornadas, clasico, andres } = await armar()

    const jornada = await definir.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      franjas: [lunes({ inicio: '14:00', fin: '17:00' }), lunes({ inicio: '09:00', fin: '12:00' })],
    })

    expect(jornada).toEqual({
      barberoId: andres.id,
      franjas: [
        { diaSemana: 'LUNES', inicio: '09:00', fin: '12:00' },
        { diaSemana: 'LUNES', inicio: '14:00', fin: '17:00' },
      ],
    })
    expect(await jornadas.deBarbero(andres.id)).toHaveLength(2)
  })

  it('rechaza una franja que se sale del horario de atención, y no guarda nada (RES-07)', async () => {
    const { definir, jornadas, clasico, andres } = await armar()

    await expect(
      definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [lunes({ inicio: '07:00', fin: '11:00' })] }),
    ).rejects.toBeInstanceOf(JornadaFueraDeHorario)
    expect(await jornadas.deBarbero(andres.id)).toEqual([])
  })

  it('con jornada partida, una franja no puede cruzar el cierre del mediodía (RES-07)', async () => {
    const { definir, clasico, andres } = await armar()

    await expect(
      definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [lunes({ inicio: '10:00', fin: '15:00' })] }),
    ).rejects.toBeInstanceOf(JornadaFueraDeHorario)
  })

  it('rechaza un día en que la barbería no atiende (RES-07)', async () => {
    const { definir, clasico, andres } = await armar()

    await expect(
      definir.ejecutar({
        barberiaId: clasico.id,
        barberoId: andres.id,
        franjas: [{ diaSemana: 'MARTES', ...MANANA }],
      }),
    ).rejects.toBeInstanceOf(JornadaFueraDeHorario)
  })

  it('rechaza franjas del mismo día que se solapan o que no avanzan, y admite las contiguas', async () => {
    const { definir, clasico, andres } = await armar()
    const definirLunes = (...franjas: Franja[]) =>
      definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: franjas.map(lunes) })

    await expect(definirLunes({ inicio: '08:00', fin: '11:00' }, { inicio: '10:00', fin: '12:00' })).rejects.toBeInstanceOf(
      JornadaInvalida,
    )
    await expect(definirLunes({ inicio: '11:00', fin: '09:00' })).rejects.toBeInstanceOf(JornadaInvalida)
    const contiguas = await definirLunes({ inicio: '08:00', fin: '10:00' }, { inicio: '10:00', fin: '12:00' })
    expect(contiguas.franjas).toHaveLength(2)
  })

  it('dos barberos de la misma barbería tienen jornadas distintas', async () => {
    const { definir, usuarios, jornadas, clasico, andres } = await armar()
    const camilo = await usuarios.guardar(barbero(clasico.id, 'camilo@elclasico.co'))

    await definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [lunes(MANANA)] })
    await definir.ejecutar({ barberiaId: clasico.id, barberoId: camilo.id, franjas: [lunes(TARDE)] })

    expect((await jornadas.deBarbero(andres.id)).map((j) => j.franja)).toEqual([MANANA])
    expect((await jornadas.deBarbero(camilo.id)).map((j) => j.franja)).toEqual([TARDE])
  })

  it('reemplaza la jornada completa: lo que no viene deja de existir', async () => {
    const { definir, jornadas, clasico, andres } = await armar()
    await definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [lunes(MANANA), lunes(TARDE)] })

    const vacia = await definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [] })

    expect(vacia.franjas).toEqual([])
    expect(await jornadas.deBarbero(andres.id)).toEqual([])
  })

  it('se registra con la barbería suspendida (D-03)', async () => {
    const { definir, barberias, clasico, andres } = await armar()
    await new HabilitarBarberia(barberias).ejecutar(clasico.id)
    await new SuspenderBarberia(barberias).ejecutar({ id: clasico.id, motivo: 'Incumple la política de precios' })

    const jornada = await definir.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, franjas: [lunes(MANANA)] })

    expect(jornada.franjas).toHaveLength(1)
  })

  it('no registra la jornada de quien no es barbero de esa barbería (RES-02)', async () => {
    const { definir, barberias, usuarios, jornadas, clasico, andres } = await armar()
    const moderno = await new RegistrarBarberia(barberias).ejecutar({ ...EL_CLASICO, correo: 'hola@elmoderno.co' })
    const ajeno = await usuarios.guardar(barbero(moderno.id, 'ajeno@elmoderno.co'))
    const administradora = await usuarios.guardar({
      ...barbero(clasico.id, 'laura@elclasico.co'),
      rol: 'ADMINISTRADOR',
    })

    for (const barberoId of [ajeno.id, administradora.id, 'no-existe'])
      await expect(
        definir.ejecutar({ barberiaId: clasico.id, barberoId, franjas: [lunes(MANANA)] }),
      ).rejects.toBeInstanceOf(BarberoNoEncontrado)
    // Tampoco se le registra a Andrés desde la URL de otra barbería.
    await expect(
      definir.ejecutar({ barberiaId: moderno.id, barberoId: andres.id, franjas: [] }),
    ).rejects.toBeInstanceOf(BarberoNoEncontrado)
    expect(await jornadas.deBarbero(ajeno.id)).toEqual([])
  })

  it('rechaza a un barbero desvinculado (D-17)', async () => {
    const { definir, usuarios, clasico } = await armar()
    const desvinculado = await usuarios.guardar({ ...barbero(clasico.id, 'pedro@elclasico.co'), activo: false })

    await expect(
      definir.ejecutar({ barberiaId: clasico.id, barberoId: desvinculado.id, franjas: [lunes(MANANA)] }),
    ).rejects.toBeInstanceOf(BarberoDesvinculado)
  })

  it('falla si la barbería no existe, con el mismo error que reconoce la ruta', async () => {
    const { definir, andres } = await armar()

    await expect(
      definir.ejecutar({ barberiaId: 'no-existe', barberoId: andres.id, franjas: [lunes(MANANA)] }),
    ).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })
})
