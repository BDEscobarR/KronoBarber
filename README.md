# KronoBarber

Plataforma web **multiempresa** de gestión y reserva de turnos para barberías.
Proyecto de Ingeniería de Software II (103093) · Universidad Autónoma de Manizales · Semestre 2026-03.

> Este README es el documento de contexto del repositorio. Resume el **qué** (Documento de Visión v1.1)
> y fija el **cómo** (arquitectura y convenciones). Ante una duda de alcance, manda el Documento de Visión;
> ante una duda de estructura, manda este archivo.

---

## 1. La idea en una frase

Una sola instancia del sistema atiende a **varias barberías independientes**. Cada barbería administra su
información de negocio, su catálogo de servicios, su personal y sus horarios; los clientes entran a un
espacio común, eligen **barbería → servicio → barbero → espacio libre**, y confirman la cita pagando en
línea un **anticipo del 20 %** del valor del servicio. El 80 % restante se paga presencialmente y **fuera
del sistema**.

### Sentencia de posición

**Para** los propietarios y administradores de barberías urbanas que hoy gestionan sus turnos por
mensajería, llamada o cuaderno, **que** necesitan reducir las inasistencias y aprovechar la capacidad de
cada barbero sin dedicar el día a coordinar citas, **KronoBarber** es una plataforma web compartida de
gestión y reserva de turnos **que** centraliza catálogo, personal, horarios y permisos, publica la
disponibilidad real de cada barbero y confirma cada cita con un anticipo del 20 %.
**A diferencia de** la agenda por mensajería y de las agendas genéricas de citas, **nuestro producto**
modela la disponibilidad **por profesional** y no por local, y convierte cada reserva en un compromiso
económico verificable.

### Los tres problemas que ataca

| Id | Problema | Solución esperada |
|---|---|---|
| **P-01** | Turnos acordados informalmente a los que el cliente no se presenta, sin costo para él | Reserva confirmada con anticipo del 20 %, y liberación automática del espacio si la reserva no se completa |
| **P-02** | No se puede saber, sin llamar ni escribir, cuándo está libre un barbero concreto | Calendario en línea con los espacios realmente libres, reservables en el acto |
| **P-03** | Servicios, precios, personal, horarios y ausencias en registros dispersos | Administración centralizada donde aprobar un permiso cambia de inmediato la disponibilidad publicada |

---

## 2. Actores y roles

| Rol | Qué hace | Alcance de lo que ve |
|---|---|---|
| **Operador de la plataforma** | Verifica y **habilita** barberías, **suspende** las que incumplen políticas, supervisa la operación | Transversal: no pertenece a ninguna barbería |
| **Administrador de barbería** | Perfil del negocio, catálogo de servicios, personal, horarios de atención, aprobación de ausencias, agenda general | **Solo su propia barbería** |
| **Barbero** | Consulta su agenda, gestiona su jornada y bloqueos, solicita ausencias, registra la observación de cierre | **Solo su propia agenda** |
| **Cliente** | Explora barberías, elige servicio y barbero, reserva pagando el anticipo, cancela o reprograma | Barberías **habilitadas** y sus propios turnos |

---

## 3. Vocabulario del dominio (obligatorio en el código)

El código se escribe **en español** con estos nombres exactos. Si un concepto no está aquí, probablemente
no exista todavía en el dominio.

| Término | Significado preciso |
|---|---|
| **Barbería** | Establecimiento de **una sola sede**. Es la unidad de aislamiento de los datos (tenant). |
| **Servicio** | Prestación con nombre, precio y **duración estimada**. La duración determina el tamaño del turno. |
| **Catálogo** | Servicios vigentes de una barbería. Un servicio se **desactiva**, nunca se borra. |
| **Turno** | Intervalo comprometido entre un cliente y un barbero para un servicio. Unidad central del sistema. |
| **Reserva** | Acto de solicitar un turno. **Solo se considera confirmada cuando se pagó el anticipo.** |
| **Anticipo** | 20 % del valor del servicio, pagado en línea. Convierte la cita en compromiso económico. |
| **Saldo** | 80 % restante. Se paga presencialmente y **no pasa por la plataforma**. |
| **Horario de atención** | Días y franjas en que abre la barbería. Límite exterior de toda disponibilidad. |
| **Jornada** | Franja propia del barbero **dentro** del horario del establecimiento. |
| **Ausencia** | Permiso, día libre o bloqueo puntual **aprobado**. Retira disponibilidad de inmediato. |
| **Disponibilidad** | Horario de atención ∩ jornada − ausencias aprobadas − turnos ya reservados. |
| **Espacio libre** | Intervalo continuo de la disponibilidad, **de duración suficiente para el servicio elegido**. Es lo único que el cliente ve. |
| **Solapamiento** | Coincidencia total o parcial de dos turnos del mismo barbero. El sistema debe impedirlo incluso ante reservas concurrentes. |
| **Reprogramación** | Traslado de un turno confirmado a otro espacio libre, conservando el anticipo según la política. |
| **Cancelación** | Terminación anticipada, con el tratamiento del anticipo que fije la política **comunicada antes del pago**. |
| **Inasistencia** | Turno confirmado al que el cliente no se presenta. Es un **estado del ciclo de vida**, no un incidente suelto. |
| **Agenda** | Vista de turnos en el tiempo: **general** (todo el establecimiento) o **personal** (un barbero). |
| **Observación de cierre** | Nota estructurada del barbero al finalizar la atención; se incorpora al historial del cliente. |
| **Habilitación / Suspensión** | Autorización (o su retiro) del operador para que una barbería reciba reservas. |
| **Pasarela de pagos** | Servicio externo que procesa el anticipo. La plataforma **no** almacena medios de pago. |
| **Sandbox** | Modo de la pasarela que reproduce el flujo completo sin dinero real. |

