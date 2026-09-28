# eLucre - Publicacao do dia (entregador diario para o Discord MC-monitor)
# Lido pelo Agendador de Tarefas as 09:00. Sem emoji literal (encoding-safe).
# Uso manual/preview de um dia: post_do_dia.ps1 -Date 2026-09-10
param([string]$Date)
$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfg  = Get-Content (Join-Path $base 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$webhook = $cfg.discord_webhook
$root = $cfg.posts_root

$today = if([string]::IsNullOrWhiteSpace($Date)){ Get-Date -Format 'yyyy-MM-dd' } else { $Date }
$mon   = $today.Substring(0,7)
$calPath = Join-Path $base ("calendario_$mon.json")
if(-not (Test-Path $calPath)){ Write-Host "sem calendario para $mon"; exit 0 }
$cal  = Get-Content $calPath -Raw -Encoding UTF8 | ConvertFrom-Json
$item = @($cal | Where-Object { $_.data -eq $today })[0]
if($null -eq $item){ Write-Host "sem publicacao para $today"; exit 0 }

# emojis via code point (independe do encoding do arquivo)
$e_mega = [System.Char]::ConvertFromUtf32(0x1F4E3)  # megafone
$e_cal  = [System.Char]::ConvertFromUtf32(0x1F5D3)  # calendario
$e_ok   = [System.Char]::ConvertFromUtf32(0x2705)   # check

function Send-DiscordPost {
  param([string]$Webhook,[string]$Content,[string[]]$Files)
  $boundary = 'eLucre' + [Guid]::NewGuid().ToString('N')
  $LF = "`r`n"
  $ms = New-Object System.IO.MemoryStream
  $enc = [System.Text.Encoding]::UTF8
  $w = { param($s) $b = $enc.GetBytes($s); $ms.Write($b,0,$b.Length) }
  $payload = @{ content = $Content } | ConvertTo-Json -Compress
  & $w "--$boundary$LF"
  & $w "Content-Disposition: form-data; name=`"payload_json`"$LF"
  & $w "Content-Type: application/json$LF$LF"
  & $w "$payload$LF"
  if($Files){
    for($i=0; $i -lt $Files.Count; $i++){
      $fp = $Files[$i]; $fn = [System.IO.Path]::GetFileName($fp)
      $bytes = [System.IO.File]::ReadAllBytes($fp)
      & $w "--$boundary$LF"
      & $w "Content-Disposition: form-data; name=`"files[$i]`"; filename=`"$fn`"$LF"
      & $w "Content-Type: image/jpeg$LF$LF"
      $ms.Write($bytes,0,$bytes.Length)
      & $w $LF
    }
  }
  & $w "--$boundary--$LF"
  $body = $ms.ToArray(); $ms.Dispose()
  Invoke-WebRequest -Uri $Webhook -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $body -UseBasicParsing | Out-Null
}

if($item.status -eq 'pronto'){
  $files = @()
  if($item.feed_glob){
    $glob = Join-Path $root ($item.feed_glob -replace '/','\')
    $files = @(Get-ChildItem -Path $glob -File -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -First 10 | ForEach-Object { $_.FullName })
  }
  $cap  = "$e_mega **Publicacao do dia - $($item.data)**`n"
  $cap += "**$($item.tema)**  |  _$($item.pilar)_  |  $($item.tipo)`n`n"
  $cap += "$($item.legenda)`n`n$($item.hashtags)`n`n"
  $cap += "$e_ok Aprovar, ou responder no Claude Code para refinar. (Story tambem gerado: $($item.story_glob))"
  if($files.Count -gt 0){ Send-DiscordPost -Webhook $webhook -Content $cap -Files $files }
  else { Send-DiscordPost -Webhook $webhook -Content $cap }
  Write-Host "postado ($($files.Count) imagens): $($item.tema)"
}
else {
  $cap  = "$e_cal **Publicacao de hoje ($($item.data)): $($item.tema)** - ainda NAO foi gerada.`n"
  $cap += "Pilar: $($item.pilar)  |  Nicho: $($item.nicho)`n"
  $cap += "Ideia: $($item.ideia)`n`n"
  $cap += "Abra o Claude Code e peca: 'Gera a publicacao de $($item.data)'."
  Send-DiscordPost -Webhook $webhook -Content $cap
  Write-Host "lembrete enviado (planejado): $($item.tema)"
}
