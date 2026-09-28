Add-Type -AssemblyName System.Drawing
$root = "C:\Users\Idecasio\Desktop\eLucre_Posts"
$soc  = Join-Path $root "_social"
$out  = Join-Path $soc "_preview_tema_claro"
New-Item -ItemType Directory -Force $out | Out-Null
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$prof = Join-Path $env:TEMP 'elucre_chrome_prof'
$fontlink = '<meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">'
$U8 = New-Object System.Text.UTF8Encoding($false)

# override TEMA CLARO — fonte unica: extrai do _kit.css (bloco marcado)
$kit   = [System.IO.File]::ReadAllText((Join-Path $soc "_kit.css"), $U8)
$claro = $kit.Substring($kit.IndexOf('/* ===== TEMA CLARO'))

$jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Render-Doc($doc, $file){
  $html = [System.IO.Path]::ChangeExtension($file,'html')
  [System.IO.File]::WriteAllText($html,$doc,(New-Object System.Text.UTF8Encoding($false)))
  $png = [System.IO.Path]::ChangeExtension($file,'png')
  $url = ([System.Uri]$html).AbsoluteUri
  & $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1350 --virtual-time-budget=6000 --user-data-dir="$prof" --screenshot="$png" "$url" | Out-Null
  if (-not (Test-Path $png)) { Write-Output ("  ERRO: " + (Split-Path $file -Leaf)); return }
  $eps = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $eps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]92)
  $img = [System.Drawing.Image]::FromFile($png)
  $dim = "$($img.Width)x$($img.Height)"
  $img.Save($file,$jpgCodec,$eps); $img.Dispose()
  Write-Output ("  OK " + (Split-Path $file -Leaf) + "  $dim")
}

# posts legados (style proprio + <div class=page> com slabels)
function Process-Legacy($src, $prefix, $isStory){
  Write-Output ("== " + $prefix + " (" + (Split-Path $src -Leaf) + ") ==")
  $raw   = [System.IO.File]::ReadAllText($src, $U8)
  $style = [regex]::Match($raw,'(?s)<style>.*?</style>').Value
  $after = $raw.Substring($raw.IndexOf('</style>')+8)
  $parts = [regex]::Split($after,'<!--\s*=====\s*S\d+\s*=====\s*-->')
  $hover = ''
  if ($isStory) { $hover = '<style>.story{height:1350px!important}.in{padding:84px 80px!important}.swipeup{display:none!important}</style>' }
  for($i=1; $i -lt $parts.Count; $i++){
    $chunk = [regex]::Replace($parts[$i],'(?s)<div class="slabel">.*?</div>','').Trim()
    $chunk = $chunk -replace 'class="story"','class="story tema-claro"'
    $chunk = $chunk -replace 'class="slide"','class="slide tema-claro"'
    $doc = $fontlink + "`n" + $style + "`n<style>`n" + $claro + "`n</style>`n" + $hover + "`n<body style=""margin:0;background:#EDEBFF"">`n" + $chunk + "`n</body>"
    Render-Doc $doc (Join-Path $out ("{0}_{1}.jpg" -f $prefix,$i))
  }
}

# posts do kit (_kit.css + src/pNN.html, sem wrapper)
function Process-Kit($src, $prefix){
  Write-Output ("== " + $prefix + " (" + (Split-Path $src -Leaf) + ") ==")
  $raw   = [System.IO.File]::ReadAllText($src, $U8)
  $parts = [regex]::Split($raw,'<!--\s*=====\s*S\d+\s*=====\s*-->')
  for($i=1; $i -lt $parts.Count; $i++){
    $chunk = $parts[$i].Trim() -replace 'class="slide"','class="slide tema-claro"'
    $doc = $fontlink + "`n<style>`n" + $kit + "`n</style>`n<body style=""margin:0;background:#EDEBFF"">`n" + $chunk + "`n</body>"
    Render-Doc $doc (Join-Path $out ("{0}_{1}.jpg" -f $prefix,$i))
  }
}

Process-Legacy (Join-Path $root "eLucre_Stories_Sequencia3.html") "d15_seq3"    $true
Process-Legacy (Join-Path $root "eLucre_Carrossel_Delivery.html")  "d16_delivery" $false
Process-Kit    (Join-Path $soc  "src\p17.html")                    "d17_2min"
Write-Output "FIM"