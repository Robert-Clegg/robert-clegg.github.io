# KNOVERSEAI -- Post-Process Capture Videos
# Downscales 3-camera MP4s to dashboard display sizes.
# Reduces ~64MB session to ~15MB for GitHub Pages hosting.
#
# USAGE:
#   cd C:\Users\rcleg\Desktop\PathogenikaCapture
#   powershell -ExecutionPolicy Bypass -File post-process.ps1
#
# Processes the LATEST session by default.
# Add session ID to process a specific one:
#   powershell -ExecutionPolicy Bypass -File post-process.ps1 -SessionId 20260323_094807a
#
# REQUIRES: ffmpeg in PATH
#   Install: winget install ffmpeg
#   Or: https://www.gyan.dev/ffmpeg/builds/

param(
    [string]$SessionId = ""
)

$Root = Join-Path $env:USERPROFILE "Desktop\PathogenikaCapture"
$OutDir = Join-Path $Root "web"

if (-not (Test-Path $Root)) {
    Write-Host "ERROR: ${Root} does not exist." -ForegroundColor Red
    exit 1
}

# Check ffmpeg
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "ERROR: ffmpeg not found. Install with: winget install ffmpeg" -ForegroundColor Red
    exit 1
}

# Find latest session if no ID specified
if ($SessionId -eq "") {
    $LatestSync = Get-ChildItem -Path $Root -Filter "*_sync.json" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $LatestSync) {
        Write-Host "ERROR: No sync.json files found in ${Root}" -ForegroundColor Red
        exit 1
    }
    $SessionId = $LatestSync.Name -replace "_sync\.json$", "" -replace "^session_", ""
}

Write-Host "Processing session: ${SessionId}" -ForegroundColor Cyan

# Create output directory
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

# Define source and target files
$PlayerSrc = Join-Path $Root "session_${SessionId}_player.mp4"
$OverviewSrc = Join-Path $Root "session_${SessionId}_overview.mp4"
$ActionSrc = Join-Path $Root "session_${SessionId}_action.mp4"
$SyncSrc = Join-Path $Root "session_${SessionId}_sync.json"

$PlayerOut = Join-Path $OutDir "session_${SessionId}_player.mp4"
$OverviewOut = Join-Path $OutDir "session_${SessionId}_overview.mp4"
$ActionOut = Join-Path $OutDir "session_${SessionId}_action.mp4"
$SyncOut = Join-Path $OutDir "session_${SessionId}_sync.json"

# Also find telemetry
$SyncContent = Get-Content $SyncSrc -Raw | ConvertFrom-Json
$TelemetryName = $SyncContent.telemetryFile
$TelemetrySrc = Join-Path $Root "telemetry" $TelemetryName
$TelemetryOut = Join-Path $OutDir $TelemetryName

# Encode settings -- CRF 28 is visually fine for dashboard-sized panels
$CommonArgs = "-c:v libx264 -preset fast -crf 28 -an -movflags +faststart -y"

# Player: 960x540 (displays at ~700px wide)
if (Test-Path $PlayerSrc) {
    $SrcSize = [math]::Round((Get-Item $PlayerSrc).Length / 1MB, 1)
    Write-Host "Player: ${SrcSize} MB -> 960x540..." -ForegroundColor White
    $cmd = "ffmpeg -i `"${PlayerSrc}`" -vf scale=960:540 ${CommonArgs} `"${PlayerOut}`""
    Invoke-Expression $cmd 2>&1 | Out-Null
    if (Test-Path $PlayerOut) {
        $OutSize = [math]::Round((Get-Item $PlayerOut).Length / 1MB, 1)
        Write-Host "  Done: ${OutSize} MB" -ForegroundColor Green
    } else {
        Write-Host "  FAILED" -ForegroundColor Red
    }
} else {
    # Fallback: single-camera session (no _player suffix)
    $FallbackSrc = Join-Path $Root "session_${SessionId}.mp4"
    if (Test-Path $FallbackSrc) {
        $SrcSize = [math]::Round((Get-Item $FallbackSrc).Length / 1MB, 1)
        Write-Host "Player (single-cam): ${SrcSize} MB -> 960x540..." -ForegroundColor White
        $cmd = "ffmpeg -i `"${FallbackSrc}`" -vf scale=960:540 ${CommonArgs} `"${PlayerOut}`""
        Invoke-Expression $cmd 2>&1 | Out-Null
        if (Test-Path $PlayerOut) {
            $OutSize = [math]::Round((Get-Item $PlayerOut).Length / 1MB, 1)
            Write-Host "  Done: ${OutSize} MB" -ForegroundColor Green
        }
    } else {
        Write-Host "Player: NOT FOUND" -ForegroundColor Yellow
    }
}

# Overview: 640x360 (displays at ~350px wide)
if (Test-Path $OverviewSrc) {
    $SrcSize = [math]::Round((Get-Item $OverviewSrc).Length / 1MB, 1)
    Write-Host "Overview: ${SrcSize} MB -> 640x360..." -ForegroundColor White
    $cmd = "ffmpeg -i `"${OverviewSrc}`" -vf scale=640:360 ${CommonArgs} `"${OverviewOut}`""
    Invoke-Expression $cmd 2>&1 | Out-Null
    if (Test-Path $OverviewOut) {
        $OutSize = [math]::Round((Get-Item $OverviewOut).Length / 1MB, 1)
        Write-Host "  Done: ${OutSize} MB" -ForegroundColor Green
    }
} else {
    Write-Host "Overview: NOT FOUND (single-camera session?)" -ForegroundColor Yellow
}

# Action: 640x360
if (Test-Path $ActionSrc) {
    $SrcSize = [math]::Round((Get-Item $ActionSrc).Length / 1MB, 1)
    Write-Host "Action: ${SrcSize} MB -> 640x360..." -ForegroundColor White
    $cmd = "ffmpeg -i `"${ActionSrc}`" -vf scale=640:360 ${CommonArgs} `"${ActionOut}`""
    Invoke-Expression $cmd 2>&1 | Out-Null
    if (Test-Path $ActionOut) {
        $OutSize = [math]::Round((Get-Item $ActionOut).Length / 1MB, 1)
        Write-Host "  Done: ${OutSize} MB" -ForegroundColor Green
    }
} else {
    Write-Host "Action: NOT FOUND (single-camera session?)" -ForegroundColor Yellow
}

# Copy sync.json and telemetry
if (Test-Path $SyncSrc) { Copy-Item $SyncSrc $SyncOut -Force }
if (Test-Path $TelemetrySrc) { Copy-Item $TelemetrySrc $TelemetryOut -Force }

# Summary
Write-Host "" -ForegroundColor White
Write-Host "=== POST-PROCESS COMPLETE ===" -ForegroundColor Cyan
$WebFiles = Get-ChildItem -Path $OutDir -File
$TotalMB = [math]::Round(($WebFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
Write-Host "Output: ${OutDir}" -ForegroundColor White
Write-Host "Files: $($WebFiles.Count)" -ForegroundColor White
Write-Host "Total: ${TotalMB} MB" -ForegroundColor Green
Write-Host ""
Write-Host "To host for judges, copy the web/ folder contents to:" -ForegroundColor DarkGray
Write-Host "  robert-clegg.github.io/virus-sim/videos/" -ForegroundColor DarkGray
