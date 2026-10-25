import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import type { McpToolContext } from '../context.js';
import {
  AddBestPracticeInput,
  AuditHistoryInput,
  AuditReportInput,
  CreateProjectInput,
  DeleteProjectInput,
  GetProjectInput,
  GetResourceInput,
  GetRecommendationsInput,
  GetTimelineInput,
  InspectSiteInput,
  SearchBestPracticesInput,
  ListProjectsInput,
  ListResourcesInput,
  SearchKnowledgeInput,
  TOOL_DESCRIPTIONS,
  ValidateResourceInput,
} from '../schemas/tool-schemas.js';
import { executeAuditHistory } from '../tools/audit-history.js';
import { executeAuditReport } from '../tools/audit-report.js';
import { executeCreateProject } from '../tools/create-project.js';
import { executeDeleteProject } from '../tools/delete-project.js';
import { executeGetProject } from '../tools/get-project.js';
import { executeAddBestPractice } from '../tools/add-best-practice.js';
import { executeGetTimeline } from '../tools/get-timeline.js';
import { executeSearchBestPractices } from '../tools/search-best-practices.js';
import { executeGetRecommendations } from '../tools/get-recommendations.js';
import { executeGetResource } from '../tools/get-resource.js';
import { executeInspectSite } from '../tools/inspect-site.js';
import { executeListProjects } from '../tools/list-projects.js';
import { executeListResources } from '../tools/list-resources.js';
import { executeSearchKnowledge } from '../tools/search-knowledge.js';
import { executeValidateResource } from '../tools/validate-resource.js';
import { formatIssues, invalidParams, toToolErrorResult } from '../utils/errors.js';
import type { McpLogger } from '../utils/logger.js';

/**
 * Métadonnées d'un outil, telles qu'affichées par `tools/list`.
 *
 * Le SDK se charge de la sérialisation JSON Schema ; cette liste sert de
 * référence lisible et de garde-fou dans les tests (ordre et nombre d'outils).
 */
export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
}

/** Les quatorze outils (MVP-2 + S13 projets + S14 timeline + S15 BP), ordre stable. */
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  { name: 'search_knowledge', description: TOOL_DESCRIPTIONS.search_knowledge },
  { name: 'get_resource', description: TOOL_DESCRIPTIONS.get_resource },
  { name: 'list_resources', description: TOOL_DESCRIPTIONS.list_resources },
  { name: 'validate_resource', description: TOOL_DESCRIPTIONS.validate_resource },
  { name: 'inspect_site', description: TOOL_DESCRIPTIONS.inspect_site },
  { name: 'audit_history', description: TOOL_DESCRIPTIONS.audit_history },
  { name: 'audit_report', description: TOOL_DESCRIPTIONS.audit_report },
  { name: 'create_project', description: TOOL_DESCRIPTIONS.create_project },
  { name: 'list_projects', description: TOOL_DESCRIPTIONS.list_projects },
  { name: 'get_project', description: TOOL_DESCRIPTIONS.get_project },
  { name: 'delete_project', description: TOOL_DESCRIPTIONS.delete_project },
  { name: 'get_timeline', description: TOOL_DESCRIPTIONS.get_timeline },
  { name: 'search_best_practices', description: TOOL_DESCRIPTIONS.search_best_practices },
  { name: 'add_best_practice', description: TOOL_DESCRIPTIONS.add_best_practice },
  { name: 'get_recommendations', description: TOOL_DESCRIPTIONS.get_recommendations },
];

/**
 * Exécute un outil après validation de ses paramètres.
 *
 * Chemin unique utilisé à la fois par `tools/call` et par les tests : les deux
 * valident avec le même schéma Zod, donc une erreur ne peut pas n'apparaître
 * que dans l'un des deux.
 *
 * @param context - Services partagés.
 * @param name - Nom de l'outil demandé.
 * @param args - Arguments bruts reçus du client.
 * @throws {McpError} Outil inconnu ou paramètres invalides (`-32602`).
 */
