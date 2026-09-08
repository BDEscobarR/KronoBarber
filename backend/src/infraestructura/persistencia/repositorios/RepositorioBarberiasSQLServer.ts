import sql from "mssql";
import { CorreoDeBarberiaYaRegistrado } from "../../../aplicacion/errores/ErrorAplicacion";
import { Barberia } from "../../../dominio/modelo/Barberia";
import { EstadoBarberia } from "../../../dominio/modelo/EstadoBarberia";
import { CorreoElectronico } from "../../../dominio/modelo/valores/CorreoElectronico";
import { IdBarberia } from "../../../dominio/modelo/valores/IdBarberia";
import { CriteriosBusquedaBarberias, RepositorioBarberias } from "../../../dominio/puertos";
import { FilaBarberia, MapeadorBarberia } from "../mapeadores/MapeadorBarberia";

/** Códigos de SQL Server para violación de índice único / clave única. */
const VIOLACION_UNICIDAD = [2627, 2601];

/**
 * Adaptador de salida: implementa el puerto RepositorioBarberias sobre
 * SQL Server. Si mañana se cambia de motor, solo se sustituye esta clase
 * en main.ts; el dominio y los casos de uso no se enteran.
 *
 * Dos reglas al tocar este archivo:
 *  - Todo parámetro entra por `.input(...)`, nunca concatenado en el texto de
 *    la consulta. Concatenar abre una inyección de SQL.
 *  - Nada de reglas de negocio aquí. Este adaptador guarda y lee; quien
 *    decide si algo es válido es el agregado.
 */
export class RepositorioBarberiasSQLServer implements RepositorioBarberias {
  constructor(private readonly pool: sql.ConnectionPool) {}

  /**
   * Guarda la barbería exista o no (*upsert*), en un solo viaje a la base.
   *
   * Por qué UPDATE y después INSERT, y no al revés: lo normal es actualizar
   * una barbería que ya existe, así que se intenta primero el caso frecuente.
   * `@@ROWCOUNT = 0` significa que el UPDATE no encontró la fila, y solo
   * entonces se inserta.
   *
   * `WITH (UPDLOCK, SERIALIZABLE)` es lo que evita la carrera clásica de este
   * patrón: sin él, dos peticiones simultáneas sobre la misma barbería
   * inexistente podrían pasar ambas por el UPDATE sin tocar nada y ejecutar
   * dos INSERT, con el segundo reventando. El bloqueo hace que la segunda
   * espere a que la primera termine.
   *
   * `registrada_en` no se actualiza a propósito: es la fecha de alta y no
   * cambia nunca, aunque el resto del perfil sí.
   *
   * La violación del índice único de correo se traduce a un error del
   * lenguaje del negocio. Es la última línea de defensa contra el alta
   * duplicada: el caso de uso ya lo comprueba antes, pero esa comprobación
   * no sirve si dos altas con el mismo correo llegan a la vez.
   */
  async guardar(barberia: Barberia): Promise<void> {
    const fila = MapeadorBarberia.aFila(barberia);

    try {
      await this.pool
        .request()
        .input("id", sql.NVarChar(36), fila.id)
        .input("nombre", sql.NVarChar(80), fila.nombre)
        .input("descripcion", sql.NVarChar(500), fila.descripcion)
        .input("direccion", sql.NVarChar(200), fila.direccion)
        .input("ciudad", sql.NVarChar(100), fila.ciudad)
        .input("telefono", sql.NVarChar(20), fila.telefono)
        .input("correo", sql.NVarChar(254), fila.correo)
        .input("estado", sql.VarChar(30), fila.estado)
        .input("motivoSuspension", sql.NVarChar(500), fila.motivo_suspension)
        .input("registradaEn", sql.DateTime2(3), fila.registrada_en)
        .input("habilitadaEn", sql.DateTime2(3), fila.habilitada_en)
        .input("actualizadaEn", sql.DateTime2(3), fila.actualizada_en)
        .query(`
          UPDATE dbo.barberias WITH (UPDLOCK, SERIALIZABLE) SET
            nombre            = @nombre,
            descripcion       = @descripcion,
            direccion         = @direccion,
            ciudad            = @ciudad,
            telefono          = @telefono,
            correo            = @correo,
            estado            = @estado,
            motivo_suspension = @motivoSuspension,
            habilitada_en     = @habilitadaEn,
            actualizada_en    = @actualizadaEn
          WHERE id = @id;

          IF @@ROWCOUNT = 0
            INSERT INTO dbo.barberias (
              id, nombre, descripcion, direccion, ciudad, telefono, correo,
              estado, motivo_suspension, registrada_en, habilitada_en, actualizada_en
            ) VALUES (
              @id, @nombre, @descripcion, @direccion, @ciudad, @telefono, @correo,
              @estado, @motivoSuspension, @registradaEn, @habilitadaEn, @actualizadaEn
            );
        `);
    } catch (error) {
      if (error instanceof sql.RequestError && VIOLACION_UNICIDAD.includes(Number(error.number))) {
        throw new CorreoDeBarberiaYaRegistrado(fila.correo);
      }
      throw error;
    }
  }

  async buscarPorId(id: IdBarberia): Promise<Barberia | null> {
    const resultado = await this.pool
      .request()
      .input("id", sql.NVarChar(36), id.valorPrimitivo)
      .query<FilaBarberia>("SELECT * FROM dbo.barberias WHERE id = @id;");

    const fila = resultado.recordset[0];
    return fila ? MapeadorBarberia.aEntidad(fila) : null;
  }

  async buscarPorCorreo(correo: CorreoElectronico): Promise<Barberia | null> {
    const resultado = await this.pool
      .request()
      .input("correo", sql.NVarChar(254), correo.valorPrimitivo)
      .query<FilaBarberia>("SELECT * FROM dbo.barberias WHERE correo = @correo;");

    const fila = resultado.recordset[0];
    return fila ? MapeadorBarberia.aEntidad(fila) : null;
  }

  async listarPorEstado(estado: EstadoBarberia): Promise<readonly Barberia[]> {
    const resultado = await this.pool
      .request()
      .input("estado", sql.VarChar(30), estado)
      .query<FilaBarberia>(
        "SELECT * FROM dbo.barberias WHERE estado = @estado ORDER BY registrada_en DESC;",
      );

    return resultado.recordset.map((fila) => MapeadorBarberia.aEntidad(fila));
  }

  async listarHabilitadas(criterios: CriteriosBusquedaBarberias = {}): Promise<readonly Barberia[]> {
    const resultado = await this.pool
      .request()
      .input("estado", sql.VarChar(30), EstadoBarberia.Habilitada)
      .input("ciudad", sql.NVarChar(100), criterios.ciudad ?? null)
      .input("texto", sql.NVarChar(80), criterios.texto ?? null)
      .query<FilaBarberia>(`
        SELECT * FROM dbo.barberias
         WHERE estado = @estado
           AND (@ciudad IS NULL OR ciudad = @ciudad)
           AND (@texto  IS NULL OR nombre LIKE '%' + @texto + '%')
         ORDER BY nombre;
      `);

    return resultado.recordset.map((fila) => MapeadorBarberia.aEntidad(fila));
  }
}
