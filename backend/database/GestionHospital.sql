/* =====================================================================
   GESTIÓN HOSPITAL - Script completo de base de datos
   ---------------------------------------------------------------------
   Crea la base GestionHospital desde cero, alineada con las entidades
   del backend unificado (Martín + Nacho + Joa Mulla + Acosta).

   !!! ATENCIÓN: BORRA la base GestionHospital si ya existe y la vuelve
   a crear. Si tenés datos que quieras conservar, hacé un backup antes.

   Usuario inicial:  admin@hospital.com  /  Admin123!
   ===================================================================== */

USE master;
GO

IF DB_ID('GestionHospital') IS NOT NULL
BEGIN
    ALTER DATABASE GestionHospital SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE GestionHospital;
END
GO

-- CI = case-insensitive: TypeORM consulta "id" y la columna puede llamarse "Id"
CREATE DATABASE GestionHospital COLLATE Modern_Spanish_CI_AS;
GO

USE GestionHospital;
GO

/* =====================================================================
   IAM - Identidad y accesos
   ===================================================================== */
CREATE TABLE dbo.Roles (
    Id     INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_Nombre UNIQUE
);

CREATE TABLE dbo.Usuarios (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    RolId         INT          NOT NULL CONSTRAINT FK_Usuarios_Roles REFERENCES dbo.Roles(Id),
    NombreUsuario VARCHAR(100) NOT NULL,
    Email         VARCHAR(100) NOT NULL CONSTRAINT UQ_Usuarios_Email UNIQUE,
    PasswordHash  VARCHAR(255) NOT NULL
);
GO

/* =====================================================================
   PACIENTES Y COBERTURAS
   ===================================================================== */
CREATE TABLE dbo.Coberturas (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        VARCHAR(100)  NOT NULL CONSTRAINT UQ_Coberturas_Nombre UNIQUE,
    TipoCobertura VARCHAR(50)   NOT NULL,   -- PUBLICA | PREPAGA | PARTICULAR (estrategia de facturación)
    CopagoFijo    DECIMAL(18,2) NOT NULL CONSTRAINT DF_Coberturas_CopagoFijo DEFAULT 0
);

CREATE TABLE dbo.Pacientes (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT          NULL     CONSTRAINT FK_Pacientes_Usuarios   REFERENCES dbo.Usuarios(Id),
    CoberturaId     INT          NOT NULL CONSTRAINT FK_Pacientes_Coberturas REFERENCES dbo.Coberturas(Id),
    Nombre          VARCHAR(100) NOT NULL,
    Apellido        VARCHAR(100) NOT NULL,
    Documento       VARCHAR(20)  NOT NULL CONSTRAINT UQ_Pacientes_Documento UNIQUE,  -- el DNI identifica al paciente
    FechaNacimiento DATE         NOT NULL
);
GO

/* =====================================================================
   HCE - Historia Clínica Electrónica
   ===================================================================== */
CREATE TABLE dbo.HistoriaClinica (
    Id                     INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId             INT           NOT NULL CONSTRAINT FK_HistoriaClinica_Pacientes REFERENCES dbo.Pacientes(Id)
                                                  CONSTRAINT UQ_HistoriaClinica_Paciente UNIQUE,
    Alergias               NVARCHAR(MAX) NULL,
    AntecedentesFamiliares NVARCHAR(MAX) NULL
);

CREATE TABLE dbo.EvolucionesMedicas (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    HistoriaClinicaId INT           NOT NULL CONSTRAINT FK_Evoluciones_HistoriaClinica REFERENCES dbo.HistoriaClinica(Id),
    MedicoId          INT           NOT NULL CONSTRAINT FK_Evoluciones_Usuarios        REFERENCES dbo.Usuarios(Id),
    FechaHora         DATETIME      NOT NULL CONSTRAINT DF_Evoluciones_FechaHora DEFAULT GETDATE(),
    Observaciones     NVARCHAR(MAX) NOT NULL
);

CREATE TABLE dbo.EstudiosMedicos (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    HistoriaClinicaId INT           NOT NULL CONSTRAINT FK_Estudios_HistoriaClinica REFERENCES dbo.HistoriaClinica(Id),
    TipoEstudio       VARCHAR(100)  NOT NULL,
    Descripcion       NVARCHAR(MAX) NOT NULL,
    Enlace            VARCHAR(500)  NULL,
    FechaHora         DATETIME      NOT NULL CONSTRAINT DF_Estudios_FechaHora DEFAULT GETDATE()
);
GO

