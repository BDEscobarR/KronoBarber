import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import type { CredencialDTO } from '../../src/dominio/puertos'
import { ClavesBcrypt } from '../../src/infraestructura/seguridad/ClavesBcrypt'
import { TokensJwt } from '../../src/infraestructura/seguridad/TokensJwt'

const SECRETO = 'secreto-de-pruebas-de-al-menos-32-caracteres'

const administrador: CredencialDTO = { usuarioId: 'u-1', rol: 'ADMINISTRADOR', barberiaId: 'b-1' }

describe('ClavesBcrypt', () => {
  // Costo mínimo de bcrypt: la prueba es del contrato, no de la resistencia a fuerza bruta.
  const claves = new ClavesBcrypt(4)

  it('el hash no es la clave en claro (RES-13)', async () => {
    const hash = await claves.cifrar('clave-segura-123')
    expect(hash).not.toContain('clave-segura-123')
  })

  it('la clave correcta coincide con su hash', async () => {
    const hash = await claves.cifrar('clave-segura-123')
    expect(await claves.comparar('clave-segura-123', hash)).toBe(true)
  })

  it('otra clave no coincide', async () => {
    const hash = await claves.cifrar('clave-segura-123')
    expect(await claves.comparar('clave-segura-124', hash)).toBe(false)
  })

  it('la misma clave produce hashes distintos, porque cada uno lleva su sal', async () => {
    expect(await claves.cifrar('clave-segura-123')).not.toBe(await claves.cifrar('clave-segura-123'))
  })
})

describe('TokensJwt', () => {
  const tokens = new TokensJwt(SECRETO)

  it('el token lleva usuarioId, rol y barberiaId', () => {
    expect(tokens.verificar(tokens.emitir(administrador))).toEqual(administrador)
  })

  it('un usuario sin barbería conserva barberiaId en null', () => {
    const operador: CredencialDTO = { usuarioId: 'u-2', rol: 'OPERADOR', barberiaId: null }
    expect(tokens.verificar(tokens.emitir(operador))).toEqual(operador)
  })

  it('la sesión dura una hora por defecto (D-09)', () => {
    const contenido = jwt.decode(tokens.emitir(administrador)) as { iat: number; exp: number }
    expect(contenido.exp - contenido.iat).toBe(3600)
  })

  it('no acepta una sesión de más de una hora (D-09)', () => {
    expect(() => new TokensJwt(SECRETO, 3601)).toThrow(/D-09/)
  })

  it('rechaza un secreto de menos de 32 caracteres', () => {
    expect(() => new TokensJwt('corto')).toThrow(/JWT_SECRET/)
  })

  it('un token vencido no da credencial: el usuario vuelve a iniciar sesión (D-09)', () => {
    const vencido = jwt.sign({ ...administrador, exp: Math.floor(Date.now() / 1000) - 1 }, SECRETO)
    expect(tokens.verificar(vencido)).toBeNull()
  })

  it('un token firmado con otro secreto no da credencial', () => {
    const ajeno = new TokensJwt('otro-secreto-de-al-menos-32-caracteres!!').emitir(administrador)
    expect(tokens.verificar(ajeno)).toBeNull()
  })

  it('un token sin firma (alg none) no da credencial', () => {
    const sinFirma = jwt.sign(administrador, '', { algorithm: 'none' })
    expect(tokens.verificar(sinFirma)).toBeNull()
  })

  it('un token con un rol que el dominio no conoce no da credencial', () => {
    const rolInventado = jwt.sign({ ...administrador, rol: 'SUPERUSUARIO' }, SECRETO)
    expect(tokens.verificar(rolInventado)).toBeNull()
  })

  it('un texto que no es un token no da credencial', () => {
    expect(tokens.verificar('no-es-un-token')).toBeNull()
  })
})
