import { describe, expect, it } from 'vitest'
import {
  aUsuarioDTO,
  esBarberoDe,
  esRolUsuario,
  perteneceABarberia,
  puedePrestarServicio,
  ROLES_USUARIO,
  type Usuario,
} from '../../src/dominio/modelo/Usuario'
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

describe('puedePrestarServicio', () => {
  const BARBERO: Usuario = { ...ADMINISTRADOR, id: '2', correo: 'andres@elclasico.co', rol: 'BARBERO' }

  it('permite prestar servicio si es BARBERO, está activo y pertenece a la barbería', () => {
    expect(puedePrestarServicio(BARBERO, 'barberia-1')).toBe(true)
  })

  it('rechaza si el barbero está inactivo', () => {
    expect(puedePrestarServicio({ ...BARBERO, activo: false }, 'barberia-1')).toBe(false)
  })

  it('rechaza si pertenece a otra barbería', () => {
    expect(puedePrestarServicio(BARBERO, 'barberia-2')).toBe(false)
  })

  it('rechaza si el usuario no tiene rol BARBERO', () => {
    expect(puedePrestarServicio(ADMINISTRADOR, 'barberia-1')).toBe(false)
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