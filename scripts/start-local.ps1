# 本地一键启动与联通性自检脚本（Windows PowerShell 7）
# 使用方法：右键使用 PowerShell 运行 或 在 PowerShell 中执行：.\scripts\start-local.ps1

param(
  [int]$Port = 14000
)

Write-Host "设置本地端口为 $Port" -ForegroundColor Cyan
$env:PORT = "$Port"
$env:NODE_ENV = "development"

# 启动后端（前台运行以便查看日志；如需后台可用 Start-Process + pm2）
Write-Host "启动后端服务（node src/app.js）..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "src/app.js" -WorkingDirectory (Get-Location)

# 等待服务启动
Start-Sleep -Seconds 3

function Test-Endpoint {
  param([string]$Url)
  try {
    $resp = Invoke-RestMethod -Method GET -Uri $Url -TimeoutSec 5
    Write-Host ("OK -> " + $Url) -ForegroundColor Green
    return $true
  } catch {
    Write-Host ("FAIL -> " + $Url + " : " + $_.Exception.Message) -ForegroundColor Red
    return $false
  }
}

Write-Host "联通性自检..." -ForegroundColor Cyan
$base = "http://localhost:$Port"
$checks = @(
  "$base/health",
  "$base/api/info",
  "$base/api/agents/status",
  "$base/api/evolution/self-check",
  "$base/api/story-agent/self-check",
  "$base/"
)

$allOk = $true
foreach ($u in $checks) {
  if (-not (Test-Endpoint -Url $u)) { $allOk = $false }
}

# 简易注册/登录演示
try {
  $regBody = @{ username = "localuser"; password = "localpass" } | ConvertTo-Json
  $regResp = Invoke-RestMethod -Method POST -Uri "$base/api/auth/register" -ContentType "application/json" -Body $regBody
  Write-Host ("注册接口 -> " + ($regResp | ConvertTo-Json)) -ForegroundColor Green
} catch {
  Write-Host ("注册接口失败: " + $_.Exception.Message) -ForegroundColor Yellow
}

try {
  $loginBody = @{ username = "localuser"; password = "localpass" } | ConvertTo-Json
  $loginResp = Invoke-RestMethod -Method POST -Uri "$base/api/auth/login" -ContentType "application/json" -Body $loginBody
  Write-Host ("登录接口 -> " + ($loginResp | ConvertTo-Json)) -ForegroundColor Green
} catch {
  Write-Host ("登录接口失败: " + $_.Exception.Message) -ForegroundColor Yellow
}

if ($allOk) {
  Write-Host "本地部署已就绪，浏览器打开：$base" -ForegroundColor Green
} else {
  Write-Host "部分联通性检查失败，请查看 node 控制台日志。" -ForegroundColor Yellow
}