export async function dispatchTool(
  context: McpToolContext,
  name: string,
  args: unknown,
): Promise<unknown> {
  switch (name) {
    case 'search_knowledge':
      return executeSearchKnowledge(context, parse(SearchKnowledgeInput, name, args));
    case 'get_resource':
      return executeGetResource(context, parse(GetResourceInput, name, args));
    case 'list_resources':
      return executeListResources(context, parse(ListResourcesInput, name, args));
    case 'validate_resource':
      return executeValidateResource(parse(ValidateResourceInput, name, args));
    case 'inspect_site':
      return executeInspectSite(context, parse(InspectSiteInput, name, args));
    case 'audit_history':
      return executeAuditHistory(context, parse(AuditHistoryInput, name, args));
    case 'audit_report':
      return executeAuditReport(context, parse(AuditReportInput, name, args));
    case 'create_project':
      return executeCreateProject(context, parse(CreateProjectInput, name, args));
    case 'list_projects':
      return executeListProjects(context, parse(ListProjectsInput, name, args));
    case 'get_project':
      return executeGetProject(context, parse(GetProjectInput, name, args));
    case 'delete_project':
      return executeDeleteProject(context, parse(DeleteProjectInput, name, args));
    case 'get_timeline':
      return executeGetTimeline(context, parse(GetTimelineInput, name, args));
    case 'search_best_practices':
      return executeSearchBestPractices(context, parse(SearchBestPracticesInput, name, args));
    case 'get_recommendations':
      return executeGetRecommendations(context, parse(GetRecommendationsInput, name, args));
    case 'add_best_practice':
      return executeAddBestPractice(context, parse(AddBestPracticeInput, name, args));
    default:
      throw invalidParams(`Outil inconnu : « ${name} ». Outils disponibles : ${toolNames()}.`);
  }
}

/**
 * Enregistre les quatorze outils sur un serveur MCP.
 *
 * Chaque gestionnaire attrape ses erreurs et renvoie un résultat `isError`
 * avec la charge utile standardisée : le SDK, lui, remplacerait un `throw` par
 * un simple texte, perdant le code d'erreur.
 *
 * @param server - Serveur MCP construit par `createEktsServer`.
 * @param context - Services partagés.
 * @param logger - Journal structuré (jamais `stdout`).
 */
