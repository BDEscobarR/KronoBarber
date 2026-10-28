export const TIPOS_AUSENCIA = ['DIA_LIBRE', 'PERMISO', 'BLOQUEO'] as const
export type TipoAusencia = typeof TIPOS_AUSENCIA[number]

export interface Ausencia {
  id: string
  barberoId: string
  tipo: TipoAusencia
  desde: Date
  hasta: Date
}

/**
 * Valida las reglas de negocio de una ausencia antes de guardarla.
 */
export function validarAusencia(ausencia: Omit<Ausencia, 'id'>): void {
  // 1. Validar que el tipo sea uno de los permitidos
  if (!TIPOS_AUSENCIA.includes(ausencia.tipo as TipoAusencia)) {
    throw new Error(`Tipo de ausencia inválido. Debe ser: ${TIPOS_AUSENCIA.join(', ')}`)
  }

  // 2. Validar que las fechas sean objetos Date válidos
  if (isNaN(ausencia.desde.getTime()) || isNaN(ausencia.hasta.getTime())) {
    throw new Error('Las fechas proporcionadas no son válidas')
  }

  // 3. Validar que termine después de empezar
  if (ausencia.hasta <= ausencia.desde) {
    throw new Error('La ausencia debe terminar después de empezar')
  }
}