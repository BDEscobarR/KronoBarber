import sql from "mssql";
import { ESQUEMA_BARBERIAS, ESQUEMA_SERVICIOS } from "./esquema";

/**
 * Crea el esquema si aún no existe. Es idempotente: ejecutarlo dos veces no
 * cambia nada, igual que el resto de tareas repetibles del sistema.
 *
 * El orden del arreglo es el de las dependencias entre tablas: `servicios`
 * tiene una clave foránea hacia `barberias`, así que la primera no puede
 * crearse antes que la segunda. Cada entidad nueva se añade **al final**.
 */
const ESQUEMA_EN_ORDEN: readonly string[] = [ESQUEMA_BARBERIAS, ESQUEMA_SERVICIOS];

export async function aplicarEsquema(pool: sql.ConnectionPool): Promise<void> {
  for (const guion of ESQUEMA_EN_ORDEN) {
    await pool.request().batch(guion);
  }
}
