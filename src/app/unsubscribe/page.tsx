import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Abmelden — Spurig',
  description: 'Outbound-Mail von Spurig abbestellen',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ l?: string }>;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const leadId = params.l;

  let status: 'done' | 'invalid' | 'not_found' = 'invalid';
  let name: string | null = null;

  if (leadId && /^[a-f0-9-]{36}$/i.test(leadId)) {
    const sb = await createServiceClient();
    const { data: lead } = await sb
      .from('outbound_leads')
      .select('id, name')
      .eq('id', leadId)
      .maybeSingle();

    if (lead) {
      await sb
        .from('outbound_leads')
        .update({ status: 'do_not_contact', notes: 'Unsubscribed via link' })
        .eq('id', leadId);
      status = 'done';
      name = lead.name;
    } else {
      status = 'not_found';
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">{status === 'done' ? '✓' : '·'}</div>

        {status === 'done' && (
          <>
            <h1 className="text-2xl font-semibold">Du bist abgemeldet</h1>
            <p className="text-muted-foreground">
              {name ? <><strong>{name}</strong> bekommt</> : 'Du bekommst'} keine weiteren
              Mails mehr von uns. Falls das versehentlich war, melde dich gern unter{' '}
              <a href="mailto:david@spurig.com" className="underline">david@spurig.com</a>.
            </p>
          </>
        )}

        {status === 'not_found' && (
          <>
            <h1 className="text-2xl font-semibold">Eintrag nicht gefunden</h1>
            <p className="text-muted-foreground">
              Der Abmelde-Link ist abgelaufen oder ungültig. Antworte einfach auf eine unserer Mails mit „stop" — dann nehmen wir dich manuell raus.
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-2xl font-semibold">Kein gültiger Link</h1>
            <p className="text-muted-foreground">
              Bitte nutze den Abmelde-Link aus deiner E-Mail. Falls du den nicht hast,
              antworte mit „stop" oder schreib an david@spurig.com.
            </p>
          </>
        )}

        <div className="pt-4 border-t border-border">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Spurig.com
          </a>
        </div>
      </div>
    </main>
  );
}
