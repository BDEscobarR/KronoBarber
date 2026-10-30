import { describe, expect, it } from 'vitest'
import {
  aUsuarioDTO,
  esBarberoDe,
  esRolUsuario,
  perteneceABarberia,
  ROLES_USUARIO,
  type Usuario,
} from '../../src/dominio/modelo/Usuario'
import { CredencialesInvalidas, IniciarSesion } from '../../src/aplicacion/casos-uso/IniciarSesion'
import { UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'
import { ServicioClavesEnMemoria } from '../dobles/ServicioClavesEnMemoria'
import { ServicioTokensEnMemoria } from '../dobles/ServicioTokensEnMemoria'
import { BarberiaRequeridaParaRol, ClaveInvalida, RegistrarUsuario, RolNoPerteneceABarberia } from '../../src/aplicacion/casos-uso/RegistrarUsuario'
import { CorreoYaRegistrado } from '../../src/aplicacion/casos-uso/CorreoYaRegistrado'
import { UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'
import { ServicioClavesEnMemoria } from '../dobles/ServicioClavesEnMemoria'

const ADMINISTRADOR: Usuario = {
  id: '1',
  nombre: 'Laura Gómez',
  correo: 'laura@elclasico.co',
  claveHash: '$2a$10$hashDePrueba',
  rol: 'ADMINISTRADOR',
  barberiaId: 'barberia-1',
  activo: true,
}

describe('roles de usuario', () => {
  it('reconoce exactamente los cuatro roles de la plataforma', () => {
    for (const rol of ROLES_USUARIO) expect(esRolUsuario(rol)).toBe(true)
    expect(esRolUsuario('administrador')).toBe(false)
    expect(esRolUsuario('SUPERUSUARIO')).toBe(false)
    expect(esRolUsuario(null)).toBe(false)
  })

  it('solo el administrador y el barbero pertenecen a una barbería', () => {
    expect(perteneceABarberia('ADMINISTRADOR')).toBe(true)
    expect(perteneceABarberia('BARBERO')).toBe(true)
    expect(perteneceABarberia('OPERADOR')).toBe(false)
    expect(perteneceABarberia('CLIENTE')).toBe(false)
  })
})

describe('esBarberoDe', () => {
  const BARBERO: Usuario = { ...ADMINISTRADOR, id: '2', correo: 'andres@elclasico.co', rol: 'BARBERO' }

  it('solo es barbero de su propia barbería (RES-02)', () => {
    expect(esBarberoDe(BARBERO, 'barberia-1')).toBe(true)
    expect(esBarberoDe(BARBERO, 'barberia-2')).toBe(false)
  })

  it('el administrador de la barbería no es uno de sus barberos', () => {
    expect(esBarberoDe(ADMINISTRADOR, 'barberia-1')).toBe(false)
  })

  it('un barbero desvinculado sigue siendo de su barbería (D-17)', () => {
    expect(esBarberoDe({ ...BARBERO, activo: false }, 'barberia-1')).toBe(true)
  })
})

describe('aUsuarioDTO', () => {
  it('nunca deja salir el hash de la clave', () => {
    const dto = aUsuarioDTO(ADMINISTRADOR)

    expect(dto).not.toHaveProperty('claveHash')
    expect(dto).toEqual({
      id: '1',
      nombre: 'Laura Gómez',
      correo: 'laura@elclasico.co',
      rol: 'ADMINISTRADOR',
      barberiaId: 'barberia-1',
      activo: true,
    })
  })
})

describe('IniciarSesion', () => {
  const { id: _id, ...administradorNuevo } = ADMINISTRADOR

  function armar() {
    const usuarios = new UsuarioDAOEnMemoria()
    const tokens = new ServicioTokensEnMemoria()
    const iniciar = new IniciarSesion(usuarios, new ServicioClavesEnMemoria(), tokens)
    return { usuarios, tokens, iniciar }
  }

  it('emite un token y devuelve el DTO sin el hash para credenciales válidas', async () => {
    const { usuarios, tokens, iniciar } = armar()
    await usuarios.guardar({ ...administradorNuevo, claveHash: 'hash:claveSegura123' })

    const sesion = await iniciar.ejecutar({ correo: ' LAURA@ELCLASICO.CO ', clave: 'claveSegura123' })

    expect(sesion.token).toBe('token-1')
    expect(sesion.usuario).toMatchObject({ correo: 'laura@elclasico.co', rol: 'ADMINISTRADOR' })
    expect(sesion.usuario).not.toHaveProperty('claveHash')
    expect(tokens.verificar(sesion.token)).toEqual({ usuarioId: '1', rol: 'ADMINISTRADOR', barberiaId: 'barberia-1' })
  })

  it('usa el mismo error para correo inexistente, cuenta inactiva y clave incorrecta', async () => {
    const { usuarios, iniciar } = armar()
    await usuarios.guardar({ ...administradorNuevo, claveHash: 'hash:claveSegura123' })
    await usuarios.guardar({
      ...administradorNuevo,
      correo: 'inactivo@ejemplo.co',
      activo: false,
      claveHash: 'hash:claveSegura123',
    })

    const intentos = [
      iniciar.ejecutar({ correo: 'noexiste@ejemplo.co', clave: 'claveSegura123' }),
      iniciar.ejecutar({ correo: 'laura@elclasico.co', clave: 'incorrecta' }),
      iniciar.ejecutar({ correo: 'inactivo@ejemplo.co', clave: 'claveSegura123' }),
    ]
    const resultados = await Promise.all(intentos.map((intento) => intento.catch((error: unknown) => error)))

    expect(resultados.every((error) => error instanceof CredencialesInvalidas)).toBe(true)
    expect(new Set(resultados.map((error) => (error as Error).message)).size).toBe(1)
describe('RegistrarUsuario', () => {
  function armar() {
    const usuarios = new UsuarioDAOEnMemoria()
    const registrar = new RegistrarUsuario(usuarios, new ServicioClavesEnMemoria())
    return { usuarios, registrar }
  }

  const datos = {
    nombre: '  Ana Pérez ',
    correo: ' ANA@Ejemplo.CO ',
    clave: 'claveSegura123',
  }

  it('registra cliente con correo normalizado, clave cifrada y DTO sin credenciales', async () => {
    const { usuarios, registrar } = armar()

    const respuesta = await registrar.ejecutar({ ...datos, barberiaId: null }, 'CLIENTE')

    expect(respuesta).toMatchObject({ nombre: 'Ana Pérez', correo: 'ana@ejemplo.co', rol: 'CLIENTE', barberiaId: null, activo: true })
    expect(respuesta).not.toHaveProperty('claveHash')
    expect(await usuarios.porCorreo('ana@ejemplo.co')).toMatchObject({ claveHash: `hash:${datos.clave}` })
  })

  it('exige barbería para los roles de barbería y la rechaza para los demás', async () => {
    const { registrar } = armar()
    await expect(registrar.ejecutar(datos, 'BARBERO')).rejects.toBeInstanceOf(BarberiaRequeridaParaRol)
    await expect(registrar.ejecutar({ ...datos, barberiaId: 'barberia-1' }, 'OPERADOR')).rejects.toBeInstanceOf(
      RolNoPerteneceABarberia,
    )
    await expect(registrar.ejecutar({ ...datos, barberiaId: 'barberia-1' }, 'ADMINISTRADOR')).resolves.toMatchObject({
      rol: 'ADMINISTRADOR',
      barberiaId: 'barberia-1',
    })
  })

  it('rechaza correos repetidos ignorando mayúsculas y espacios', async () => {
    const { registrar } = armar()
    await registrar.ejecutar({ ...datos, barberiaId: null }, 'CLIENTE')
    await expect(registrar.ejecutar({ ...datos, correo: 'ana@ejemplo.co', barberiaId: null }, 'OPERADOR')).rejects.toBeInstanceOf(
      CorreoYaRegistrado,
    )
  })

  it('acepta claves de 10 y 64 caracteres y rechaza las que quedan fuera', async () => {
    const { registrar } = armar()
    await expect(registrar.ejecutar({ ...datos, clave: '123456789', barberiaId: null }, 'CLIENTE')).rejects.toBeInstanceOf(ClaveInvalida)
    await expect(registrar.ejecutar({ ...datos, clave: 'a'.repeat(65), barberiaId: null }, 'CLIENTE')).rejects.toBeInstanceOf(ClaveInvalida)
    await expect(registrar.ejecutar({ ...datos, correo: 'min@ejemplo.co', clave: '1234567890', barberiaId: null }, 'CLIENTE')).resolves.toBeDefined()
    await expect(registrar.ejecutar({ ...datos, correo: 'max@ejemplo.co', clave: 'a'.repeat(64), barberiaId: null }, 'CLIENTE')).resolves.toBeDefined()
  })
})
