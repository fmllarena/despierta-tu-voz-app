# Script de Backup para Despierta tu Voz
$sourceDir = "c:\Projects\appDTV\despierta-tu-voz-app"
$backupBaseDir = "c:\Projects\appDTV\backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupFolder = Join-Path $backupBaseDir "dtv-backup-$timestamp"

# Crear carpetas si no existen
if (!(Test-Path $backupBaseDir)) { New-Item -ItemType Directory -Path $backupBaseDir }
New-Item -ItemType Directory -Path $backupFolder

Write-Host "🚀 Iniciando backup en: $backupFolder" -ForegroundColor Cyan

# Lista de archivos y carpetas clave
$itemsToBackup = @(
    "index.html",
    "landing.html",
    "main.js",
    "package.json",
    ".env",
    "api",
    "css",
    "js",
    "assets"
)

foreach ($item in $itemsToBackup) {
    $sourcePath = Join-Path $sourceDir $item
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $backupFolder -Recurse -Force
        Write-Host "✅ Copiado: $item" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No encontrado: $item" -ForegroundColor Yellow
    }
}

Write-Host "✨ Backup completado con éxito." -ForegroundColor Cyan
