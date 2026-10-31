<#
.SYNOPSIS
  Mesure C-O02 / C-O03 sur Windows natif (protocole O2-B, Sprint 24).

.DESCRIPTION
  Ce script ne modifie pas le depot : il installe, construit, mesure et ecrit
  un rapport. Ecrit pour PowerShell 5.1 (Windows 11 natif), sans dependance.

  Trois regles apprises de la premiere execution (31/10/2026, 5 PASS / 7 FAIL
  / 1 BLOCKED), qui etaient autant de defauts de ce script :

  1. L'installation passe AVANT l'inspection des dependances. La version
     precedente inspectait `npm ls` sur un depot non installe : ELSPROBLEMS
     etait garanti et ne mesurait rien.
  2. Un echec affiche la FIN de la sortie, jamais le debut. La version
     precedente tronquait a 400 caracteres : elle affichait un avertissement
     de depreciation et masquait l'erreur reelle.
  3. Un echec de precondition rend les etapes suivantes BLOCKED, pas FAIL.
     Sans installation, « tsc introuvable » n'est pas un defaut du projet.
     Et une etape sans objet est BLOCKED, jamais PASS : « 0 base analysee »
     n'est pas une ACL verifiee.

  Chaque etape rend un verdict explicite :
    PASS      l'etape a reussi et sa preuve est consignee ;
    FAIL      l'etape a echoue pour sa propre raison ;
    BLOCKED   une precondition manque (installation, build, compte, cible) ;
    INFO      constat consigne, jamais compte comme succes.

.PARAMETER DataDir
  Repertoire de donnees a utiliser. Defaut : un sous-repertoire temporaire.

.PARAMETER SkipInstall
  Ne pas executer `npm ci` (utile si les dependances sont deja installees).

.PARAMETER OutputDir
  Repertoire du rapport JSON. Defaut : la racine du depot.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1
#>

[CmdletBinding()]
param(
  [string] $DataDir = (Join-Path $env:TEMP ("ekts-windows-check-" + (Get-Date -Format "yyyyMMdd-HHmmss"))),
  [string] $OutputDir = '',
  [switch] $SkipInstall
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if ([string]::IsNullOrWhiteSpace($OutputDir)) { $OutputDir = $root }

$results = New-Object System.Collections.ArrayList
$facts = [ordered]@{}

# Preconditions observees, pas supposees.
$script:installOk = $false
$script:buildOk = $false

function Add-Result {
  param([string] $Step, [string] $Verdict, [string] $Evidence)

  $null = $results.Add([pscustomobject]@{
    etape   = $Step
    verdict = $Verdict
    preuve  = $Evidence
  })

  Write-Host ("[{0}] {1} - {2}" -f $Verdict, $Step, $Evidence)
}

# Execute une commande native et restitue code + FIN de sortie.
function Invoke-Native {
  param([string] $File, [string[]] $Arguments)

  $sortie = (& $File @Arguments 2>&1 | Out-String)
  $code = $LASTEXITCODE
  $lignes = $sortie -split "`r?`n" | Where-Object { $_ -ne '' }
  $queue = ($lignes | Select-Object -Last 25) -join "`n"

  return [pscustomobject]@{ code = $code; tail = $queue; all = $sortie }
}

# Etape bloquee par une precondition non satisfaite.
function Add-Blocked {
  param([string] $Step, [string] $Reason)

  Add-Result -Step $Step -Verdict 'BLOCKED' -Evidence $Reason
}

function Invoke-Step {
  param([string] $Step, [scriptblock] $Action)

  try {
    $evidence = & $Action
    Add-Result -Step $Step -Verdict 'PASS' -Evidence $evidence
    return $true
  }
  catch {
    Add-Result -Step $Step -Verdict 'FAIL' -Evidence $_.Exception.Message
    return $false
  }
}

# 1. Systeme
if (-not (Invoke-Step 'systeme' {
      $os = Get-CimInstance Win32_OperatingSystem
      $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
      $build = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'

      $facts['edition'] = $os.Caption
      $facts['version'] = $os.Version
      $facts['build'] = $build.CurrentBuildNumber
      $facts['architecture'] = $os.OSArchitecture
      $facts['cpu'] = $cpu.Name
      $facts['memoireGo'] = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)

      "$($os.Caption) build $($build.CurrentBuildNumber) / $($os.OSArchitecture) / $($cpu.Name)"
    })) { }

# 2. Outils
if (-not (Invoke-Step 'outils' {
      $facts['node'] = (& node --version)
      $facts['npm'] = (& npm --version)
      $facts['commit'] = (& git rev-parse --short HEAD)

      "node $($facts['node']) / npm $($facts['npm']) / commit $($facts['commit'])"
    })) { }

