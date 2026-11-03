import { describe, expect, it } from 'vitest'
import { AnularAusencia } from '../../src/aplicacion/casos-uso/AnularAusencia'
import { BarberoDesvinculado, BarberoNoEncontrado } from '../../src/aplicacion/casos-uso/DefinirJornada'
import { BarberiaNoEncontrada, HabilitarBarberia } from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { AusenciaAnulada, AusenciaNoEncontrada, ModificarAusencia } from '../../src/aplicacion/casos-uso/ModificarAusencia'
import { AusenciaInvalida, RegistrarAusencia } from '../../src/aplicacion/casos-uso/RegistrarAusencia'
import { RegistrarBarberia, type RegistroBarberiaDTO } from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import { SuspenderBarberia } from '../../src/aplicacion/casos-uso/SuspenderBarberia'
import { esTipoAusencia, terminaDespuesDeEmpezar, TIPOS_AUSENCIA } from '../../src/dominio/modelo/Ausencia'
import type { UsuarioNuevo } from '../../src/dominio/modelo/Usuario'
import { AusenciaDAOEnMemoria } from '../dobles/AusenciaDAOEnMemoria'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'

/** Un martes de 14:00 a 16:00 en Bogotá, que en UTC es de 19:00 a 21:00. */
const DESDE = new Date('2026-11-10T14:00:00-05:00')
const HASTA = new Date('2026-11-10T16:00:00-05:00')

