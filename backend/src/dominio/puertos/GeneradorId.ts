/** Fuente de identificadores. Aísla al dominio de UUID, ULID o secuencias. */
export interface GeneradorId {
  nuevo(): string;
}