-- Las evoluciones médicas son inmutables: no se pueden modificar ni borrar
CREATE TRIGGER dbo.TR_EvolucionesMedicas_Inmutables
ON dbo.EvolucionesMedicas
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50001, 'Las evoluciones médicas son inmutables: no se pueden modificar ni eliminar.', 1;
END
GO

/* =====================================================================
   RECURSOS Y CAMAS + INVENTARIO
   ===================================================================== */
CREATE TABLE dbo.Camas (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    Numero     VARCHAR(20) NOT NULL CONSTRAINT UQ_Camas_Numero UNIQUE,
    Estado     VARCHAR(30) NOT NULL CONSTRAINT DF_Camas_Estado DEFAULT 'libres',  -- libres | ocupadas | en limpieza | bloqueadas
    RowVersion INT         NOT NULL CONSTRAINT DF_Camas_RowVersion DEFAULT 1      -- @VersionColumn (bloqueo optimista)
);

CREATE TABLE dbo.AsignacionCamas (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    CamaId       INT      NOT NULL CONSTRAINT FK_AsignacionCamas_Camas     REFERENCES dbo.Camas(Id),
    PacienteId   INT      NOT NULL CONSTRAINT FK_AsignacionCamas_Pacientes REFERENCES dbo.Pacientes(Id),
    FechaIngreso DATETIME NOT NULL CONSTRAINT DF_AsignacionCamas_FechaIngreso DEFAULT GETDATE(),
    FechaEgreso  DATETIME NULL
);

CREATE TABLE dbo.InventarioInsumos (
    Id             INT IDENTITY(1,1) PRIMARY KEY,
    Nombre         VARCHAR(150)  NOT NULL,
    StockActual    INT           NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    StockMinimo    INT           NOT NULL CONSTRAINT DF_Inventario_StockMinimo DEFAULT 0
);

-- Idempotencia de eventos: un mismo evento no se procesa dos veces por el mismo consumidor
CREATE TABLE dbo.EventoProcesados (
    EventoId       UNIQUEIDENTIFIER NOT NULL,
    Consumidor     VARCHAR(50)      NOT NULL,
    FechaProcesado DATETIME         NOT NULL CONSTRAINT DF_EventoProcesados_Fecha DEFAULT GETDATE(),
    CONSTRAINT PK_EventoProcesados PRIMARY KEY (EventoId, Consumidor)
);
GO

/* =====================================================================
   ATENCIÓN Y ENFERMERÍA
   ===================================================================== */
CREATE TABLE dbo.IndicacionesMedicas (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId      INT          NOT NULL CONSTRAINT FK_Indicaciones_Pacientes  REFERENCES dbo.Pacientes(Id),
    MedicoId        INT          NOT NULL CONSTRAINT FK_Indicaciones_Usuarios   REFERENCES dbo.Usuarios(Id),
    InsumoId        INT          NOT NULL CONSTRAINT FK_Indicaciones_Inventario REFERENCES dbo.InventarioInsumos(Id),
    Dosis           VARCHAR(100) NOT NULL,
    Frecuencia      VARCHAR(100) NOT NULL,
    FechaIndicacion DATETIME     NOT NULL CONSTRAINT DF_Indicaciones_Fecha  DEFAULT GETDATE(),
    PrimeraDosis    DATETIME     NOT NULL,
    Activa          BIT          NOT NULL CONSTRAINT DF_Indicaciones_Activa DEFAULT 1
);

CREATE TABLE dbo.AdministracionMedicion (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    IndicacionId        INT         NOT NULL CONSTRAINT FK_Administracion_Indicaciones REFERENCES dbo.IndicacionesMedicas(Id),
    EnfermeroId         INT         NOT NULL CONSTRAINT FK_Administracion_Usuarios     REFERENCES dbo.Usuarios(Id),
    FechaHoraAplicacion DATETIME    NOT NULL CONSTRAINT DF_Administracion_Fecha DEFAULT GETDATE(),
    Estado              VARCHAR(50) NOT NULL,
    FechaHoraProgramada DATETIME    NULL
);

CREATE TABLE dbo.vital_signs (
    id                     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_vital_signs PRIMARY KEY
                                                     CONSTRAINT DF_vital_signs_id DEFAULT NEWSEQUENTIALID(),
    patientId              INT           NOT NULL CONSTRAINT FK_vital_signs_Pacientes REFERENCES dbo.Pacientes(Id),
    nurseName              NVARCHAR(100) NOT NULL,
    roomNumber             NVARCHAR(50)  NOT NULL,
    bloodPressureSystolic  FLOAT         NOT NULL,
    bloodPressureDiastolic FLOAT         NOT NULL,
    heartRate              FLOAT         NOT NULL,
    temperature            FLOAT         NOT NULL,
    isCriticalAlert        BIT           NOT NULL CONSTRAINT DF_vital_signs_alert DEFAULT 0,
    nursingNote            NVARCHAR(500) NULL,
    recordedAt             DATETIME      NOT NULL CONSTRAINT DF_vital_signs_recordedAt DEFAULT GETDATE()
);

