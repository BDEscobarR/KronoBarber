/**
 * Ciclo de vida del servicio dentro del catálogo.
 *
 * Solo hay dos estados y ninguno es «borrado»:
 * Un servicio INACTIVO desaparece del catálogo público y no admite reservas
 * nuevas, pero sigue existiendo para los turnos que ya lo usaron.
 */
export const EstadoServicio = {
  Activo: "ACTIVO",
  Inactivo: "INACTIVO",
} as const;

export type EstadoServicio = (typeof EstadoServicio)[keyof typeof EstadoServicio];

/**
 * Los únicos saltos que existen. Ningún estado salta a sí mismo: desactivar un
 * servicio ya desactivado es un error de quien lo pide, no una operación vacía
 * que se ignora en silencio. Es la misma decisión que se tomó en
 * `EstadoBarberia`, y se mantiene por coherencia entre entidades.
 */
const TRANSICIONES_PERMITIDAS: Readonly<Record<EstadoServicio, readonly EstadoServicio[]>> = {
  [EstadoServicio.Activo]: [EstadoServicio.Inactivo],
  [EstadoServicio.Inactivo]: [EstadoServicio.Activo],
};

/** ¿Se puede pasar de un estado a otro? Lo usa el agregado antes de cambiar. */
export function esTransicionValida(desde: EstadoServicio, hacia: EstadoServicio): boolean {
  return TRANSICIONES_PERMITIDAS[desde].includes(hacia);
}

/**
 * Guarda de tipo para texto que viene de fuera: el `?estado=` de una consulta
 * o la columna leída de la base de datos. Distingue mayúsculas: solo acepta la
 * forma exacta que se persiste.
 */
export function esEstadoServicio(valor: string): valor is EstadoServicio {
  return Object.values(EstadoServicio).includes(valor as EstadoServicio);
}