# 3. Installation (AVANT toute inspection de dependances)
if ($SkipInstall) {
  $script:installOk = Test-Path (Join-Path $root 'node_modules')
  Add-Result -Step 'npm-ci' -Verdict 'SKIPPED' -Evidence "installation sautee (-SkipInstall) ; node_modules present : $($script:installOk)"
} else {
  $install = Invoke-Native -File 'npm.cmd' -Arguments @('ci')
  $facts['npmCi'] = $install.tail

  if ($install.code -eq 0) {
    $script:installOk = $true
    Add-Result -Step 'npm-ci' -Verdict 'PASS' -Evidence 'npm ci reussi (code 0)'
  } else {
    Add-Result -Step 'npm-ci' -Verdict 'FAIL' -Evidence "code $($install.code). Fin de sortie :`n$($install.tail)"
  }
}

# 4. Dependances natives (apres installation, sinon la mesure est vide)
if (-not $script:installOk) {
  Add-Blocked -Step 'dependances-natives' -Reason 'npm ci non reussi : la mesure porterait sur un depot non installe'
} else {
  $ls = Invoke-Native -File 'npm.cmd' -Arguments @('ls', 'better-sqlite3', 'sqlite-vec', '--depth=0')
  $facts['dependancesNatives'] = $ls.tail

  if ($ls.code -eq 0) {
    Add-Result -Step 'dependances-natives' -Verdict 'PASS' -Evidence (($ls.tail -split "`n" | Select-Object -Last 4) -join ' ; ')
  } else {
    Add-Result -Step 'dependances-natives' -Verdict 'FAIL' -Evidence "code $($ls.code). Fin de sortie :`n$($ls.tail)"
  }
}

# 5. Build
if (-not $script:installOk) {
  Add-Blocked -Step 'build' -Reason 'npm ci non reussi : tsc serait absent, ce qui ne dirait rien du projet'
} else {
  $chrono = [System.Diagnostics.Stopwatch]::StartNew()
  $build = Invoke-Native -File 'npm.cmd' -Arguments @('run', 'build')
  $chrono.Stop()
  $facts['build'] = $build.tail

  $cli = Join-Path $root 'dist\cli\index.js'
  $mcp = Join-Path $root 'dist\mcp\server.js'

  if ($build.code -eq 0 -and (Test-Path $cli) -and (Test-Path $mcp)) {
    $script:buildOk = $true
    Add-Result -Step 'build' -Verdict 'PASS' -Evidence ("code 0, dist/cli et dist/mcp presents, $([math]::Round($chrono.Elapsed.TotalSeconds,1)) s")
  } elseif ($build.code -eq 0) {
    Add-Result -Step 'build' -Verdict 'FAIL' -Evidence 'code 0 mais dist/cli/index.js ou dist/mcp/server.js absent'
  } else {
    Add-Result -Step 'build' -Verdict 'FAIL' -Evidence "code $($build.code). Fin de sortie :`n$($build.tail)"
  }
}

# 6. Diagnostic projet — constat, jamais compte comme succes
$doctor = Invoke-Native -File 'npm.cmd' -Arguments @('run', 'doctor')
$facts['doctor'] = $doctor.tail
Add-Result -Step 'doctor' -Verdict 'INFO' -Evidence "code $($doctor.code) — constat consigne, non compte comme preuve"

# 7 a 10. Fonctionnement sur base temporaire
$env:EKTS_DATA_DIR = $DataDir

