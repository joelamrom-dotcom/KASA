# Fix all Next.js 15 async params in dynamic routes

$routeFiles = Get-ChildItem -Path "C:\Users\YoelAG\KASA\app\api" -Filter "route.ts" -Recurse | Where-Object { $_.DirectoryName -match '\[.*\]' }

$fixedCount = 0
$errors = @()

foreach ($file in $routeFiles) {
    try {
        $content = (Get-Content -LiteralPath $file.FullName) -join "`n"
        $originalContent = $content
        $modified = $false
        
        # Find all export async function (GET|POST|PUT|DELETE|PATCH)
        $functions = [regex]::Matches($content, 'export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]+\)')
        
        foreach ($match in $functions) {
            $functionStart = $match.Index
            $functionName = $match.Groups[1].Value
            
            # Find the params type definition in this function
            $paramMatch = [regex]::Match($content.Substring($functionStart), '\{ params \}: \{ params: Promise<(\{[^}]+\})> \}')
            
            if ($paramMatch.Success) {
                # Extract parameter names from the type definition
                $paramsType = $paramMatch.Groups[1].Value
                $paramNames = [regex]::Matches($paramsType, '(\w+):\s*string') | ForEach-Object { $_.Groups[1].Value }
                
                if ($paramNames.Count -gt 0) {
                    # Find the function body start (after the closing paren and opening brace)
                    $bodyStartMatch = [regex]::Match($content.Substring($functionStart), '\)\s*\{')
                    if ($bodyStartMatch.Success) {
                        $bodyStart = $functionStart + $bodyStartMatch.Index + $bodyStartMatch.Length
                        
                        # Look for "try {" followed by "await connectDB()"
                        $tryMatch = [regex]::Match($content.Substring($bodyStart, [Math]::Min(500, $content.Length - $bodyStart)), '(\s*try\s*\{\s*)(await connectDB\(\)[^\n]*\n)')
                        
                        if ($tryMatch.Success) {
                            $insertPos = $bodyStart + $tryMatch.Groups[1].Length + $tryMatch.Groups[2].Length
                            
                            # Check if params destructuring already exists
                            $checkExisting = $content.Substring($insertPos, [Math]::Min(100, $content.Length - $insertPos))
                            if ($checkExisting -notmatch 'const \{[^}]*\} = await params') {
                                # Create destructuring statement
                                $destructure = "    const { $($paramNames -join ', ') } = await params`n"
                                
                                # Insert the destructuring
                                $content = $content.Substring(0, $insertPos) + $destructure + $content.Substring($insertPos)
                                $modified = $true
                                
                                Write-Host "  Fixed $functionName in $($file.Name)" -ForegroundColor Green
                            }
                        }
                    }
                }
            }
        }
        
        if ($modified -and $content -ne $originalContent) {
            Set-Content -LiteralPath $file.FullName -Value $content -NoNewline
            $fixedCount++
            Write-Host "Fixed: $($file.FullName)" -ForegroundColor Cyan
        }
    }
    catch {
        $errors += "Error processing $($file.FullName): $_"
        Write-Host "Error: $($file.FullName) - $_" -ForegroundColor Red
    }
}

Write-Host "`nFixed $fixedCount files" -ForegroundColor Green
if ($errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Yellow
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}
