Add-Type -AssemblyName System.Drawing

function Create-RoundedImage($sourcePath, $targetPath, [int]$size, [int]$radius) {
    $src = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Create smooth rounded rectangle path
    $diameter = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc($size - $diameter, 0, $diameter, $diameter, 270, 90)
    $path.AddArc($size - $diameter, $size - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc(0, $size - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    
    # Clip and draw image
    $g.SetClip($path)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.ResetClip()
    
    # Draw a subtle inner/outer border highlight for premium depth
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), [Math]::Max(1, [int]($size / 256)))
    $g.DrawPath($pen, $path)
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose()
    $path.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Host "Generated rounded transparent image: $targetPath ($size x $size)"
}

$srcFile = "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\yexs_fullbleed_icon_1790918432705.jpg"

# 1. Main Play Store Icon (Default with rounded transparent corners)
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\playstore_assets\app_icon_512x512.png" 512 110
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\playstore_assets\app_icon_rounded_transparent_512x512.png" 512 110

# 2. Also save fullbleed square for Play Store in case Play Console validation rejects transparency
Copy-Item "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\yexs_fullbleed_icon_1790918432705.jpg" "d:\belajar\backend\presensi apps web\playstore_assets\app_icon_fullbleed_square_512x512.png" -Force

# 3. Frontend App & Web Assets (All rounded transparent)
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\frontend\assets\images\icon.png" 1024 220
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\frontend\assets\images\android-icon-foreground.png" 512 110
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\frontend\assets\images\splash-icon.png" 512 110
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\frontend\assets\images\favicon.png" 192 40
Create-RoundedImage $srcFile "d:\belajar\backend\presensi apps web\frontend\public\favicon.png" 192 40

# 4. Brain preview artifact
Create-RoundedImage $srcFile "C:\Users\OMEN\.gemini\antigravity-ide\brain\c94f5aa3-2f53-42c8-9b2d-f069486bebec\app_icon_512x512.png" 512 110

Write-Host "All assets successfully regenerated with rounded transparent corners!"
