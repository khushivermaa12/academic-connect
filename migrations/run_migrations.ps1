\
Param(
    [string]$DbUser = "ac_user",
    [string]$DbName = "academic_connect",
    [string]$SchemaFile = "db\schema_postgres.sql"
)

Write-Output "Running migrations..."
# Assumes psql is in PATH and passwordless auth or PGPASSWORD env set by user.
# Example usage: $env:PGPASSWORD='ac_pass'; .\run_migrations.ps1 -DbUser ac_user -DbName academic_connect
$cmd = "psql -U $DbUser -d $DbName -f `"$SchemaFile`""
Write-Output "Executing: $cmd"
Invoke-Expression $cmd
if ($LASTEXITCODE -eq 0) { Write-Output "Migrations ran successfully." } else { Write-Error "Migrations failed with exit code $LASTEXITCODE" }
