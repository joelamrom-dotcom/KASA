# Fix all Next.js 15 async params issues

$routeFiles = Get-ChildItem -Path "C:\Users\YoelAG\KASA\app\api" -Filter "route.ts" -Recurse | Where-Object { $_.DirectoryName -match '\[.*\]' }

$fixedCount = 0
$errors = @()

foreach ($file in $routeFiles) {
    try {
        $content = (Get-Content -LiteralPath $file.FullName) -join "`n"
        $originalContent = $content
        $modified = $false
        
        # Pattern 1: Find function signatures with non-Promise params
        # Match: { params }: { params: { id: string } }
        # or: { params }: { params: { id: string; memberId: string } }
        if ($content -match '\{ params \}: \{ params: \{[^}]+\} \}') {
            # Extract the params type definition
            if ($content -match '\{ params \}: \{ params: (\{[^}]+\}) \}') {
                $paramsType = $matches[1]
                # Replace with Promise wrapper
                $content = $content -replace '\{ params \}: \{ params: ' + [regex]::Escape($paramsType) + ' \}', "{ params }: { params: Promise<$paramsType> }"
                $modified = $true
            }
        }
        
        # Pattern 2: Find usages of params.id, params.memberId, etc. without await
        # Look for functions that use params but don't have "const { ... } = await params"
        if ($content -match 'params\.(id|memberId|entityType|entityId|eventId|noteId|relationshipId|linkId)' -and 
            $content -notmatch 'const \{[^}]+\} = await params') {
            
            # Find which params are being used
            $paramNames = @()
            if ($content -match 'params\.id\b') { $paramNames += 'id' }
            if ($content -match 'params\.memberId\b') { $paramNames += 'memberId' }
            if ($content -match 'params\.entityType\b') { $paramNames += 'entityType' }
            if ($content -match 'params\.entityId\b') { $paramNames += 'entityId' }
            if ($content -match 'params\.eventId\b') { $paramNames += 'eventId' }
            if ($content -match 'params\.noteId\b') { $paramNames += 'noteId' }
            if ($content -match 'params\.relationshipId\b') { $paramNames += 'relationshipId' }
            if ($content -match 'params\.linkId\b') { $paramNames += 'linkId' }
            
            if ($paramNames.Count -gt 0) {
                $destructure = "const { " + ($paramNames -join ', ') + " } = await params"
                
                # Find the first occurrence of await connectDB() or similar to insert after it
                if ($content -match '(await connectDB\(\)[^\n]*\n)') {
                    $insertPoint = $matches[1]
                    $content = $content -replace [regex]::Escape($insertPoint), "$insertPoint    $destructure`n"
                    
                    # Now replace all params.id with just id, etc.
                    foreach ($param in $paramNames) {
                        $content = $content -replace "params\.$param\b", $param
                    }
                    
                    $modified = $true
                }
            }
        }
        
        if ($modified -and $content -ne $originalContent) {
            Set-Content -LiteralPath $file.FullName -Value $content -NoNewline
            $fixedCount++
            Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        $errors += "Error processing $($file.FullName): $_"
        Write-Host "Error: $($file.FullName) - $_" -ForegroundColor Red
    }
}

Write-Host "`nFixed $fixedCount files" -ForegroundColor Cyan
if ($errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Yellow
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}
