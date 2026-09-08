import { ErrorDeTransicion, ErrorDeValidacion } from "../errores/ErrorDominio";
import { EstadoBarberia, esEstadoBarberia, esTransicionValida } from "./EstadoBarberia";
import { CorreoElectronico } from "./valores/CorreoElectronico";
import { DescripcionBarberia } from "./valores/DescripcionBarberia";
import { IdBarberia } from "./valores/IdBarberia";
import { MediosContacto } from "./valores/MediosContacto";
import { NombreBarberia } from "./valores/NombreBarberia";
import { Telefono } from "./valores/Telefono";
import { Ubicacion } from "./valores/Ubicacion";

/** Datos publicables de la barbería. Se actualizan en bloque (CAR-01). */
export interface PerfilBarberia {
  readonly nombre: NombreBarberia;
  readonly descripcion: DescripcionBarberia;
  readonly ubicacion: Ubicacion;
  readonly contacto: MediosContacto;
}

/**
 * Representación plana del agregado. Es el único formato que cruza la frontera
 * hacia la infraestructura: el repositorio persiste una instantánea y
 * reconstruye la entidad desde ella, sin conocer sus objetos de valor.
 *
 * Los instantes viajan en UTC; presentarlos en America/Bogotá (DEP-02) es
 * responsabilidad del borde.
 */
export interface InstantaneaBarberia {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly telefono: string;
  readonly correo: string;
  readonly estado: string;
  readonly motivoSuspension: string | null;
  readonly registradaEn: Date;
  readonly habilitadaEn: Date | null;
  readonly actualizadaEn: Date;
}

const LONGITUD_MINIMA_MOTIVO = 10;

/**
 * Raíz del agregado Barbería.
 *
 * Invariantes que protege:
 *  - una barbería nace PENDIENTE_VERIFICACION y nadie puede crearla habilitada;
 *  - solo cambia de estado por transiciones permitidas (CAR-02);
 *  - una suspensión siempre queda con motivo registrado;
 *  - solo puede recibir reservas y ser vista si está habilitada (RES-11).
 */
export class Barberia {
  private constructor(
    private readonly id: IdBarberia,
    private perfil: PerfilBarberia,
    private estado: EstadoBarberia,
    private motivoSuspension: string | null,
    private readonly registradaEn: Date,
    private habilitadaEn: Date | null,
    private actualizadaEn: Date,
  ) {}

  /** Alta de una barbería nueva. Queda a la espera del operador (CAR-01, CAR-02). */
  static registrar(id: IdBarberia, perfil: PerfilBarberia, momento: Date): Barberia {
    return new Barberia(
      id,
      perfil,
      EstadoBarberia.PendienteVerificacion,
      null,
      momento,
      null,
      momento,
    );
  }

  /** Reconstrucción desde persistencia. No aplica reglas de creación. */
  static reconstituir(datos: InstantaneaBarberia): Barberia {
    if (!esEstadoBarberia(datos.estado)) {
      throw new ErrorDeValidacion(`Estado de barbería desconocido: «${datos.estado}».`);
    }
    const perfil: PerfilBarberia = {
      nombre: NombreBarberia.desde(datos.nombre),
      descripcion: DescripcionBarberia.desde(datos.descripcion),
      ubicacion: Ubicacion.desde({ direccion: datos.direccion, ciudad: datos.ciudad }),
      contacto: MediosContacto.desde(
        Telefono.desde(datos.telefono),
        CorreoElectronico.desde(datos.correo),
      ),
    };
    return new Barberia(
      IdBarberia.desde(datos.id),
      perfil,
      datos.estado,
      datos.motivoSuspension,
      datos.registradaEn,
      datos.habilitadaEn,
      datos.actualizadaEn,
    );
  }

  // ---------------------------------------------------------------- comandos

  /** El operador verifica y habilita la barbería (CAR-02). */
  habilitar(momento: Date): void {
    this.exigirTransicion(EstadoBarberia.Habilitada);
    this.estado = EstadoBarberia.Habilitada;
    this.motivoSuspension = null;
    this.habilitadaEn = this.habilitadaEn ?? momento;
    this.actualizadaEn = momento;
  }

  /** El operador retira la habilitación por incumplir las políticas (CAR-02). */
  suspender(motivo: string, momento: Date): void {
    const motivoLimpio = (motivo ?? "").trim();
    if (motivoLimpio.length < LONGITUD_MINIMA_MOTIVO) {
      throw new ErrorDeValidacion(
        `La suspensión exige un motivo de al menos ${LONGITUD_MINIMA_MOTIVO} caracteres.`,
      );
    }
    this.exigirTransicion(EstadoBarberia.Suspendida);
    this.estado = EstadoBarberia.Suspendida;
    this.motivoSuspension = motivoLimpio;
    this.actualizadaEn = momento;
  }

  /** El administrador actualiza la información publicada de su negocio (CAR-01). */
  actualizarPerfil(perfil: PerfilBarberia, momento: Date): void {
    if (this.estado === EstadoBarberia.Suspendida) {
      throw new ErrorDeTransicion(
        "Una barbería suspendida no puede modificar su perfil hasta que sea habilitada de nuevo.",
      );
    }
    this.perfil = perfil;
    this.actualizadaEn = momento;
  }

  // --------------------------------------------------------------- consultas

  /** RES-11: regla que consultará el módulo de reservas antes de crear un turno. */
  puedeRecibirReservas(): boolean {
    return this.estado === EstadoBarberia.Habilitada;
  }

  /** RES-11, CAR-07: una barbería no habilitada no aparece en el catálogo público. */
  esVisibleParaClientes(): boolean {
    return this.estado === EstadoBarberia.Habilitada;
  }

  get identificador(): IdBarberia {
    return this.id;
  }

  get estadoActual(): EstadoBarberia {
    return this.estado;
  }

  get perfilActual(): PerfilBarberia {
    return this.perfil;
  }

  get correoDeContacto(): CorreoElectronico {
    return this.perfil.contacto.correoContacto;
  }

  instantanea(): InstantaneaBarberia {
    return {
      id: this.id.valorPrimitivo,
      nombre: this.perfil.nombre.valorPrimitivo,
      descripcion: this.perfil.descripcion.valorPrimitivo,
      direccion: this.perfil.ubicacion.direccionCompleta,
      ciudad: this.perfil.ubicacion.ciudadValor,
      telefono: this.perfil.contacto.telefonoContacto.valorPrimitivo,
      correo: this.perfil.contacto.correoContacto.valorPrimitivo,
      estado: this.estado,
      motivoSuspension: this.motivoSuspension,
      registradaEn: this.registradaEn,
      habilitadaEn: this.habilitadaEn,
      actualizadaEn: this.actualizadaEn,
    };
  }

  // ----------------------------------------------------------------- privado

  private exigirTransicion(destino: EstadoBarberia): void {
    if (!esTransicionValida(this.estado, destino)) {
      throw new ErrorDeTransicion(
        `No se puede pasar de «${this.estado}» a «${destino}» para la barbería ${this.id.valorPrimitivo}.`,
      );
    }
  }
}
