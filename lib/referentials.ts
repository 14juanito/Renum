// Référentiels initiaux (annexes A et B du cahier des charges) — modifiables via l'administration (EF-REF-01/02).

export const ADMIN_TYPES = [
  { code: "T01", label: "Institutions de la République", examples: "Présidence, Primature, Parlement, Cours et tribunaux" },
  { code: "T02", label: "Ministère / Secrétariat général", examples: "Cabinets ministériels et secrétariats généraux" },
  { code: "T03", label: "Direction / service central", examples: "Directions générales et directions techniques" },
  { code: "T04", label: "Établissement public", examples: "Établissements à caractère administratif, scientifique ou social" },
  { code: "T05", label: "Entreprise publique", examples: "Entreprises du portefeuille de l'État" },
  { code: "T06", label: "Agence / autorité de régulation", examples: "Agences et autorités sectorielles" },
  { code: "T07", label: "Gouvernorat de province", examples: "Administration provinciale et ses services" },
  { code: "T08", label: "Entité territoriale décentralisée", examples: "Ville, commune, secteur, chefferie" },
  { code: "T09", label: "Service déconcentré", examples: "Divisions provinciales, antennes locales" },
  { code: "T10", label: "Autre", examples: "À préciser (avec validation)" },
] as const;

export const CATEGORIES = [
  { code: "B01", label: "Équipements informatiques", examples: "Ordinateurs, imprimantes, scanners, serveurs, périphériques",
    keywords: ["ordinateur", "ordinateurs", "pc", "poste", "postes", "laptop", "portable", "imprimante", "imprimantes", "scanner", "serveur", "serveurs", "périphérique", "écran", "tablette", "photocopieuse", "matériel", "equipement", "équipement", "desktop", "clavier", "projecteur"] },
  { code: "B02", label: "Réseau et connectivité", examples: "Accès Internet, fibre, VSAT, réseau local, Wi-Fi, intranet",
    keywords: ["internet", "fibre", "vsat", "réseau", "reseau", "wifi", "wi-fi", "lan", "wan", "intranet", "connexion", "connectivité", "bande passante", "débit", "switch", "routeur", "câblage", "4g", "fai"] },
  { code: "B03", label: "Logiciels et applications métiers", examples: "Progiciels, gestion RH, finances, courrier, GED, licences",
    keywords: ["logiciel", "application", "progiciel", "erp", "licence", "licences", "gestion", "rh", "paie", "comptabilité", "courrier", "ged", "workflow", "office", "microsoft", "développement", "plateforme"] },
  { code: "B04", label: "Hébergement et cloud", examples: "Salle serveur, centre de données, hébergement mutualisé, sauvegardes",
    keywords: ["hébergement", "hebergement", "cloud", "datacenter", "data center", "centre de données", "salle serveur", "baie", "stockage", "nas", "san", "virtualisation", "sauvegarde", "backup"] },
  { code: "B05", label: "Cybersécurité", examples: "Pare-feu, antivirus, politique de sécurité, audit, sensibilisation",
    keywords: ["sécurité", "securite", "cybersécurité", "pare-feu", "firewall", "antivirus", "audit", "pentest", "intrusion", "chiffrement", "siem", "soc", "vulnérabilité", "mot de passe", "sensibilisation", "ransomware", "pssi"] },
  { code: "B06", label: "Données et interopérabilité", examples: "Bases de données, échanges entre systèmes, API, numérisation d'archives",
    keywords: ["données", "donnees", "base de données", "interopérabilité", "api", "numérisation", "archives", "archivage", "statistiques", "registre", "échange", "dématérialisation", "open data"] },
  { code: "B07", label: "Services en ligne aux usagers", examples: "Portails, téléservices, paiement en ligne, e-gouvernance",
    keywords: ["portail", "site web", "site internet", "téléservice", "e-service", "en ligne", "paiement", "usagers", "citoyens", "e-gouvernance", "guichet", "mobile money", "démarches"] },
  { code: "B08", label: "Énergie et continuité", examples: "Onduleurs, groupe électrogène, solaire, climatisation de salle serveur",
    keywords: ["onduleur", "onduleurs", "ups", "groupe électrogène", "générateur", "solaire", "panneaux", "énergie", "electricité", "électricité", "climatisation", "batterie", "délestage", "coupure"] },
  { code: "B09", label: "Compétences et formation", examples: "Formations, certification, recrutement de profils numériques",
    keywords: ["formation", "formations", "former", "certification", "compétences", "renforcement de capacités", "recrutement", "atelier", "agents", "bureautique", "capacités"] },
  { code: "B10", label: "Gouvernance et conduite du changement", examples: "Schéma directeur, politiques, accompagnement, cellule numérique",
    keywords: ["schéma directeur", "gouvernance", "stratégie", "politique", "conduite du changement", "accompagnement", "cellule", "pilotage", "étude", "consultance", "transformation"] },
  { code: "B11", label: "Support et maintenance", examples: "Contrats de maintenance, assistance, pièces de rechange",
    keywords: ["maintenance", "support", "assistance", "réparation", "pièces", "rechange", "contrat", "dépannage", "helpdesk", "garantie", "entretien"] },
  { code: "B12", label: "Autre", examples: "À préciser", keywords: [] },
] as const;

