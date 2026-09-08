import { Reloj } from "../../dominio/puertos";

/** Adaptador del puerto Reloj. */
export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}