**Prefijos de identificador del Documento de Visión** (referenciarlos, no repetir su enunciado):
`P-` problemas · `NC-` necesidades clave · `SUP-` suposiciones · `DEP-` dependencias ·
`CAR-` características · `RES-` restricciones.

---

## 4. Reglas de negocio que no se negocian

Estas son las invariantes del dominio. Cada una debería tener una prueba unitaria con su nombre.

1. **El anticipo es del 20 % exacto**, sin excepciones configurables por barbería en esta versión (RES-03).
   Como la operación es en pesos enteros, el 20 % casi nunca cae exacto: se **redondea al peso más
   cercano**, con la mitad hacia arriba. El saldo se obtiene **restando** el anticipo del total, nunca
   calculando un 80 % aparte, para que anticipo + saldo sume siempre el precio del servicio. Ese
   redondeo vivirá en **una sola función pura del dominio**, que entra con la historia de reserva
   (CAR-10). Hoy el precio del servicio ya se guarda en pesos enteros y se valida con `esPrecioValido`.
2. **La reserva no está confirmada hasta que el anticipo se pagó.** Antes de eso el espacio no está
   comprometido de forma definitiva (CAR-10). Una reserva sin pagar **libera el espacio** al vencer su plazo.
3. **El saldo del 80 % no se procesa en la plataforma** (RES-04, SUP-04). No hay caja, ni conciliación,
   ni devoluciones automáticas.
4. **La disponibilidad de un barbero nunca excede el horario de atención de su barbería** (RES-07).
5. **Nunca dos turnos solapados del mismo barbero**, ni siquiera ante intentos simultáneos (CAR-13).
   Esto es una regla de concurrencia, no solo una validación de formulario.
6. **Una barbería no habilitada no es visible ni recibe reservas** (RES-11, CAR-02).
7. **Una barbería = una sede** (SUP-03). No cerrar el diseño contra esta suposición, pero no implementar cadenas.
8. **La política de cancelación y el precio total se muestran al cliente antes de pagar** (RES-14, Ley 1480 de 2011).
9. **No se almacenan datos de tarjeta ni credenciales de pago**; solo la referencia de la transacción (RES-13).
10. **COP, español, zona horaria America/Bogotá** para toda la operación (RES-06, DEP-02).
11. **Aislamiento lógico multiempresa**: cada administrador ve únicamente su negocio (RES-02).
12. **Ley 1581 de 2012 y Decreto 1074 de 2015**: autorización previa e informada, finalidad declarada,
    atención de consultas y reclamos (RES-12).

### Ciclo de vida del turno

```
                        (pago del anticipo)
  RESERVADO ──────────────────────────────────▶ CONFIRMADO
      │                                          │  │  │
      │ (vence el plazo de pago)                 │  │  └──▶ ATENDIDO   (cierre + observación)
      └──▶ CANCELADO ◀───────────────────────────┘  └─────▶ INASISTIDO (el cliente no llegó)
                    (cancelación cliente/barbería)
```

Las transiciones inválidas **no existen**: no se cierra un turno cancelado, no se atiende uno que nunca se
confirmó. Esto se modela con estados explícitos (patrón **State**), no con un `if` sobre un string.

---

## 5. Características del producto (CAR-01 … CAR-19)

Alto nivel, verificables a nivel de negocio. Cada una se desarrolla como una o varias historias de usuario.

