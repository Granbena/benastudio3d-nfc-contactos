# Cambio pendiente en nfc-submit-contact

La función está desplegada directamente en Supabase. Primero debe incorporarse al repositorio su versión actualmente desplegada; no se ha creado, modificado ni desplegado una implementación sustituta.

En el manejo del error del INSERT existente a public.nfc_contacts, antes del error genérico, detectar NFC_PROFILE_LIMIT_REACHED en el mensaje de Supabase (SQLSTATE P0001) y responder HTTP 409 con este JSON exacto:

```json
{ "error": "La empresa ya utilizó todos los perfiles NFC contratados.", "code": "PROFILE_LIMIT_REACHED" }
```

Conservar las cabeceras CORS y Content-Type, validaciones, consentimiento, limitación de solicitudes y toda la lógica actual. Supabase sigue siendo la autoridad de cupos; un conteo previo no sustituye la validación transaccional de la base.

Validar una vez disponible el código: último cupo aceptado; siguiente envío devuelve 409; dos envíos concurrentes no superan el límite; disabled libera cupo; otros errores conservan su comportamiento. El frontend consulta los cupos después del éxito y al recibir PROFILE_LIMIT_REACHED o NFC_PROFILE_LIMIT_REACHED.