export const PROVINCES = [
  "Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Mai-Ndombe", "Kasaï", "Kasaï-Central", "Kasaï-Oriental",
  "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Ituri", "Haut-Uele", "Tshopo", "Bas-Uele",
  "Nord-Ubangi", "Mongala", "Sud-Ubangi", "Équateur", "Tshuapa", "Tanganyika", "Haut-Lomami", "Lualaba", "Haut-Katanga",
] as const;

export const PRIORITIES = [
  { code: "critique", label: "Critique", help: "Bloque une mission essentielle ou expose la structure à un risque majeur." },
  { code: "haute", label: "Haute", help: "Impact fort sur le service rendu ; à traiter dans l'année." },
  { code: "moyenne", label: "Moyenne", help: "Amélioration significative, sans urgence immédiate." },
  { code: "basse", label: "Basse", help: "Souhaitable, peut être reporté." },
] as const;

export const HORIZONS = [
  { code: "lt6", label: "Moins de 6 mois" },
  { code: "6to12", label: "6 à 12 mois" },
  { code: "gt12", label: "Plus d'un an" },
] as const;

export const COST_NATURES = [
  { code: "investissement", label: "Investissement (achat initial)" },
  { code: "fonctionnement", label: "Fonctionnement (récurrent annuel)" },
  { code: "mixte", label: "Les deux" },
] as const;

export const NEED_STATUS = {
  brouillon: "Brouillon", soumis: "Soumis", en_revue: "En revue", valide: "Validé",
  a_completer: "À compléter", rejete: "Rejeté", regroupe: "Regroupé",
} as const;

export const STRUCTURE_STATUS = {
  brouillon: "Brouillon", soumise: "Soumise", validee: "Validée", a_completer: "À compléter",
  rejetee: "Rejetée", archivee: "Archivée",
} as const;

export const ROLES = {
  responsable: "Responsable numérique",
  delegue: "Délégué / point focal",
  analyste: "Analyste",
  decideur: "Décideur",
  admin: "Administrateur",
} as const;

export const CIVILITIES = ["M.", "Mme"] as const;
export const POST_STATUS = [
  { code: "titulaire", label: "Titulaire" },
  { code: "interimaire", label: "Intérimaire" },
  { code: "de_fait", label: "Personne désignée de fait" },
] as const;

export const label = <T extends readonly { code: string; label: string }[]>(list: T, code?: string | null) =>
  list.find((x) => x.code === code)?.label ?? code ?? "—";
