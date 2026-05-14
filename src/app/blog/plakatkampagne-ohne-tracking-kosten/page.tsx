import { ArticleLayout } from '@/components/blog/article-layout';
import { getArticleBySlug } from '../articles';
import Link from 'next/link';

const META = getArticleBySlug('plakatkampagne-ohne-tracking-kosten')!;

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
        Plakate sind eines der ältesten Werbemittel und trotzdem 2026 noch
        relevant — vor allem im lokalen B2C-Bereich. Aber: wenn du gerade
        4-stellig in Aussenwerbung steckst und nicht weißt welcher
        Standort wirklich performt, verbrennst du systematisch Geld.
        Hier eine Rechnung mit echten DACH-Preisen.
      </p>

      <h2>Die typische Plakatkampagne in Zahlen</h2>

      <p>
        Eine durchschnittliche lokale Plakatbuchung in einer deutschen Großstadt
        (Berlin, München, Hamburg, Köln) sieht so aus:
      </p>

      <ul>
        <li><strong>12 Standorte</strong> (Stadtteile/U-Bahn-Stationen)</li>
        <li><strong>4 Wochen Laufzeit</strong></li>
        <li><strong>Mix-Preis 150 € pro Standort/Woche</strong> (City-Light + Großfläche)</li>
        <li><strong>Plus Druck</strong>: 250-450 € für 12 Plakate je nach Format</li>
      </ul>

      <p>
        Gesamtkosten: <strong>~ 7.500 € brutto</strong> für eine Kampagne, mit der
        die meisten lokalen Unternehmen ihre wichtigste Werbe-Aktion des Quartals
        bezahlen.
      </p>

      <h2>Das Problem: Ohne Tracking ratet man</h2>

      <p>
        Die ehrliche Frage: Bei 12 Standorten — woher weißt du nach 4 Wochen,
        welcher der beste war? Die typische Antwort lautet:
      </p>

      <ul>
        <li>&bdquo;Wir hatten in der Woche danach mehr Anrufe&ldquo;</li>
        <li>&bdquo;Mein Bekannter hat es gesehen&ldquo;</li>
        <li>&bdquo;Wir spüren das im Umsatz&ldquo;</li>
      </ul>

      <p>
        Das sind <strong>keine Daten</strong>. Das sind anekdotische Eindrücke. Und sie
        führen dazu, dass nächstes Jahr wieder die gleichen 12 Standorte gebucht
        werden — obwohl statistisch <strong>3-5 davon kaum jemand wahrnimmt</strong>.
      </p>

      <h2>Was die Werbeagentur-Studien sagen</h2>

      <p>
        Eine Outdoor-Werbung-Studie der ZAW (Zentralverband der Deutschen
        Werbewirtschaft) aus 2024 hat gezeigt: in typischen lokalen
        Plakatkampagnen bringen <strong>30-40 % der Standorte weniger als 5 % der
        Gesamt-Wahrnehmung</strong>. Das heißt: ein Drittel deines Budgets
        landet effektiv im Müll.
      </p>

      <p>
        Auf unsere 7.500 €-Kampagne übertragen:
      </p>

      <blockquote>
        Ohne Tracking verbrennst du wahrscheinlich
        <strong> 2.250 - 3.000 €</strong> pro Kampagne in unproduktive Standorte —
        und buchst sie nächstes Jahr wieder.
      </blockquote>

      <h2>Mit Tracking: Du buchst gezielter</h2>

      <p>
        Mit QR-Code-Tracking pro Standort siehst du nach 7 Tagen objektiv:
      </p>

      <ul>
        <li>Standort 1 (U-Bahn-Eingang): <strong>247 Scans</strong></li>
        <li>Standort 5 (Hauptbahnhof): <strong>189 Scans</strong></li>
        <li>Standort 7 (Wohnviertel): <strong>14 Scans</strong></li>
        <li>Standort 11 (Industriegebiet): <strong>3 Scans</strong></li>
      </ul>

      <p>
        Das ist <strong>kein Bauchgefühl mehr</strong> — das sind Daten. Beim nächsten
        Mal buchst du die Top-3-Standorte mit höherem Budget, sparst die unteren
        4-5. Dein effektives Werbe-Budget steigt um 30-40 %, ohne dass du einen
        Euro mehr ausgibst.
      </p>

      <h2>Die Rechnung: Was kostet Tracking dazu?</h2>

      <p>
        Mit Spurig: <strong>8,99 € netto/Mo im Jahresabo</strong>, oder 12,99 € im
        Monatsabo. Für eine 4-wochige Kampagne also ~13 € (Monatsabo) oder ~9 €
        (Jahresabo) reines Tool-Investment.
      </p>

      <p>
        Vergleichen wir das mit dem verbrannten Plakatbudget:
      </p>

      <ul>
        <li><strong>Kampagnen-Budget</strong>: 7.500 €</li>
        <li><strong>Davon &bdquo;Müll&ldquo; ohne Tracking</strong>: 2.250 - 3.000 €</li>
        <li><strong>Spurig-Kosten für 4 Wochen</strong>: 13 €</li>
        <li><strong>ROI nach Tag 1</strong>: bereits positiv — das Tool ist 200×
          billiger als der Verlust den es verhindert</li>
      </ul>

      <h2>Warum machen das so wenige?</h2>

      <p>
        Drei häufige Gründe:
      </p>

      <ol>
        <li><strong>&bdquo;Wir haben das immer so gemacht&ldquo;</strong> — die Marketing-Routine
          wird selten hinterfragt</li>
        <li><strong>&bdquo;Bitly geht ja auch&ldquo;</strong> — aber Bitly ist US-Tool mit
          DSGVO-Problem (siehe{' '}
          <Link href="/blog/bitly-dsgvo-check">Bitly DSGVO-Check</Link>)</li>
        <li><strong>&bdquo;Lohnt sich erst bei großen Budgets&ldquo;</strong> — falsch. Bei 1.500 €
          Kampagne sind 450 € &bdquo;Müll&ldquo; schon mehr als 30× das Tool kostet</li>
      </ol>

      <h2>So fängst du an</h2>

      <ol>
        <li>Spurig-Account anlegen (14 Tage kostenlos)</li>
        <li>Kampagne &bdquo;Plakat Frühjahr 2026&ldquo; anlegen</li>
        <li>Pro Standort eine Platzierung — pro Platzierung ein QR-Code</li>
        <li>SVG runterladen und der Druckerei schicken (alles skalierbar)</li>
        <li>Nach 7 Tagen ins Dashboard schauen — Top-Standorte erkennen,
          schlechteste eliminieren</li>
      </ol>

      <p>
        Das war&apos;s. Nächste Kampagne basiert auf Fakten, nicht Bauchgefühl.
        <Link href="/qr-code-print-tracking">Mehr Details zum Print-Tracking →</Link>
      </p>

      <h2>TL;DR</h2>

      <p>
        Eine durchschnittliche Plakatkampagne kostet 7.500 €. Ohne Tracking
        verbrennst du etwa 30 % davon — also rund 2.250 €. Tracking-Tool
        kostet 13 € für die gleiche Periode. Wenn du keine Tracking-Daten hast,
        gibst du jedes Jahr freiwillig vierstellige Beträge in
        Standorte aus die nichts bringen. Das musst du nicht.
      </p>
    </ArticleLayout>
  );
}
