/**
 * El dominio nunca llama a `new Date()`: pide la hora por este puerto.
 *
 * El motivo es que el tiempo sea un dato de entrada y no un efecto oculto.
 * En producción lo implementa `RelojSistema`; en las pruebas se sustituye por
 * un reloj fijo, y así se puede afirmar que una barbería quedó habilitada en
 * un instante exacto sin depender de cuándo se ejecutó la prueba.
 *
 * Los instantes se persisten en UTC y se presentan en America/Bogotá (DEP-02).
 */
export interface Reloj {
  ahora(): Date;
}