describe('reglas de la ausencia', () => {
  it('reconoce exactamente los tres tipos de ausencia (D-16)', () => {
    for (const tipo of TIPOS_AUSENCIA) expect(esTipoAusencia(tipo)).toBe(true)
    expect(esTipoAusencia('VACACIONES')).toBe(false)
    expect(esTipoAusencia('permiso')).toBe(false)
    expect(esTipoAusencia(null)).toBe(false)
  })

  it('una ausencia termina después de empezar: ni vacía ni invertida', () => {
    expect(terminaDespuesDeEmpezar({ desde: DESDE, hasta: HASTA })).toBe(true)
    expect(terminaDespuesDeEmpezar({ desde: DESDE, hasta: DESDE })).toBe(false)
    expect(terminaDespuesDeEmpezar({ desde: HASTA, hasta: DESDE })).toBe(false)
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

/** El Clásico tiene a Andrés, barbero activo. */
async function armar() {
  const barberias = new BarberiaDAOEnMemoria()
  const usuarios = new UsuarioDAOEnMemoria()
  const ausencias = new AusenciaDAOEnMemoria()
  const clasico = await new RegistrarBarberia(barberias).ejecutar({ ...EL_CLASICO })
  const andres = await usuarios.guardar(barbero(clasico.id, 'andres@elclasico.co'))
  return {
    barberias,
    usuarios,
    ausencias,
    clasico,
    andres,
    registrar: new RegistrarAusencia(barberias, usuarios, ausencias),
    modificar: new ModificarAusencia(barberias, usuarios, ausencias),
    anular: new AnularAusencia(barberias, usuarios, ausencias),
  }
}

describe('RegistrarAusencia', () => {
  it('registra un permiso vigente desde que se guarda, sin solicitud ni aprobación (D-16)', async () => {
    const { registrar, ausencias, clasico, andres } = await armar()

    const ausencia = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'PERMISO',
      desde: DESDE,
      hasta: HASTA,
    })

    expect(ausencia).toMatchObject({ barberoId: andres.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA, anulada: false })
    expect(await ausencias.deBarbero(andres.id)).toHaveLength(1)
  })

  it('rechaza una ausencia que no termina después de empezar, y no guarda nada', async () => {
    const { registrar, ausencias, clasico, andres } = await armar()
    const registrarDe = (desde: Date, hasta: Date) =>
      registrar.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, tipo: 'BLOQUEO', desde, hasta })

    await expect(registrarDe(DESDE, DESDE)).rejects.toBeInstanceOf(AusenciaInvalida)
    await expect(registrarDe(HASTA, DESDE)).rejects.toBeInstanceOf(AusenciaInvalida)
    expect(await ausencias.deBarbero(andres.id)).toEqual([])
  })

  it('se registra con la barbería suspendida (D-03)', async () => {
    const { registrar, barberias, clasico, andres } = await armar()
    await new HabilitarBarberia(barberias).ejecutar(clasico.id)
    await new SuspenderBarberia(barberias).ejecutar({ id: clasico.id, motivo: 'Incumple la política de precios' })

    const ausencia = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'DIA_LIBRE',
      desde: DESDE,
      hasta: HASTA,
    })

    expect(ausencia.anulada).toBe(false)
  })

  it('no registra la ausencia de quien no es barbero de esa barbería (RES-02)', async () => {
    const { registrar, barberias, usuarios, ausencias, clasico, andres } = await armar()
    const moderno = await new RegistrarBarberia(barberias).ejecutar({ ...EL_CLASICO, correo: 'hola@elmoderno.co' })
    const ajeno = await usuarios.guardar(barbero(moderno.id, 'ajeno@elmoderno.co'))
    const administradora = await usuarios.guardar({ ...barbero(clasico.id, 'laura@elclasico.co'), rol: 'ADMINISTRADOR' })

    for (const barberoId of [ajeno.id, administradora.id, 'no-existe'])
      await expect(
        registrar.ejecutar({ barberiaId: clasico.id, barberoId, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
      ).rejects.toBeInstanceOf(BarberoNoEncontrado)
    // Tampoco se le registra a Andrés desde la URL de otra barbería.
    await expect(
      registrar.ejecutar({ barberiaId: moderno.id, barberoId: andres.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
    ).rejects.toBeInstanceOf(BarberoNoEncontrado)
    expect(await ausencias.deBarbero(andres.id)).toEqual([])
  })

  it('rechaza a un barbero desvinculado: ya no atiende (D-17)', async () => {
    const { registrar, usuarios, clasico } = await armar()
    const desvinculado = await usuarios.guardar({ ...barbero(clasico.id, 'pedro@elclasico.co'), activo: false })

    await expect(
      registrar.ejecutar({ barberiaId: clasico.id, barberoId: desvinculado.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
    ).rejects.toThrow(BarberoDesvinculado)
    await expect(
      registrar.ejecutar({ barberiaId: clasico.id, barberoId: desvinculado.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
    ).rejects.toThrow(/no se le puede registrar ausencias/)
  })

  it('falla si la barbería no existe, con el mismo error que reconoce la ruta', async () => {
    const { registrar, andres } = await armar()

    await expect(
      registrar.ejecutar({ barberiaId: 'no-existe', barberoId: andres.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
    ).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })
})

describe('ModificarAusencia', () => {
  /** Andrés con un permiso registrado de 14:00 a 16:00. */
  async function conPermiso() {
    const contexto = await armar()
    const { registrar, clasico, andres } = contexto
    const permiso = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'PERMISO',
      desde: DESDE,
      hasta: HASTA,
    })
    return { ...contexto, permiso }
  }

  it('reemplaza el tipo y el intervalo de la ausencia', async () => {
    const { modificar, ausencias, clasico, andres, permiso } = await conPermiso()
    const finDelDia = new Date('2026-11-10T19:00:00-05:00')

    const modificada = await modificar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      ausenciaId: permiso.id,
      tipo: 'DIA_LIBRE',
      desde: DESDE,
      hasta: finDelDia,
    })

    expect(modificada).toMatchObject({ id: permiso.id, tipo: 'DIA_LIBRE', hasta: finDelDia, anulada: false })
    expect(await ausencias.porId(andres.id, permiso.id)).toMatchObject({ tipo: 'DIA_LIBRE', hasta: finDelDia })
  })

  it('rechaza un intervalo que no termina después de empezar', async () => {
    const { modificar, clasico, andres, permiso } = await conPermiso()

    await expect(
      modificar.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, ausenciaId: permiso.id, tipo: 'PERMISO', desde: HASTA, hasta: DESDE }),
    ).rejects.toBeInstanceOf(AusenciaInvalida)
  })

  it('no modifica la ausencia de otro barbero, aunque sea de la misma barbería (RES-02)', async () => {
    const { modificar, usuarios, clasico, permiso } = await conPermiso()
    const camilo = await usuarios.guardar(barbero(clasico.id, 'camilo@elclasico.co'))

    for (const ausenciaId of [permiso.id, 'no-existe'])
      await expect(
        modificar.ejecutar({ barberiaId: clasico.id, barberoId: camilo.id, ausenciaId, tipo: 'PERMISO', desde: DESDE, hasta: HASTA }),
      ).rejects.toBeInstanceOf(AusenciaNoEncontrada)
  })

  it('no modifica una ausencia anulada', async () => {
    const { modificar, anular, clasico, andres, permiso } = await conPermiso()
    await anular.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, ausenciaId: permiso.id })

    await expect(
      modificar.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, ausenciaId: permiso.id, tipo: 'BLOQUEO', desde: DESDE, hasta: HASTA }),
    ).rejects.toBeInstanceOf(AusenciaAnulada)
  })

  it('no modifica las ausencias de un barbero desvinculado (D-17)', async () => {
    const { modificar, usuarios, ausencias, clasico } = await armar()
    const pedro = await usuarios.guardar({ ...barbero(clasico.id, 'pedro@elclasico.co'), activo: false })
    const suya = await ausencias.guardar({ barberoId: pedro.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA, anulada: false })

    await expect(
      modificar.ejecutar({ barberiaId: clasico.id, barberoId: pedro.id, ausenciaId: suya.id, tipo: 'BLOQUEO', desde: DESDE, hasta: HASTA }),
    ).rejects.toBeInstanceOf(BarberoDesvinculado)
  })
})

