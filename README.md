# UnHolly Date App

Aplicación social y de citas para adultos (+18), con identidad visual dark/violet y diseño adaptable a móvil y escritorio.

## Estado actual

Esta es la **base inicial del proyecto (0.1.0)**. Incluye una interfaz navegable de demostración para:
- Descubrir perfiles de ejemplo.
- Dar likes y pasar perfiles (estado local del navegador).
- Ver los likes enviados durante la sesión.
- Abrir conversaciones de ejemplo y enviar mensajes localmente.
- Consultar una vista ilustrativa del mapa.
- Editar un nombre visible temporal.

**Todavía no es un servicio multiusuario.** No hay registro real, perfiles reales, chat en servidor, mapas geolocalizados, pagos, anuncios, llamadas ni moderación conectada. La interfaz lo indica como demostración. No uses datos personales reales en esta versión.

## Requisitos

- Node.js 20 o superior recomendado.
- npm.

## Ejecutar en local

```bash
npm install
npm run dev
```

Vite mostrará una dirección local. Para probar desde el iPhone en la misma red Wi-Fi, abre la dirección de red que muestre Vite.

## Compilar

```bash
npm run build
npm run preview
```

## Próximas etapas

1. Crear el proyecto Supabase y configurar variables de entorno.
2. Implementar autenticación, verificación de edad y perfiles.
3. Diseñar políticas RLS y almacenamiento privado de medios.
4. Implementar likes y matches en servidor.
5. Conectar mensajería en tiempo real.
6. Incorporar mapas con ubicación aproximada y consentimiento.
7. Añadir reportes, bloqueos, moderación, borrado de cuenta y herramientas de privacidad.
8. Evaluar pagos y publicación en tiendas.

## Variables de entorno

Copia `.env.example` a `.env.local` y añade la URL del proyecto Supabase y su clave pública anon. Nunca incluyas una clave `service_role` en el frontend ni la subas a GitHub.

## Seguridad y privacidad

UnHolly está pensado para mayores de 18 años. Antes de abrirlo al público habrá que implementar controles reales de edad, consentimiento, privacidad, seguridad, moderación y cumplimiento de RGPD/LOPDGDD. Las ubicaciones deben ser aproximadas y voluntarias. No se puede garantizar que un destinatario no grabe una pantalla con otro dispositivo.


## Registro e inicio de sesión (etapa siguiente)

La interfaz de autenticación ya está preparada para Supabase Auth. Cuando `.env.local` tenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, la aplicación mostrará registro e inicio de sesión. El alta solicita fecha de nacimiento y una confirmación de mayoría de edad; la validación del navegador es solo una primera barrera y **no sustituye una verificación de edad robusta antes del lanzamiento público**.

Para activar el acceso:
1. Crea un proyecto en https://supabase.com/.
2. En SQL Editor, ejecuta `supabase/schema.sql`.
3. Copia Project URL y la clave publicable/anon del proyecto a `.env.local` (no subas ese archivo a GitHub).
4. En Authentication, configura la confirmación de correo y las URLs autorizadas para tu dominio.

Hasta completar esos pasos, la aplicación seguirá en modo demostración. La interfaz actual de descubrimiento y chat todavía utiliza datos de ejemplo; no se deben presentar como usuarios o conversaciones reales.
