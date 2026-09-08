/**
 * Ciclo de vida de la barbería dentro de la plataforma (CAR-02).
 *
 *   PENDIENTE_VERIFICACION ──▶ HABILITADA ◀──▶ SUSPENDIDA
 *              └──────────────────────────────────▶
 *
 * Solo una barbería HABILITADA es visible para los clientes y puede recibir
 * reservas (RES-11).
 */
export const EstadoBarberia = {
  PendienteVerificacion: "PENDIENTE_VERIFICACION",
  Habilitada: "HABILITADA",
  Suspendida: "SUSPENDIDA",
} as const;

export type EstadoBarberia = (typeof EstadoBarberia)[keyof typeof EstadoBarberia];

/**
 * Los únicos saltos que existen. Todo lo que no esté aquí es imposible, no
 * improbable: no se vuelve a «pendiente de verificación» y ningún estado
 * salta a sí mismo (habilitar dos veces es un error, no una operación vacía).
 *
 * Cambiar el ciclo de vida se hace **solo aquí**. Ninguna otra parte del
 * código decide si un cambio de estado es legal.
 */
const TRANSICIONES_PERMITIDAS: Readonly<Record<EstadoBarberia, readonly EstadoBarberia[]>> = {
  [EstadoBarberia.PendienteVerificacion]: [EstadoBarberia.Habilitada, EstadoBarberia.Suspendida],
  [EstadoBarberia.Habilitada]: [EstadoBarberia.Suspendida],
  [EstadoBarberia.Suspendida]: [EstadoBarberia.Habilitada],
};

/** ¿Se puede pasar de un estado a otro? Lo usa el agregado antes de cambiar. */
export function esTransicionValida(desde: EstadoBarberia, hacia: EstadoBarberia): boolean {
  return TRANSICIONES_PERMITIDAS[desde].includes(hacia);
}

/**
 * Guarda de tipo para texto que viene de fuera: el `?estado=` de una consulta
 * o la columna leída de la base de datos.
 *
 * Al devolver `valor is EstadoBarberia`, TypeScript estrecha el tipo después
 * del `if`, y así un `string` cualquiera no puede colarse como estado válido.
 * Distingue mayúsculas: solo acepta la forma exacta que se persiste.
 */
export function esEstadoBarberia(valor: string): valor is EstadoBarberia {
  return Object.values(EstadoBarberia).includes(valor as EstadoBarberia);
}