| Id | Característica | Perfil |
|---|---|---|
| CAR-01 | Registro y perfil de barbería | Administrador |
| CAR-02 | Habilitación y suspensión de barberías | Operador |
| CAR-03 | Catálogo de servicios (precio, duración, activar/desactivar) | Administrador |
| CAR-04 | Gestión del personal y de los servicios que presta cada barbero | Administrador |
| CAR-05 | Horarios de atención del establecimiento, incluidos cierres por fecha | Administrador |
| CAR-06 | Jornada y bloqueos puntuales del barbero | Barbero |
| CAR-07 | Exploración de barberías y servicios | Cliente |
| CAR-08 | Selección explícita de barbero | Cliente |
| CAR-09 | Calendario de disponibilidad **real** | Cliente |
| CAR-10 | Reserva con anticipo del 20 % contra sandbox de la pasarela | Cliente |
| CAR-11 | Comprobante y confirmación de reserva (pagado / saldo pendiente) | Cliente |
| CAR-12 | Cancelación y reprogramación con política explícita | Cliente / Administrador |
| CAR-13 | Prevención de solapamientos, incluso concurrentes | Todos |
| CAR-14 | Agenda general del establecimiento | Administrador |
| CAR-15 | Agenda personal del barbero, desde el teléfono | Barbero |
| CAR-16 | Cierre del turno y ciclo de vida de estados | Barbero |
| CAR-17 | Cuentas propias y acceso por rol | Todos |
| CAR-18 | Diseño adaptable y accesible (uso de pie, con prisa) | Todos |
| CAR-19 | Supervisión de la plataforma | Operador |

---

## 6. Fuera del alcance

Enunciarlo no es una renuncia definitiva: es la frontera contra la cual se contrasta cualquier solicitud
posterior, para que una incorporación exija una decisión consciente y no ocurra por deslizamiento.

- Barberías con **más de una sede**.
- Cobro, registro o conciliación del **80 % restante**.
- **Pagos reales en producción**, manejo de fondos, devoluciones automáticas, conciliación bancaria.
- **Facturación electrónica** y cualquier documento tributario.
- Nómina, comisiones o pagos a barberos.
- **Aplicaciones móviles nativas** (el acceso es web adaptable).
- Inventario y venta de productos.
- Fidelización, cupones, descuentos, bonos, tarifas dinámicas.
- Valoraciones o reseñas públicas.
- Mensajería en tiempo real cliente–barbero.
- Notificaciones por **SMS o mensajería instantánea de terceros**.
- Atención sin reserva previa (fila presencial, orden de llegada, mostrador).
- Tableros de BI, analítica avanzada, predicción de demanda.
- Integración con **calendarios externos** (Google Calendar, Outlook).
- Multi-idioma y multi-moneda.
- Migración de datos históricos de cuadernos, hojas de cálculo o chats.
- Historial clínico capilar o cualquier dato de salud.

---

## 7. Suposiciones vivas

Cada suposición es un riesgo con nombre. Si una se rompe, se recalcula alcance y estimación **sin culpa**.

| Id | Suposición | Si falla |
|---|---|---|
| SUP-01 | Los clientes aceptan pagar el 20 % por anticipado | Se desploma la propuesta de valor → prever reserva sin anticipo configurable |
| SUP-02 | Las barberías mantienen catálogo y horarios al día | Reservas a precios u horarios inexistentes → configuración guiada y avisos |
| SUP-03 | Una barbería = una sede | El modelo no representa cadenas → excluido, pero no cerrar el diseño |
| SUP-04 | El saldo se cobra presencialmente | Aparecen requisitos de caja y facturación |
| SUP-05 | Hay conectividad suficiente al momento de usar | Reservas incompletas y pagos ambiguos → confirmación explícita de estado |
| SUP-06 | Hay demanda inicial de clientes | Las barberías se registran y abandonan → arrancar con pilotos que traigan su clientela |
| SUP-07 | El operador habilita en un plazo breve | Barberías bloqueadas que abandonan → plazo máximo e informe de estado |
| SUP-08 | El flujo en sandbox equivale al de producción salvo credenciales | Habría que rehacer la confirmación → aislar la pasarela tras interfaz propia |

**Dependencias**: DEP-01 infraestructura de despliegue en la nube · DEP-02 zona horaria única America/Bogotá ·
DEP-03 disponibilidad del sandbox de la pasarela (respaldo: simulador propio que respete el mismo contrato).

---

## 8. Arquitectura

**Hexagonal (puertos y adaptadores)**, con una única regla de dependencia:

```
infraestructura ──▶ aplicacion ──▶ dominio
                                     ▲
      (la infraestructura implementa los puertos que el dominio declara)
```

El dominio **no importa** infraestructura, ni el framework HTTP, ni el ORM. Se prueba sin base de datos
y sin red.

### Stack

