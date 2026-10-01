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
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Generated: $targetPath ($width x $height)"
}

$dir = "d:\belajar\backend\presensi apps web\playstore_assets"
Resize-Image "$dir\yexssync_app_icon_1790833829443.jpg" "$dir\app_icon_512x512.png" 512 512
Resize-Image "$dir\yexssync_feature_graphic_1790834043779.jpg" "$dir\feature_graphic_1024x500.png" 1024 500