if (-not $script:buildOk) {
  foreach ($etape in @('init-base', 'accents-utf8', 'recherche', 'redemarrage')) {
    Add-Blocked -Step $etape -Reason 'build non reussi : dist absent, toute execution serait une erreur d import'
  }
} else {
  if (-not (Invoke-Step 'init-base' {
        if (Test-Path $DataDir) { Remove-Item -Recurse -Force $DataDir }
        New-Item -ItemType Directory -Path $DataDir | Out-Null
        $init = Invoke-Native -File 'node' -Arguments @('dist/cli/index.js', 'init')

        if ($init.code -ne 0) { throw "code $($init.code). Fin de sortie :`n$($init.tail)" }
        "base initialisee dans $DataDir"
      })) { }

  $titre = 'Reseau - accents e a u c : éàüç'
  $contenu = 'Phrase accentuée : où sont les données élégantes ?'

  if (-not (Invoke-Step 'accents-utf8' {
        $add = Invoke-Native -File 'node' -Arguments @('dist/cli/index.js', 'add', '--type', 'other', '--title', $titre, '--content', $contenu, '--json')

        if ($add.code -ne 0) { throw "code $($add.code). Fin de sortie :`n$($add.tail)" }
        $facts['ajout'] = $add.tail
        'ressource accentuee ajoutee'
      })) { }

  if (-not (Invoke-Step 'recherche' {
        $search = Invoke-Native -File 'node' -Arguments @('dist/cli/index.js', 'search', 'accentuee', '-m', 'fts', '--json')

        if ($search.code -ne 0) { throw "code $($search.code). Fin de sortie :`n$($search.tail)" }
        if ($search.all -notmatch 'accentu') { throw 'le resultat ne contient pas le texte accentue attendu' }
        $facts['recherche'] = $search.tail
        'recherche FTS retrouve la ressource accentuee'
      })) { }

  if (-not (Invoke-Step 'redemarrage' {
        $again = Invoke-Native -File 'node' -Arguments @('dist/cli/index.js', 'search', 'accentuee', '-m', 'fts', '--json')

        if ($again.code -ne 0) { throw "code $($again.code) dans un nouveau processus" }
        if ($again.all -notmatch 'accents') { throw 'la ressource n a pas survecu au redemarrage' }
        'persistance confirmee dans un nouveau processus'
      })) { }
}

# 11. ACL — mesure seulement si des bases existent
$bases = @()
if (Test-Path $DataDir) {
  $bases = @(Get-ChildItem -Path $DataDir -Filter '*.db' -File)
}

if ($bases.Count -eq 0) {
  Add-Blocked -Step 'acl' -Reason 'aucune base presente : « 0 base » n est pas une ACL verifiee'
} else {
  $facts['acl'] = (& icacls $DataDir 2>&1 | Out-String).Trim()

  foreach ($base in $bases) {
    $facts["acl-$($base.Name)"] = (& icacls $base.FullName 2>&1 | Out-String).Trim()
  }

  Add-Result -Step 'acl' -Verdict 'PASS' -Evidence "$($bases.Count) bases ; ACL consignees — le refus effectif exige un second compte"
}

# 12. Refus effectif : impossible sans compte non autorise
Add-Blocked -Step 'acl-acces-refuse' -Reason 'exige un second compte Windows non autorise, non fourni par ce script'

# 13. Latence — PASS seulement si le protocole conclut CONFORME
if (-not $script:buildOk) {
  Add-Blocked -Step 'latence' -Reason 'build non reussi : le protocole C-O07 exige dist/mcp/server.js'
} else {
  $lat = Invoke-Native -File 'npm.cmd' -Arguments @('run', 'bench:latency')
  $facts['latence'] = $lat.all.Trim()

  $verdictLatence = ''
  if ($lat.all -match 'CONFORME') {
    if ($lat.all -match 'NON CONFORME') { $verdictLatence = 'NON CONFORME' } else { $verdictLatence = 'CONFORME' }
  }

  if ($lat.code -eq 0 -and $verdictLatence -eq 'CONFORME') {
    Add-Result -Step 'latence' -Verdict 'PASS' -Evidence 'protocole C-O07 : verdict CONFORME consigne'
  } elseif ($verdictLatence -eq 'NON CONFORME') {
    Add-Result -Step 'latence' -Verdict 'FAIL' -Evidence "seuil depasse. Fin de sortie :`n$($lat.tail)"
  } else {
    Add-Result -Step 'latence' -Verdict 'FAIL' -Evidence "code $($lat.code), aucun verdict CONFORME lisible. Fin de sortie :`n$($lat.tail)"
  }
}

# 14. Rapport
$peuples = @($results | Where-Object { $_.verdict -ne 'INFO' -and $_.verdict -ne 'SKIPPED' })
$rapport = [ordered]@{
  date      = (Get-Date).ToString('o')
  machine   = $env:COMPUTERNAME
  racine    = $root
  faits     = $facts
  resultats = $results
}

$fichier = Join-Path $OutputDir ("windows-check-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$rapport | ConvertTo-Json -Depth 6 | Out-File -FilePath $fichier -Encoding utf8

Write-Host ''
Write-Host "Rapport ecrit : $fichier"
Write-Host ("Etapes comptees : {0} PASS, {1} FAIL, {2} BLOCKED" -f `
    (@($peuples | Where-Object { $_.verdict -eq 'PASS' }).Count), `
    (@($peuples | Where-Object { $_.verdict -eq 'FAIL' }).Count), `
    (@($peuples | Where-Object { $_.verdict -eq 'BLOCKED' }).Count))

if (@($peuples | Where-Object { $_.verdict -eq 'FAIL' }).Count -gt 0) {
  exit 1
}

exit 0