| Elemento | Valor |
|---|---|
| Lenguaje | **TypeScript** estricto, más `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` |
| Runtime | **Node.js ≥ 20.12** (probado en 24.19). `"type": "commonjs"` + `"module": "nodenext"`: los imports no llevan extensión |
| HTTP | **Express 5** · documentación interactiva con **Swagger UI** en `/api/docs` |
| Base de datos | **SQL Server 2022** (la edición Express sirve) instalado en la máquina. **Sin Docker** |
| ORM | **Prisma 7** con el adaptador `@prisma/adapter-mssql` |
| Pruebas | **Vitest** |

Lo que deliberadamente **no** se usa: `zod`/`class-validator` (la validación se escribe a mano en la
frontera HTTP), `dotenv` (se usa `--env-file` de Node), `eslint` (la regla de dependencias la verifica una
prueba), decoradores, contenedores de inyección de dependencias.

### Estructura de carpetas

El repositorio es solo el servidor: `prisma/`, `src/` y `tests/` en la
raíz. El árbol refleja lo que **existe hoy**: no se crean carpetas vacías por adelantado, una capa entra
cuando una historia de usuario la necesita.

```
KronoBarber/
├── prisma/
│   ├── schema.prisma                  esquema de la BD (fuente de verdad del ORM)
│   └── migrations/                    SQL generado por `prisma migrate dev` (se versiona)
│
├── src/
│   ├── dominio/                       ⬅ EL NEGOCIO. No importa nada de afuera.
│   │   ├── modelo/
│   │   │   ├── Barberia.ts            entidad + EstadoBarberia + BarberiaDTO + aBarberiaDTO()
│   │   │   └── Servicio.ts            entidad + reglas de precio y duración + ServicioDTO
│   │   └── puertos/
│   │       └── index.ts               BarberiaDAO · ServicioDAO
│   │
│   ├── aplicacion/                    ⬅ ORQUESTACIÓN de las reglas.
│   │   └── casos-uso/
│   │       ├── RegistrarBarberia.ts   caso de uso + RegistroBarberiaDTO + CorreoDeBarberiaYaRegistrado
│   │       ├── HabilitarBarberia.ts   caso de uso + BarberiaNoEncontrada + BarberiaYaHabilitada
│   │       └── CrearServicio.ts       caso de uso + CreacionServicioDTO + ServicioYaExiste
│   │
│   ├── infraestructura/               ⬅ LO REEMPLAZABLE. Aquí vive la tecnología.
│   │   ├── persistencia/
│   │   │   ├── prisma.ts              PrismaClient con el adaptador de SQL Server
│   │   │   ├── BarberiaDAOPrisma.ts   adaptador: implementa BarberiaDAO con Prisma
│   │   │   ├── ServicioDAOPrisma.ts   adaptador: implementa ServicioDAO con Prisma
│   │   │   └── generado/              (no versionado) cliente generado por Prisma
│   │   └── http/
│   │       ├── servidor.ts            arma la app Express: prefijo /api, Swagger, 404, errores
│   │       ├── openapi.ts             contrato OpenAPI 3.0.3 como objeto TS
│   │       └── rutas/
│   │           ├── barberias.ts       validación de frontera + handlers de barberías
│   │           └── servicios.ts       validación de frontera + handlers del catálogo
│   │
│   └── main.ts                        ⬅ RAÍZ DE COMPOSICIÓN. El único con `new`.
│
├── tests/
│   ├── unidad/                        casos de uso y reglas, sin BD ni red, en milisegundos
│   ├── dobles/                        BarberiaDAOEnMemoria · ServicioDAOEnMemoria
│   └── arquitectura.test.ts           verifica la regla de dependencias
│
├── .env.example                       plantilla de variables (sí se versiona)
├── .gitignore
├── package.json
├── prisma.config.ts                   configuración del CLI de Prisma 7
├── tsconfig.json
└── vitest.config.ts
```

Equivalencias para quien venga de MVC:

| Concepto MVC | Aquí se llama | Ubicación |
|---|---|---|
| `models/` | Entidades de dominio | `src/dominio/modelo/` |
| `repositories/` (interfaz) | Puertos `...DAO` | `src/dominio/puertos/index.ts` |
| `repositories/` (implementación) | Adaptadores `...DAOPrisma` | `src/infraestructura/persistencia/` |
| `services/` | Casos de uso | `src/aplicacion/casos-uso/` |
| `controllers/` + `routes/` | Handlers dentro del `Router` | `src/infraestructura/http/rutas/` |
| `middlewares/` | Funciones que devuelven `RequestHandler` | Junto a la ruta que las usa |
| `dtos/` | Sin carpeta: cada DTO junto a quien lo usa | ver abajo |
| `config/` + inyección de dependencias | Raíz de composición | `src/main.ts` |
| `utils/` / `helpers/` | **Prohibido por convención** | — |

