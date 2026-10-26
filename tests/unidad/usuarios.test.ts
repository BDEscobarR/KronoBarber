import { describe, expect, it } from 'vitest'
import { aUsuarioDTO, esRolUsuario, perteneceABarberia, ROLES_USUARIO, type Usuario } from '../../src/dominio/modelo/Usuario'
import { BarberiaRequeridaParaRol, ClaveInvalida, RegistrarUsuario, RolNoPerteneceABarberia } from '../../src/aplicacion/casos-uso/RegistrarUsuario'
import { CorreoYaRegistrado } from '../../src/aplicacion/casos-uso/CorreoYaRegistrado'
import { UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'

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
    const clavesGuardadas: string[] = []
    const registrar = new RegistrarUsuario(usuarios, {
      async hash(clave) {
        clavesGuardadas.push(clave)
        return `hash:${clave}`
      },
    })
    return { usuarios, registrar, clavesGuardadas }
  }

  const datos = {
    nombre: '  Ana Pérez ',
    correo: ' ANA@Ejemplo.CO ',
    clave: 'claveSegura123',
    barberiaId: null,
  }

  it('registra cliente con correo normalizado, hash y DTO sin credenciales', async () => {
    const { usuarios, registrar, clavesGuardadas } = armar()

    const respuesta = await registrar.ejecutar(datos, 'CLIENTE')

    expect(respuesta).toMatchObject({ nombre: 'Ana Pérez', correo: 'ana@ejemplo.co', rol: 'CLIENTE', barberiaId: null, activo: true })
    expect(respuesta).not.toHaveProperty('claveHash')
    expect(clavesGuardadas).toEqual([datos.clave])
    expect(await usuarios.porCorreo('ana@ejemplo.co')).toMatchObject({ claveHash: `hash:${datos.clave}` })
  })

  it('exige barbería para roles de barbería y la rechaza para los demás', async () => {
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
    await registrar.ejecutar(datos, 'CLIENTE')
    await expect(registrar.ejecutar({ ...datos, correo: 'ana@ejemplo.co' }, 'OPERADOR')).rejects.toBeInstanceOf(CorreoYaRegistrado)
  })

  it('acepta claves de 10 y 64 caracteres y rechaza las que quedan fuera', async () => {
    const { registrar } = armar()
    await expect(registrar.ejecutar({ ...datos, clave: '123456789' }, 'CLIENTE')).rejects.toBeInstanceOf(ClaveInvalida)
    await expect(registrar.ejecutar({ ...datos, clave: 'a'.repeat(65) }, 'CLIENTE')).rejects.toBeInstanceOf(ClaveInvalida)
    await expect(registrar.ejecutar({ ...datos, correo: 'min@ejemplo.co', clave: '1234567890' }, 'CLIENTE')).resolves.toBeDefined()
    await expect(registrar.ejecutar({ ...datos, correo: 'max@ejemplo.co', clave: 'a'.repeat(64) }, 'CLIENTE')).resolves.toBeDefined()
  })
})
