Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\YoelAG\my-sfdx-project\ai-saas-platform"
WshShell.Run "cmd /c set PATH=%PATH%;C:\Program Files\nodejs && npm run dev", 0, False
Set WshShell = Nothing
