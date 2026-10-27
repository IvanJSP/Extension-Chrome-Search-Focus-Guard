#Requires AutoHotkey v2.0
#SingleInstance Force

; Evita que AHK altere el estado/LED de CapsLock
SetStoreCapsLockMode False

#HotIf WinActive("ahk_exe chrome.exe")
$^v::
{
    SendInput "^+e"
}
#HotIf
