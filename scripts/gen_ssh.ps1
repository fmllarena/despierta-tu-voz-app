$sshPath = "$HOME\.ssh"
if (-not (Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath
}
$keyFile = "$sshPath\id_ed25519"
if (Test-Path $keyFile) {
    Remove-Item $keyFile
    Remove-Item "$keyFile.pub"
}
ssh-keygen -t ed25519 -C "pruebasimagenesai@gmail.com" -f $keyFile -N "" -q
Get-Content "$keyFile.pub"
