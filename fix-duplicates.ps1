# Remove duplicate params destructuring

$routeFiles = Get-ChildItem -Path "C:\Users\YoelAG\KASA\app\api" -Filter "route.ts" -Recurse | Where-Object { $_.DirectoryName -match '\[.*\]' }

$fixedCount = 0

foreach ($file in $routeFiles) {
    try {
        $lines = Get-Content -LiteralPath $file.FullName
        $modified = $false
        $newLines = @()
        $seenDestructuring = @{}
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            # Check if this is a params destructuring line
            if ($line -match '^\s*const\s+\{\s*([^}]+)\s*\}\s*=\s*await\s+params') {
                $params = $matches[1]
                
                # Check if we've seen this exact destructuring in the current function
                $functionContext = ($newLines | Select-Object -Last 20) -join "`n"
                
                # If this exact destructuring already exists in recent lines, skip it
                $alreadyExists = $false
                for ($j = [Math]::Max(0, $newLines.Count - 30); $j -lt $newLines.Count; $j++) {
                    if ($newLines[$j] -match "const\s+\{\s*$([regex]::Escape($params))\s*\}\s*=\s*await\s+params") {
                        $alreadyExists = $true
                        Write-Host "  Removing duplicate: $line" -ForegroundColor Yellow
                        break
                    }
                }
                
                if (-not $alreadyExists) {
                    $newLines += $line
                } else {
                    $modified = $true
                    # Also remove the line before if it's just a comment about "Await params"
                    if ($newLines.Count -gt 0 -and $newLines[-1] -match '^\s*//.*Await params') {
                        $newLines = $newLines[0..($newLines.Count - 2)]
                    }
                }
            } else {
                $newLines += $line
            }
        }
        
        if ($modified) {
            Set-Content -LiteralPath $file.FullName -Value $newLines
            $fixedCount++
            Write-Host "Fixed duplicates in: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`nFixed $fixedCount files" -ForegroundColor Cyan