describe('AnularAusencia', () => {
  it('la anula sin borrarla: sigue en el historial con anulada: true', async () => {
    const { registrar, anular, ausencias, clasico, andres } = await armar()
    const permiso = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'PERMISO',
      desde: DESDE,
      hasta: HASTA,
    })

    const anulada = await anular.ejecutar({ barberiaId: clasico.id, barberoId: andres.id, ausenciaId: permiso.id })

    expect(anulada).toMatchObject({ id: permiso.id, anulada: true })
    expect(await ausencias.deBarbero(andres.id)).toEqual([expect.objectContaining({ id: permiso.id, anulada: true })])
  })

  it('anular una ausencia ya anulada es un error, no una operación vacía', async () => {
    const { registrar, anular, clasico, andres } = await armar()
    const permiso = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'PERMISO',
      desde: DESDE,
      hasta: HASTA,
    })
    const datos = { barberiaId: clasico.id, barberoId: andres.id, ausenciaId: permiso.id }
    await anular.ejecutar(datos)

    await expect(anular.ejecutar(datos)).rejects.toBeInstanceOf(AusenciaAnulada)
  })

  it('no anula la ausencia de otro barbero ni la de un barbero de otra barbería (RES-02)', async () => {
    const { registrar, anular, barberias, usuarios, clasico, andres } = await armar()
    const permiso = await registrar.ejecutar({
      barberiaId: clasico.id,
      barberoId: andres.id,
      tipo: 'PERMISO',
      desde: DESDE,
      hasta: HASTA,
    })
    const camilo = await usuarios.guardar(barbero(clasico.id, 'camilo@elclasico.co'))
    const moderno = await new RegistrarBarberia(barberias).ejecutar({ ...EL_CLASICO, correo: 'hola@elmoderno.co' })

    await expect(
      anular.ejecutar({ barberiaId: clasico.id, barberoId: camilo.id, ausenciaId: permiso.id }),
    ).rejects.toBeInstanceOf(AusenciaNoEncontrada)
    await expect(
      anular.ejecutar({ barberiaId: moderno.id, barberoId: andres.id, ausenciaId: permiso.id }),
    ).rejects.toBeInstanceOf(BarberoNoEncontrado)
  })

  it('no anula las ausencias de un barbero desvinculado (D-17)', async () => {
    const { anular, usuarios, ausencias, clasico } = await armar()
    const pedro = await usuarios.guardar({ ...barbero(clasico.id, 'pedro@elclasico.co'), activo: false })
    const suya = await ausencias.guardar({ barberoId: pedro.id, tipo: 'PERMISO', desde: DESDE, hasta: HASTA, anulada: false })

    await expect(
      anular.ejecutar({ barberiaId: clasico.id, barberoId: pedro.id, ausenciaId: suya.id }),
    ).rejects.toBeInstanceOf(BarberoDesvinculado)
  })
})
