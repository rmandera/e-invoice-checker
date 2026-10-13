#!/usr/bin/env bash
# Downloads ZUGFeRD / Factur-X sample PDFs from the public ZUGFeRD corpus (Apache-2.0) into test/zugferd/.
# Not redistributed here; CI and developers fetch them.
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://raw.githubusercontent.com/ZUGFeRD/corpus/master"
rm -rf zugferd
mkdir -p zugferd/valid zugferd/outdated zugferd/zugferd1 zugferd/not-einvoice

# Current EN 16931 profile: must be valid.
for f in EN16931_1_Teilrechnung EN16931_2_Teilrechnung EN16931_AbweichenderZahlungsempf \
  EN16931_Betriebskostenabrechnung EN16931_Einfach EN16931_Einfach_DueDate EN16931_Elektron EN16931_Gutschrift \
  EN16931_Haftpflichtversicherung_Versicherungssteuer EN16931_Innergemeinschaftliche_Lieferungen \
  EN16931_Kraftfahrversicherung_Bruttopreise EN16931_Miete EN16931_OEPNV EN16931_Physiotherapeut EN16931_Rabatte \
  EN16931_Rechnungskorrektur EN16931_Reisekostenabrechnung EN16931_SEPA_Prenotification \
  EN16931_Sachversicherung_berechneter_Steuersatz; do
  curl -sSfL -o "zugferd/valid/$f.pdf" "$BASE/XML-Rechnung/FX/$f.pdf"
done

# Written against rules that have since changed, so current rules must reject them: four declare XRechnung 2.1
# (superseded by 3.0 on 1 February 2024), two use electronic-address scheme 9958 (removed from the EAS code list).
for f in EN16931_ElektronischeAdresse EN16931_RechnungsUebertragung XRECHNUNG_Betriebskostenabrechnung \
  XRECHNUNG_Einfach XRECHNUNG_Elektron XRECHNUNG_Reisekostenabrechnung; do
  curl -sSfL -o "zugferd/outdated/$f.pdf" "$BASE/XML-Rechnung/FX/$f.pdf"
done

# ZUGFeRD 1.0: recognised, and reported as no longer a valid e-invoice.
curl -sSfL -o zugferd/zugferd1/ZUGFeRD_1p0_COMFORT_Einfach.pdf "$BASE/ZUGFeRDv1/correct/Intarsys/ZUGFeRD_1p0_COMFORT_Einfach.pdf"
curl -sSfL -o zugferd/zugferd1/MustangBeispiel_504.pdf "$BASE/ZUGFeRDv1/correct/Mustangproject/MustangGnuaccountingBeispielRE-20151008_504.pdf"

# MINIMUM and BASIC WL profiles: not e-invoices under German law.
curl -sSfL -o zugferd/not-einvoice/Facture_FR_MINIMUM.pdf "$BASE/ZUGFeRDv2/correct/FNFE-factur-x-examples/Facture_FR_MINIMUM.pdf"
curl -sSfL -o zugferd/not-einvoice/Facture_FR_BASICWL.pdf "$BASE/ZUGFeRDv2/correct/FNFE-factur-x-examples/Facture_FR_BASICWL.pdf"

echo "ZUGFeRD corpus: $(find zugferd -name '*.pdf' | wc -l) PDFs"
