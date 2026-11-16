param(
	[Parameter(Mandatory = $true)][ValidateNotNullOrEmpty()][string]$Email,
	[ValidateNotNullOrEmpty()][string]$Name = 'CCE Administrator'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $projectRoot 'tools\node-runtime\node-v24.22.1-win-x64'
$tsxCli = Join-Path $projectRoot 'node_modules\.bin\tsx.CMD'
if (-not (Test-Path -LiteralPath (Join-Path $nodeDir 'node.exe'))) { throw 'The portable Node.js runtime is missing. Run the MySQL setup script first.' }
if (-not (Test-Path -LiteralPath $tsxCli)) { throw 'Project dependencies are missing. Install them, then retry.' }

$originalPassword = $env:ADMIN_INITIAL_PASSWORD
$first = Read-Host 'Enter a unique admin password (minimum 14 characters)' -AsSecureString
$confirm = Read-Host 'Confirm admin password' -AsSecureString
$firstBstr = [IntPtr]::Zero
$confirmBstr = [IntPtr]::Zero
$password = $null
try {
	$firstBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
	$confirmBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm)
	$password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstBstr)
	$confirmation = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmBstr)
	if ($password.Length -lt 14) { throw 'The password must be at least 14 characters long.' }
	if ($password -cne $confirmation) { throw 'The passwords do not match.' }
	$env:ADMIN_INITIAL_PASSWORD = $password
	$env:PATH = "$nodeDir;$env:PATH"
	Push-Location $projectRoot
	try {
		& $tsxCli scripts/create-admin.ts $Email $Name
		if ($LASTEXITCODE -ne 0) { throw 'Administrator creation failed. Confirm the email is unused and MySQL is running.' }
	} finally { Pop-Location }
} finally {
	if ($null -eq $originalPassword) { Remove-Item Env:ADMIN_INITIAL_PASSWORD -ErrorAction SilentlyContinue }
	else { $env:ADMIN_INITIAL_PASSWORD = $originalPassword }
	$password = $null
	$confirmation = $null
	if ($firstBstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstBstr) }
	if ($confirmBstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmBstr) }
	$first.Dispose()
	$confirm.Dispose()
}