### Cómo está hecha cada entidad

**Hay dos definiciones de cada entidad, a propósito:**

| | Dónde | Qué es |
|---|---|---|
| Modelo de persistencia | `prisma/schema.prisma` | Cómo se guarda en SQL Server: `@id`, `@unique`, `@db.NVarChar`, columnas de auditoría (`creadoEn`) |
| Entidad de dominio | `src/dominio/modelo/*.ts` | Qué es para el negocio: una `interface` de TypeScript pura, sin decoradores ni dependencia del ORM |

Entre las dos está la función `aDominio()` del adaptador DAO. Esa separación es lo que permite cambiar de
ORM sin tocar el dominio. Cada archivo de `modelo/` tiene las mismas cinco piezas:

1. Los estados como **array `as const` + tipo derivado** (`ESTADOS_BARBERIA` → `EstadoBarberia`), no `enum`
   de TypeScript. El mismo array valida datos y alimenta el `enum` de OpenAPI.
2. La **entidad sin sufijo** (`Barberia`, `Servicio`).
3. El tipo para creación: `BarberiaNueva = Omit<Barberia, 'id'>`. El id lo asigna la base de datos.
4. El **DTO de salida** (`BarberiaDTO`): lo que cruza por HTTP. `BarberiaDTO` no tiene `motivoSuspension`,
   así que ese dato interno del operador no puede filtrarse por descuido.
5. **Funciones puras**: guardas de tipo (`esEstadoBarberia`, `esPrecioValido`, `esDuracionValida`), reglas
   (`esVisibleParaClientes`) y el mapeador a DTO (`aBarberiaDTO`), la única puerta de salida.

**`Catalogo` no es una clase, y es deliberado.** El §3 lo define como *los servicios vigentes de una
barbería*, pero eso es una **consulta** (`ServicioDAO.activosDe`), no una entidad con estado propio.

### Convención de sufijos

| Sufijo | Significa | Ejemplos |
|---|---|---|
| `...DTO` | Estructura que **cruza una frontera**. Solo campos. | `BarberiaDTO`, `RegistroBarberiaDTO`, `CreacionServicioDTO` |
| `...DAO` | Contrato de **acceso a datos**, en vocabulario del negocio (`guardar`, `porId`, `activosDe`). | `BarberiaDAO` (puerto) · `BarberiaDAOPrisma`, `BarberiaDAOEnMemoria` (implementaciones) |
| sin sufijo | Entidades y puertos de comportamiento. | `Barberia`, `Servicio`, `EstadoBarberia` |

Un DTO vive **junto al código que lo usa**: el de salida de una entidad, con la entidad; el de entrada de
un caso de uso, con el caso de uso; uno puramente HTTP, con la ruta.

### Casos de uso y rutas

Cada caso de uso es **una clase, con dependencias `private readonly` por constructor y un único método
`ejecutar()`**. Solo importa del dominio, y en el mismo archivo declara su DTO de entrada y sus errores de
negocio (`CorreoDeBarberiaYaRegistrado`). La normalización (`trim`, correo en minúsculas, teléfono sin
separadores) es del caso de uso, no de HTTP.

Cada archivo de `rutas/` tiene cuatro bloques: validación de frontera (`validarRegistro(cuerpo: unknown):
RegistroBarberiaDTO | string`, donde el string es el mensaje del 400), la interfaz `Dependencias...`, los
middlewares si hacen falta y la fábrica del `Router`. Cada handler hace siempre lo mismo: validar → `400`;
llamar al caso de uso; responder con el DTO; traducir errores de negocio a HTTP (`409`, `404`) y delegar el
resto a `next(error)`. **El dominio no sabe qué es un 409.**

### Conexión a SQL Server (sin Docker)

La base de datos es un **SQL Server instalado en la máquina** (servicio de Windows), no un contenedor.
La configuración entra por variables de entorno, nunca por el código (RES-13):

| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `BD_SERVIDOR` | Host de SQL Server | Sí |
| `BD_PUERTO` | Puerto TCP | No (1433) |
| `BD_NOMBRE` | Base de datos de la aplicación | Sí |
| `BD_USUARIO` · `BD_CONTRASENA` | Login de SQL Server | Sí |
| `BD_CIFRADO` | `false` desactiva el cifrado de la conexión | No (`true`) |
| `BD_CONFIAR_CERTIFICADO` | `true` acepta el certificado autofirmado de un SQL Server local | No (`false`) |
| `PUERTO` | Puerto HTTP | No (3000) |

Las mismas variables sirven a los dos consumidores:

