/**
 * Contrats de l'inspecteur multi-niveaux.
 *
 * Trois niveaux emboîtés, chacun ajoutant une analyse au précédent :
 *
 * | Niveau | Contenu | Budget |
 * | --- | --- | --- |
 * | L1 | Capture, accessibilité (arbre ARIA), métadonnées | 10 s |
 * | L2 | L1 + Lighthouse (Core Web Vitals) + SEO | 30 s |
 * | L3 | L2 + axe-core (WCAG 2.2 AA) + UX + contenu | 60 s |
 *
 * Les budgets sont des **cibles mesurées**, pas des coupures : un dépassement
 * est signalé (`withinBudget: false`) et non masqué, sauf si l'appelant
 * demande le mode strict.
 *
 * Ces types sont volontairement plats et sérialisables : ils alimentent le
 * rapport JSON, la CLI et les outils MCP des sprints 9 à 11 sans transformation.
 */

import type { WebVitals } from '../../analysis/measurement.js';
import type {
  NavigationOptions,
  NavigationResult,
  PageLike,
  PdfOptions,
  PdfResult,
  ScreenshotOptions,
  ScreenshotResult,
  TraceOptions,
  TraceResult,
  TraceStartOptions,
} from '../types.js';

/** Niveau d'inspection. L4 (crawling multi-pages) est hors périmètre MVP-2. */
export type InspectionLevel = 'L1' | 'L2' | 'L3';

/** Niveaux disponibles, du plus rapide au plus complet. */
export const INSPECTION_LEVELS: readonly InspectionLevel[] = ['L1', 'L2', 'L3'];

/** Budget de temps de chaque niveau, en millisecondes. */
export const INSPECTION_BUDGETS: Readonly<Record<InspectionLevel, number>> = {
  L1: 10_000,
  L2: 30_000,
  L3: 60_000,
};

/** Moteur utilisé pour l'inspection (Lighthouse exige Chromium). */
export type InspectionBrowserKind = 'chromium' | 'firefox' | 'webkit';

/** Options d'une inspection. */
export interface InspectionOptions {
  /** URL absolue à inspecter (http ou https). */
  readonly url: string;
  /** Niveau demandé (défaut : `L1`). */
  readonly level?: InspectionLevel;
  /** Viewport appliqué au contexte (défaut : 1920 × 1080). */
  readonly viewport?: { readonly width: number; readonly height: number };
  /** User-Agent appliqué au contexte (défaut : celui du moteur). */
  readonly userAgent?: string;
  /** Délai maximal de navigation en millisecondes (défaut : 30 000). */
  readonly timeout?: number;
  /** Moteur (défaut : `chromium`). Les niveaux L2 et L3 l'exigent. */
  readonly browserKind?: InspectionBrowserKind;
  /** Dossier des artefacts (défaut : `artifacts/inspections`). */
  readonly outputDir?: string;
  /** Capture d'écran (défaut : `true`). */
  readonly screenshot?: boolean;
  /** Trace Playwright (défaut : `false`). Chromium uniquement. */
  readonly trace?: boolean;
  /** Impression PDF (défaut : `false`). Chromium uniquement. */
  readonly pdf?: boolean;
  /** Échoue au premier outil indisponible au lieu de dégrader (défaut : `false`). */
  readonly strict?: boolean;
}

/** Chemins des fichiers produits par une inspection. */
export interface InspectionArtifacts {
  /** Capture PNG pleine page. */
  readonly screenshot?: string;
  /** Trace Playwright (ZIP). */
  readonly trace?: string;
  /** Impression PDF. */
  readonly pdf?: string;
  /** Rapport JSON de l'inspection. */
  readonly report?: string;
}

/** Métadonnées d'une page inspectée. */
export interface PageMetadata {
  /** URL finale, après redirections. */
  readonly url: string;
  /** URL demandée. */
  readonly requestedUrl: string;
  /** Titre du document. */
  readonly title: string;
  /** Contenu de `meta[name="description"]`. */
  readonly description: string | null;
  /** Langue déclarée (`html[lang]`). */
  readonly language: string | null;
  /** Viewport appliqué au contexte. */
  readonly viewport: { readonly width: number; readonly height: number };
  /** User-Agent effectif du contexte. */
  readonly userAgent: string;
  /** Durée de chargement mesurée par la navigation. */
  readonly loadTime: number;
  /** Code HTTP de la réponse principale (`0` si aucune réponse). */
  readonly httpStatus: number;
  /** `true` si une redirection a eu lieu. */
  readonly redirected: boolean;
  /** Date de l'inspection (ISO 8601). */
  readonly timestamp: string;
}

