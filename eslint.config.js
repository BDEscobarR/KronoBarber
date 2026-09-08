const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

/**
 * La regla de dependencia del hexágono, hecha cumplir por la herramienta:
 *
 *   infraestructura ──▶ aplicacion ──▶ dominio
 *
 * Lo que aquí falla en rojo no es una preferencia de estilo, es la
 * arquitectura del proyecto (README §8).
 */
module.exports = tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "frontend/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Los argumentos que Express exige pero no se usan se marcan con «_».
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["backend/src/dominio/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/infraestructura/**"], message: "El dominio no importa infraestructura." },
            { group: ["**/aplicacion/**"], message: "El dominio no conoce los casos de uso." },
            {
              group: ["express", "mssql"],
              message: "El dominio no conoce el framework HTTP ni el driver de base de datos.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["backend/src/aplicacion/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infraestructura/**"],
              message:
                "La aplicación no importa infraestructura: depende de los puertos del dominio.",
            },
          ],
        },
      ],
    },
  },

  {
    // Este mismo archivo de configuración es CommonJS, no TypeScript.
    files: ["eslint.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { require: "readonly", module: "writable" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