- **En ejecución**, `src/infraestructura/persistencia/prisma.ts` arma el objeto de configuración de
  `PrismaMssql`, que no acepta URL, y **falla temprano** con un mensaje que dice qué hacer si falta alguna.
- **Para el CLI** (`migrate`, `studio`), `prisma.config.ts` compone con ellas la URL `sqlserver://…` y la
  de la **base sombra** `<BD_NOMBRE>_sombra`.

Diferencias con PostgreSQL que condicionan el esquema:

| Tema | En SQL Server con Prisma | Cómo se resolvió |
|---|---|---|
| `enum` | **No soportado** | `estado` es `String`. La lista válida vive en el dominio y `BarberiaDAOPrisma` la comprueba al leer |
| `onDelete: Restrict` | **No soportado** (error de validación) | `NoAction`, que produce el mismo efecto: una barbería con catálogo no se puede borrar |
| Base sombra de `migrate dev` | Crearla automáticamente exige ser administrador del servidor | Se crea una vez a mano (`KronoBarber_sombra`) y `prisma.config.ts` la declara |
| Mayúsculas | La intercalación por defecto no las distingue | «Corte clásico» y «CORTE CLÁSICO» chocan en el `@@unique([barberiaId, nombre])`, que es lo que se quiere |

### Puesta en marcha

**Requisitos**: Node.js 20.12 o superior; SQL Server 2022 con **TCP/IP habilitado en el puerto 1433**
(SQL Server Configuration Manager) y **autenticación mixta** (SQL Server y Windows).

**Preparación única de la base de datos**, con un usuario administrador (por ejemplo
`sqlcmd -S localhost -E -C`):

```sql
CREATE LOGIN kronobarber WITH PASSWORD = 'una-clave-local-segura', CHECK_POLICY = OFF;
CREATE DATABASE KronoBarber;
CREATE DATABASE KronoBarber_sombra;   -- la base sombra que usa `prisma migrate dev`
GO
USE KronoBarber;
CREATE USER kronobarber FOR LOGIN kronobarber;
ALTER ROLE db_owner ADD MEMBER kronobarber;
GO
USE KronoBarber_sombra;
CREATE USER kronobarber FOR LOGIN kronobarber;
ALTER ROLE db_owner ADD MEMBER kronobarber;
GO
```

**Secuencia completa**, desde la raíz del repositorio:

```bash
npm install                      # el postinstall genera el cliente de Prisma
cp .env.example .env             # PowerShell: Copy-Item .env.example .env  — y poner la contraseña
npm run db:migrate               # aplica las migraciones (crea las tablas Barberia y Servicio)
npm run dev                      # KronoBarber escuchando en http://localhost:3000/api · docs en /api/docs
```

> Instala las versiones del `package.json` tal cual. Hoy la etiqueta `latest` de `prisma` en npm apunta a
> una versión candidata de Prisma 8, mientras `@prisma/client` y `@prisma/adapter-mssql` van en 7.10:
> un `npm install prisma` sin versión los desalinea.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Ejecuta `src/main.ts` con `tsx`, sin compilar y recargando al guardar. Carga `.env` con `--env-file` |
| `npm run build` | `tsc`: compila `src/` y `tests/` a `dist/` |
| `npm start` | Ejecuta el JS compilado (`dist/src/main.js`). Requiere `build` |
| `npm test` | Vitest en modo watch |
| `npm run cov` | Vitest una pasada con cobertura (puede pedir instalar `@vitest/coverage-v8`) |
| `npm run db:migrate` | `prisma migrate dev`: genera el SQL en `prisma/migrations/`, lo aplica y regenera el cliente |
| `npm run db:studio` | Explorador visual de datos de Prisma |
| `npm run arquitectura` | Falla si `dominio/` o `aplicacion/` importan infraestructura, Express o Prisma |
| `postinstall` | Automático tras `npm install`: `prisma generate` |

**Cuando cambies el esquema**: edita `prisma/schema.prisma` y corre `npm run db:migrate` (pide un nombre
descriptivo). Las migraciones **se versionan siempre** y no se editan a mano.

### Endpoints disponibles hoy (`/api`)

| Método | Ruta | Qué hace | Errores |
|---|---|---|---|
| `GET` | `/salud` | Verificación de vida, sin tocar la base de datos | — |
| `GET` | `/docs` · `/openapi.json` | Swagger UI · contrato OpenAPI | — |
| `POST` | `/barberias` | `RegistroBarberiaDTO` → `201` con `BarberiaDTO` en `PENDIENTE_VERIFICACION` (CAR-01) | `400` · `409` correo repetido |
| `GET` | `/barberias?ciudad=` | Catálogo público: **solo habilitadas** (CAR-07, RES-11) | — |
| `GET` | `/barberias/:id` | Detalle, en cualquier estado | `404` |
| `POST` | `/barberias/:id/habilitacion` | El operador habilita, desde pendiente o suspendida (CAR-02) | `404` · `409` ya habilitada |
| `POST` | `/barberias/:barberiaId/servicios` | `CreacionServicioDTO` → `201` con `ServicioDTO`, activo (CAR-03) | `400` · `404` · `409` nombre repetido |
| `GET` | `/barberias/:barberiaId/servicios` | Vitrina: servicios activos, **solo si la barbería está habilitada** | `404` |