CREATE TABLE dbo.Notificaciones (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    Prioridad    VARCHAR(20)   NOT NULL,
    Destinatario VARCHAR(50)   NOT NULL,
    Mensaje      NVARCHAR(500) NOT NULL,
    ReferenciaId VARCHAR(50)   NULL,
    Leida        BIT           NOT NULL CONSTRAINT DF_Notificaciones_Leida DEFAULT 0,
    FechaHora    DATETIME      NOT NULL CONSTRAINT DF_Notificaciones_Fecha DEFAULT GETDATE()
);

CREATE TABLE dbo.ProtocolosAtencion (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId    INT          NOT NULL CONSTRAINT FK_Protocolos_Pacientes REFERENCES dbo.Pacientes(Id),
    TipoProtocolo VARCHAR(100) NOT NULL,
    FechaInicio   DATETIME     NOT NULL CONSTRAINT DF_Protocolos_FechaInicio DEFAULT GETDATE(),
    Habitacion    VARCHAR(50)  NULL
);

CREATE TABLE dbo.TareasProtocolo (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    ProtocoloId INT          NOT NULL CONSTRAINT FK_Tareas_Protocolos REFERENCES dbo.ProtocolosAtencion(Id) ON DELETE CASCADE,
    Descripcion VARCHAR(255) NOT NULL,
    Completada  BIT          NOT NULL CONSTRAINT DF_Tareas_Completada DEFAULT 0
);
GO

/* =====================================================================
   ADMISIÓN, TURNOS Y GUARDIA
   ===================================================================== */
CREATE TABLE dbo.Especialidades (
    id     INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL CONSTRAINT UQ_Especialidades_nombre UNIQUE,
    tipo   VARCHAR(20)   NOT NULL CONSTRAINT DF_Especialidades_tipo DEFAULT 'medico'   -- medico | enfermero
);

-- Profesionales que atienden turnos (médicos y enfermeros), con cuenta de usuario opcional
CREATE TABLE dbo.Medicos (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    nombre         NVARCHAR(120) NOT NULL,
    tipo           VARCHAR(20)   NOT NULL CONSTRAINT DF_Medicos_tipo DEFAULT 'medico',
    especialidadId INT NULL CONSTRAINT FK_Medicos_Especialidades REFERENCES dbo.Especialidades(id),
    usuarioId      INT NULL CONSTRAINT FK_Medicos_Usuarios       REFERENCES dbo.Usuarios(Id)
);

CREATE TABLE dbo.HorariosMedico (
    id                       INT IDENTITY(1,1) PRIMARY KEY,
    MedicoId                 INT  NOT NULL CONSTRAINT FK_HorariosMedico_Medicos REFERENCES dbo.Medicos(id),
    DiaSemana                INT  NOT NULL,   -- 1 = lunes ... 7 = domingo
    HoraInicio               TIME NOT NULL,
    HoraFin                  TIME NOT NULL,
    DuracionIntervaloMinutos INT  NOT NULL CONSTRAINT DF_HorariosMedico_Duracion DEFAULT 30
);

CREATE TABLE dbo.Turnos (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId      INT         NOT NULL CONSTRAINT FK_Turnos_Pacientes REFERENCES dbo.Pacientes(Id),
    MedicoId        INT         NOT NULL CONSTRAINT FK_Turnos_Medicos   REFERENCES dbo.Medicos(id),
    FechaHoraInicio DATETIME    NOT NULL,
    FechaHoraFin    DATETIME    NOT NULL,
    Estado          VARCHAR(50) NOT NULL CONSTRAINT DF_Turnos_Estado       DEFAULT 'Programado',
    EsEntreturno    BIT         NOT NULL CONSTRAINT DF_Turnos_EsEntreturno DEFAULT 0,
    RowVersion      INT         NOT NULL CONSTRAINT DF_Turnos_RowVersion   DEFAULT 1   -- @VersionColumn (INT, no timestamp)
);

