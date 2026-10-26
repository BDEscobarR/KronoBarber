import { describe, expect, it } from 'vitest'
import {
  aUsuarioDTO,
  esBarberoDe,
  esRolUsuario,
  perteneceABarberia,
  ROLES_USUARIO,
  type Usuario,
} from '../../src/dominio/modelo/Usuario'

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