/** Violation d'accessibilité relevée sur l'arbre ARIA (niveau L1). */
export interface AccessibilitySummaryViolation {
  /** Règle enfreinte (`image-alt`, `button-name`…). */
  readonly rule: string;
  /** Gravité héritée de l'arbre ARIA. */
  readonly impact: 'minor' | 'moderate' | 'serious' | 'critical';
  /** Message en français. */
  readonly message: string;
}

/** Résumé d'accessibilité calculé sans navigateur (niveau L1). */
export interface AccessibilitySummary {
  /** Nombre de nœuds de l'arbre ARIA. */
  readonly nodeCount: number;
  /** Profondeur maximale parcourue. */
  readonly maxDepth: number;
  /** Violations relevées sur l'arbre. */
  readonly violations: readonly AccessibilitySummaryViolation[];
  /** Nombre de violations par gravité. */
  readonly counts: Readonly<Record<'minor' | 'moderate' | 'serious' | 'critical', number>>;
}

/**
 * Métrique Core Web Vitals.
 *
 * Depuis le Sprint 20-01 (W04 / C-W08), une inspection produit des **lectures**
 * et non des nombres nus : identité, unité et origine accompagnent chaque
 * mesure, INP / FID / max-potential-fid / TBT restent distincts, et une
 * métrique absente est explicitement indisponible (contrat 19-03).
 */
export type CoreWebVitals = WebVitals;

/** Problème détecté par Lighthouse (SEO ou performance). */
export interface LighthouseIssue {
  /** Identifiant de l'audit (`meta-description`, `is-crawlable`…). */
  readonly id: string;
  /** Titre lisible. */
  readonly title: string;
  /** Explication. */
  readonly description: string;
  /** Gravité déduite du score de l'audit. */
  readonly severity: 'error' | 'warning' | 'info';
}

/** Résultat d'analyse Lighthouse. */
export interface LighthouseAnalysis {
  /** Score performance (0-100). */
  readonly performance: {
    /** Score performance (0-100), `null` si la catégorie est absente. */
    readonly score: number | null;
    readonly metrics: CoreWebVitals;
  };
  /** Score SEO (0-100) et audits en échec. */
  readonly seo: {
    /** Score SEO (0-100), `null` si la catégorie est absente. */
    readonly score: number | null;
    readonly issues: readonly LighthouseIssue[];
  };
  /** URL réellement analysée par Lighthouse. */
  readonly url: string;
  /** Version de Lighthouse utilisée. */
  readonly version: string;
  /** Durée de l'analyse (ms). */
  readonly duration: number;
}

/** Violation WCAG rapportée par axe-core. */
export interface AxeViolation {
  /** Identifiant de la règle (`color-contrast`, `label`…). */
  readonly id: string;
  /** Gravité ; `minor` quand axe ne la qualifie pas. */
  readonly impact: 'minor' | 'moderate' | 'serious' | 'critical';
  /** Description de la règle. */
  readonly description: string;
  /** Message d'aide. */
  readonly help: string;
  /** Documentation de la règle. */
  readonly helpUrl: string;
  /**
   * Nombre de nœuds concernés, quand axe-core le fournit (Sprint 20-02).
   *
   * Absent = non fourni. Le `0` historique confondait « aucun nœud » et
   * « information absente », exactement ce que C-W09 interdit.
   */
  readonly nodes?: number;
  /**
   * Sélecteurs réellement fournis par axe-core (Sprint 20-02, C-W09).
   *
   * Absent quand axe ne fournit aucune cible : l'absence est conservée telle
   * quelle et n'est jamais remplacée par une liste vide présentée comme
   * observée.
   */
  readonly targets?: readonly string[];
  /** Balises WCAG déclenchées (`wcag2a`, `wcag2aa`…). */
  readonly tags: readonly string[];
}

