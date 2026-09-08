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

const TRANSICIONES_PERMITIDAS: Readonly<Record<EstadoBarberia, readonly EstadoBarberia[]>> = {
  [EstadoBarberia.PendienteVerificacion]: [EstadoBarberia.Habilitada, EstadoBarberia.Suspendida],
  [EstadoBarberia.Habilitada]: [EstadoBarberia.Suspendida],
  [EstadoBarberia.Suspendida]: [EstadoBarberia.Habilitada],
};

export function esTransicionValida(desde: EstadoBarberia, hacia: EstadoBarberia): boolean {
  return TRANSICIONES_PERMITIDAS[desde].includes(hacia);
}

export function esEstadoBarberia(valor: string): valor is EstadoBarberia {
  return Object.values(EstadoBarberia).includes(valor as EstadoBarberia);
}
