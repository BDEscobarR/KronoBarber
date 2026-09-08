import sql from "mssql";

export interface ConfiguracionSQLServer {
  readonly servidor: string;
  readonly puerto: number;
  readonly baseDeDatos: string;
  readonly usuario: string;
  readonly contrasena: string;
  readonly cifrado: boolean;
  readonly confiarEnCertificado: boolean;
}

function exigirVariable(nombre: string): string {
  const valor = process.env[nombre];
  if (valor === undefined || valor.trim().length === 0) {
    throw new Error(`Falta la variable de entorno ${nombre} para conectar con SQL Server.`);
  }
  return valor;
}

/**
 * La configuración entra por el entorno, nunca por el código: RES-13 prohíbe
 * credenciales en el repositorio.
 */
export function configuracionDesdeEntorno(): ConfiguracionSQLServer {
  return {
    servidor: exigirVariable("BD_SERVIDOR"),
    puerto: Number(process.env.BD_PUERTO ?? 1433),
    baseDeDatos: exigirVariable("BD_NOMBRE"),
    usuario: exigirVariable("BD_USUARIO"),
    contrasena: exigirVariable("BD_CONTRASENA"),
    cifrado: process.env.BD_CIFRADO !== "false",
    confiarEnCertificado: process.env.BD_CONFIAR_CERTIFICADO === "true",
  };
}

/** Abre el pool de conexiones. Es el único punto que conoce el driver. */
export async function abrirConexion(
  configuracion: ConfiguracionSQLServer,
): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool({
    server: configuracion.servidor,
    port: configuracion.puerto,
    database: configuracion.baseDeDatos,
    user: configuracion.usuario,
    password: configuracion.contrasena,
    options: {
      encrypt: configuracion.cifrado,
      trustServerCertificate: configuracion.confiarEnCertificado,
      // Los instantes se guardan y se leen en UTC (DEP-02).
      useUTC: true,
    },
  });

  return pool.connect();
}
