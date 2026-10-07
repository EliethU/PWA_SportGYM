# React + Vite

## Control de asistencia

La vista administrativa **Asistencia** genera un QR permanente que enlaza con el portal del cliente. El cliente debe iniciar sesión; una Cloud Function obtiene su perfil autenticado y guarda como máximo una asistencia diaria en `asistencias`. El panel administrativo escucha esos registros en tiempo real.

Configura `VITE_APP_URL` con la URL definitiva del sitio antes de compilar y publicar para que el QR impreso siga apuntando al mismo dominio. Si se omite, se utiliza el origen actual de la aplicación. Publica la función con `npm --prefix functions run deploy` desde la raíz del proyecto.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
