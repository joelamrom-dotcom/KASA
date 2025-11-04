$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\AI SaaS Server.lnk")
$Shortcut.TargetPath = "C:\Users\YoelAG\my-sfdx-project\ai-saas-platform\start-server.bat"
$Shortcut.WorkingDirectory = "C:\Users\YoelAG\my-sfdx-project\ai-saas-platform"
$Shortcut.IconLocation = "C:\Windows\System32\SHELL32.dll,13"
$Shortcut.Description = "Start AI SaaS Platform Server"
$Shortcut.Save()
Write-Host "Shortcut created on Desktop! Pin it to taskbar by right-clicking it."
