$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolDir = Join-Path $projectRoot 'tools'
$serverRoot = Join-Path $toolDir 'mysql-portable\PFiles64\MySQL\MySQL Server 8.4'
if ($env:LOCALAPPDATA -like '*\Packages\openai.codex_*\AC\#!sandbox*') {
	throw 'This PowerShell session is inside the Codex isolated sandbox. Run setup from Windows PowerShell or Windows Terminal outside Codex so MySQL can write its database files.'
}
$mysqlHome = Join-Path $env:LOCALAPPDATA 'CCE\MySQL-8.4'
$mysqlData = Join-Path $mysqlHome 'data'
$mysqlFiles = Join-Path $mysqlHome 'files'
$mysqld = Join-Path $serverRoot 'bin\mysqld.exe'
$mysql = Join-Path $serverRoot 'bin\mysql.exe'
$ini = Join-Path $toolDir 'my.ini'
$envPath = Join-Path $projectRoot '.env'

foreach ($path in @($mysqld, $mysql, $ini, $envPath)) {
	if (-not (Test-Path -LiteralPath $path)) { throw "Required local MySQL setup file is missing: $path" }
}

New-Item -ItemType Directory -Force -Path $mysqlData, $mysqlFiles | Out-Null
$iniContent = @"
[mysqld]
basedir=$($serverRoot.Replace('\','/'))
datadir=$($mysqlData.Replace('\','/'))
port=3306
bind-address=127.0.0.1
mysqlx=0
local_infile=OFF
secure_file_priv=$($mysqlFiles.Replace('\','/'))
log-error=$(($mysqlData + '\mysql-error.log').Replace('\','/'))
"@
Set-Content -LiteralPath $ini -Value $iniContent -Encoding ascii

if (-not (Test-Path -LiteralPath (Join-Path $mysqlData 'mysql'))) {
	$contents = Get-ChildItem -LiteralPath $mysqlData -Force
	if ($contents.Count -gt 0) { throw "MySQL data directory is not initialized and is not empty: $mysqlData. Preserve its contents and review it before retrying." }
	$previousErrorActionPreference = $ErrorActionPreference
	try {
		$ErrorActionPreference = 'Continue'
		$initializationOutput = & $mysqld "--defaults-file=`"$ini`"" --initialize-insecure --console 2>&1
		$initializationExitCode = $LASTEXITCODE
	} finally {
		$ErrorActionPreference = $previousErrorActionPreference
	}
	if ($initializationExitCode -ne 0) { throw "MySQL could not initialize its data directory: $($initializationOutput -join ' ')" }
}

$vars = @{}
Get-Content -LiteralPath $envPath | ForEach-Object {
	if ($_ -match '^([^#=]+)=(.*)$') { $vars[$matches[1]] = $matches[2] }
}
$rootPassword = $vars['MYSQL_ROOT_PASSWORD']
$dbUrl = [Uri]$vars['DATABASE_URL']
if (-not $rootPassword -or $dbUrl.UserInfo -notmatch '^([^:]+):(.+)$') { throw 'The local .env file is missing database credentials.' }
$appUser = [Uri]::UnescapeDataString($matches[1])
$appPassword = [Uri]::UnescapeDataString(($matches[2] -split '@')[0])
$database = $dbUrl.AbsolutePath.TrimStart('/')
$clientPath = Join-Path $toolDir 'mysql-cce-client.cnf'
$bootstrapPath = Join-Path $toolDir 'mysql-bootstrap-once.sql'
$client = "[client]`r`nuser=$appUser`r`npassword=$appPassword`r`nhost=127.0.0.1`r`nprotocol=TCP`r`nport=3306`r`ndatabase=$database`r`n"
Set-Content -LiteralPath $clientPath -Value $client -Encoding ascii
$bootstrapSql = @(
	"ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';",
	"CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword';",
	"ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword';",
	"GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;",
	"CREATE DATABASE IF NOT EXISTS ``$database`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
	"CREATE USER IF NOT EXISTS '$appUser'@'127.0.0.1' IDENTIFIED BY '$appPassword';",
	"ALTER USER '$appUser'@'127.0.0.1' IDENTIFIED BY '$appPassword';",
	"GRANT ALL PRIVILEGES ON ``$database``.* TO '$appUser'@'127.0.0.1';",
	'FLUSH PRIVILEGES;'
) -join "`r`n"
Set-Content -LiteralPath $bootstrapPath -Value $bootstrapSql -Encoding ascii
$script:lastClientError = ''

function Test-MySqlConnection([string[]]$clientOptions) {
	$previousErrorActionPreference = $ErrorActionPreference
	try {
		$ErrorActionPreference = 'Continue'
		$clientOutput = & $mysql @clientOptions -N -e 'SELECT 1' 2>&1
		$clientExitCode = $LASTEXITCODE
		if ($clientExitCode -ne 0) { $script:lastClientError = ($clientOutput | Out-String).Trim(); return $false }
		return $true
	} catch {
		$script:lastClientError = $_.Exception.Message
		return $false
	} finally {
		$ErrorActionPreference = $previousErrorActionPreference
	}
}

$serverProcess = $null
$connected = Test-MySqlConnection @("--defaults-extra-file=$clientPath")
$listener = @(Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue)
if (-not $connected -and $listener.Count -gt 0) {
	$listenerPids = @($listener.OwningProcess | Sort-Object -Unique)
	$listenerProcesses = @($listenerPids | ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
	$onlyCceServer = $listenerProcesses.Count -gt 0 -and @($listenerProcesses | Where-Object { $_.Path -ne $mysqld }).Count -eq 0
	if (-not $onlyCceServer) {
		$owners = $listenerProcesses | ForEach-Object { "PID $($_.Id): $($_.Path)" }
		Remove-Item -LiteralPath $clientPath, $bootstrapPath -Force -ErrorAction SilentlyContinue
		throw "Port 3306 is used by another process, and CCE could not authenticate. Listener: $($owners -join '; '). Stop that service or configure CCE to use a free local port."
	}
	# The CCE server was started with skip_name_resolve, which prevents 127.0.0.1
	# from matching its initial root@localhost account. Restart our own server
	# using the corrected config before provisioning accounts.
	# On Windows, mysqld may spawn a monitor and a child that owns the port.
	# Stop every process for this exact portable binary so the monitor cannot respawn it.
	$cceProcesses = @(Get-Process -Name mysqld -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $mysqld } | Sort-Object StartTime)
	foreach ($cceProcess in $cceProcesses) { Stop-Process -Id $cceProcess.Id -Force }
	foreach ($cceProcess in $cceProcesses) { Wait-Process -Id $cceProcess.Id -Timeout 10 -ErrorAction SilentlyContinue }
	$listener = @(Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue)
	if ($listener.Count -gt 0) {
		$remainingOwners = @($listener | ForEach-Object { "PID $($_.OwningProcess)" }) -join ', '
		Remove-Item -LiteralPath $clientPath, $bootstrapPath -Force -ErrorAction SilentlyContinue
		throw "The previous CCE MySQL listener is still active ($remainingOwners). Stop the remaining mysqld process and retry."
	}
}

if (-not $connected) {
	# A prior hidden launch can leave mysqld alive without opening its configured port.
	# Stop only this downloaded server binary, and only after confirming there is no listener.
	$staleProcesses = @(Get-Process -Name mysqld -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $mysqld } | Sort-Object StartTime)
	foreach ($staleProcess in $staleProcesses) { Stop-Process -Id $staleProcess.Id -Force }
	foreach ($staleProcess in $staleProcesses) { Wait-Process -Id $staleProcess.Id -Timeout 10 -ErrorAction SilentlyContinue }
	$remainingProcesses = @(Get-Process -Name mysqld -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $mysqld })
	if ($remainingProcesses.Count -gt 0) { throw 'A stale CCE MySQL process could not be stopped. Close any MySQL consoles and retry.' }
	$stdoutPath = Join-Path $toolDir 'mysql-startup.log'
	$stderrPath = Join-Path $toolDir 'mysql-startup-error.log'
	$serverProcess = Start-Process -FilePath $mysqld -ArgumentList @("--defaults-file=`"$ini`"", "--init-file=`"$bootstrapPath`"", '--console') -WorkingDirectory $serverRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
}

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
	if (Test-MySqlConnection @("--defaults-extra-file=$clientPath")) { $ready = $true; break }
	if ($serverProcess -and $serverProcess.HasExited) {
		$startupError = Get-Content -LiteralPath (Join-Path $toolDir 'mysql-startup-error.log') -Raw -ErrorAction SilentlyContinue
		$startupOutput = Get-Content -LiteralPath (Join-Path $toolDir 'mysql-startup.log') -Raw -ErrorAction SilentlyContinue
		Remove-Item -LiteralPath $clientPath, $bootstrapPath -Force -ErrorAction SilentlyContinue
		throw "MySQL exited during startup (code $($serverProcess.ExitCode)). Startup output: $startupOutput $startupError"
	}
	Start-Sleep -Seconds 1
}
if (-not $ready) {
	$serverErrorPath = Join-Path $mysqlData 'mysql-error.log'
	$serverError = Get-Content -LiteralPath $serverErrorPath -Raw -ErrorAction SilentlyContinue
	$startupOutput = Get-Content -LiteralPath (Join-Path $toolDir 'mysql-startup.log') -Raw -ErrorAction SilentlyContinue
	$startupError = Get-Content -LiteralPath (Join-Path $toolDir 'mysql-startup-error.log') -Raw -ErrorAction SilentlyContinue
	$processState = if ($serverProcess) { "started process $($serverProcess.Id), exited=$($serverProcess.HasExited)" } else { 'no new server process was started' }
	Remove-Item -LiteralPath $clientPath, $bootstrapPath -Force -ErrorAction SilentlyContinue
	throw "MySQL did not accept the CCE app connection within 30 seconds ($processState). Last client response: $script:lastClientError. Data directory: $mysqlData. Server log: $serverErrorPath ($serverError). Startup output: $startupOutput $startupError"
}

Remove-Item -LiteralPath $bootstrapPath, $clientPath -Force -ErrorAction SilentlyContinue

Push-Location $projectRoot
try {
	$drizzleCli = Join-Path $projectRoot 'node_modules\.bin\drizzle-kit.CMD'
	$tsxCli = Join-Path $projectRoot 'node_modules\.bin\tsx.CMD'
	$portableNode = Join-Path $toolDir 'node-runtime\node-v24.22.1-win-x64'
	if (Test-Path -LiteralPath (Join-Path $portableNode 'node.exe')) { $env:PATH = "$portableNode;$env:PATH" }
	elseif (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Node.js is not installed or on PATH, and the local portable runtime is missing. Install Node.js 22.12 or newer, then rerun setup.' }
	if (-not (Test-Path -LiteralPath $drizzleCli) -or -not (Test-Path -LiteralPath $tsxCli)) {
		throw 'Project dependencies are missing. Install them with pnpm install, then rerun this setup script.'
	}
	& $drizzleCli migrate
	if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
	& $tsxCli scripts/import-research.ts
	if ($LASTEXITCODE -ne 0) { throw 'Draft scholarship import failed.' }
} finally { Pop-Location }

Write-Host 'Local MySQL is configured. CCE migrations are applied and researched listings are saved as unpublished drafts.'
