"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "de";

type Dict = {
  brandTagline: string;
  navHome: string;
  navReceiving: string;
  navInvoices: string;
  navInventory: string;
  navParts: string;
  navPo: string;
  aboutTrast: string;
  logOut: string;
  languageToggle: string;

  resetSeed: string;
  resetting: string;

  // dashboard
  welcome: string;
  dashboardIntro: string;
  tileDeliveryNotes: string;
  tilePendingScan: string;
  tilePendingInvoice: string;
  tileNotices: string;
  tileDuplicates: string;
  card1Title: string;
  card1Body: string;
  card2Title: string;
  card2Body: string;
  card3Title: string;
  card3Body: string;
  realVsSimulated: string;

  // receiving
  receivingTitle: string;
  incomingScanEvent: string;
  simulatedNoScanner: string;
  simulateScanBtn: string;
  working: string;
  pendingScanNote: string;
  systemCheckTitle: string;
  scanId: string;
  po: string;
  part: string;
  listedQty: string;
  systemFlag: string;
  lowConfidence: string;
  ambiguousHumanNote: string;
  leadConfirmationTitle: string;
  confirmOrCorrect: string;
  newDelivery: string;
  duplicateScanDiscard: string;
  received: string;
  damaged: string;
  accepted: string;
  damageDescription: string;
  damagePlaceholder: string;
  damagePhoto: string;
  simulatedPhoto: string;
  duplicateConfirmNote: string;
  confirmingAs: string;
  saving: string;
  confirmBtn: string;
  currentState: string;
  deliveryNotesLogged: string;
  colDn: string;
  colPo: string;
  colPart: string;
  colListedQty: string;
  colRda: string;
  colDamageEvidence: string;
  colLoggedVia: string;
  noReceipt: string;
  photoOnly: string;
  discardedDuplicatesTitle: string;
  colScan: string;
  colPoPart: string;
  colMatchedDn: string;
  colConfirmedAt: string;

  // invoices
  invoicesTitle: string;
  incomingInvoiceEvent: string;
  simulatedNoEdi: string;
  simulateInvoiceBtn: string;
  pendingInvoiceNote: string;
  reconciliationTitle: string;
  invoice: string;
  poPart: string;
  invoicedQty: string;
  sumAccepted: string;
  reconcilesClean: string;
  discrepancyOver: string;
  discrepancyUnder: string;
  evidenceTitle: string;
  colReceipt: string;
  colReceived: string;
  colDamaged: string;
  colAccepted: string;
  colNote: string;
  gapExplain1: string;
  gapExplain2: string;
  unexplainedByDamage: string;
  damagedRejectedOn: string;
  approvingAs: string;
  approveNoticeBtn: string;
  acknowledgeNoNotice: string;
  dismissWithoutAction: string;
  generatedNoticesTitle: string;
  simulatedNoticeWarning: string;
  invoiceFor: string;
  billed: string;
  acceptedTotal: string;
  discrepancyLabel: string;
  discrepancyLabelSuffix: string;
  approvedBy: string;

  // inventory
  inventoryLedgerTitle: string;
  receivedToDateByPart: string;
  receivedToDateNote: string;
  colOnHand: string;
  colLastMovement: string;
  noReceiptsYet: string;
  addNewStock: string;
  addStockNote: string;
  partLabel: string;
  quantityLabel: string;
  addingAs: string;
  addStockBtn: string;

  // parts
  partsQrTitle: string;
  addNewPart: string;
  addPartNote: string;
  skuLabel: string;
  nameLabel: string;
  descriptionLabel: string;
  startingQuantityLabel: string;
  addPartBtn: string;
  simulateOutboundScan: string;
  simulatedNoCamera: string;
  simulateScanNote: string;
  selectPartPlaceholder: string;
  selectPoPlaceholder: string;
  quantityOnDelivery: string;
  scanBtn: string;
  scanning: string;
  partsTitle: string;
  startingQuantityShown: string;
  noPartsYet: string;

  // po tracker
  poTrackerTitle: string;
  everyPoTitle: string;
  poStatusNote: string;
  colOrdered: string;
  colAcceptedSoFar: string;
  colStatus: string;
  noPosYet: string;
  statusOpen: string;
  statusInProcess: string;
  statusDelivered: string;
  statusClosed: string;

  // po detail
  allPos: string;
  timelineTitle: string;
  nothingLoggedYet: string;

  notFoundTitle: string;
  notFoundBody: string;
  backToDashboard: string;
};

