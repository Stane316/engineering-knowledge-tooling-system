<#
.SYNOPSIS
  Mesure C-O02 / C-O03 sur Windows natif (protocole O2-B, Sprint 23-02).

.DESCRIPTION
  Ce script ne modifie pas le depot : il construit, mesure et ecrit un rapport.
  Il est ecrit pour PowerShell 5.1 (Windows 11 natif), sans dependance externe.

  Chaque etape rend un verdict explicite :
    PASS      l'etape a reussi et sa preuve est consignee ;
    FAIL      l'etape a echoue (code de sortie non nul du script) ;
    BLOCKED   l'etape exige une autorisation ou un compte que ce script ne peut
              pas fournir seul (ACL avec un second compte, par exemple).

  Aucun resultat n'est declare compatible pour une version de Windows qui n'a
  pas ete mesuree.

.PARAMETER DataDir
  Repertoire de donnees a utiliser. Defaut : un sous-repertoire temporaire.

.PARAMETER SkipInstall
  Ne pas executer `npm ci` (utile si les dependances sont deja installees).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1
#>

[CmdletBinding()]
param(
  [string] $DataDir = (Join-Path $env:TEMP ("ekts-windows-check-" + (Get-Date -Format "yyyyMMdd-HHmmss"))),
  [switch] $SkipInstall
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$results = New-Object System.Collections.ArrayList
$facts = [ordered]@{}

function Add-Result {
  param([string] $Step, [string] $Verdict, [string] $Evidence)

  $null = $results.Add([pscustomobject]@{
    etape    = $Step
    verdict  = $Verdict
    preuve   = $Evidence
  })

  Write-Host ("[{0}] {1} - {2}" -f $Verdict, $Step, $Evidence)
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
      $build = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion')

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
      $facts['git'] = (& git rev-parse --short HEAD)

      "node $($facts['node']) / npm $($facts['npm']) / commit $($facts['git'])"
    })) { }

# 3. Dependances natives
if (-not (Invoke-Step 'dependances-natives' {
      $json = & npm ls better-sqlite3 sqlite-vec --json 2>$null | Out-String
      $facts['dependances'] = $json

      $versions = (& npm ls better-sqlite3 sqlite-vec --parseable 2>$null | Out-String)
      if ([string]::IsNullOrWhiteSpace($versions)) { throw 'versions illisibles' }
      ($versions -split "`n" | Where-Object { $_ -ne '' } | ForEach-Object { Split-Path $_ -Leaf }) -join ', '
    })) { }

# 4. Installation et build
if (-not $SkipInstall) {
  if (-not (Invoke-Step 'npm-ci' {
        $sortie = & npm ci 2>&1 | Out-String
        $code = $LASTEXITCODE
        if ($code -ne 0) { throw "npm ci a echoue (code $code) : $($sortie.Substring(0, [math]::Min(400, $sortie.Length)))" }
        'npm ci reussi'
      })) { }
}

if (-not (Invoke-Step 'build' {
      $chrono = [System.Diagnostics.Stopwatch]::StartNew()
      $sortie = & npm run build 2>&1 | Out-String
      $chrono.Stop()
      if ($LASTEXITCODE -ne 0) { throw "npm run build a echoue : $($sortie.Substring(0, [math]::Min(400, $sortie.Length)))" }
      "build en $([math]::Round($chrono.Elapsed.TotalSeconds, 1)) s"
    })) { }

# 5. Diagnostic projet
if (-not (Invoke-Step 'doctor' {
      $sortie = & npm run doctor 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw 'npm run doctor a echoue' }
      $facts['doctor'] = $sortie
      'npm run doctor reussi'
    })) { }

# 6. Base temporaire
$env:EKTS_DATA_DIR = $DataDir
if (-not (Invoke-Step 'init-base' {
      if (Test-Path $DataDir) { Remove-Item -Recurse -Force $DataDir }
      New-Item -ItemType Directory -Path $DataDir | Out-Null
      $sortie = & node dist/cli/index.js init 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw "init a echoue : $sortie" }
      "base initialisee dans $DataDir"
    })) { }

# 7. Accents et UTF-8
$titre = 'Reseau - accents e a u c : éàüç'
$contenu = 'Phrase accentuée : où sont les données élégantes ?'
if (-not (Invoke-Step 'accents-utf8' {
      $sortie = & node dist/cli/index.js add --type other --title $titre --content $contenu --json 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw "add a echoue : $sortie" }
      $facts['ajout'] = $sortie.Trim()
      'ressource accentuee ajoutee'
    })) { }

# 8. Recherche dans le meme processus
$idRessource = $null
if (-not (Invoke-Step 'recherche' {
      $sortie = & node dist/cli/index.js search 'accentuee' -m fts --json 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw "search a echoue : $sortie" }
      if ($sortie -notmatch 'accentu') { throw 'le resultat ne contient pas le texte accentue attendu' }
      $facts['recherche'] = $sortie.Trim()
      'recherche FTS retrouve la ressource accentuee'
    })) { }

# 9. Redemarrage : nouveau processus, meme base
if (-not (Invoke-Step 'redemarrage' {
      $sortie = & node dist/cli/index.js search 'accentuee' -m fts --json 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw "search apres redemarrage a echoue : $sortie" }
      if ($sortie -notmatch 'accents') { throw 'la ressource n a pas survecu au redemarrage' }
      'persistance confirmee dans un nouveau processus'
    })) { }

# 10. ACL (lecture seule : la conclusion exige un second compte)
if (-not (Invoke-Step 'acl' {
      $lignes = & icacls $DataDir 2>&1 | Out-String
      $facts['acl'] = $lignes.Trim()

      $bases = Get-ChildItem -Path $DataDir -Filter '*.db' -File
      foreach ($base in $bases) {
        $facts["acl-$($base.Name)"] = (& icacls $base.FullName 2>&1 | Out-String).Trim()
      }

      "$($bases.Count) bases ; ACL consignees (verdict definitif : test avec un second compte)"
    })) { }

# Les ACL ne peuvent pas etre conclues sans un compte non autorise.
Add-Result -Step 'acl-acces-refuse' -Verdict 'BLOCKED' -Evidence 'exige un second compte Windows non autorise, non fourni par ce script'

# 11. Latence (protocole C-O07, deja instrumente)
if (-not (Invoke-Step 'latence' {
      $sortie = & npm run bench:latency 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) { throw "bench:latency a echoue : $($sortie.Substring(0, [math]::Min(400, $sortie.Length)))" }
      $facts['latence'] = $sortie.Trim()
      'protocole C-O07 execute (verdict detaille dans la sortie)'
    })) { }

# 12. Rapport
$rapport = [ordered]@{
  date     = (Get-Date).ToString('o')
  machine  = $env:COMPUTERNAME
  faits    = $facts
  resultats = $results
}

$fichier = Join-Path $root ("windows-check-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$rapport | ConvertTo-Json -Depth 6 | Out-File -FilePath $fichier -Encoding utf8

Write-Host ''
Write-Host "Rapport ecrit : $fichier"
Write-Host ("Etapes : {0} PASS, {1} FAIL, {2} BLOCKED" -f `
    (@($results | Where-Object { $_.verdict -eq 'PASS' }).Count), `
    (@($results | Where-Object { $_.verdict -eq 'FAIL' }).Count), `
    (@($results | Where-Object { $_.verdict -eq 'BLOCKED' }).Count))

if (@($results | Where-Object { $_.verdict -eq 'FAIL' }).Count -gt 0) {
  exit 1
}

exit 0
