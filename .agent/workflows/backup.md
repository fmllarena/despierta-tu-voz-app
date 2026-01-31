---
description: Realiza un backup de seguridad de los archivos críticos fuera del directorio del proyecto.
---

Este flujo de trabajo asegura que siempre tengamos una copia reciente de los archivos más importantes.

// turbo
1. Ejecutar el script de backup
```powershell
powershell -ExecutionPolicy Bypass -File c:\Projects\appDTV\despierta-tu-voz-app\scripts\backup.ps1
```

2. Confirmar la ruta del backup al usuario.
   El backup se guarda en `c:\Projects\appDTV\backups\dtv-backup-[FECHA]`.
