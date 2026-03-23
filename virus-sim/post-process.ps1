# KNOVERSEAI -- Post-Process: Downscale Action Camera
# Creates a 640x360 version of the action MP4 for smooth dashboard playback.
# Player video stays full 1080p. Action decode is the performance bottleneck.
#
# Output: session_<id>_action_sm.mp4 (same directory as originals)
# Dashboard auto-loads _action_sm.mp4 when available, falls back to _action.mp4.
#
# USAGE:
#   cd C:\Users\rcleg\Desktop\PathogenikaCapture
#   powershell -ExecutionPolicy Bypass -File post-process.ps1
#
# REQUIRES: ffmpeg in PATH (winget install ffmpeg)

param(
    [string]$SessionId = ""
)

$Root = Join-Path $env:USERPROFILE "Desktop\PathogenikaCapture"

if (-not (Test-Path $Root)) {
    Write-Host "ERROR: ${Root} does not exist." -ForegroundColor Red
    exit 1
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "ERROR: ffmpeg not found. Install with: winget install ffmpeg" -ForegroundColor Red
    exit 1
}

# Find latest session if no ID specified
if ($SessionId -eq "") {
    $LatestSync = Get-ChildItem -Path $Root -Filter "*_sync.json" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $LatestSync) {
        Write-Host "ERROR: No sync.json files found in ${Root}" -ForegroundColor Red
        exit 1
    }
    $SessionId = $LatestSync.Name -replace "_sync\.json$", "" -replace "^session_", ""
}

$ActionSrc = Join-Path $Root "session_${SessionId}_action.mp4"
$ActionOut = Join-Path $Root "session_${SessionId}_action_sm.mp4"

if (-not (Test-Path $ActionSrc)) {
    Write-Host "No action video found for session ${SessionId}" -ForegroundColor Yellow
    exit 0
}

$SrcSize = [math]::Round((Get-Item $ActionSrc).Length / 1MB, 1)
Write-Host "Action: ${SrcSize} MB (1920x1080) -> 640x360..." -ForegroundColor Cyan

$cmd = "ffmpeg -i `"${ActionSrc}`" -vf scale=640:360 -c:v libx264 -preset fast -crf 28 -an -movflags +faststart -y `"${ActionOut}`""
Invoke-Expression $cmd 2>&1 | Out-Null

if (Test-Path $ActionOut) {
    $OutSize = [math]::Round((Get-Item $ActionOut).Length / 1MB, 1)
    Write-Host "Done: ${OutSize} MB (saved ${SrcSize - $OutSize} MB)" -ForegroundColor Green
    Write-Host "Dashboard will auto-load the small version." -ForegroundColor DarkGray
} else {
    Write-Host "FAILED" -ForegroundColor Red
}