Las guardas por rol (CAR-17) todavía no existen: hoy todos los endpoints son abiertos. Entran con la
historia de identidad, como middlewares que exijan la sesión y el rol.

Prueba de humo (Git Bash; en PowerShell usar `curl.exe`, o directamente *Try it out* en `/api/docs`):

```bash
curl -X POST http://localhost:3000/api/barberias -H "Content-Type: application/json" \
  -d '{"nombre":"Barbería El Clásico","direccion":"Calle 65 # 23-10","ciudad":"Manizales","telefono":"(606) 887-1234","correo":"contacto@elclasico.co"}'
curl -X POST http://localhost:3000/api/barberias/<ID>/habilitacion
curl -X POST http://localhost:3000/api/barberias/<ID>/servicios -H "Content-Type: application/json" \
  -d '{"nombre":"Corte clásico","precio":25000,"duracionMinutos":30}'
curl http://localhost:3000/api/barberias/<ID>/servicios
```

### Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Falta BD_SERVIDOR (copia .env.example a .env)` | No existe `.env` | `cp .env.example .env` y completar la contraseña |
| `Cannot find module './generado/client'` | El cliente no se ha generado | `npx prisma generate` |
| `Failed to connect to localhost:1433` | SQL Server detenido o sin TCP/IP | Iniciar el servicio *SQL Server (SQLEXPRESS)*; en Configuration Manager habilitar TCP/IP con puerto 1433 en *IPAll* y reiniciar el servicio |
| `Login failed for user 'kronobarber'` | Autenticación mixta desactivada o clave errada | Activar *SQL Server and Windows Authentication mode* y reiniciar |
| `self signed certificate` | Certificado local autofirmado | `BD_CONFIAR_CERTIFICADO=true` |
| `migrate dev` falla con la base sombra | No existe `KronoBarber_sombra` o el login no es `db_owner` en ella | Repetir la preparación única |
| `npm run arquitectura` falla | Un archivo de `dominio/` o `aplicacion/` importa hacia afuera | La prueba lista los archivos culpables |

### Cliente web

La interfaz se construirá con **React + TypeScript** como un proyecto aparte: **no vive en este
repositorio ni es una capa del hexágono**. Se comunica exclusivamente por la API HTTP. El hexágono no sabe
que existe React, y React no conoce el modelo de dominio: conoce los DTO del borde HTTP (los mismos
nombres que aparecen en `/api/docs`).

**Reglas del cliente**

- **Ninguna regla de negocio se reimplementa en React.** El 20 %, la política de cancelación y los
  espacios libres los calcula y los devuelve el servidor. Si el cliente necesita saber una regla, la
  pide; no la deduce.
- **Los estados del turno se muestran, no se derivan.** El texto y el color salen del estado que envía
  la API, no de comparar fechas en el navegador.
- **Adaptable de verdad** (CAR-18, RES-01): el barbero la usa de pie, con una mano, en un local ruidoso.
  Contraste, tamaños de toque y navegación corta mandan sobre la densidad de información.
- **Nada de datos de tarjeta en el navegador propio** (RES-13): el pago del anticipo se delega al widget
  o a la página de la pasarela; la aplicación solo maneja la referencia de la transacción.
- **Los horarios se presentan siempre en America/Bogotá** (DEP-02), formateados en el borde, nunca
  recalculando zonas en cada componente.
- **Español** en la interfaz y en los nombres de los componentes, igual que en el servidor.

### Dónde aterrizan los patrones

| Patrón | Dónde | Estado |
|---|---|---|
| **DAO / Repository** | `dominio/puertos`: `guardar`, `porId`, `activosDe`; nunca SQL | ✅ hoy |
| **Adapter** | `BarberiaDAOPrisma`, `ServicioDAOPrisma`; después `PasarelaPagosSandbox`, `NotificadorCorreo` | ✅ hoy (persistencia) |
| **Strategy** | `PoliticaCancelacion`, `PoliticaAsignacionEspacios` | con la reserva |
| **State** | `Turno` + `EstadoTurno`: las transiciones inválidas se vuelven imposibles | con el turno |
| **Observer** | Eventos del turno → notificaciones e historial | con la reserva |

### Cómo se hace cumplir la regla

