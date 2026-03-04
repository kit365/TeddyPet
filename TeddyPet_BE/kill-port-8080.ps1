# Kill process using port 8080 (Windows)
# Run: .\kill-port-8080.ps1   or   powershell -ExecutionPolicy Bypass -File kill-port-8080.ps1

$port = 8080
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "No process found listening on port $port. You can start your application."
    exit 0
}
foreach ($conn in $connections) {
    $pid = $conn.OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    $name = if ($proc) { $proc.ProcessName } else { "PID $pid" }
    Write-Host "Killing $name (PID $pid) using port $port..."
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}
Write-Host "Done. Port $port should be free now."
