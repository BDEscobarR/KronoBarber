/**
 * El dominio nunca llama a `new Date()`: pide la hora por este puerto.
 * Así las pruebas fijan el instante y son reproducibles.
 */
export interface Reloj {
  ahora(): Date;
}
