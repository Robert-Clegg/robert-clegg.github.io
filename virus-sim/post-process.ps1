# KNOVERSEAI -- Post-Process Capture Videos
# Downscales 3-camera MP4s to dashboard display sizes.
# Reduces ~64MB session to ~15MB for GitHub Pages hosting.
#
# Shows FFmpeg progress, elapsed time, and validates output
# duration matches source duration.
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

# ── Helper: get video duration via ffprobe ──
function Get-VideoDuration {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return 0 }
    $probe = Get-Command ffprobe -ErrorAction SilentlyContinue
    if (-not $probe) { return 0 }
    try {
        $raw = & ffprobe -v quiet -show_entries format=duration -of csv=p=0 $FilePath 2>&1
        $val = [double]$raw
        return $val
    } catch { return 0 }
}

# ── Helper: compress one video with visible progress ──
function Compress-Video {
    param(
        [string]$Label,
        [string]$SrcPath,
        [string]$OutPath,
        [string]$Scale
    )
    if (-not (Test-Path $SrcPath)) {
        Write-Host "${Label}: NOT FOUND" -ForegroundColor Yellow
        return $false
    }

    $SrcSize = [math]::Round((Get-Item $SrcPath).Length / 1MB, 1)
    $SrcDur = Get-VideoDuration $SrcPath
    $DurStr = if ($SrcDur -gt 0) { [math]::Round($SrcDur, 1).ToString() + "s" } else { "??s" }
    Write-Host ""
    Write-Host "${Label}: ${SrcSize} MB, ${DurStr} -> ${Scale}" -ForegroundColor Cyan

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    # Run ffmpeg with -progress pipe:1 so we can see encoding progress.
    # FFmpeg writes progress lines to stdout; stderr has the banner/warnings.
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "ffmpeg"
    $psi.Arguments = "-i `"${SrcPath}`" -vf scale=${Scale} -c:v libx264 -preset fast -crf 28 -an -movflags +faststart -y -progress pipe:1 `"${OutPath}`""
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)

    # Read progress lines from stdout (out_time_ms shows encoding position)
    $lastPct = -1
    while (-not $proc.StandardOutput.EndOfStream) {
        $line = $proc.StandardOutput.ReadLine()
        if ($line -match "^out_time_ms=(\d+)") {
            $outMs = [long]$Matches[1]
            $outSec = [math]::Round($outMs / 1000000.0, 1)
            if ($SrcDur -gt 0) {
                $pct = [math]::Min(100, [math]::Round(($outSec / $SrcDur) * 100))
                if ($pct -ne $lastPct -and ($pct % 10 -eq 0 -or $pct -ge 95)) {
                    $elapsed = $sw.Elapsed.TotalSeconds
                    Write-Host "  ${pct}% (${outSec}s / ${DurStr}) [${elapsed:N0}s elapsed]" -ForegroundColor DarkGray
                    $lastPct = $pct
                }
            }
        }
    }
    # Consume stderr so process can exit
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    $sw.Stop()

    $elapsed = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    if ($proc.ExitCode -ne 0) {
        Write-Host "  FAILED (ffmpeg exit code $($proc.ExitCode)) [${elapsed}s]" -ForegroundColor Red
        if ($stderr) {
            $errLines = $stderr -split "`n" | Select-Object -Last 3
            foreach ($el in $errLines) { Write-Host "    $el" -ForegroundColor DarkRed }
        }
        return $false
    }

    if (-not (Test-Path $OutPath)) {
        Write-Host "  FAILED (no output file) [${elapsed}s]" -ForegroundColor Red
        return $false
    }

    $OutSize = [math]::Round((Get-Item $OutPath).Length / 1MB, 1)
    $OutDur = Get-VideoDuration $OutPath
    $OutDurStr = if ($OutDur -gt 0) { [math]::Round($OutDur, 1).ToString() + "s" } else { "??s" }
    $Reduction = if ($SrcSize -gt 0) { [math]::Round((1 - $OutSize / $SrcSize) * 100) } else { 0 }

    Write-Host "  DONE: ${OutSize} MB (${Reduction}% smaller), duration: ${OutDurStr} [${elapsed}s]" -ForegroundColor Green

    # Duration validation: warn if output is significantly shorter than source
    if ($SrcDur -gt 0 -and $OutDur -gt 0) {
        $drift = [math]::Abs($SrcDur - $OutDur)
        if ($drift -gt 2.0) {
            Write-Host "  WARNING: Duration mismatch! Source=${DurStr} Output=${OutDurStr} (drift ${drift:N1}s)" -ForegroundColor Red
            Write-Host "  The compressed file may be TRUNCATED. Dashboard will show incomplete video." -ForegroundColor Red
        }
    }

    return $true
}