-- Lista de espera para entreturnos (HU 1.3)
CREATE TABLE dbo.ListaEspera (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId INT         NOT NULL CONSTRAINT FK_ListaEspera_Pacientes REFERENCES dbo.Pacientes(Id),
    MedicoId   INT         NOT NULL CONSTRAINT FK_ListaEspera_Medicos   REFERENCES dbo.Medicos(id),
    Fecha      DATE        NOT NULL,
    Posicion   INT         NOT NULL,
    Estado     VARCHAR(50) NULL
);

-- Triaje de guardia: el paciente llega sin turno y puede no estar registrado
CREATE TABLE dbo.IngresosGuardia (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    pacienteNombre     NVARCHAR(120) NOT NULL,
    documento          VARCHAR(20)   NULL,
    motivoConsulta     NVARCHAR(300) NOT NULL,
    nivel              INT           NOT NULL,   -- Manchester: 1 rojo ... 5 azul
    estado             VARCHAR(20)   NOT NULL CONSTRAINT DF_IngresosGuardia_estado DEFAULT 'En espera',
    enfermeroUsuarioId INT           NOT NULL CONSTRAINT FK_Guardia_Enfermero REFERENCES dbo.Usuarios(Id),
    medicoUsuarioId    INT           NULL     CONSTRAINT FK_Guardia_Medico    REFERENCES dbo.Usuarios(Id),
    fechaIngreso       DATETIME      NOT NULL CONSTRAINT DF_IngresosGuardia_fechaIngreso DEFAULT GETDATE(),
    fechaAtencion      DATETIME      NULL
);
GO

/* =====================================================================
   FACTURACIÓN
   ===================================================================== */
CREATE TABLE dbo.CuentasEstadia (
    Id                 INT IDENTITY(1,1) PRIMARY KEY,
    PacienteId         INT           NOT NULL CONSTRAINT FK_CuentasEstadia_Pacientes REFERENCES dbo.Pacientes(Id),
    FechaApertura      DATETIME      NOT NULL CONSTRAINT DF_CuentasEstadia_FechaApertura DEFAULT GETDATE(),
    Estado             VARCHAR(50)   NOT NULL CONSTRAINT DF_CuentasEstadia_Estado        DEFAULT 'Abierta',
    TotalCargoPaciente DECIMAL(18,2) NOT NULL CONSTRAINT DF_CuentasEstadia_TotalPac      DEFAULT 0,
    TotalCargoTerceros DECIMAL(18,2) NOT NULL CONSTRAINT DF_CuentasEstadia_TotalTer      DEFAULT 0
);

CREATE TABLE dbo.CargosAutomaticos (
    Id                 INT IDENTITY(1,1) PRIMARY KEY,
    CuentaEstadiaId    INT           NOT NULL CONSTRAINT FK_Cargos_CuentasEstadia REFERENCES dbo.CuentasEstadia(Id),
    Concepto           VARCHAR(255)  NOT NULL,
    Detalle            VARCHAR(200)  NULL,
    Destinatario       VARCHAR(20)   NOT NULL,   -- PACIENTE | ESTADO | PREPAGA
    Monto              DECIMAL(18,2) NOT NULL,
    ReferenciaEventoId VARCHAR(64)   NULL,       -- id del evento que lo originó (NULL = cargo manual)
    FechaCargo         DATETIME      NOT NULL CONSTRAINT DF_Cargos_FechaCargo DEFAULT GETDATE()
);
GO

GO

-- La posición sale del orden de llegada: no se guarda
IF COL_LENGTH('dbo.ListaEspera', 'Posicion') IS NOT NULL
    ALTER TABLE dbo.ListaEspera DROP COLUMN Posicion;
GO

-- Estado obligatorio, por defecto 'En espera'
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.ListaEspera') AND name = 'Estado' AND is_nullable = 1)
BEGIN
    UPDATE dbo.ListaEspera SET Estado = 'En espera' WHERE Estado IS NULL;
    ALTER TABLE dbo.ListaEspera ALTER COLUMN Estado VARCHAR(50) NOT NULL;
END
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints
               WHERE parent_object_id = OBJECT_ID('dbo.ListaEspera')
                 AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('dbo.ListaEspera'), 'Estado', 'ColumnId'))
    ALTER TABLE dbo.ListaEspera ADD CONSTRAINT DF_ListaEspera_Estado DEFAULT 'En espera' FOR Estado;
GO

-- Momento en que se anotó (define el orden de la cola)
IF COL_LENGTH('dbo.ListaEspera', 'FechaAlta') IS NULL
    ALTER TABLE dbo.ListaEspera ADD FechaAlta DATETIME NOT NULL
        CONSTRAINT DF_ListaEspera_FechaAlta DEFAULT GETDATE() WITH VALUES;
GO

