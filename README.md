# TP - Sistema de Gestión Hospitalaria

Trabajo Práctico desarrollado por:

- Martín Robledo
- Joaquín Mullasano
- Ignacio Beltramino
- Joaquín Acosta

## Tecnologías

- Vue
- TypeScript
- NestJS
- SQL Server

## Estructura

- `/frontend` → Aplicación frontend
- `/backend` → API backend
- `/docs` → Documentación del proyecto

## Preparar SQL Server y ejecutar el backend

Cada integrante puede usar una instancia y una base local distinta. El esquema
se comparte mediante `backend/database/initial-schema.sql`; no se comparten
contraseñas ni archivos `.env`.

1. Instalar y arrancar SQL Server en tu equipo, y habilitar conexiones TCP/IP y
   autenticación de SQL Server.
2. Abrir `backend/database/initial-schema.sql` en SQL Server Management Studio y
   ejecutarlo conectado a una instancia con permisos para crear bases de datos.
   El script crea `GestionHospital`, las tablas de facturación y una cuenta de
   prueba abierta para el paciente 1. Si querés usar otro nombre de base,
   cambiá `GestionHospital` en el script y en el archivo `.env`.
3. Copiar `backend/.env.example` como `backend/.env` y completar el usuario y la
   contraseña de SQL Server. El `.env` es local y está excluido de Git.
4. Desde `backend`, ejecutar `npm install` y `npm run start:dev`.
5. Desde `frontend`, ejecutar `npm install` y `npm run dev`. La pantalla de
   facturación llama al backend en `http://localhost:3000`.

`npm run build` compila el backend y `npm start` ejecuta la compilación. El
backend no modifica automáticamente el esquema de la base (`synchronize` está
desactivado).
