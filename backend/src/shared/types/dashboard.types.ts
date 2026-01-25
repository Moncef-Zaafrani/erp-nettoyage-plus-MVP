/**
 * Dashboard & Reporting Types
 * Types for dashboard statistics, KPIs, and report structures
 */

export interface DashboardSummary {
  totalClients: number;
  activeClients: number;
  totalSites: number;
  activeSites: number;
  totalContracts: number;
  activeContracts: number;
  totalInterventions: number;
  completedInterventions: number;
  totalAgents: number;
  activeAgents: number;
  pendingAbsences: number;
}

export interface InterventionSummary {
  id: string;
  interventionCode: string;
  siteName: string;
  clientName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  assignedAgents: number;
  checklistCompleted: boolean;
}

export interface ZonePerformance {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  totalSites: number;
  totalAgents: number;
  interventionsThisMonth: number;
  completedInterventions: number;
  completionRate: number; // percentage
  averageQualityScore: number; // 1-5
  checklistCompletionRate: number; // percentage
  incidentsCount: number;
}

export interface RecentActivity {
  id: string;
  type: 'INTERVENTION_CREATED' | 'INTERVENTION_COMPLETED' | 'ABSENCE_REQUESTED' | 'CONTRACT_SIGNED' | 'CLIENT_ADDED' | 'INCIDENT_REPORTED';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export interface DailyReport {
  date: Date;
  zoneId: string;
  zoneName: string;
  zoneChief: string;
  sitesVisited: SiteVisit[];
  issuesFound: Issue[];
  checklistCompletionRate: number;
  uniformCompliance: boolean;
  stockAvailability: string;
  incidentsCount: number;
  summary: string;
}

export interface SiteVisit {
  siteId: string;
  siteName: string;
  interventionId: string;
  checkInTime: Date;
  checkOutTime: Date;
  agentsPresent: string[];
  checklistCompleted: boolean;
  qualityScore: number;
  issues: string[];
}

export interface Issue {
  siteId: string;
  siteName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  reportedBy: string;
  reportedAt: Date;
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  zoneId: string;
  zoneName: string;
  totalInterventions: number;
  completedInterventions: number;
  completionRate: number;
  averageQualityScore: number;
  totalIncidents: number;
  sitesCovered: number;
  agentUtilization: AgentUtilization[];
  topPerformers: string[];
  areasForImprovement: string[];
}

export interface AgentUtilization {
  agentId: string;
  agentName: string;
  interventionsAssigned: number;
  interventionsCompleted: number;
  utilizationRate: number; // percentage
  averageRating: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalClients: number;
  totalContracts: number;
  totalInterventions: number;
  completionRate: number;
  averageQualityScore: number;
  clientSatisfaction: number;
  totalRevenue: number;
  zonePerformance: ZonePerformance[];
  kpis: KPIMetrics;
}

export interface KPIMetrics {
  roleType: 'SUPERVISOR' | 'AGENT' | 'OVERALL';
  interventionCompletionRate: number;
  checklistCompletionRate: number;
  averageQualityScore: number;
  clientSatisfactionRate: number;
  incidentRate: number;
  absenceRate: number;
  responseTime: number; // hours
}

export enum ActivityType {
  INTERVENTION_CREATED = 'INTERVENTION_CREATED',
  INTERVENTION_COMPLETED = 'INTERVENTION_COMPLETED',
  ABSENCE_REQUESTED = 'ABSENCE_REQUESTED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  CLIENT_ADDED = 'CLIENT_ADDED',
  INCIDENT_REPORTED = 'INCIDENT_REPORTED',
}

export interface DashboardFilters {
  zoneId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}
