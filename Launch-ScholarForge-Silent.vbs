Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run Launch-ScholarForge.bat hidden (0 = invisible)
WshShell.Run """" & ScriptDir & "\Launch-ScholarForge.bat""", 0, False
