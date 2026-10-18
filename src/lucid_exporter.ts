export interface CountryAggregate {
  count: number;
  cardboardG: number;
  plasticG: number;
  otherG: number;
}

export interface ExportConfig {
  lucidId: string;
  systemOp: string;
  citeoIdu: string;
  period: string;
}

export function generateGermanLucidXml(deStats: CountryAggregate | undefined, cfg: ExportConfig): string {
  const stats = deStats || { count: 0, cardboardG: 0, plasticG: 0, otherG: 0 };
  const deCardboardKg = (stats.cardboardG / 1000).toFixed(3);
  const dePlasticKg = (stats.plasticG / 1000).toFixed(3);
  const deOtherKg = (stats.otherG / 1000).toFixed(3);
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<Datenmeldung xmlns="https://lucid.verpackungsregister.org/schema/2026/VerpackDG">
  <Kopfdaten>
    <Registrierungsnummer>${cfg.lucidId || 'DE0000000000000'}</Registrierungsnummer>
    <Meldezeitraum>${cfg.period}</Meldezeitraum>
    <SystembetreiberCode>${cfg.systemOp}</SystembetreiberCode>
    <ErstelltAm>${today}</ErstelltAm>
    <Rechtsgrundlage>VerpackDG-PPWR-2026</Rechtsgrundlage>
  </Kopfdaten>
  <Verpackungsmengen SendungenGesamt="${stats.count}">
    <MaterialFraktion>
      <FraktionCode>PPK</FraktionCode>
      <Bezeichnung>Papier, Pappe, Karton</Bezeichnung>
      <MasseKg>${deCardboardKg}</MasseKg>
    </MaterialFraktion>
    <MaterialFraktion>
      <FraktionCode>KUNSTSTOFFE</FraktionCode>
      <Bezeichnung>Kunststoffe (LDPE Versandtaschen, Klebeband)</Bezeichnung>
      <MasseKg>${dePlasticKg}</MasseKg>
    </MaterialFraktion>
    <MaterialFraktion>
      <FraktionCode>GLAS_SONSTIGE</FraktionCode>
      <Bezeichnung>Glas und sonstige Schutzverpackung</Bezeichnung>
      <MasseKg>${deOtherKg}</MasseKg>
    </MaterialFraktion>
  </Verpackungsmengen>
</Datenmeldung>`;
}

export function generateEuCiteoCsv(
  byCountry: Record<string, CountryAggregate>,
  cfg: ExportConfig
): string {
  const authorities: Record<string, string> = {
    DE: 'ZSVR LUCID (VerpackDG)',
    FR: 'Citeo / Adelphe (IDU)',
    AT: 'ARA Austria',
    IT: 'CONAI Consortium',
    ES: 'MITECO Spain',
    NL: 'Verpact NL'
  };

  const lines = [
    'Country_Code,Registry_Authority,Merchant_Identifier,Period,Total_Shipments,Paper_Cardboard_KG,Plastics_KG,Glass_Other_KG'
  ];

  for (const code of ['DE', 'FR', 'AT', 'IT', 'ES', 'NL']) {
    const st = byCountry[code] || { count: 0, cardboardG: 0, plasticG: 0, otherG: 0 };
    const idUsed = code === 'DE' ? cfg.lucidId : code === 'FR' ? cfg.citeoIdu : `EU-PPWR-${code}`;
    lines.push(
      `${code},"${authorities[code]}",${idUsed},${cfg.period},${st.count},${(st.cardboardG / 1000).toFixed(3)},${(st.plasticG / 1000).toFixed(3)},${(st.otherG / 1000).toFixed(3)}`
    );
  }

  return lines.join('\n');
}
