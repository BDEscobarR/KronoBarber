import { randomUUID } from 'crypto';

export const TIPOS_AUSENCIA = ['DIA_LIBRE', 'PERMISO', 'BLOQUEO'] as const;
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];

export const ESTADOS_AUSENCIA = ['ACTIVA', 'ANULADA'] as const;
export type EstadoAusencia = (typeof ESTADOS_AUSENCIA)[number];

export interface AusenciaAtributos {
  id?: string;
  barberoId: string;
  tipo: TipoAusencia;
  desde: Date;
  hasta: Date;
  estado?: EstadoAusencia;
  creadoEn?: Date;
}

export class Ausencia {
  readonly id: string;
  readonly barberoId: string;
  readonly tipo: TipoAusencia;
  readonly desde: Date;
  readonly hasta: Date;
  readonly estado: EstadoAusencia;
  readonly creadoEn: Date;

  constructor(props: AusenciaAtributos) {
    this.id = props.id ?? randomUUID();
    this.barberoId = props.barberoId;
    this.tipo = props.tipo;
    this.desde = props.desde;
    this.hasta = props.hasta;
    this.estado = props.estado ?? 'ACTIVA';
    this.creadoEn = props.creadoEn ?? new Date();
  }
}