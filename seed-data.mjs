const SB_URL = 'https://otgymdbdurpsszulhsji.supabase.co/rest/v1';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3ltZGJkdXJwc3N6dWxoc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1ODU2NCwiZXhwIjoyMDkwNjM0NTY0fQ.JIrHjwLcgxL9vbKTI-7xXdJ6bX00YsWAe9fFdag2HC4';
const headers = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

async function ins(table, data) {
  const res = await fetch(`${SB_URL}/${table}`, { method: 'POST', headers, body: JSON.stringify(data) });
  if (res.status >= 400) console.log(`  ${table}: ${res.status} - ${await res.text()}`);
  else console.log(`  ${table}: OK (${data.length} rows)`);
}

// Valid UUIDs (hex only)
const C1='c1000000-0000-0000-0000-000000000001', C2='c1000000-0000-0000-0000-000000000002', C3='c1000000-0000-0000-0000-000000000003';
const L1='a1000000-0000-0000-0000-000000000001', L2='a1000000-0000-0000-0000-000000000002', L3='a1000000-0000-0000-0000-000000000003';
const L4='a1000000-0000-0000-0000-000000000004', L5='a1000000-0000-0000-0000-000000000005', L6='a1000000-0000-0000-0000-000000000006', L7='a1000000-0000-0000-0000-000000000007';
const P1='b1000000-0000-0000-0000-000000000001', P2='b1000000-0000-0000-0000-000000000002', P3='b1000000-0000-0000-0000-000000000003', P4='b1000000-0000-0000-0000-000000000004';
const P5='b1000000-0000-0000-0000-000000000005', P6='b1000000-0000-0000-0000-000000000006', P7='b1000000-0000-0000-0000-000000000007', P8='b1000000-0000-0000-0000-000000000008';
const Q1='d1000000-0000-0000-0000-000000000001', Q2='d1000000-0000-0000-0000-000000000002', Q3='d1000000-0000-0000-0000-000000000003', Q4='d1000000-0000-0000-0000-000000000004';
const Q5='d1000000-0000-0000-0000-000000000005', Q6='d1000000-0000-0000-0000-000000000006', Q7='d1000000-0000-0000-0000-000000000007', Q8='d1000000-0000-0000-0000-000000000008';

