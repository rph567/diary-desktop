param(
  [string]$TargetRoot = 'D:\76188\日记本'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceDirectory = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot 'release\win-unpacked'))
$expectedTargetRoot = [System.IO.Path]::GetFullPath('D:\76188\日记本')
$resolvedTargetRoot = [System.IO.Path]::GetFullPath($TargetRoot)
$applicationDirectory = [System.IO.Path]::GetFullPath((Join-Path $resolvedTargetRoot 'app'))
$dataDirectory = [System.IO.Path]::GetFullPath((Join-Path $resolvedTargetRoot 'data'))

if (-not [string]::Equals($resolvedTargetRoot, $expectedTargetRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "安装目录必须为 $expectedTargetRoot"
}

if (-not $applicationDirectory.StartsWith($resolvedTargetRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw '应用目录校验失败'
}

if (-not (Test-Path -LiteralPath $sourceDirectory)) {
  throw "未找到桌面构建产物：$sourceDirectory。请先运行 pnpm desktop:pack。"
}

New-Item -ItemType Directory -Path $resolvedTargetRoot -Force | Out-Null
New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null

if (Test-Path -LiteralPath $applicationDirectory) {
  Remove-Item -LiteralPath $applicationDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path $applicationDirectory -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDirectory '*') -Destination $applicationDirectory -Recurse -Force

$executable = Join-Path $applicationDirectory '日记本.exe'
if (-not (Test-Path -LiteralPath $executable)) {
  throw "安装完成后未找到程序：$executable"
}

$shell = New-Object -ComObject WScript.Shell
$desktopShortcut = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) '日记本.lnk'))
$desktopShortcut.TargetPath = $executable
$desktopShortcut.WorkingDirectory = $applicationDirectory
$desktopShortcut.IconLocation = $executable
$desktopShortcut.Save()

$startMenuDirectory = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\日记本'
New-Item -ItemType Directory -Path $startMenuDirectory -Force | Out-Null
$startMenuShortcut = $shell.CreateShortcut((Join-Path $startMenuDirectory '日记本.lnk'))
$startMenuShortcut.TargetPath = $executable
$startMenuShortcut.WorkingDirectory = $applicationDirectory
$startMenuShortcut.IconLocation = $executable
$startMenuShortcut.Save()

Write-Output "应用已安装到：$applicationDirectory"
Write-Output "数据目录：$dataDirectory"
Write-Output "快捷方式已创建。"