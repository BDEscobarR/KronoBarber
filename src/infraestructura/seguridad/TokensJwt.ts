import jwt from 'jsonwebtoken'
import { esRolUsuario } from '../../dominio/modelo/Usuario'
import type { CredencialDTO, ServicioTokens } from '../../dominio/puertos'

/** D-09: una sesión dura como máximo una hora; vencida, el usuario vuelve a iniciar sesión. */
const DURACION_MAXIMA_SEGUNDOS = 60 * 60

/** Con HS256, un secreto más corto que el propio hash (256 bits) se puede adivinar. */
const LONGITUD_MINIMA_SECRETO = 32

/** Se fija el algoritmo al verificar: así nadie puede presentar un token sin firma (`alg: none`). */
const ALGORITMO = 'HS256'

/**
 * Guarda de tipo para el contenido de un token ya verificado. La firma garantiza que lo emitimos
 * nosotros, pero no qué forma tenía en ese momento: un token de una versión anterior podría traer
 * otros campos.
 *
 * @param contenido Lo que devolvió `jwt.verify`.
 * @returns `true` si trae `usuarioId`, un `rol` conocido y `barberiaId` como texto o `null`.
 */
function esCredencial(contenido: unknown): contenido is CredencialDTO {
  if (typeof contenido !== 'object' || contenido === null) return false
  const { usuarioId, rol, barberiaId } = contenido as Record<string, unknown>
  return (
    typeof usuarioId === 'string' &&
    esRolUsuario(rol) &&
    (typeof barberiaId === 'string' || barberiaId === null)
  )
}

/**
 * Adaptador de seguridad: implementa `ServicioTokens` con JWT firmados con HS256. Es el único
 * archivo que conoce `jsonwebtoken` (CAR-17).
 */
export class TokensJwt implements ServicioTokens {
  /**
   * @param secreto Clave con la que se firman los tokens: `JWT_SECRET` del `.env`.
   * @param duracionSegundos Cuánto dura una sesión. Por defecto, la máxima que permite D-09.
   * @throws {Error} Si el secreto tiene menos de 32 caracteres o la duración no está entre 1 segundo
   *   y una hora.
   */
  constructor(
    private readonly secreto: string,
    private readonly duracionSegundos: number = DURACION_MAXIMA_SEGUNDOS,
  ) {
    if (secreto.length < LONGITUD_MINIMA_SECRETO) {
      throw new Error(`JWT_SECRET debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres`)
    }
    if (!Number.isInteger(duracionSegundos) || duracionSegundos < 1 || duracionSegundos > DURACION_MAXIMA_SEGUNDOS) {
      throw new Error(`La sesión debe durar entre 1 y ${DURACION_MAXIMA_SEGUNDOS} segundos (D-09)`)
    }
  }

  /**
   * @param credencial Quién inició sesión y con qué alcance.
   * @returns Un JWT firmado que vence en `duracionSegundos`.
   */
  emitir({ usuarioId, rol, barberiaId }: CredencialDTO): string {
    return jwt.sign({ usuarioId, rol, barberiaId }, this.secreto, {
      algorithm: ALGORITMO,
      expiresIn: this.duracionSegundos,
    })
  }

  /**
   * @param token Token tal como llegó en la petición.
   * @returns La credencial, o `null` si la firma no es válida, el token venció o no tiene la forma
   *   de una credencial.
   */
  verificar(token: string): CredencialDTO | null {
    try {
      const contenido = jwt.verify(token, this.secreto, { algorithms: [ALGORITMO] })
      if (!esCredencial(contenido)) return null
      // Se arma de nuevo para no dejar salir `iat` ni `exp`, que son del JWT y no de la credencial.
      return { usuarioId: contenido.usuarioId, rol: contenido.rol, barberiaId: contenido.barberiaId }
    } catch {
      return null
    }
  }
}
