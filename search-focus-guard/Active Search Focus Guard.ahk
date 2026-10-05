#Requires AutoHotkey v2.0
#SingleInstance Force

#HotIf WinActive("ahk_exe chrome.exe")
$^v::
{
    SendInput "^+e"
    Sleep 120
    SendInput "{Right}"
}
#HotIf