-- Turno que se le asignó al promoverlo
IF COL_LENGTH('dbo.ListaEspera', 'TurnoId') IS NULL
    ALTER TABLE dbo.ListaEspera ADD TurnoId INT NULL
        CONSTRAINT FK_ListaEspera_Turnos REFERENCES dbo.Turnos(Id);
GO

IF COL_LENGTH('dbo.ListaEspera', 'FechaAsignacion') IS NULL
    ALTER TABLE dbo.ListaEspera ADD FechaAsignacion DATETIME NULL;
GO

-- Búsqueda de la cola de un profesional en un día
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ListaEspera_Medico_Fecha_Estado')
    CREATE INDEX IX_ListaEspera_Medico_Fecha_Estado ON dbo.ListaEspera (MedicoId, Fecha, Estado);
GO

SELECT c.name AS columna, TYPE_NAME(c.user_type_id) AS tipo, c.is_nullable
FROM sys.columns c WHERE c.object_id = OBJECT_ID('dbo.ListaEspera') ORDER BY c.column_id;

INSERT INTO dbo.Roles (Nombre)
SELECT 'Maestranza'
WHERE NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Nombre = 'Maestranza');

/* =====================================================================
   DATOS INICIALES
   ===================================================================== */

-- Roles: HCE y Enfermería comparan con 'Médico' (con tilde), no cambiar los nombres
-- NCHAR(233) = 'é': así el valor queda bien aunque SSMS abra el archivo con otra codificación
INSERT INTO dbo.Roles (Nombre) VALUES
    ('Administrador'), (N'M' + NCHAR(233) + N'dico'), ('Enfermero'), ('Recepcionista');

-- Admin inicial  ->  admin@hospital.com / Admin123!  (hash bcrypt, 10 rondas)
INSERT INTO dbo.Usuarios (RolId, NombreUsuario, Email, PasswordHash)
SELECT Id, 'Administrador', 'admin@hospital.com',
       '$2b$10$ebXoNPXhQiioX5S/e7jMD.A9IK59eUc9ip0O8LqfDYpZrUtVv60qu'
FROM dbo.Roles WHERE Nombre = 'Administrador';

-- Coberturas (ejemplos de las HU de Facturación)
INSERT INTO dbo.Coberturas (Nombre, TipoCobertura, CopagoFijo) VALUES
    ('Particular (sin cobertura)', 'PARTICULAR', 0),
    ('Obra Social Pública',        'PUBLICA',    0),
    ('Medicina Prepaga Premium',   'PREPAGA',    3000);

-- Pacientes de ejemplo (nombres de las HU) con su historia clínica
INSERT INTO dbo.Pacientes (CoberturaId, Nombre, Apellido, Documento, FechaNacimiento)
SELECT c.Id, p.Nombre, p.Apellido, p.Documento, p.FechaNacimiento
FROM (VALUES
    ('Juan',   'Gómez', '30111222', CAST('1985-03-12' AS DATE), 'Obra Social Pública'),
    ('Ana',    'Rojas', '32444555', CAST('1990-07-25' AS DATE), 'Medicina Prepaga Premium'),
    ('Carlos', 'López', '28777888', CAST('1979-11-02' AS DATE), 'Particular (sin cobertura)')
) AS p(Nombre, Apellido, Documento, FechaNacimiento, Cobertura)
JOIN dbo.Coberturas c ON c.Nombre = p.Cobertura;

INSERT INTO dbo.HistoriaClinica (PacienteId) SELECT Id FROM dbo.Pacientes;

-- Especialidades
INSERT INTO dbo.Especialidades (nombre, tipo) VALUES
    ('Clínica Médica', 'medico'),
    ('Pediatría',      'medico'),
    ('Cardiología',    'medico'),
    ('Enfermería',     'enfermero');

-- Camas
INSERT INTO dbo.Camas (Numero) VALUES ('101'), ('102'), ('103'), ('104');

-- Insumos (Ibuprofeno con stock 50, como en la HU de inventario)
INSERT INTO dbo.InventarioInsumos (Nombre, StockActual, PrecioUnitario, StockMinimo) VALUES
    ('Ibuprofeno 400mg',      50, 350.00, 10),
    ('Paracetamol 500mg',     80, 280.00, 10),
    ('Amoxicilina 500mg',     40, 900.00,  5),
    ('Solución fisiológica',  30, 1500.00, 5);
GO

/* =====================================================================
   VERIFICACIÓN
   ===================================================================== */
SELECT name AS tabla FROM sys.tables ORDER BY name;
SELECT Id, Nombre FROM dbo.Roles;   -- 'Médico' tiene que verse con tilde