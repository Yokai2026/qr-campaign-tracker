export type OutboundSegment =
  | 'marketing_agency'
  | 'gastronomy'
  | 'crafts_sme'
  | 'events_tourism';

export type LeadStatus =
  | 'new'
  | 'queued'
  | 'contacted'
  | 'replied'
  | 'bounced'
  | 'uninterested'
  | 'converted'
  | 'do_not_contact';

export type EmailStatus = 'unknown' | 'discovered' | 'verified' | 'risky' | 'invalid';

export type LeadSource = 'google_places' | 'manual' | 'import';

export type OutboundLead = {
  id: string;
  source: LeadSource;
  source_id: string | null;
  segment: OutboundSegment;
  query: string | null;
  name: string;
  industry: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  rating_count: number | null;
  email: string | null;
  email_status: EmailStatus;
  email_source: string | null;
  status: LeadStatus;
  notes: string | null;
  scraped_at: string;
  contacted_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadInsert = Omit<
  OutboundLead,
  'id' | 'created_at' | 'updated_at' | 'scraped_at'
> & {
  scraped_at?: string;
};

export type PlacesSearchResult = {
  place_id: string;
  name: string;
  industry: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  rating_count: number | null;
};
