# PATHOGENIKA CAPTURE SERVER
# Serves Desktop/PathogenikaCapture/ on http://localhost:8099
# with CORS headers so the dashboard can auto-load files.
#
# USAGE:
#   cd C:\Users\rcleg\Desktop\PathogenikaCapture
#   powershell -ExecutionPolicy Bypass -File capture-server.ps1

$Port = 8099
$Root = Join-Path $env:USERPROFILE "Desktop\PathogenikaCapture"

if (-not (Test-Path $Root)) {
    Write-Host "ERROR: $Root does not exist." -ForegroundColor Red
    exit 1
}

Write-Host "PATHOGENIKA CAPTURE SERVER" -ForegroundColor Cyan
Write-Host "http://localhost:${Port}" -ForegroundColor Cyan
Write-Host "Serving: $Root" -ForegroundColor DarkGray
Write-Host "Press Ctrl+C to stop" -ForegroundColor DarkGray

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:${Port}/")
$Listener.Start()
Write-Host "[OK] Listening on port ${Port}" -ForegroundColor Green

$MimeTypes = @{
    ".mp4"  = "video/mp4"
    ".json" = "application/json"
    ".txt"  = "text/plain"
    ".html" = "text/html"
}

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $Response.Headers.Add("Access-Control-Allow-Origin", "*")
        $Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($Request.HttpMethod -eq "OPTIONS") {
            $Response.StatusCode = 204
            $Response.Close()
            continue
        }

        $UrlPath = $Request.Url.LocalPath.TrimStart("/")

        if ($UrlPath -eq "" -or $UrlPath -eq "/") {
            # Exclude web/ subdirectory — those are compressed copies for hosting.
            # Dashboard should always load the full-resolution originals from root.
            $WebDir = Join-Path $Root "web"
            $AllFiles = Get-ChildItem -Path $Root -Recurse -File |
                Where-Object { -not $_.FullName.StartsWith($WebDir) } |
                ForEach-Object {
                $RelPath = $_.FullName.Substring($Root.Length + 1).Replace("\", "/")
                @{
                    name = $_.Name
                    path = $RelPath
                    size = $_.Length
                    modified = $_.LastWriteTimeUtc.ToString("o")
                }
            }
            $JsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($AllFiles | ConvertTo-Json -Depth 3))
            $Response.ContentType = "application/json"
            $Response.ContentLength64 = $JsonBytes.Length
            $Response.OutputStream.Write($JsonBytes, 0, $JsonBytes.Length)
            $Response.Close()
            $FileCount = @($AllFiles).Count
            Write-Host "[DIR] Listed ${FileCount} files" -ForegroundColor DarkGray
            continue
        }

        $FilePath = Join-Path $Root $UrlPath
        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }

            $FileInfo = Get-Item $FilePath
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $FileInfo.Length

            $FileStream = [System.IO.File]::OpenRead($FilePath)
            $Buffer = New-Object byte[] 65536
            while (($Read = $FileStream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {
                $Response.OutputStream.Write($Buffer, 0, $Read)
            }
            $FileStream.Close()
            $Response.Close()

            $SizeMB = [math]::Round($FileInfo.Length / 1MB, 1)
            Write-Host "[200] ${UrlPath} - ${SizeMB} MB" -ForegroundColor Green
        } else {
            $Response.StatusCode = 404
            $NotFoundMsg = "Not found: ${UrlPath}"
            $Body = [System.Text.Encoding]::UTF8.GetBytes($NotFoundMsg)
            $Response.OutputStream.Write($Body, 0, $Body.Length)
            $Response.Close()
            Write-Host "[404] ${UrlPath}" -ForegroundColor Yellow
        }
    }
} finally {
    $Listener.Stop()
    Write-Host "[STOPPED] Server shut down." -ForegroundColor Red
}
