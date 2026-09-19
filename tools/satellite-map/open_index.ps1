#!/usr/bin/env pwsh
# PowerShell wrapper to run the Python server and open index.html
param(
    [string]$File = "index.html",
    [int]$Port,
    [string]$Dir = $PSScriptRoot
)

$script = Join-Path $PSScriptRoot "serve_and_open.py"
$args = @()
$args += "-f"
$args += $File
if ($Port) { $args += "-p"; $args += $Port }
$args += "-d"
$args += $Dir

& python $script @args
