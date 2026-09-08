import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Carga las variables de un archivo `.env` en `process.env`.
 *
 * Existe para que `npm run dev` funcione sin obligar a cada integrante a
 * exportar seis variables en su terminal cada vez que abre el proyecto, y sin
 * añadir una dependencia más al `package.json` por veinte líneas de código.
 *
 * Tres decisiones:
 *  - **No pisa lo que ya está definido.** Una variable del sistema o del CI
 *    manda sobre el archivo; así el despliegue no depende de que exista `.env`.
 *  - **Si el archivo no existe, no pasa nada.** En producción las variables
 *    vienen del entorno y `.env` no debe estar ahí. `.gitignore` ya lo excluye
 *    del repositorio (RES-13: ninguna credencial se versiona).
 *  - **No interpreta nada.** Sin variables dentro de variables ni comandos: es
 *    un archivo de configuración, no un guion.
 */
export function cargarEntorno(archivo = ".env"): void {
  let contenido: string;
  try {
    contenido = readFileSync(resolve(process.cwd(), archivo), "utf8");
  } catch {
    return;
  }

  for (const linea of contenido.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (limpia.length === 0 || limpia.startsWith("#")) {
      continue;
    }

    const separador = limpia.indexOf("=");
    if (separador <= 0) {
      continue;
    }

    const clave = limpia.slice(0, separador).trim();
    if (process.env[clave] !== undefined) {
      continue;
    }

    // Se admiten comillas alrededor del valor para poder escribir contraseñas
    // con espacios; se retiran antes de guardar.
    const valor = limpia
      .slice(separador + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");

    process.env[clave] = valor;
  }
}