# ── Find latest session if no ID specified ──
if ($SessionId -eq "") {
    # Only look at root-level sync files, NOT inside web/ subdirectory
    $LatestSync = Get-ChildItem -Path $Root -Filter "*_sync.json" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $LatestSync) {
        Write-Host "ERROR: No sync.json files found in ${Root}" -ForegroundColor Red
        exit 1
    }
    $SessionId = $LatestSync.Name -replace "_sync\.json$", "" -replace "^session_", ""
}

Write-Host "=== KNOVERSEAI POST-PROCESS ===" -ForegroundColor Cyan
Write-Host "Session: ${SessionId}" -ForegroundColor White
Write-Host "Output:  ${OutDir}" -ForegroundColor DarkGray

$totalSw = [System.Diagnostics.Stopwatch]::StartNew()

# Create output directory
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

# Define source files
$PlayerSrc = Join-Path $Root "session_${SessionId}_player.mp4"
$OverviewSrc = Join-Path $Root "session_${SessionId}_overview.mp4"
$ActionSrc = Join-Path $Root "session_${SessionId}_action.mp4"
$SyncSrc = Join-Path $Root "session_${SessionId}_sync.json"

$PlayerOut = Join-Path $OutDir "session_${SessionId}_player.mp4"
$OverviewOut = Join-Path $OutDir "session_${SessionId}_overview.mp4"
$ActionOut = Join-Path $OutDir "session_${SessionId}_action.mp4"
$SyncOut = Join-Path $OutDir "session_${SessionId}_sync.json"

# Telemetry
$SyncContent = Get-Content $SyncSrc -Raw | ConvertFrom-Json
$TelemetryName = $SyncContent.telemetryFile
$TelemetrySrc = Join-Path $Root "telemetry" $TelemetryName
$TelemetryOut = Join-Path $OutDir $TelemetryName

# ── Compress all 3 cameras ──
$playerOk = $false
if (Test-Path $PlayerSrc) {
    $playerOk = Compress-Video -Label "PLAYER" -SrcPath $PlayerSrc -OutPath $PlayerOut -Scale "960:540"
} else {
    # Fallback: single-camera session (no _player suffix)
    $FallbackSrc = Join-Path $Root "session_${SessionId}.mp4"
    if (Test-Path $FallbackSrc) {
        $playerOk = Compress-Video -Label "PLAYER (single-cam)" -SrcPath $FallbackSrc -OutPath $PlayerOut -Scale "960:540"
    } else {
        Write-Host "PLAYER: NOT FOUND" -ForegroundColor Yellow
    }
}

$overviewOk = Compress-Video -Label "OVERVIEW" -SrcPath $OverviewSrc -OutPath $OverviewOut -Scale "640:360"
$actionOk = Compress-Video -Label "ACTION" -SrcPath $ActionSrc -OutPath $ActionOut -Scale "640:360"

# Copy sync.json and telemetry
if (Test-Path $SyncSrc) { Copy-Item $SyncSrc $SyncOut -Force }
if (Test-Path $TelemetrySrc) { Copy-Item $TelemetrySrc $TelemetryOut -Force }

$totalSw.Stop()
$totalElapsed = [math]::Round($totalSw.Elapsed.TotalSeconds, 1)

# Summary
Write-Host ""
Write-Host "=== POST-PROCESS COMPLETE === [${totalElapsed}s total]" -ForegroundColor Cyan
$WebFiles = Get-ChildItem -Path $OutDir -File
$TotalMB = [math]::Round(($WebFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
Write-Host "Output: ${OutDir}" -ForegroundColor White
Write-Host "Files: $($WebFiles.Count)" -ForegroundColor White
Write-Host "Total: ${TotalMB} MB" -ForegroundColor Green

# Status summary
$statuses = @()
if ($playerOk) { $statuses += "Player OK" } else { $statuses += "Player FAIL" }
if ($overviewOk) { $statuses += "Overview OK" } else { $statuses += "Overview FAIL" }
if ($actionOk) { $statuses += "Action OK" } else { $statuses += "Action FAIL" }
$statusLine = $statuses -join " | "
$allOk = $playerOk -and $overviewOk -and $actionOk
$statusColor = if ($allOk) { "Green" } else { "Yellow" }
Write-Host $statusLine -ForegroundColor $statusColor
Write-Host ""
Write-Host "To host for judges, copy the web/ folder contents to:" -ForegroundColor DarkGray
Write-Host "  robert-clegg.github.io/virus-sim/videos/" -ForegroundColor DarkGray
