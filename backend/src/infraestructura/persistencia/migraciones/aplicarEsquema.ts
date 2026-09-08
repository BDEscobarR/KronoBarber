import sql from "mssql";
import { ESQUEMA_BARBERIAS } from "./esquema";

/**
 * Crea el esquema si aún no existe. Es idempotente: ejecutarlo dos veces no
 * cambia nada, igual que el resto de tareas repetibles del sistema.
 */
export async function aplicarEsquema(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().batch(ESQUEMA_BARBERIAS);
}
