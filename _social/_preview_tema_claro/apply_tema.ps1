Add-Type -AssemblyName System.Drawing
$root = "C:\Users\Idecasio\Desktop\eLucre_Posts"
$soc  = Join-Path $root "_social"
$tmp  = Join-Path $soc "_preview_tema_claro\_tmp"
New-Item -ItemType Directory -Force $tmp | Out-Null
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$prof = Join-Path $env:TEMP 'elucre_chrome_prof'
$fontlink = '<meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">'
$U8 = New-Object System.Text.UTF8Encoding($false)
$jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

$kit   = [System.IO.File]::ReadAllText((Join-Path $soc "_kit.css"), $U8)
$claro = $kit.Substring($kit.IndexOf('/* ===== TEMA CLARO'))

function Render-Doc($doc, $w, $h, $jpgOut){
  $stem = [System.IO.Path]::GetFileNameWithoutExtension($jpgOut)
  $html = Join-Path $tmp ($stem + ".html")
  $png  = Join-Path $tmp ($stem + ".png")
  [System.IO.File]::WriteAllText($html,$doc,$U8)
  $url = ([System.Uri]$html).AbsoluteUri
  & $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size=$w,$h --virtual-time-budget=6000 --user-data-dir="$prof" --screenshot="$png" "$url" | Out-Null
  if (-not (Test-Path $png)) { Write-Output ("    ERRO PNG: " + $stem); return }
  $eps = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $eps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]92)
  $img = [System.Drawing.Image]::FromFile($png)
  $dim = "$($img.Width)x$($img.Height)"
  $img.Save($jpgOut,$jpgCodec,$eps); $img.Dispose()
  Write-Output ("    OK " + (Split-Path $jpgOut -Leaf) + "  $dim")
}

function Get-Slices($src, $isLegacy){
  $raw = [System.IO.File]::ReadAllText($src, $U8)
  if ($isLegacy){
    $style = [regex]::Match($raw,'(?s)<style>.*?</style>').Value
    $after = $raw.Substring($raw.IndexOf('</style>')+8)
    $parts = [regex]::Split($after,'<!--\s*=====\s*S\d+\s*=====\s*-->')
    $slices = @()
    for($i=1;$i -lt $parts.Count;$i++){
      $c = [regex]::Replace($parts[$i],'(?s)<div class="slabel">.*?</div>','').Trim()
      $c = $c -replace 'class="story"','class="story tema-claro"' -replace 'class="slide"','class="slide tema-claro"'
      $slices += ,$c
    }
    return @{ style=$style; slices=$slices }
  } else {
    $parts = [regex]::Split($raw,'<!--\s*=====\s*S\d+\s*=====\s*-->')
    $slices = @()
    for($i=1;$i -lt $parts.Count;$i++){
      $c = ($parts[$i].Trim()) -replace 'class="slide"','class="slide tema-claro"'
      $slices += ,$c
    }
    return @{ style=$null; slices=$slices }
  }
}

# monta o documento pronto pra render, conforme tipo/modo
function Build-Doc($kind,$mode,$style,$slice){
  $ov = ''
  if     ($kind -eq 'legacy-story' -and $mode -eq 'feed')  { $ov = '<style>.story{height:1350px!important}.in{padding:84px 80px!important}.swipeup{display:none!important}</style>' }
  elseif ($kind -eq 'legacy-story' -and $mode -eq 'story') { $ov = '' }  # nativo 1920, mantem swipeup
  elseif ($kind -eq 'legacy-slide' -and $mode -eq 'story') { $ov = '<style>.slide{height:1920px!important}.pnum,.swipe,.foot{display:none!important}</style>' }
  elseif ($kind -eq 'kit'          -and $mode -eq 'story') { $ov = '<style>.slide{height:1920px!important}.pnum,.swipe,.foot{display:none!important}</style>' }
  if ($style) { $css = $style + "`n<style>`n" + $claro + "`n</style>" } else { $css = "<style>`n" + $kit + "`n</style>" }
  return $fontlink + "`n" + $css + "`n" + $ov + "`n<body style=""margin:0;background:#EDEBFF"">`n" + $slice + "`n</body>"
}

$posts = @(
 @{ id='15'; src=(Join-Path $root 'eLucre_Stories_Sequencia3.html'); kind='legacy-story'; folder='stories - sequencia de 3';
    feed=@('seq3_1_gancho.jpg','seq3_2_valor.jpg','seq3_3_cta.jpg');
    story=@('story_1_gancho.jpg','story_2_valor.jpg','story_3_cta.jpg') },
 @{ id='16'; src=(Join-Path $root 'eLucre_Carrossel_Delivery.html'); kind='legacy-slide'; folder='delivery - cardapio';
    feed=@('delivery_1_capa.jpg','delivery_2_comissao.jpg','delivery_3_cardapio.jpg','delivery_4_pedido.jpg','delivery_5_cta.jpg');
    story=@('story_delivery_1_capa.jpg','story_delivery_2_comissao.jpg','story_delivery_3_cardapio.jpg','story_delivery_4_pedido.jpg','story_delivery_5_cta.jpg') },
 @{ id='17'; src=(Join-Path $soc 'src\p17.html'); kind='kit'; folder='demonstracao - 2 minutos';
    feed=@('feed_1.jpg','feed_2.jpg','feed_3.jpg','feed_4.jpg');
    story=@('story_1.jpg','story_2.jpg','story_3.jpg','story_4.jpg') },
 @{ id='23'; src=(Join-Path $soc 'src\p23.html'); kind='kit'; folder='produto - pedido no whatsapp';
    feed=@('feed_1.jpg'); story=@('story_1.jpg') },
 @{ id='24'; src=(Join-Path $soc 'src\p24.html'); kind='kit'; folder='celular - loja de celular';
    feed=@('feed_1.jpg','feed_2.jpg','feed_3.jpg','feed_4.jpg');
    story=@('story_1.jpg','story_2.jpg','story_3.jpg','story_4.jpg') },
 @{ id='25'; src=(Join-Path $soc 'src\p25.html'); kind='kit'; folder='prova - mais barato que internet';
    feed=@('feed_1.jpg'); story=@('story_1.jpg') }
)

foreach($p in $posts){
  Write-Output ("== dia " + $p.id + "  (" + $p.folder + ")  [" + $p.kind + "] ==")
  $isLegacy = $p.kind -like 'legacy*'
  $g = Get-Slices $p.src $isLegacy
  $n = $g.slices.Count
  if ($n -ne $p.feed.Count) { Write-Output ("    !! slices=$n mas feed=" + $p.feed.Count + " -- PULANDO por seguranca"); continue }
  $fdir = Join-Path $root $p.folder
  $sdir = Join-Path $fdir "Stories"
  Write-Output "  [feed 1080x1350]"
  for($i=0;$i -lt $n;$i++){
    $doc = Build-Doc $p.kind 'feed' $g.style $g.slices[$i]
    Render-Doc $doc 1080 1350 (Join-Path $fdir $p.feed[$i])
  }
  Write-Output "  [story 1080x1920]"
  for($i=0;$i -lt $n;$i++){
    $doc = Build-Doc $p.kind 'story' $g.style $g.slices[$i]
    Render-Doc $doc 1080 1920 (Join-Path $sdir $p.story[$i])
  }
}
Write-Output "FIM"