async function main() {
  console.log('Seeding...');

  await ins('locations', [
    { id:L1, district:'Spandau', venue_name:'Stadtbibliothek Spandau', address:'Carl-Schurz-Str. 13, 13597 Berlin', location_type:'library', notes:'Haupteingang und Jugendbereich', active:true },
    { id:L2, district:'Spandau', venue_name:'Jugendzentrum Spandau', address:'Mauerstr. 6, 13597 Berlin', location_type:'youth_center', notes:'Eingang und schwarzes Brett', active:true },
    { id:L3, district:'Mitte', venue_name:'Zentral- und Landesbibliothek', address:'Breite Str. 30-36, 10178 Berlin', location_type:'library', notes:'Foyer und Informationsbereich', active:true },
    { id:L4, district:'Neukölln', venue_name:'Gemeinschaftshaus Gropiusstadt', address:'Bat-Yam-Platz 1, 12353 Berlin', location_type:'community_center', notes:'Aushang im Treppenhaus', active:true },
    { id:L5, district:'Charlottenburg', venue_name:'Schiller-Bibliothek', address:'Müllerstr. 149, 13353 Berlin', location_type:'library', notes:'', active:true },
    { id:L6, district:'Spandau', venue_name:'Kulturhaus Spandau', address:'Mauerstr. 6, 13597 Berlin', location_type:'event_space', notes:'Veranstaltungsfoyer', active:true },
    { id:L7, district:'Mitte', venue_name:'Rathaus Mitte', address:'Karl-Marx-Allee 31, 10178 Berlin', location_type:'public_board', notes:'Aushangstafel EG', active:true },
  ]);

  await ins('placements', [
    { id:P1, campaign_id:C1, location_id:L1, name:'Bibliothek Eingang links', placement_code:'bfa-spandau-bib-01', placement_type:'poster', poster_version:'A3-v1', flyer_version:'', notes:'', status:'active', installed_at:'2026-03-15T10:00:00Z' },
    { id:P2, campaign_id:C1, location_id:L1, name:'Bibliothek Jugendbereich', placement_code:'bfa-spandau-bib-02', placement_type:'flyer', poster_version:'', flyer_version:'Flyer-v1', notes:'', status:'active', installed_at:'2026-03-15T10:00:00Z' },
    { id:P3, campaign_id:C1, location_id:L2, name:'Jugendzentrum Eingang', placement_code:'bfa-spandau-jz-01', placement_type:'poster', poster_version:'A3-v1', flyer_version:'', notes:'', status:'active', installed_at:'2026-03-16T09:00:00Z' },
    { id:P4, campaign_id:C1, location_id:L3, name:'ZLB Foyer links', placement_code:'bfa-mitte-zlb-01', placement_type:'poster', poster_version:'A3-v2', flyer_version:'', notes:'', status:'active', installed_at:'2026-03-20T11:00:00Z' },
    { id:P5, campaign_id:C2, location_id:L1, name:'Digitale Teilhabe Flyer Theke', placement_code:'dt-spandau-bib-01', placement_type:'flyer', poster_version:'', flyer_version:'Flyer-A5-v1', notes:'', status:'active', installed_at:'2026-04-01T08:00:00Z' },
    { id:P6, campaign_id:C2, location_id:L6, name:'Kulturhaus Poster Foyer', placement_code:'dt-spandau-kh-01', placement_type:'poster', poster_version:'A2-v1', flyer_version:'', notes:'', status:'installed', installed_at:'2026-04-02T09:00:00Z' },
    { id:P7, campaign_id:C1, location_id:L4, name:'Gropiusstadt Community Board', placement_code:'bfa-nk-grop-01', placement_type:'poster', poster_version:'A3-v1', flyer_version:'', notes:'', status:'active', installed_at:'2026-03-22T14:00:00Z' },
    { id:P8, campaign_id:C1, location_id:L7, name:'Rathaus Mitte Aushang', placement_code:'bfa-mitte-rat-01', placement_type:'poster', poster_version:'A3-v2', flyer_version:'', notes:'', status:'paused', installed_at:'2026-03-25T10:00:00Z' },
  ]);

  await ins('qr_codes', [
    { id:Q1, placement_id:P1, short_code:'bfa-sb01', target_url:'https://example.com/bildung-fuer-alle', active:true, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-spandau-bib-01' },
    { id:Q2, placement_id:P2, short_code:'bfa-sb02', target_url:'https://example.com/bildung-fuer-alle', active:true, utm_source:'flyer', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-spandau-bib-02' },
    { id:Q3, placement_id:P3, short_code:'bfa-jz01', target_url:'https://example.com/bildung-fuer-alle', active:true, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-spandau-jz-01' },
    { id:Q4, placement_id:P4, short_code:'bfa-zl01', target_url:'https://example.com/bildung-fuer-alle', active:true, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-mitte-zlb-01' },
    { id:Q5, placement_id:P5, short_code:'dt-sb01', target_url:'https://example.com/digitale-teilhabe', active:true, utm_source:'flyer', utm_medium:'offline_qr', utm_campaign:'digitale-teilhabe-spandau', utm_content:'dt-spandau-bib-01' },
    { id:Q6, placement_id:P6, short_code:'dt-kh01', target_url:'https://example.com/digitale-teilhabe', active:true, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'digitale-teilhabe-spandau', utm_content:'dt-spandau-kh-01' },
    { id:Q7, placement_id:P7, short_code:'bfa-gp01', target_url:'https://example.com/bildung-fuer-alle', active:true, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-nk-grop-01' },
    { id:Q8, placement_id:P8, short_code:'bfa-rm01', target_url:'https://example.com/bildung-fuer-alle', active:false, utm_source:'poster', utm_medium:'offline_qr', utm_campaign:'bildung-fuer-alle-2026', utm_content:'bfa-mitte-rat-01' },
  ]);

  const re = (qr,pl,ca,sc,et,dt,ip,dest,ts) => ({qr_code_id:qr,placement_id:pl,campaign_id:ca,short_code:sc,event_type:et,device_type:dt,ip_hash:ip,destination_url:dest||null,created_at:ts});
  await ins('redirect_events', [
    re(Q1,P1,C1,'bfa-sb01','qr_open','mobile','h1','https://example.com/bildung-fuer-alle','2026-03-16T14:23:00Z'),
    re(Q1,P1,C1,'bfa-sb01','qr_open','mobile','h2','https://example.com/bildung-fuer-alle','2026-03-17T10:15:00Z'),
    re(Q1,P1,C1,'bfa-sb01','qr_open','mobile','h3','https://example.com/bildung-fuer-alle','2026-03-18T16:30:00Z'),
    re(Q1,P1,C1,'bfa-sb01','qr_open','tablet','h4','https://example.com/bildung-fuer-alle','2026-03-19T09:00:00Z'),
    re(Q1,P1,C1,'bfa-sb01','qr_open','mobile','h5','https://example.com/bildung-fuer-alle','2026-03-20T11:45:00Z'),
    re(Q2,P2,C1,'bfa-sb02','qr_open','mobile','h6','https://example.com/bildung-fuer-alle','2026-03-17T15:00:00Z'),
    re(Q2,P2,C1,'bfa-sb02','qr_open','mobile','h7','https://example.com/bildung-fuer-alle','2026-03-18T14:20:00Z'),
    re(Q2,P2,C1,'bfa-sb02','qr_open','desktop','h8','https://example.com/bildung-fuer-alle','2026-03-20T10:00:00Z'),
    re(Q3,P3,C1,'bfa-jz01','qr_open','mobile','h9','https://example.com/bildung-fuer-alle','2026-03-18T13:00:00Z'),
    re(Q3,P3,C1,'bfa-jz01','qr_open','mobile','h10','https://example.com/bildung-fuer-alle','2026-03-19T16:45:00Z'),
    re(Q4,P4,C1,'bfa-zl01','qr_open','mobile','h11','https://example.com/bildung-fuer-alle','2026-03-21T12:00:00Z'),
    re(Q4,P4,C1,'bfa-zl01','qr_open','mobile','h12','https://example.com/bildung-fuer-alle','2026-03-22T14:30:00Z'),
    re(Q4,P4,C1,'bfa-zl01','qr_open','tablet','h13','https://example.com/bildung-fuer-alle','2026-03-23T09:15:00Z'),
    re(Q4,P4,C1,'bfa-zl01','qr_open','mobile','h14','https://example.com/bildung-fuer-alle','2026-03-24T17:00:00Z'),
    re(Q5,P5,C2,'dt-sb01','qr_open','mobile','h15','https://example.com/digitale-teilhabe','2026-04-02T11:00:00Z'),
    re(Q5,P5,C2,'dt-sb01','qr_open','mobile','h16','https://example.com/digitale-teilhabe','2026-04-03T14:30:00Z'),
    re(Q7,P7,C1,'bfa-gp01','qr_open','mobile','h17','https://example.com/bildung-fuer-alle','2026-03-23T15:00:00Z'),
    re(Q7,P7,C1,'bfa-gp01','qr_open','mobile','h18','https://example.com/bildung-fuer-alle','2026-03-25T10:00:00Z'),
    re(Q8,P8,C1,'bfa-rm01','qr_blocked_inactive','mobile','h19',null,'2026-03-27T12:00:00Z'),
  ]);

  const pe = (et,qr,pl,ca,sid,url,ts) => ({event_type:et,qr_code_id:qr,placement_id:pl,campaign_id:ca,session_id:sid,page_url:url,created_at:ts});
  await ins('page_events', [
    pe('landing_page_view',Q1,P1,C1,'ses1','https://example.com/bildung-fuer-alle','2026-03-16T14:23:05Z'),
    pe('cta_click',Q1,P1,C1,'ses1','https://example.com/bildung-fuer-alle','2026-03-16T14:24:00Z'),
    pe('form_start',Q1,P1,C1,'ses1','https://example.com/bildung-fuer-alle/anmelden','2026-03-16T14:25:00Z'),
    pe('form_submit',Q1,P1,C1,'ses1','https://example.com/bildung-fuer-alle/anmelden','2026-03-16T14:27:00Z'),
    pe('landing_page_view',Q2,P2,C1,'ses2','https://example.com/bildung-fuer-alle','2026-03-17T15:00:05Z'),
    pe('cta_click',Q2,P2,C1,'ses2','https://example.com/bildung-fuer-alle','2026-03-17T15:01:00Z'),
    pe('landing_page_view',Q4,P4,C1,'ses3','https://example.com/bildung-fuer-alle','2026-03-21T12:00:05Z'),
    pe('cta_click',Q4,P4,C1,'ses3','https://example.com/bildung-fuer-alle','2026-03-21T12:01:00Z'),
    pe('form_start',Q4,P4,C1,'ses3','https://example.com/bildung-fuer-alle/anmelden','2026-03-21T12:02:00Z'),
    pe('form_submit',Q4,P4,C1,'ses3','https://example.com/bildung-fuer-alle/anmelden','2026-03-21T12:04:00Z'),
    pe('landing_page_view',Q5,P5,C2,'ses4','https://example.com/digitale-teilhabe','2026-04-02T11:00:05Z'),
    pe('cta_click',Q5,P5,C2,'ses4','https://example.com/digitale-teilhabe','2026-04-02T11:01:00Z'),
    pe('file_download',Q5,P5,C2,'ses4','https://example.com/digitale-teilhabe','2026-04-02T11:02:00Z'),
  ]);

  await ins('qr_status_history', [
    {qr_code_id:Q1,action:'created',note:'Erstellt für Bibliothek Spandau Eingang'},
    {qr_code_id:Q2,action:'created',note:'Erstellt für Bibliothek Spandau Jugendbereich'},
    {qr_code_id:Q3,action:'created',note:'Erstellt für Jugendzentrum Spandau'},
    {qr_code_id:Q4,action:'created',note:'Erstellt für ZLB Mitte'},
    {qr_code_id:Q5,action:'created',note:'Erstellt für Digitale Teilhabe Bibliothek'},
    {qr_code_id:Q6,action:'created',note:'Erstellt für Kulturhaus Spandau'},
    {qr_code_id:Q7,action:'created',note:'Erstellt für Gropiusstadt'},
    {qr_code_id:Q8,action:'created',note:'Erstellt für Rathaus Mitte'},
    {qr_code_id:Q8,action:'deactivated',note:'Poster entfernt, QR-Code deaktiviert'},
  ]);

  console.log('\nFertig!');
}
main().catch(console.error);
