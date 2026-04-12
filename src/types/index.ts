// ============================================
// Database types matching Supabase schema
// ============================================

export type UserRole = 'admin' | 'editor';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type LocationType =
  | 'library' | 'school' | 'youth_center' | 'community_center'
  | 'public_board' | 'event_space' | 'office' | 'shop' | 'other';

export type PlacementType = string;

export type PlacementStatus =
  | 'planned' | 'installed' | 'active' | 'paused' | 'removed' | 'archived';

export type QrAction =
  | 'created' | 'activated' | 'deactivated' | 'paused'
  | 'expired' | 'replaced' | 'target_changed' | 'note_added'
  | 'archived' | 'downloaded';

export type RedirectEventType = 'qr_open' | 'qr_blocked_inactive' | 'qr_expired';

export type PageEventType =
  | 'landing_page_view' | 'cta_click' | 'form_start'
  | 'form_submit' | 'file_download';

// ============================================
// Row types
// ============================================

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  role: UserRole;
  trial_ends_at: string | null;
  onboarding_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanTier = 'free' | 'paid';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'on_trial' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignTag {
  id: string;
  campaign_id: string;
  tag: string;
  created_at: string;
}

export interface Location {
  id: string;
  district: string | null;
  venue_name: string;
  address: string | null;
  location_type: LocationType;
  notes: string | null;
  active: boolean;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Placement {
  id: string;
  campaign_id: string;
  location_id: string;
  name: string;
  placement_code: string;
  placement_type: PlacementType;
  poster_version: string | null;
  flyer_version: string | null;
  notes: string | null;
  status: PlacementStatus;
  installed_at: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  campaign?: Campaign;
  location?: Location;
  qr_codes?: QrCode[];
}

export interface QrCode {
  id: string;
  placement_id: string;
  short_code: string;
  target_url: string;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  note: string | null;
  created_by: string | null;
  qr_png_url: string | null;
  qr_svg_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_id: string | null;
  qr_fg_color: string;
  qr_bg_color: string;
  max_scans: number | null;
  limit_redirect_url: string | null;
  short_host: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  placement?: Placement;
}

export interface QrStatusHistory {
  id: string;
  qr_code_id: string;
  action: QrAction;
  changed_by: string | null;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface RedirectEvent {
  id: string;
  qr_code_id: string | null;
  placement_id: string | null;
  campaign_id: string | null;
  short_code: string;
  event_type: RedirectEventType;
  referrer: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser_family: string | null;
  os_family: string | null;
  ip_hash: string | null;
  destination_url: string | null;
  country: string | null;
  created_at: string;
}

export interface PageEvent {
  id: string;
  event_type: PageEventType;
  qr_code_id: string | null;
  placement_id: string | null;
  campaign_id: string | null;
  session_id: string | null;
  page_url: string | null;
  metadata: Record<string, unknown> | null;
  referrer: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser_family: string | null;
  os_family: string | null;
  ip_hash: string | null;
  created_at: string;
}

// ============================================
// Short Links
// ============================================

export interface LinkGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  campaign_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export type LinkMode = 'short' | 'direct';

export interface ShortLink {
  id: string;
  short_code: string;
  target_url: string;
  title: string | null;
  description: string | null;
  campaign_id: string | null;
  link_group_id: string | null;
  link_mode: LinkMode;
  active: boolean;
  archived: boolean;
  expires_at: string | null;
  expired_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_id: string | null;
  click_count: number;
  last_clicked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
  link_group?: LinkGroup;
}

// ============================================
// Custom Domains
// ============================================

export interface CustomDomain {
  id: string;
  host: string;
  verification_token: string;
  verified: boolean;
  verified_at: string | null;
  is_primary: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportSchedule {
  id: string;
  user_id: string;
  email: string;
  frequency: ReportFrequency;
  campaign_id: string | null;
  active: boolean;
  last_sent_at: string | null;
  next_run_at: string;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

// ============================================
// UTM Templates
// ============================================

export interface UtmTemplate {
  id: string;
  user_id: string;
  name: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Scan Alerts
// ============================================

export type AlertMetric = 'total_scans' | 'unique_visitors';

export interface ScanAlert {
  id: string;
  user_id: string;
  email: string;
  campaign_id: string | null;
  metric: AlertMetric;
  threshold: number;
  cooldown_hours: number;
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

// ============================================
// Redirect Rules (Conditional Redirects)
// ============================================

export type ConditionType = 'device' | 'os' | 'browser' | 'country' | 'time_range' | 'day_of_week';

export interface RedirectRule {
  id: string;
  qr_code_id: string | null;
  short_link_id: string | null;
  condition_type: ConditionType;
  condition_value: Record<string, unknown>;
  target_url: string;
  label: string | null;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RedirectRuleInput {
  qr_code_id?: string;
  short_link_id?: string;
  condition_type: ConditionType;
  condition_value: Record<string, unknown>;
  target_url: string;
  label?: string;
  priority?: number;
  active?: boolean;
}

// ============================================
// A/B Testing
// ============================================

export interface AbVariant {
  id: string;
  qr_code_id: string | null;
  short_link_id: string | null;
  target_url: string;
  weight: number;
  label: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Audit Log
// ============================================

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_hash: string | null;
  created_at: string;
}

// ============================================
// Analytics / aggregated types
// ============================================

export interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  campaign_status: CampaignStatus;
  placement_count: number;
  qr_code_count: number;
  total_opens: number;
  cta_clicks: number;
  form_submits: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface TopPlacement {
  placement_id: string;
  placement_name: string;
  placement_code: string;
  location_name: string;
  campaign_name: string;
  total_opens: number;
}

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  campaign_id?: string;
  location_id?: string;
  placement_id?: string;
  district?: string;
  status?: string;
}

// ============================================
// Form / input types
// ============================================

export interface CampaignInput {
  name: string;
  slug: string;
  description?: string;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  tags?: string[];
}

export interface LocationInput {
  district?: string;
  venue_name: string;
  address?: string;
  location_type: LocationType;
  notes?: string;
  active: boolean;
  lat?: number;
  lng?: number;
}

export interface PlacementInput {
  campaign_id: string;
  location_id: string;
  name: string;
  placement_code: string;
  placement_type: PlacementType;
  poster_version?: string;
  flyer_version?: string;
  notes?: string;
  status: PlacementStatus;
}

export interface QrCodeInput {
  placement_id?: string;
  target_url: string;
  note?: string;
  valid_from?: string;
  valid_until?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_id?: string;
  qr_fg_color?: string;
  qr_bg_color?: string;
  max_scans?: number;
  limit_redirect_url?: string;
  short_host?: string;
}
