export const allAuthors = [
  {
    id: '1',
    name: 'Anthony',
    surname: 'Ruiz',
  },
  {
    id: '2',
    name: 'Sarah',
    surname: 'Dupont',
  },
  {
    id: '3',
    name: 'Jean',
    surname: 'Saez',
  },
  {
    id: '4',
    name: 'Séverine',
    surname: 'Duclos',
  },
  {
    id: '5',
    name: 'Frédéric',
    surname: 'Urien',
  },
];

export const allLanguages = [
  {
    id: 'ENG',
    name: 'English',
  },
  {
    id: 'FR',
    name: 'French',
  },
  {
    id: 'ESP',
    name: 'Spanish',
  },
];

export const allSubjects = [
  {
    id: '1.16',
    subject: 'KARST HYDROTHERMAL',
  },
  {
    id: '2.22',
    subject: 'EUROPE OCCIDENTALE ET CENTRALE',
  },
  {
    id: '2.3',
    subject: 'ASIE',
  },
  {
    id: '4.2',
    subject: 'HISTOIRE DE LA SPÉLÉOLOGIE',
  },
  {
    id: '7.1',
    subject:
      "TECHNIQUE ET MATÉRIEL D' EXPLORATION : Équipement personnel, techniques de progression, explosifs, logistique.",
  },
];

export const allEditors = [
  {
    id: '1',
    name: 'The Slovak Museum of Natural Protection and Speleology',
  },
  {
    id: '2',
    name: 'Star publications',
  },
  {
    id: '3',
    name: 'Editions Gypaète',
  },
  {
    id: '4',
    name: 'Editions Glénat',
  },
  {
    id: '5',
    name: 'The Office of National Museums',
  },
  {
    id: '324',
    name: 'Fédération Française de Spéléologie',
  },
];

export const allLibraries = [
  {
    id: '1',
    name: 'Centre de documentació espeleologica',
  },
  {
    id: '2',
    name: 'Centre Documentation; Union Belge de Spéléologie UBS/SSW',
  },
  {
    id: '3',
    name:
      'Bibliothèque centrale Société Suisse de Spéléologie / Centre Documentation UIS',
  },
  {
    id: '4',
    name: 'Bibliothèque du centre d’hydrogéologie de l’université de Neuchâtel',
  },
  {
    id: '5',
    name: 'Société spéléologique Hellenique',
  },
];

export const allRegions = [
  {
    id: '1',
    name: 'E13 - Espagne Navarre (Navarra)',
  },
  {
    id: '2',
    name:
      'F/B - France Bourgogne. Côte d´Or (21); Nièvre (58); Saône et Loire (71); Yonne (89)',
  },
  {
    id: '3',
    name:
      'F/F - France Midi/Pyrénées. Ariège (09); Aveyron (12); Haute Garonne (31); Gers (32); Lot (46); Hautes Pyrénées (65); Tarn (81); Tarn et Garonne (82)',
  },
  {
    id: '4',
    name: 'GR02 - Grèce Macédoine; Thraki',
  },
  {
    id: '5',
    name: 'SCH - Suisse',
  },
];

export const allPartOf = [
  {
    id: '10',
    name: 'Spelunca',
    documentType: {
      id: 1,
      name: 'Collection',
    },
    editor: allEditors[5],
    identifier: '0242-1771',
    identifierType: {
      id: '3',
      name: 'ISSN',
    },
  },
  {
    id: '1',
    name: 'Spelunca',
    issue: 'n°100',
    partOf: {
      id: '10',
      name: 'Spelunca',
      documentType: {
        id: 1,
        name: 'Collection',
      },
      editor: allEditors[5],
    },
    editor: allEditors[5],
    library: allLibraries[1],
    documentType: {
      id: 2,
      name: 'Collection Element',
    },
  },
  {
    id: '20',
    name: 'Spéléoscope',
    documentType: {
      id: 1,
      name: 'Collection',
    },
    editor: allEditors[5],
    identifier: '2102-3751',
    identifierType: {
      id: '3',
      name: 'ISSN',
    },
  },
  {
    id: '2',
    name: 'Spéléoscope',
    issue: 'n°19',
    partOf: {
      id: '20',
      name: 'Spéléoscope',
      documentType: {
        id: 1,
        name: 'Collection',
      },
    },
    documentType: {
      id: 2,
      name: 'Collection Element',
    },
  },
  {
    id: '3',
    name: 'Spéléoscope',
    issue: 'n°20',
    partOf: {
      id: '20',
      name: 'Spéléoscope',
      documentType: {
        id: 1,
        name: 'Collection',
      },
    },
    documentType: {
      id: 2,
      name: 'Collection Element',
    },
  },
];

export const allMassifs = [
  {
    id: '1',
    name: 'Parmelan (massif du)',
  },
  {
    id: '2',
    name: 'Picos de Europa',
  },
  {
    id: '3',
    name: 'Vosges (massif des)',
  },
  {
    id: '4',
    name: 'Jura vaudois',
  },
  {
    id: '5',
    name: 'Pyrénées',
  },
];

export const allIdentifierTypes = [
  {
    id: '1',
    text: 'DOI',
  },
  {
    id: '2',
    text: 'ISBN',
  },
  {
    id: '3',
    text: 'ISSN',
  },
  {
    id: '4',
    text: 'URL',
  },
];
