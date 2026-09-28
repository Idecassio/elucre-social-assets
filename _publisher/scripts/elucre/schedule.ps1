# schedule.ps1 (fusão eLucre) — registra as 3 tarefas do Windows que deixam a operação ativa:
#   1) eLucre-Publisher-Daily     09:00 todo dia   -> daily.mjs   (prévia no Discord + enfileira c/ janela de veto)
#   2) eLucre-Publisher-RunDue    a cada 15 min    -> run-due.mjs (publica feed+story no horário, se não vetado)
#   3) eLucre-Publisher-Skeleton  dia 1 09:05      -> skeleton.mjs (cria o esqueleto do calendário do mês)
# Também DESABILITA a tarefa antiga "eLucre Social - Publicacao do dia" (post_do_dia.ps1),
# que seria redundante com a daily.mjs.
#
# Uso (PowerShell):
#   ./scripts/elucre/schedule.ps1            # registra/ativa
#   ./scripts/elucre/schedule.ps1 -Remove    # remove as 3 tarefas
param([switch]$Remove)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # ...\_publisher
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "Node não encontrado no PATH. Reabra o terminal após instalar o Node." }

$daily    = Join-Path $root "scripts\elucre\daily.mjs"
$rundue   = Join-Path $root "scripts\run-due.mjs"
$skeleton = Join-Path $root "scripts\elucre\skeleton.mjs"

$T1 = "eLucre-Publisher-Daily"
$T2 = "eLucre-Publisher-RunDue"
$T3 = "eLucre-Publisher-Skeleton"

if ($Remove) {
  foreach ($t in @($T1,$T2,$T3)) { Unregister-ScheduledTask -TaskName $t -Confirm:$false -ErrorAction SilentlyContinue }
  Write-Host "Tarefas removidas: $T1, $T2, $T3"
  return
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# 1) Daily 09:00
$a1 = New-ScheduledTaskAction -Execute $node -Argument "`"$daily`"" -WorkingDirectory $root
$g1 = New-ScheduledTaskTrigger -Daily -At 9:00am
Register-ScheduledTask -TaskName $T1 -Action $a1 -Trigger $g1 -Settings $settings -Force `
  -Description "eLucre: prévia no Discord + enfileira o post do dia (janela de veto)" | Out-Null

# 2) RunDue a cada 15 min
$a2 = New-ScheduledTaskAction -Execute $node -Argument "`"$rundue`"" -WorkingDirectory $root
$g2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName $T2 -Action $a2 -Trigger $g2 -Settings $settings -Force `
  -Description "eLucre: publica feed+story dos itens vencidos (não vetados)" | Out-Null

# 3) Skeleton — roda diário 08:55; o skeleton.mjs só CRIA se o calendário do mês ainda não existir
#    (então na prática cria no 1º dia útil do mês e faz no-op nos demais dias). Register-ScheduledTask
#    lida com o espaço em "Program Files" (o schtasks não).
$a3 = New-ScheduledTaskAction -Execute $node -Argument "`"$skeleton`"" -WorkingDirectory $root
$g3 = New-ScheduledTaskTrigger -Daily -At 8:55am
Register-ScheduledTask -TaskName $T3 -Action $a3 -Trigger $g3 -Settings $settings -Force `
  -Description "eLucre: cria o esqueleto do calendário do mês no dia 1 (roda diário; no-op se já existir)" | Out-Null

# Desabilita a tarefa antiga (evita prévia dupla)
Disable-ScheduledTask -TaskName "eLucre Social - Publicacao do dia" -ErrorAction SilentlyContinue | Out-Null

Write-Host "Ativado:"
Write-Host "  $T1  -> 09:00 diario   (daily.mjs)"
Write-Host "  $T2  -> a cada 15 min  (run-due.mjs)"
Write-Host "  $T3  -> diario 08:55  (skeleton.mjs; cria so no 1o dia do mes)"
Write-Host "Node:   $node"
Write-Host "Antiga 'eLucre Social - Publicacao do dia' foi DESABILITADA (redundante)."
Write-Host "Para remover tudo: ./scripts/elucre/schedule.ps1 -Remove"
