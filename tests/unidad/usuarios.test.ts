import { describe, expect, it } from 'vitest'
import { aUsuarioDTO, esRolUsuario, perteneceABarberia, ROLES_USUARIO, type Usuario } from '../../src/dominio/modelo/Usuario'

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