`tests/arquitectura.test.ts` recorre `src/dominio/` y `src/aplicacion/` y falla si algún archivo importa
de `infraestructura/`, de `express` o de `@prisma/` (y, en el caso del dominio, de `aplicacion/`). Corre
con `npm test` y por separado con `npm run arquitectura`.

Está escrita como prueba, y no como un `grep` en `package.json`, porque en Windows npm ejecuta los
scripts con `cmd.exe`: así corre igual en Windows, Mac y en la integración continua.

---

## 9. Convenciones

- **Nombres en el idioma del negocio.** `ReservarTurno`, no `BookingService`. `LiberarReservasVencidas`,
  no `ReservationProcessor`.
- **Nada de `GestorX` ni `ServicioX` genéricos.** Un nombre que sirve para todo no describe nada.
- **Nada de `utils/` ni `helpers/`.** Son carpetas sin criterio de pertenencia: todo cabe y nada se
  encuentra. Si algo no tiene dónde ir, es que le falta un nombre.
- **Un archivo por concepto.** La entidad, su DTO y sus funciones puras viven juntos en
  `dominio/modelo/X.ts`; el caso de uso, su DTO de entrada y sus errores, en `casos-uso/VerboX.ts`
  (verbo en infinitivo). El único `index.ts` es `dominio/puertos/`.
- **No se crean capas vacías.** Una carpeta o un puerto entra cuando una historia de usuario lo necesita.
- **Pruebas junto con cada entidad**: `tests/unidad/` por entidad y un doble en memoria por DAO en
  `tests/dobles/`.
- **Imports relativos y sin extensión** (commonjs + nodenext). `import type` para todo lo que sea solo tipo.
- **`main.ts` es el único archivo que puede importarlo todo y hacer `new`.** Si un segundo empieza a
  hacerlo, hay un problema de diseño.
- **`process.env['X']` con corchetes** y guarda explícita: lo exige `noUncheckedIndexedAccess`.
- **Nulo explícito, no opcional**: `motivoSuspension: string | null`, no `motivoSuspension?: string`
  (`exactOptionalPropertyTypes`).
- **Los DAO devuelven `null` cuando no encuentran**; no lanzan. "No existe" es un resultado normal.
- **Ningún `new Date()` en `dominio/` ni en `aplicacion/`.** Hoy los instantes de auditoría (`creadoEn`) los
  pone la base de datos. Cuando una regla necesite "ahora" (el vencimiento de reservas), entra un puerto
  `Reloj` y su doble `RelojFijo`.
- **El dinero son pesos COP enteros**: `Int` en la base de datos, `number` entero en el dominio, validado
  con `esPrecioValido`. El 20 % y su redondeo vivirán en una sola función del dominio (regla 1).
- **Los instantes se persisten en UTC y se presentan en America/Bogotá.** La conversión ocurre en los
  bordes, no en el dominio.

---

## 10. Atributos de calidad (ISO/IEC 25010)

| Atributo | Compromiso |
|---|---|
| **Fiabilidad** | La liberación de reservas vencidas es **idempotente**: repetir la ejecución no cancela dos veces el mismo turno |
| **Mantenibilidad** | El dominio se prueba sin base de datos ni red; la suite unitaria corre en menos de un segundo |
| **Seguridad** | Autorización por rol **y por barbería** en cada operación; ningún dato personal ni de pago en bitácoras |
| **Usabilidad** | Consultar la agenda o cerrar un turno se hace de pie, desde el teléfono, en pocos toques |
| **Portabilidad** | Cambiar el motor de persistencia o la pasarela no modifica una línea del dominio |
| **Eficiencia** | El cálculo de espacios libres responde de inmediato al abrir el calendario del barbero |

---

## 11. Proceso y entregas

- **Scrum**, sprints de duración fija, una entrega demostrable por corte académico (tres cortes en 2026-03).
- **GitFlow** e integración continua: ninguna entrega se acepta con la construcción en rojo.
- Cada entrega compara el **esfuerzo estimado contra el esfuerzo real** medido.
- **Node.js + TypeScript con tipado estricto** en el servidor y **React** en el cliente
  (plan de curso 103093).
- Los cambios acordados **entran al backlog, no al sprint en curso**.
- Sin presupuesto: solo herramientas libres, gratuitas o de bajo costo (RES-09).

---

## 12. Documentos de referencia del proyecto

| Documento | Contenido |
|---|---|
| `DocumentoDeVision-KronoBarber-V1.1.docx` | Fuente de verdad del alcance, los interesados, las características y las restricciones |
| `Idea_general_del_proyecto` | Descripción original de la que parte el producto |
| `documento-vision.md` | Plantilla y guía del curso para el documento de visión |