/** Résultat d'analyse axe-core. */
export interface AxeAnalysis {
  /** Violations, de la plus grave à la moins grave. */
  readonly violations: readonly AxeViolation[];
  /** Score d'accessibilité (0-100). */
  readonly score: number;
  /** Règles exécutées sans violation. */
  readonly passCount: number;
  /** Règles non applicables à la page. */
  readonly inapplicableCount: number;
  /** Durée de l'analyse (ms). */
  readonly duration: number;
  /**
   * Version du moteur axe-core, quand elle est fournie (Sprint 20-02, C-W09).
   *
   * Sans elle, un constat ne peut pas être rattaché à la version de règles qui
   * l'a produit.
   */
  readonly engineVersion?: string;
}

/** Heuristique de Nielsen évaluée. */
export interface UxHeuristic {
  /** Identifiant stable (`status`, `consistency`…). */
  readonly id: string;
  /** Nom de l'heuristique. */
  readonly name: string;
  /** Score de 0 à 100. */
  readonly score: number;
  /** Constats, en français. */
  readonly issues: readonly string[];
}

/** Résultat d'analyse UX (heuristiques de Nielsen). */
export interface UxAnalysis {
  /** Score global (0-100). */
  readonly score: number;
  /** Heuristiques évaluées. */
  readonly heuristics: readonly UxHeuristic[];
}

/** Résultat d'analyse de contenu. */
export interface ContentAnalysis {
  /** Score global (0-100). */
  readonly score: number;
  /** Nombre de mots visibles. */
  readonly wordCount: number;
  /** Temps de lecture estimé (minutes). */
  readonly readingTime: number;
  /** Indice de lisibilité Flesch (0-100, plus haut = plus simple). */
  readonly readabilityScore: number;
  /** Métriques structurelles. */
  readonly structure: {
    readonly paragraphs: number;
    readonly lists: number;
    readonly tables: number;
    readonly headings: number;
  };
}

/** Résultat commun aux trois niveaux. */
export interface BaseInspectionResult {
  /** URL demandée. */
  readonly url: string;
  /** Date de l'inspection (ISO 8601). */
  readonly timestamp: string;
  /** Durée cumulée de l'inspection (ms). */
  readonly duration: number;
  /** Budget du niveau, en millisecondes. */
  readonly budget: number;
  /** `true` si `duration` respecte `budget`. */
  readonly withinBudget: boolean;
  /** Métadonnées de la page. */
  readonly metadata: PageMetadata;
  /** Résumé d'accessibilité. */
  readonly accessibility: AccessibilitySummary;
  /** Artefacts produits. */
  readonly artifacts: InspectionArtifacts;
  /**
   * Outils indisponibles ou dégradés, en français.
   *
   * Une liste vide signifie que tout ce que le niveau demandait a fonctionné.
   */
  readonly warnings: readonly string[];
}

/** Résultat d'inspection L1 (rapide). */
export interface L1InspectionResult extends BaseInspectionResult {
  readonly level: 'L1';
}

/** Résultat d'inspection L2 (standard). */
export interface L2InspectionResult extends BaseInspectionResult {
  readonly level: 'L2';
  /** Analyse Lighthouse, `null` si elle a été dégradée (voir `warnings`). */
  readonly lighthouse: LighthouseAnalysis | null;
  /** Analyse SEO dérivée du DOM. */
  readonly seo: SeoAnalysis;
}

/** Résultat d'inspection L3 (approfondie). */
export interface L3InspectionResult extends BaseInspectionResult {
  readonly level: 'L3';
  readonly lighthouse: LighthouseAnalysis | null;
  readonly seo: SeoAnalysis;
  /** Analyse axe-core, `null` si elle a été dégradée. */
  readonly axe: AxeAnalysis | null;
  /** Analyse UX. */
  readonly ux: UxAnalysis;
  /** Analyse de contenu. */
  readonly content: ContentAnalysis;
}

/** Résultat d'inspection, selon le niveau demandé. */
export type InspectionResult = L1InspectionResult | L2InspectionResult | L3InspectionResult;

/**
 * Surface de session dont les niveaux ont besoin.
 *
 * `Navigator` la satisfait telle quelle : les signatures sont reprises des
 * contrats existants, pas redéfinies, pour que le compilateur le vérifie.
 */
