import { ArticleLayout } from '@/components/blog/article-layout';
import { getArticleBySlug } from '../articles';
import Link from 'next/link';

const META = getArticleBySlug('bitly-dsgvo-check')!;

export const metadata = {
  title: `${META.title} · Spurig Blog`,
  description: META.description,
  alternates: { canonical: `/blog/${META.slug}` },
  openGraph: {
    title: META.title,
    description: META.description,
    type: 'article',
    publishedTime: META.publishedAt,
    url: `https://spurig.com/blog/${META.slug}`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: META.title }],
  },
};

export default function Article() {
  return (
    <ArticleLayout meta={META}>
      <p>
        Bitly ist der bekannteste Kurzlink-Dienst der Welt — mehr als 70 % aller getrackten
        Kurzlinks weltweit laufen darüber. Auch in deutschen Marketing-Teams ist das
        Tool weit verbreitet. Aber spätestens seit dem Schrems-II-Urteil 2020 stellt sich
        die Frage: <strong>Ist Bitly überhaupt DSGVO-konform nutzbar?</strong>
      </p>

      <p>
        Die kurze Antwort: <em>Es ist kompliziert</em> — und für die meisten deutschen
        Unternehmen rechtlich heikel. Dieser Artikel erklärt warum, was du
        dagegen tun kannst, und welche Alternativen es gibt.
      </p>

      <h2>1. Wo das Problem liegt: Bitly ist ein US-Unternehmen</h2>

      <p>
        Bitly Inc. hat seinen Sitz in New York City und unterliegt damit dem
        US-Recht — insbesondere dem <strong>CLOUD Act</strong> (Clarifying Lawful Overseas
        Use of Data Act). Dieser erlaubt US-Behörden, von US-Unternehmen die
        Herausgabe von Daten zu fordern, auch wenn diese Daten auf Servern außerhalb
        der USA liegen.
      </p>

      <p>
        Aus DSGVO-Sicht heißt das: Selbst wenn Bitly Daten technisch in Europa
        speichern würde — die Übermittlungspflicht an US-Behörden bliebe bestehen.
        Genau dieser Konflikt war Kern des <strong>Schrems-II-Urteils</strong> des EuGH
        vom 16. Juli 2020.
      </p>

      <blockquote>
        Schrems II hat den Privacy Shield für ungültig erklärt und festgestellt:
        Standardvertragsklauseln allein reichen nicht — Unternehmen müssen zusätzlich
        prüfen ob im Empfängerland ein DSGVO-vergleichbares Schutzniveau besteht.
        Bei den USA ist die Antwort laut EuGH: nein.
      </blockquote>

      <h2>2. Welche Daten Bitly überhaupt sammelt</h2>

      <p>
        Bei jedem Bitly-Kurzlink-Klick werden mindestens diese Daten verarbeitet:
      </p>

      <ul>
        <li><strong>IP-Adresse</strong> des Klickenden (personenbezogenes Datum nach DSGVO Art. 4)</li>
        <li><strong>User-Agent</strong> (Browser, Betriebssystem, ggf. Gerät)</li>
        <li><strong>Referrer</strong> (von welcher Seite kam der Klick)</li>
        <li><strong>Geo-Daten</strong> (per IP-Lookup: Stadt, Land)</li>
        <li><strong>Zeitstempel</strong></li>
        <li><strong>Tracking-Cookies</strong> in höheren Plänen für Cross-Device-Attribution</li>
      </ul>

      <p>
        Die IP-Adresse allein ist nach EuGH-Rechtsprechung (Breyer-Urteil 2016) ein
        personenbezogenes Datum — auch in &bdquo;pseudonymisierter&ldquo; Form. Damit greift die
        volle DSGVO.
      </p>

      <h2>3. Was Bitly als &bdquo;DSGVO-Compliance&ldquo; anbietet</h2>

      <p>
        Bitly hat einen DPA (Data Processing Agreement / Auftragsverarbeitungsvertrag)
        und nutzt Standardvertragsklauseln für den Datentransfer in die USA. In der
        Praxis bedeutet das:
      </p>

      <ol>
        <li>Du musst den AVV aktiv anfordern und unterschreiben (nicht jeder weiß das)</li>
        <li>Du musst eine <strong>Transfer Impact Assessment (TIA)</strong> durchführen — eine
          dokumentierte Risikoanalyse für den Drittlandtransfer</li>
        <li>Du musst <strong>zusätzliche technische Maßnahmen</strong> ergreifen, z. B.
          Pseudonymisierung, Zugriffsbeschränkungen, Audit-Logs</li>
        <li>Du musst deinen Datenschutz-Beauftragten und ggf. die Aufsichtsbehörde
          informieren</li>
      </ol>

      <p>
        Realistisch gesehen: <strong>kaum ein deutsches mittelständisches Unternehmen
        macht das vollständig</strong>. Die meisten setzen Bitly &bdquo;einfach so&ldquo; ein — und
        riskieren damit Bußgelder bis zu <strong>4 % vom Jahresumsatz</strong>.
      </p>

      <h2>4. Was die deutschen Aufsichtsbehörden sagen</h2>

      <p>
        Die Datenschutz-Konferenz (DSK) der Länder hat in mehreren Beschlüssen
        klargestellt: US-basierte Tracking-Dienste sind ohne explizite Einwilligung
        und vollständige Risiko-Analyse nicht zulässig. Insbesondere Google Analytics
        wurde mehrfach abgemahnt — die gleichen Argumente gelten 1:1 für Bitly.
      </p>

      <p>
        2024 hat die österreichische Datenschutzbehörde eine erste konkrete
        Entscheidung gegen einen Kurzlink-Dienst mit US-Hosting getroffen.
        Es ist nur eine Frage der Zeit bis solche Verfahren auch in Deutschland
        verbreitet sind.
      </p>

      <h2>5. Was die Alternative ist</h2>

      <p>
        Wer DSGVO-konform Kurzlinks und QR-Codes tracken will, hat im Wesentlichen
        zwei Optionen:
      </p>

      <h3>Option A: Selbst hosten</h3>
      <p>
        Open-Source-Tools wie YOURLS oder Polr selbst auf EU-Servern betreiben.
        Funktioniert, kostet aber Server-Setup, Wartung, SSL-Renewal,
        DB-Backup-Strategie — typischerweise 5-10 h Setup + monatlich 1-2 h Wartung.
      </p>

      <h3>Option B: EU-basierter SaaS</h3>
      <p>
        Deutsche oder europäische Anbieter mit Hosting in der EU. Spurig ist
        einer davon: Server in Frankfurt, IP-Anonymisierung ab Tag 1, keine
        Tracking-Cookies, kein Cookie-Banner nötig. Vollständige
        Datenschutz-Compliance ohne dass dein Datenschutz-Team eine
        Risiko-Analyse machen muss.
      </p>

      <p>
        Vergleich der beiden Lösungen findest du auf{' '}
        <Link href="/bitly-alternative">/bitly-alternative</Link> mit
        kompletter Feature-Tabelle und Preis-Übersicht.
      </p>

      <h2>Fazit</h2>

      <p>
        Bitly funktioniert technisch hervorragend — aber für deutsche Unternehmen
        ist die rechtliche Compliance ein erheblicher Aufwand, der in der Realität
        kaum vollständig umgesetzt wird. Wer auf der sicheren Seite sein will,
        wechselt auf einen EU-basierten Anbieter mit transparenter
        Datenschutz-Architektur.
      </p>

      <p>
        Spurig kostet 8,99 € netto/Mo im Jahresabo — etwa <strong>95 % weniger
        als Bitlys Growth-Plan</strong> (199 $/Mo), und braucht keine TIA.
        Du kannst es <Link href="/signup">14 Tage kostenlos testen</Link>,
        ohne Karte.
      </p>
    </ArticleLayout>
  );
}