export function registerTools(server: McpServer, context: McpToolContext, logger: McpLogger): void {
  server.registerTool(
    'search_knowledge',
    {
      title: 'Rechercher dans la base de connaissances',
      description: TOOL_DESCRIPTIONS.search_knowledge,
      inputSchema: SearchKnowledgeInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('search_knowledge', logger, () => dispatchTool(context, 'search_knowledge', args)),
  );

  server.registerTool(
    'get_resource',
    {
      title: 'Lire une ressource',
      description: TOOL_DESCRIPTIONS.get_resource,
      inputSchema: GetResourceInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => run('get_resource', logger, () => dispatchTool(context, 'get_resource', args)),
  );

  server.registerTool(
    'list_resources',
    {
      title: 'Lister les ressources',
      description: TOOL_DESCRIPTIONS.list_resources,
      inputSchema: ListResourcesInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('list_resources', logger, () => dispatchTool(context, 'list_resources', args)),
  );

  server.registerTool(
    'validate_resource',
    {
      title: 'Valider une ressource',
      description: TOOL_DESCRIPTIONS.validate_resource,
      inputSchema: ValidateResourceInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('validate_resource', logger, () => dispatchTool(context, 'validate_resource', args)),
  );

  server.registerTool(
    'inspect_site',
    {
      title: 'Inspecter un site web',
      description: TOOL_DESCRIPTIONS.inspect_site,
      inputSchema: InspectSiteInput,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async (args) => run('inspect_site', logger, () => dispatchTool(context, 'inspect_site', args)),
  );

  server.registerTool(
    'audit_history',
    {
      title: "Consulter l'historique des audits",
      description: TOOL_DESCRIPTIONS.audit_history,
      inputSchema: AuditHistoryInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('audit_history', logger, () => dispatchTool(context, 'audit_history', args)),
  );

  server.registerTool(
    'audit_report',
    {
      title: "Générer le rapport d'un audit",
      description: TOOL_DESCRIPTIONS.audit_report,
      inputSchema: AuditReportInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => run('audit_report', logger, () => dispatchTool(context, 'audit_report', args)),
  );

  server.registerTool(
    'create_project',
    {
      title: 'Créer un projet',
      description: TOOL_DESCRIPTIONS.create_project,
      inputSchema: CreateProjectInput,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (args) =>
      run('create_project', logger, () => dispatchTool(context, 'create_project', args)),
  );

  server.registerTool(
    'list_projects',
    {
      title: 'Lister les projets',
      description: TOOL_DESCRIPTIONS.list_projects,
      inputSchema: ListProjectsInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('list_projects', logger, () => dispatchTool(context, 'list_projects', args)),
  );

  server.registerTool(
    'get_project',
    {
      title: 'Lire un projet',
      description: TOOL_DESCRIPTIONS.get_project,
      inputSchema: GetProjectInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => run('get_project', logger, () => dispatchTool(context, 'get_project', args)),
  );

  server.registerTool(
    'delete_project',
    {
      title: 'Supprimer un projet',
      description: TOOL_DESCRIPTIONS.delete_project,
      inputSchema: DeleteProjectInput,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (args) =>
      run('delete_project', logger, () => dispatchTool(context, 'delete_project', args)),
  );

  server.registerTool(
    'get_timeline',
    {
      title: 'Analyser la timeline',
      description: TOOL_DESCRIPTIONS.get_timeline,
      inputSchema: GetTimelineInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => run('get_timeline', logger, () => dispatchTool(context, 'get_timeline', args)),
  );

  server.registerTool(
    'search_best_practices',
    {
      title: 'Rechercher les bonnes pratiques',
      description: TOOL_DESCRIPTIONS.search_best_practices,
      inputSchema: SearchBestPracticesInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('search_best_practices', logger, () =>
        dispatchTool(context, 'search_best_practices', args),
      ),
  );

  server.registerTool(
    'add_best_practice',
    {
      title: 'Créer une bonne pratique',
      description: TOOL_DESCRIPTIONS.add_best_practice,
      inputSchema: AddBestPracticeInput,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (args) =>
      run('add_best_practice', logger, () => dispatchTool(context, 'add_best_practice', args)),
  );

  server.registerTool(
    'get_recommendations',
    {
      title: 'Générer les recommandations',
      description: TOOL_DESCRIPTIONS.get_recommendations,
      inputSchema: GetRecommendationsInput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) =>
      run('get_recommendations', logger, () => dispatchTool(context, 'get_recommendations', args)),
  );
}

/** Exécute un outil et convertit le succès ou l'échec en résultat MCP. */
async function run(
  name: string,
  logger: McpLogger,
  execute: () => Promise<unknown>,
): Promise<CallToolResult> {
  const started = Date.now();

  try {
    const result = await execute();
    logger.debug('Outil exécuté', { tool: name, durationMs: Date.now() - started });

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    // Les arguments ne sont pas journalisés : une requête peut contenir du
    // contenu utilisateur, sans intérêt pour le diagnostic et coûteux en logs.
    logger.error('Échec de l’outil', error, { tool: name });

    return toToolErrorResult(error);
  }
}

/** Liste des outils, pour les messages d'erreur. */
function toolNames(): string {
  return TOOL_DEFINITIONS.map((tool) => tool.name).join(', ');
}

/** Valide les paramètres ou lève `-32602` avec le détail des champs fautifs. */
function parse<T>(schema: z.ZodType<T>, name: string, args: unknown): T {
  const parsed = schema.safeParse(args ?? {});

  if (parsed.success) {
    return parsed.data;
  }

  throw invalidParams(
    `Paramètres invalides pour « ${name} » : ${formatIssues(parsed.error.issues)}`,
  );
}
