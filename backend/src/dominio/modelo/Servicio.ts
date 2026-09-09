import { ErrorDeTransicion, ErrorDeValidacion } from "../errores/ErrorDominio";
import { EstadoServicio, esEstadoServicio, esTransicionValida } from "./EstadoServicio";
import { DescripcionServicio } from "./valores/DescripcionServicio";
import { Dinero } from "./valores/Dinero";
import { Duracion } from "./valores/Duracion";
import { IdBarberia } from "./valores/IdBarberia";
import { IdServicio } from "./valores/IdServicio";
import { NombreServicio } from "./valores/NombreServicio";

/**
 * Datos publicables del servicio. Se actualizan en bloque, igual que el perfil
 * de la barbería: el administrador guarda el formulario completo, no campo a campo.
 */
export interface FichaServicio {
  readonly nombre: NombreServicio;
  readonly descripcion: DescripcionServicio;
  readonly precio: Dinero;
  readonly duracion: Duracion;
}

/**
 * Representación plana del agregado. Es el único formato que cruza la frontera
 * hacia la infraestructura: el repositorio persiste una instantánea y
 * reconstruye la entidad desde ella, sin conocer sus objetos de valor.
 *
 * El precio viaja en pesos enteros y la duración en minutos; los instantes
 * van en UTC y presentarlos en America/Bogotá (DEP-02) es del borde.
 */
export interface InstantaneaServicio {
  readonly id: string;
  readonly idBarberia: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly duracionMinutos: number;
  readonly estado: string;
  readonly creadoEn: Date;
  readonly actualizadoEn: Date;
}

/**
 * Raíz del agregado Servicio: una prestación del catálogo de **una** barbería
 * (CAR-03).
 *
 * Invariantes que protege:
 *  - todo servicio pertenece a una barbería y esa pertenencia no cambia nunca
 *    (RES-02: es la clave del aislamiento multiempresa);
 *  - nace ACTIVO y solo cambia de estado por transiciones permitidas;
 *  - el precio es siempre mayor que cero, porque sobre él se calcula el
 *    anticipo del 20 % que confirma la reserva (RES-03);
 *  - la duración encaja en la rejilla de la agenda, porque de ella depende el
 *    tamaño del espacio libre que ve el cliente (CAR-09).
 *
 * Lo que **no** es responsabilidad de este agregado: que la barbería dueña esté
 * habilitada. Eso lo sabe `Barberia` y lo comprueba el caso de uso (RES-11).
 */
export class Servicio {
  private constructor(
    private readonly id: IdServicio,
    private readonly idBarberia: IdBarberia,
    private ficha: FichaServicio,
    private estado: EstadoServicio,
    private readonly creadoEn: Date,
    private actualizadoEn: Date,
  ) {}

  /**
   * Alta de un servicio en el catálogo (CAR-03).
   *
   * Nace ACTIVO: a diferencia de la barbería, no necesita que nadie lo
   * verifique. Quien decide si el catálogo se ve es el estado de la barbería.
   */
  static crear(
    id: IdServicio,
    idBarberia: IdBarberia,
    ficha: FichaServicio,
    momento: Date,
  ): Servicio {
    Servicio.exigirPrecioCobrable(ficha.precio);
    return new Servicio(id, idBarberia, ficha, EstadoServicio.Activo, momento, momento);
  }

  /** Reconstrucción desde persistencia. No aplica reglas de creación. */
  static reconstituir(datos: InstantaneaServicio): Servicio {
    if (!esEstadoServicio(datos.estado)) {
      throw new ErrorDeValidacion(`Estado de servicio desconocido: «${datos.estado}».`);
    }
    const ficha: FichaServicio = {
      nombre: NombreServicio.desde(datos.nombre),
      descripcion: DescripcionServicio.desde(datos.descripcion),
      precio: Dinero.desdePesos(datos.precio),
      duracion: Duracion.desdeMinutos(datos.duracionMinutos),
    };
    return new Servicio(
      IdServicio.desde(datos.id),
      IdBarberia.desde(datos.idBarberia),
      ficha,
      datos.estado,
      datos.creadoEn,
      datos.actualizadoEn,
    );
  }

  // ---------------------------------------------------------------- comandos

