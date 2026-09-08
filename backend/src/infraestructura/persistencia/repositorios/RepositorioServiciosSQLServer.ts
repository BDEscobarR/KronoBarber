import sql from "mssql";
import { NombreDeServicioYaRegistrado } from "../../../aplicacion/errores/ErrorAplicacion";
import { EstadoServicio } from "../../../dominio/modelo/EstadoServicio";
import { Servicio } from "../../../dominio/modelo/Servicio";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { IdServicio } from "../../../dominio/modelo/valores/IdServicio";
import { NombreServicio } from "../../../dominio/modelo/valores/NombreServicio";
import { CriteriosBusquedaServicios, RepositorioServicios } from "../../../dominio/puertos";
import { FilaServicio, MapeadorServicio } from "../mapeadores/MapeadorServicio";

/** Códigos de SQL Server para violación de índice único / clave única. */
const VIOLACION_UNICIDAD = [2627, 2601];

/**
 * Adaptador de salida: implementa el puerto RepositorioServicios sobre
 * SQL Server. Si mañana se cambia de motor, solo se sustituye esta clase
 * en main.ts; el dominio y los casos de uso no se enteran.
 *
 * Dos reglas al tocar este archivo:
 *  - Todo parámetro entra por `.input(...)`, nunca concatenado en el texto de
 *    la consulta. Concatenar abre una inyección de SQL.
 *  - Nada de reglas de negocio aquí. Este adaptador guarda y lee; quien
 *    decide si algo es válido es el agregado.
 *
 * Y una tercera, propia del catálogo: **ninguna consulta se escribe sin filtro
 * de barbería**, salvo la búsqueda por identificador propio. Es como se hace
 * cumplir RES-02 por construcción y no por revisión.
 */
export class RepositorioServiciosSQLServer implements RepositorioServicios {
  constructor(private readonly pool: sql.ConnectionPool) {}

  /**
   * Guarda el servicio exista o no (*upsert*), en un solo viaje a la base.
   * Mismo patrón que en barberías, y por los mismos motivos.
   *
   * `WITH (UPDLOCK, SERIALIZABLE)` evita que dos peticiones simultáneas sobre
   * el mismo servicio inexistente pasen ambas por el UPDATE sin tocar nada y
   * ejecuten dos INSERT.
   *
   * `id_barberia` y `creado_en` no se actualizan a propósito: un servicio no
   * cambia de dueño (RES-02) y la fecha de alta no se mueve.
   *
   * La violación del índice único de nombre se traduce a un error del lenguaje
   * del negocio. Es la última línea de defensa contra el alta duplicada: el
   * caso de uso ya lo comprueba antes, pero esa comprobación no sirve si dos
   * altas con el mismo nombre llegan a la vez.
   */
  async guardar(servicio: Servicio): Promise<void> {
    const fila = MapeadorServicio.aFila(servicio);

    try {
      await this.pool
        .request()
        .input("id", sql.NVarChar(36), fila.id)
        .input("idBarberia", sql.NVarChar(36), fila.id_barberia)
        .input("nombre", sql.NVarChar(80), fila.nombre)
        .input("descripcion", sql.NVarChar(300), fila.descripcion)
        .input("precio", sql.Int, fila.precio)
        .input("duracionMinutos", sql.Int, fila.duracion_minutos)
        .input("estado", sql.VarChar(20), fila.estado)
        .input("creadoEn", sql.DateTime2(3), fila.creado_en)
        .input("actualizadoEn", sql.DateTime2(3), fila.actualizado_en).query(`
          UPDATE dbo.servicios WITH (UPDLOCK, SERIALIZABLE) SET
            nombre           = @nombre,
            descripcion      = @descripcion,
            precio           = @precio,
            duracion_minutos = @duracionMinutos,
            estado           = @estado,
            actualizado_en   = @actualizadoEn
          WHERE id = @id;

          IF @@ROWCOUNT = 0
            INSERT INTO dbo.servicios (
              id, id_barberia, nombre, descripcion, precio,
              duracion_minutos, estado, creado_en, actualizado_en
            ) VALUES (
              @id, @idBarberia, @nombre, @descripcion, @precio,
              @duracionMinutos, @estado, @creadoEn, @actualizadoEn
            );
        `);
    } catch (error) {
      if (error instanceof sql.RequestError && VIOLACION_UNICIDAD.includes(Number(error.number))) {
        throw new NombreDeServicioYaRegistrado(fila.nombre);
      }
      throw error;
    }
  }

  async buscarPorId(id: IdServicio): Promise<Servicio | null> {
    const resultado = await this.pool
      .request()
      .input("id", sql.NVarChar(36), id.valorPrimitivo)
      .query<FilaServicio>("SELECT * FROM dbo.servicios WHERE id = @id;");

    const fila = resultado.recordset[0];
    return fila ? MapeadorServicio.aEntidad(fila) : null;
  }

  async buscarPorNombreEnBarberia(
    idBarberia: IdBarberia,
    nombre: NombreServicio,
  ): Promise<Servicio | null> {
    const resultado = await this.pool
      .request()
      .input("idBarberia", sql.NVarChar(36), idBarberia.valorPrimitivo)
      .input("nombre", sql.NVarChar(80), nombre.valorPrimitivo)
      .query<FilaServicio>(
        "SELECT * FROM dbo.servicios WHERE id_barberia = @idBarberia AND nombre = @nombre;",
      );

    const fila = resultado.recordset[0];
    return fila ? MapeadorServicio.aEntidad(fila) : null;
  }

  async listarDeBarberia(
    idBarberia: IdBarberia,
    criterios: CriteriosBusquedaServicios = {},
  ): Promise<readonly Servicio[]> {
    const resultado = await this.pool
      .request()
      .input("idBarberia", sql.NVarChar(36), idBarberia.valorPrimitivo)
      .input("estado", sql.VarChar(20), criterios.estado ?? null)
      .input("texto", sql.NVarChar(80), criterios.texto ?? null).query<FilaServicio>(`
        SELECT * FROM dbo.servicios
         WHERE id_barberia = @idBarberia
           AND (@estado IS NULL OR estado = @estado)
           AND (@texto  IS NULL OR nombre LIKE '%' + @texto + '%')
         ORDER BY nombre;
      `);

    return resultado.recordset.map((fila) => MapeadorServicio.aEntidad(fila));
  }

  async listarActivosDeBarberia(idBarberia: IdBarberia): Promise<readonly Servicio[]> {
    const resultado = await this.pool
      .request()
      .input("idBarberia", sql.NVarChar(36), idBarberia.valorPrimitivo)
      .input("estado", sql.VarChar(20), EstadoServicio.Activo).query<FilaServicio>(`
        SELECT * FROM dbo.servicios
         WHERE id_barberia = @idBarberia
           AND estado = @estado
         ORDER BY nombre;
      `);

    return resultado.recordset.map((fila) => MapeadorServicio.aEntidad(fila));
  }
}
