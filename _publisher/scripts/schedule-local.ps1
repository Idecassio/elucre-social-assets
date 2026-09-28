# schedule-local.ps1 — registra uma tarefa no Task Scheduler do Windows que roda
# run-due.mjs a cada 5 minutos (fase de TESTE; dispara só com o PC ligado).
# Em produção, o mesmo run-due.mjs é chamado por um cron na nuvem.
#
# Uso (PowerShell):
#   ./scripts/schedule-local.ps1                 # registra a tarefa
#   ./scripts/schedule-local.ps1 -Remove         # remove a tarefa
#
param(
  [string]$TaskName = "social-publisher-run-due",
  [int]$EveryMinutes = 5,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot           # raiz da skill
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "Node não encontrado no PATH. Instale o Node 18+ e tente de novo." }
$script = Join-Path $root "scripts\run-due.mjs"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tarefa '$TaskName' removida."
  return
}

$action  = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
             -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
             -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Settings $settings -Description "social-publisher: processa a fila de posts (teste local)" -Force | Out-Null

Write-Host "Tarefa '$TaskName' registrada: roda a cada $EveryMinutes min."
Write-Host "Node:   $node"
Write-Host "Script: $script"
Write-Host "Para remover: ./scripts/schedule-local.ps1 -Remove"