  /**
   * El administrador corrige el nombre, el detalle, el precio o la duración
   * (CAR-03).
   *
   * Se permite también sobre un servicio INACTIVO —a diferencia del perfil de
   * una barbería suspendida, que sí se bloquea—: desactivar un servicio para
   * revisarle el precio antes de volver a publicarlo es justamente el uso
   * previsto de la desactivación.
   *
   * Cambiar el precio o la duración **no afecta a los turnos ya reservados**:
   * el turno copia ambos valores en el momento de la reserva, porque lo pactado
   * con el cliente no puede moverse después (RES-14).
   */
  actualizarFicha(ficha: FichaServicio, momento: Date): void {
    Servicio.exigirPrecioCobrable(ficha.precio);
    this.ficha = ficha;
    this.actualizadoEn = momento;
  }

  /** Vuelve a publicar el servicio en el catálogo (CAR-03). */
  activar(momento: Date): void {
    this.exigirTransicion(EstadoServicio.Activo);
    this.estado = EstadoServicio.Activo;
    this.actualizadoEn = momento;
  }

  /**
   * Retira el servicio del catálogo sin borrarlo (CAR-03).
   * Los turnos que ya lo usaron siguen apuntando aquí: son el historial.
   */
  desactivar(momento: Date): void {
    this.exigirTransicion(EstadoServicio.Inactivo);
    this.estado = EstadoServicio.Inactivo;
    this.actualizadoEn = momento;
  }

  // --------------------------------------------------------------- consultas

  /** CAR-07: un servicio inactivo no aparece en el catálogo que ve el cliente. */
  esVisibleParaClientes(): boolean {
    return this.estado === EstadoServicio.Activo;
  }

  /** Regla que consultará el módulo de reservas antes de crear un turno (CAR-10). */
  puedeReservarse(): boolean {
    return this.estado === EstadoServicio.Activo;
  }

  /**
   * RES-02: defensa del aislamiento multiempresa. La comprueba el caso de uso
   * antes de dejar que un administrador toque un servicio que no es suyo.
   */
  perteneceA(idBarberia: IdBarberia): boolean {
    return this.idBarberia.esIgualA(idBarberia);
  }

  /**
   * Anticipo que el cliente debe pagar para confirmar la reserva (RES-03).
   * El porcentaje es único para toda la plataforma y no lo configura la barbería.
   */
  anticipoExigido(): Dinero {
    return this.ficha.precio.porcentaje(Servicio.PORCENTAJE_ANTICIPO);
  }

  /** El 80 % que el cliente paga presencialmente y fuera del sistema (RES-04). */
  saldoPresencial(): Dinero {
    return this.ficha.precio.restar(this.anticipoExigido());
  }

  get identificador(): IdServicio {
    return this.id;
  }

  get barberiaPropietaria(): IdBarberia {
    return this.idBarberia;
  }

  get estadoActual(): EstadoServicio {
    return this.estado;
  }

  get fichaActual(): FichaServicio {
    return this.ficha;
  }

  get nombreActual(): NombreServicio {
    return this.ficha.nombre;
  }

  get precioActual(): Dinero {
    return this.ficha.precio;
  }

  get duracionActual(): Duracion {
    return this.ficha.duracion;
  }

  instantanea(): InstantaneaServicio {
    return {
      id: this.id.valorPrimitivo,
      idBarberia: this.idBarberia.valorPrimitivo,
      nombre: this.ficha.nombre.valorPrimitivo,
      descripcion: this.ficha.descripcion.valorPrimitivo,
      precio: this.ficha.precio.valorEnPesos,
      duracionMinutos: this.ficha.duracion.valorEnMinutos,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }

  // ----------------------------------------------------------------- privado

  /** RES-03. El anticipo es un porcentaje del precio; un precio cero no confirma nada. */
  private static readonly PORCENTAJE_ANTICIPO = 20;

  private static exigirPrecioCobrable(precio: Dinero): void {
    if (precio.esCero()) {
      throw new ErrorDeValidacion(
        "El precio del servicio debe ser mayor que cero: sobre él se calcula el anticipo del 20 %.",
      );
    }
  }

  private exigirTransicion(destino: EstadoServicio): void {
    if (!esTransicionValida(this.estado, destino)) {
      // 409 y no 400: el dato es correcto, lo que no encaja es el momento.
      throw new ErrorDeTransicion(
        `El servicio ${this.id.valorPrimitivo} ya está en estado «${this.estado}».`,
      );
    }
  }
}
