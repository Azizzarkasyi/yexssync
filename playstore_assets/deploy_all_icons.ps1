Add-Type -AssemblyName System.Drawing

function Resize-Image($sourcePath, $targetPath, [int]$width, [int]$height) {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($img, 0, 0, $width, $height)
    
    # Ensure parent dir exists
    $parent = Split-Path -Parent $targetPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Generated: $targetPath ($width x $height)"
}

$iconSrc = "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\yexs_fullbleed_icon_1790918432705.jpg"
$featureSrc = "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\yexs_new_feature_graphic_1790835866846.jpg"

# 1. Play Store Assets
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\playstore_assets\app_icon_512x512.png" 512 512
Resize-Image $featureSrc "d:\belajar\backend\presensi apps web\playstore_assets\feature_graphic_1024x500.png" 1024 500

# 2. Frontend Assets
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\frontend\assets\images\icon.png" 1024 1024
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\frontend\assets\images\android-icon-foreground.png" 512 512
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\frontend\assets\images\splash-icon.png" 512 512
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\frontend\assets\images\favicon.png" 192 192
Resize-Image $iconSrc "d:\belajar\backend\presensi apps web\frontend\public\favicon.png" 192 192

# 3. Brain copies for artifact preview
Resize-Image $iconSrc "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\app_icon_512x512.png" 512 512
Resize-Image $featureSrc "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\feature_graphic_1024x500.png" 1024 500

Write-Host "All assets successfully resized and deployed!"
