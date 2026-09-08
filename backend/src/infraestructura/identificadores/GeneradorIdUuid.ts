import { randomUUID } from "node:crypto";
import { GeneradorId } from "../../dominio/puertos";

/** Adaptador del puerto GeneradorId basado en UUID v4. */
export class GeneradorIdUuid implements GeneradorId {
  nuevo(): string {
    return randomUUID();
  }
}