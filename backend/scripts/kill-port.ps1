param([int]$Port = 3001)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) { exit 0 }

foreach ($conn in $connections) {
  Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}
exit 0
