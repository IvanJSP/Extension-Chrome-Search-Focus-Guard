#Requires AutoHotkey v2.0
#SingleInstance Force

; Evita que AHK altere el estado/LED de CapsLock
SetStoreCapsLockMode False

#HotIf WinActive("ahk_exe chrome.exe")
$^v::
{
    SendInput "^+e"
    Sleep 100
    SendInput "{Right}"
}

$^w::
{
    SendInput "^w"
}

$^+w::
{
    answer := MsgBox("¿Cerrar esta ventana de Chrome y todas sus pestañas?", "Confirmar cierre", "YesNo 0x1000 0x10000")
    if (answer = "Yes") {
        SendInput "^+w"
    }
}
#HotIf