const dict: Record<Locale, Dict> = {
  en: {
    brandTagline: "Case C04 · delivery vs. invoice reconciliation · SYNTHETIC DATA",
    navHome: "Home",
    navReceiving: "Receiving",
    navInvoices: "Invoice reconciliation",
    navInventory: "Inventory",
    navParts: "Parts & QR",
    navPo: "PO tracker",
    aboutTrast: "About trast",
    logOut: "Log out",
    languageToggle: "Switch to Deutsch",

    resetSeed: "Reset to seed state",
    resetting: "Resetting...",

    welcome: "Welcome",
    dashboardIntro:
      "Case C04. The client's pain: at the loading bay they record what arrived; later someone reconciles the invoice and cannot tell whether a difference is a shortage, a damaged item, a duplicate scan, or a second delivery. This prototype demonstrates a narrow slice of that workflow end-to-end, with a human confirming every write.",
    tileDeliveryNotes: "Delivery notes logged",
    tilePendingScan: "Pending scan awaiting confirmation",
    tilePendingInvoice: "Pending invoice awaiting review",
    tileNotices: "Discrepancy notices generated",
    tileDuplicates: "Duplicate scans discarded",
    card1Title: "1. Receiving",
    card1Body:
      "Simulate an incoming delivery-note scan, see the system's new-vs-duplicate flag with its reasoning, then confirm or correct it as the parts receiving lead.",
    card2Title: "2. Invoice reconciliation",
    card2Body:
      "Simulate an incoming invoice, reconcile it against the sum of accepted quantities across linked delivery notes, review the evidence, and approve (or not) a simulated discrepancy notice.",
    card3Title: "3. Inventory",
    card3Body: "See received-to-date by part, summed live from accepted receipts, and add new stock as the parts receiving lead.",
    realVsSimulated: "What's real vs. simulated in this prototype →",

    receivingTitle: "Receiving",
    incomingScanEvent: "Incoming delivery note event",
    simulatedNoScanner: "Simulated — no real scanner",
    simulateScanBtn: "Simulate incoming delivery note",
    working: "Working...",
    pendingScanNote: "A scan is pending parts receiving lead confirmation below — resolve it before simulating another.",
    systemCheckTitle: "System check against open POs",
    scanId: "Scan ID",
    po: "PO",
    part: "Part",
    listedQty: "Listed qty",
    systemFlag: "System flag",
    lowConfidence: " (low confidence)",
    ambiguousHumanNote: "The system will not guess here — a human must decide new vs. duplicate below.",
    leadConfirmationTitle: "Parts receiving lead confirmation (required before anything is saved)",
    confirmOrCorrect: "Confirm or correct the flag:",
    newDelivery: "New delivery",
    duplicateScanDiscard: "Duplicate scan (discard)",
    received: "Received",
    damaged: "Damaged",
    accepted: "Accepted",
    damageDescription: "Damage description",
    damagePlaceholder: "what's damaged, how",
    damagePhoto: "Damage photo (optional if description given)",
    simulatedPhoto: "Simulated — photo never leaves this prototype",
    duplicateConfirmNote:
      "Confirming this as a duplicate discards the scan — no new delivery note or receipt is created. The discard itself is logged for audit.",
    confirmingAs: "Confirming as",
    saving: "Saving...",
    confirmBtn: "Confirm",
    currentState: "Current state",
    deliveryNotesLogged: "Delivery notes logged",
    colDn: "DN",
    colPo: "PO",
    colPart: "Part",
    colListedQty: "Listed qty",
    colRda: "Received / Damaged / Accepted",
    colDamageEvidence: "Damage evidence",
    colLoggedVia: "Logged via",
    noReceipt: "(no receipt)",
    photoOnly: "(photo only)",
    discardedDuplicatesTitle: "Discarded duplicate scans (audit log)",
    colScan: "Scan",
    colPoPart: "PO / Part",
    colMatchedDn: "Matched DN",
    colConfirmedAt: "Confirmed at",

    invoicesTitle: "Invoice reconciliation",
    incomingInvoiceEvent: "Incoming invoice event",
    simulatedNoEdi: "Simulated — no real EDI/accounting feed",
    simulateInvoiceBtn: "Simulate incoming invoice",
    pendingInvoiceNote: "An invoice review is pending below — resolve it before simulating another.",
    reconciliationTitle: "Reconciliation",
    invoice: "Invoice",
    poPart: "PO / Part",
    invoicedQty: "Invoiced qty",
    sumAccepted: "Sum of accepted",
    reconcilesClean: "Reconciles cleanly — no discrepancy",
    discrepancyOver: "Discrepancy: invoice overcharges by",
    discrepancyUnder: "Discrepancy: invoice undercharges by",
    evidenceTitle: "Evidence, why (by delivery note / receipt)",
    colReceipt: "Receipt",
    colReceived: "Received",
    colDamaged: "Damaged",
    colAccepted: "Accepted",
    colNote: "Note",
    gapExplain1: "Invoice bills",
    gapExplain2: "; delivery notes above accepted",
    unexplainedByDamage: "unexplained by damage, see evidence rows above",
    damagedRejectedOn: "damaged/rejected on",
    approvingAs: "Approving as",
    approveNoticeBtn: "Approve discrepancy notice (simulated)",
    acknowledgeNoNotice: "Acknowledge, no notice needed",
    dismissWithoutAction: "Dismiss without action",
    generatedNoticesTitle: "Generated discrepancy notices",
    simulatedNoticeWarning: "SIMULATED — displayed only. Nothing is actually sent to a supplier or posted to accounting.",
    invoiceFor: "Invoice",
    billed: "for",
    acceptedTotal: "billed",
    discrepancyLabel: "accepted total",
    discrepancyLabelSuffix: "discrepancy",
    approvedBy: "Approved by",

    inventoryLedgerTitle: "Inventory ledger",
    receivedToDateByPart: "Received-to-date by part",
    receivedToDateNote: "Not a live stock count — cumulative accepted quantity received to date, per part.",
    colOnHand: "Received-to-date (accepted)",
    colLastMovement: "Last movement",
    noReceiptsYet: "No receipts logged yet.",
    addNewStock: "Add new stock",
    addStockNote: "Never reaches a real supplier or inventory-of-record system.",
    partLabel: "Part",
    quantityLabel: "Quantity",
    addingAs: "Adding as",
    addStockBtn: "Add stock",

    partsQrTitle: "Parts & QR",
    addNewPart: "Add new part",
    addPartNote: "Creates an inventory-master record and generates its QR. Prototype identifier only — not a real GS1/barcode standard.",
    skuLabel: "SKU",
    nameLabel: "Name",
    descriptionLabel: "Description",
    startingQuantityLabel: "Starting quantity",
    addPartBtn: "Add part + generate QR",
    simulateOutboundScan: "Simulate outbound scan",
    simulatedNoCamera: "Simulated — no real scanner/camera",
    simulateScanNote: "Scan a part's QR against an open PO. Feeds the same classify/confirm flow as the Receiving page — go there next to resolve it.",
    selectPartPlaceholder: "Select a part...",
    selectPoPlaceholder: "Select a PO...",
    quantityOnDelivery: "Quantity on this delivery",
    scanBtn: "Simulate scan",
    scanning: "Scanning...",
    partsTitle: "Parts",
    startingQuantityShown: "Starting quantity",
    noPartsYet: "No parts yet — add one above.",

    poTrackerTitle: "PO tracker",
    everyPoTitle: "Every PO, from creation until fully resolved",
    poStatusNote:
      "Status computed live from delivery notes, receipts and approved discrepancy notices — never a separate flag to keep in sync. A PO stays open/in-process indefinitely if never fully resolved.",
    colOrdered: "Ordered",
    colAcceptedSoFar: "Accepted so far",
    colStatus: "Status",
    noPosYet: "No POs yet.",
    statusOpen: "open",
    statusInProcess: "in process",
    statusDelivered: "delivered",
    statusClosed: "closed",

    allPos: "all POs",
    timelineTitle: "Timeline",
    nothingLoggedYet: "Nothing logged yet — still open.",

    notFoundTitle: "Page not found",
    notFoundBody: "That page doesn't exist in this prototype.",
    backToDashboard: "Back to dashboard",
  },
  de: {
    brandTagline: "Fall C04 · Abgleich Lieferung/Rechnung · SYNTHETISCHE DATEN",
    navHome: "Start",
    navReceiving: "Wareneingang",
    navInvoices: "Rechnungsabgleich",
    navInventory: "Bestand",
    navParts: "Teile & QR",
    navPo: "Bestellverfolgung",
    aboutTrast: "Über trast",
    logOut: "Abmelden",
    languageToggle: "Switch to English",

    resetSeed: "Auf Ausgangszustand zurücksetzen",
    resetting: "Wird zurückgesetzt...",

    welcome: "Willkommen",
    dashboardIntro:
      "Fall C04. Das Problem des Kunden: An der Laderampe wird erfasst, was ankommt; später gleicht jemand die Rechnung ab und kann nicht erkennen, ob eine Abweichung eine Fehlmenge, eine Beschädigung, ein Doppelscan oder eine zweite Lieferung ist. Dieser Prototyp zeigt einen schmalen Ausschnitt dieses Arbeitsablaufs Ende-zu-Ende, wobei ein Mensch jede Schreibaktion bestätigt.",
    tileDeliveryNotes: "Erfasste Lieferscheine",
    tilePendingScan: "Scan wartet auf Bestätigung",
    tilePendingInvoice: "Rechnung wartet auf Prüfung",
    tileNotices: "Erstellte Abweichungsmeldungen",
    tileDuplicates: "Verworfene Doppelscans",
    card1Title: "1. Wareneingang",
    card1Body:
      "Simuliere einen eingehenden Lieferschein-Scan, sieh die Neu-vs-Duplikat-Einstufung des Systems mit Begründung und bestätige oder korrigiere sie als Wareneingangsleitung.",
    card2Title: "2. Rechnungsabgleich",
    card2Body:
      "Simuliere eine eingehende Rechnung, gleiche sie mit der Summe der akzeptierten Mengen aus verknüpften Lieferscheinen ab, prüfe die Nachweise und genehmige (oder nicht) eine simulierte Abweichungsmeldung.",
    card3Title: "3. Bestand",
    card3Body: "Sieh den bisher erhaltenen Bestand je Teil, live aus akzeptierten Wareneingängen summiert, und erfasse neuen Bestand als Wareneingangsleitung.",
    realVsSimulated: "Was in diesem Prototyp echt vs. simuliert ist →",

    receivingTitle: "Wareneingang",
    incomingScanEvent: "Eingehendes Lieferschein-Ereignis",
    simulatedNoScanner: "Simuliert — kein echter Scanner",
    simulateScanBtn: "Eingehenden Lieferschein simulieren",
    working: "Wird bearbeitet...",
    pendingScanNote: "Unten wartet ein Scan auf die Bestätigung der Wareneingangsleitung — erst klären, bevor ein weiterer simuliert wird.",
    systemCheckTitle: "Systemprüfung gegen offene Bestellungen",
    scanId: "Scan-ID",
    po: "Bestellung",
    part: "Teil",
    listedQty: "Gelistete Menge",
    systemFlag: "Systemeinstufung",
    lowConfidence: " (geringe Sicherheit)",
    ambiguousHumanNote: "Das System rät hier nicht — ein Mensch muss unten zwischen Neu und Duplikat entscheiden.",
    leadConfirmationTitle: "Bestätigung der Wareneingangsleitung (erforderlich, bevor etwas gespeichert wird)",
    confirmOrCorrect: "Einstufung bestätigen oder korrigieren:",
    newDelivery: "Neue Lieferung",
    duplicateScanDiscard: "Doppelscan (verwerfen)",
    received: "Erhalten",
    damaged: "Beschädigt",
    accepted: "Akzeptiert",
    damageDescription: "Schadensbeschreibung",
    damagePlaceholder: "was ist beschädigt, wie",
    damagePhoto: "Schadensfoto (optional bei vorhandener Beschreibung)",
    simulatedPhoto: "Simuliert — Foto verlässt diesen Prototyp nie",
    duplicateConfirmNote:
      "Die Bestätigung als Duplikat verwirft den Scan — es wird kein neuer Lieferschein oder Wareneingang erstellt. Das Verwerfen selbst wird für die Prüfung protokolliert.",
    confirmingAs: "Bestätigung durch",
    saving: "Wird gespeichert...",
    confirmBtn: "Bestätigen",
    currentState: "Aktueller Zustand",
    deliveryNotesLogged: "Erfasste Lieferscheine",
    colDn: "Lieferschein",
    colPo: "Bestellung",
    colPart: "Teil",
    colListedQty: "Gelistete Menge",
    colRda: "Erhalten / Beschädigt / Akzeptiert",
    colDamageEvidence: "Schadensnachweis",
    colLoggedVia: "Erfasst über",
    noReceipt: "(kein Wareneingang)",
    photoOnly: "(nur Foto)",
    discardedDuplicatesTitle: "Verworfene Doppelscans (Prüfprotokoll)",
    colScan: "Scan",
    colPoPart: "Bestellung / Teil",
    colMatchedDn: "Zugeordneter Lieferschein",
    colConfirmedAt: "Bestätigt am",

    invoicesTitle: "Rechnungsabgleich",
    incomingInvoiceEvent: "Eingehendes Rechnungsereignis",
    simulatedNoEdi: "Simuliert — kein echter EDI-/Buchhaltungs-Feed",
    simulateInvoiceBtn: "Eingehende Rechnung simulieren",
    pendingInvoiceNote: "Unten wartet eine Rechnungsprüfung — erst klären, bevor eine weitere simuliert wird.",
    reconciliationTitle: "Abgleich",
    invoice: "Rechnung",
    poPart: "Bestellung / Teil",
    invoicedQty: "Rechnungsmenge",
    sumAccepted: "Summe akzeptiert",
    reconcilesClean: "Stimmt vollständig überein — keine Abweichung",
    discrepancyOver: "Abweichung: Rechnung überhöht um",
    discrepancyUnder: "Abweichung: Rechnung zu niedrig um",
    evidenceTitle: "Nachweise, Begründung (nach Lieferschein / Wareneingang)",
    colReceipt: "Wareneingang",
    colReceived: "Erhalten",
    colDamaged: "Beschädigt",
    colAccepted: "Akzeptiert",
    colNote: "Hinweis",
    gapExplain1: "Rechnung stellt",
    gapExplain2: "in Rechnung; obige Lieferscheine akzeptierten insgesamt",
    unexplainedByDamage: "nicht durch Beschädigung erklärt, siehe Nachweiszeilen oben",
    damagedRejectedOn: "beschädigt/abgelehnt bei",
    approvingAs: "Genehmigung durch",
    approveNoticeBtn: "Abweichungsmeldung genehmigen (simuliert)",
    acknowledgeNoNotice: "Zur Kenntnis genommen, keine Meldung nötig",
    dismissWithoutAction: "Ohne Aktion verwerfen",
    generatedNoticesTitle: "Erstellte Abweichungsmeldungen",
    simulatedNoticeWarning: "SIMULIERT — nur zur Anzeige. Es wird nichts tatsächlich an einen Lieferanten gesendet oder in die Buchhaltung gebucht.",
    invoiceFor: "Rechnung",
    billed: "für",
    acceptedTotal: "in Rechnung gestellt",
    discrepancyLabel: "Summe akzeptiert",
    discrepancyLabelSuffix: "Abweichung",
    approvedBy: "Genehmigt von",

    inventoryLedgerTitle: "Bestandsbuch",
    receivedToDateByPart: "Bisher erhalten je Teil",
    receivedToDateNote: "Kein Live-Bestandszähler — kumulierte akzeptierte Menge, bisher je Teil erhalten.",
    colOnHand: "Bisher erhalten (akzeptiert)",
    colLastMovement: "Letzte Bewegung",
    noReceiptsYet: "Noch keine Wareneingänge erfasst.",
    addNewStock: "Neuen Bestand erfassen",
    addStockNote: "Erreicht nie einen echten Lieferanten oder ein Bestandsführungssystem.",
    partLabel: "Teil",
    quantityLabel: "Menge",
    addingAs: "Erfassung durch",
    addStockBtn: "Bestand hinzufügen",

    partsQrTitle: "Teile & QR",
    addNewPart: "Neues Teil anlegen",
    addPartNote: "Erstellt einen Stammdatensatz und erzeugt den QR-Code. Nur Prototyp-Kennung — kein echter GS1-/Barcode-Standard.",
    skuLabel: "Artikelnummer",
    nameLabel: "Name",
    descriptionLabel: "Beschreibung",
    startingQuantityLabel: "Startmenge",
    addPartBtn: "Teil anlegen + QR erzeugen",
    simulateOutboundScan: "Ausgangsscan simulieren",
    simulatedNoCamera: "Simuliert — kein echter Scanner/Kamera",
    simulateScanNote: "QR-Code eines Teils gegen eine offene Bestellung scannen. Nutzt denselben Einstufungs-/Bestätigungsablauf wie der Wareneingang — dort als Nächstes klären.",
    selectPartPlaceholder: "Teil auswählen...",
    selectPoPlaceholder: "Bestellung auswählen...",
    quantityOnDelivery: "Menge dieser Lieferung",
    scanBtn: "Scan simulieren",
    scanning: "Wird gescannt...",
    partsTitle: "Teile",
    startingQuantityShown: "Startmenge",
    noPartsYet: "Noch keine Teile — oben eines anlegen.",

    poTrackerTitle: "Bestellverfolgung",
    everyPoTitle: "Jede Bestellung, von der Erstellung bis zur vollständigen Klärung",
    poStatusNote:
      "Status live berechnet aus Lieferscheinen, Wareneingängen und genehmigten Abweichungsmeldungen — nie ein separates Kennzeichen, das synchron gehalten werden muss. Eine Bestellung bleibt unbegrenzt offen/in Bearbeitung, wenn sie nie vollständig geklärt wird.",
    colOrdered: "Bestellt",
    colAcceptedSoFar: "Bisher akzeptiert",
    colStatus: "Status",
    noPosYet: "Noch keine Bestellungen.",
    statusOpen: "offen",
    statusInProcess: "in Bearbeitung",
    statusDelivered: "geliefert",
    statusClosed: "abgeschlossen",

    allPos: "alle Bestellungen",
    timelineTitle: "Verlauf",
    nothingLoggedYet: "Noch nichts protokolliert — weiterhin offen.",

    notFoundTitle: "Seite nicht gefunden",
    notFoundBody: "Diese Seite gibt es in diesem Prototyp nicht.",
    backToDashboard: "Zurück zum Dashboard",
  },
};

const LanguageContext = createContext<{ locale: Locale; t: Dict; toggle: () => void }>({
  locale: "en",
  t: dict.en,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("c04_locale");
    if (stored === "de" || stored === "en") setLocale(stored);
  }, []);

  function toggle() {
    const next: Locale = locale === "en" ? "de" : "en";
    setLocale(next);
    localStorage.setItem("c04_locale", next);
  }

  return (
    <LanguageContext.Provider value={{ locale, t: dict[locale], toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
