param(
    [int]$pid
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WinAPI {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
"@

# Get the Main Window Handle
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
if (-not $proc) { Write-Host "Process not found"; exit }

$hwnd = $proc.MainWindowHandle
if ($hwnd -eq 0) { Write-Host "Process has no main window"; exit }

# Restore if minimized (SW_RESTORE = 9)
[WinAPI]::ShowWindowAsync($hwnd, 9)

# Bring to foreground
[WinAPI]::SetForegroundWindow($hwnd)
