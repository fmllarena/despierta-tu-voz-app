# Actualización de Base de Datos - Diario de Alquimia

## Fecha: 24 Enero 2026

### Cambios necesarios en Supabase

Ejecuta el siguiente SQL en el editor de SQL de Supabase:

```sql
-- Añadir columna para notas personales del usuario
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notas_personales TEXT[] DEFAULT '{}';

-- Comentario de la columna
COMMENT ON COLUMN user_profiles.notas_personales IS 'Array de notas personales escritas por el usuario en su Diario de Alquimia. No se envían a la IA.';
```

### Descripción de los cambios

1. **Nueva columna `notas_personales`**:
   - Tipo: `TEXT[]` (array de textos)
   - Propósito: Almacenar las notas personales que el usuario escribe en el Diario de Alquimia
   - **Importante**: Estas notas NO se incluyen en el contexto de la IA para evitar ralentización
   - Son solo para consulta personal del usuario

### Funcionalidades implementadas

1. **Módulo 6 en Mi Viaje**: "Diario de Alquimia"
   - Siempre desbloqueado para todos los usuarios
   - Muestra dos secciones:
     - **Notas Personales**: Campo de escritura libre
     - **Crónicas de Sesiones**: Resúmenes automáticos generados por la IA

2. **Cierre suave de sesión**:
   - El botón "SALIR" ahora guarda la sesión pero NO cierra la autenticación
   - El chat permanece visible para consulta
   - Aparece un botón "🚪 Cerrar sesión y salir" para logout real
   - Permite al usuario añadir notas después de hablar con el mentor

### Archivos modificados

- `mi_viaje/config.js` - Añadido módulo 6
- `mi_viaje/main.js` - Funciones `abrirDiarioAlquimia()` y `renderDiarioAlquimia()`
- `main.js` - Modificado comportamiento del botón SALIR
- `style.css` - Estilos para el Diario de Alquimia

### Verificación

Después de ejecutar el SQL, verifica que:
1. La columna `notas_personales` existe en `user_profiles`
2. El tipo es `TEXT[]`
3. El valor por defecto es `'{}'` (array vacío)