export interface InspectionSession {
  goto(options: NavigationOptions): Promise<NavigationResult>;
  screenshot(options: ScreenshotOptions): Promise<ScreenshotResult>;
  startTrace(options?: TraceStartOptions): Promise<void>;
  stopTrace(options: TraceOptions): Promise<TraceResult>;
  pdf(options: PdfOptions): Promise<PdfResult>;
  getPage(): PageLike;
}

/** Options d'inspection, valeurs par défaut appliquées. */
export interface ResolvedInspectionOptions {
  readonly url: string;
  readonly level: InspectionLevel;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly userAgent: string | undefined;
  readonly timeout: number;
  readonly browserKind: InspectionBrowserKind;
  readonly outputDir: string;
  readonly screenshot: boolean;
  readonly trace: boolean;
  readonly pdf: boolean;
  readonly strict: boolean;
}

/** Ce qu'un niveau reçoit : session ouverte, page chargée, horloge. */
export interface InspectionContext {
  readonly session: InspectionSession;
  readonly options: ResolvedInspectionOptions;
  readonly navigation: {
    url: string;
    title: string;
    status: number;
    loadTime: number;
    redirected: boolean;
  };
  /** Horodatage (ms) du début de l'inspection, pour des durées cumulées. */
  readonly startedAt: number;
  readonly now: () => number;
}

/** Problème SEO dérivé du DOM. */
export interface SeoIssue {
  /** Identifiant stable (`title`, `meta-description`…). */
  readonly id: string;
  /** Message en français. */
  readonly message: string;
  /** Gravité. */
  readonly severity: 'error' | 'warning' | 'info';
}

/** Résultat d'analyse SEO (dérivée du DOM, sans réseau). */
export interface SeoAnalysis {
  /** Score de 0 à 100. */
  readonly score: number;
  /** Problèmes relevés, du plus grave au moins grave. */
  readonly issues: readonly SeoIssue[];
  /** Synthèse des éléments structurants. */
  readonly summary: {
    readonly titleLength: number;
    readonly descriptionLength: number;
    readonly headingCount: number;
    /** Niveaux de titres utilisés, dans l'ordre croissant. */
    readonly headingLevels: readonly number[];
    readonly linkCount: number;
    readonly externalLinkCount: number;
    readonly imageCount: number;
    readonly imagesWithoutAlt: number;
    readonly structuredDataBlocks: number;
  };
}

/** Élément de titre extrait du DOM. */
export interface HeadingInfo {
  readonly level: number;
  readonly text: string;
}

/** Lien extrait du DOM. */
export interface LinkInfo {
  readonly href: string;
  readonly text: string;
  /** `true` si le lien sort du domaine de la page. */
  readonly external: boolean;
}

/** Image extraite du DOM. */
export interface ImageInfo {
  readonly src: string;
  /** `null` quand l'attribut `alt` est absent ; `''` quand il est vide. */
  readonly alt: string | null;
  readonly width: number;
  readonly height: number;
  readonly lazy: boolean;
}

/**
 * Photographie du DOM, obtenue en une seule évaluation dans la page.
 *
 * Elle est ensuite analysée hors navigateur (SEO, UX, contenu), ce qui rend
 * ces analyses pures, testables sans réseau et comparables d'un moteur à
 * l'autre.
 */
export interface PageSnapshot {
  readonly language: string | null;
  /** User-Agent effectif du moteur (lu dans la page). */
  readonly userAgent: string;
  readonly title: string;
  readonly description: string | null;
  readonly canonical: string | null;
  readonly robots: string | null;
  readonly viewportMeta: string | null;
  readonly openGraph: Readonly<Record<string, string>>;
  readonly twitter: Readonly<Record<string, string>>;
  readonly headings: readonly HeadingInfo[];
  readonly links: readonly LinkInfo[];
  readonly images: readonly ImageInfo[];
  readonly landmarks: {
    readonly main: number;
    readonly nav: number;
    readonly header: number;
    readonly footer: number;
  };
  readonly structuredDataBlocks: number;
  readonly paragraphs: number;
  readonly lists: number;
  readonly tables: number;
  readonly buttons: number;
  readonly inputs: number;
  readonly labelledInputs: number;
  readonly iframes: number;
  readonly text: string;
}
