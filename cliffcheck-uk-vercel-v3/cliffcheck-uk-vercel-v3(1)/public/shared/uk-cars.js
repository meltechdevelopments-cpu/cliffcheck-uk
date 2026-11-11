// ============================================================================
// CLIFFCHECK UK — FULL AUTOTRADER UK MAKE & MODEL DIRECTORY (50+ MAKES)
// ============================================================================
(function (root) {
  const UK_CAR_MAKES_MODELS = {
    "ABARTH": ["500", "500e", "595", "600e", "695", "124 Spider"],
    "ALFA ROMEO": ["Giulia", "Giulietta", "Junior", "MiTo", "Stelvio", "Tonale", "159", "Brera", "Spider"],
    "ASTON MARTIN": ["DB9", "DB11", "DB12", "DBX", "Rapide", "Vantage", "Vanquish"],
    "AUDI": [
      "A1", "A3", "A4", "A4 Allroad", "A5", "A6", "A6 Allroad", "A6 e-tron", "A7", "A8",
      "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "e-tron", "e-tron GT",
      "S1", "S3", "S4", "S5", "S6", "S7", "S8", "SQ2", "SQ5", "SQ7", "SQ8",
      "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "TT", "TTS", "TT RS", "R8"
    ],
    "BENTLEY": ["Bentayga", "Continental GT", "Continental GTC", "Flying Spur", "Mulsanne"],
    "BMW": [
      "1 Series", "2 Series", "2 Series Active Tourer", "2 Series Gran Coupe", "3 Series", "3 Series GT",
      "4 Series", "5 Series", "6 Series", "7 Series", "8 Series",
      "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM",
      "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3",
      "M2", "M3", "M4", "M5", "M8", "Z4"
    ],
    "BYD": ["Atto 3", "Dolphin", "Seal", "Seal U", "Seal U DM-i", "Tang"],
    "CHEVROLET": ["Aveo", "Camaro", "Captiva", "Corvette", "Cruze", "Orlando", "Spark", "Trax"],
    "CHRYSLER": ["300C", "Delta", "Grand Voyager", "Ypsilon"],
    "CITROEN": [
      "Ami", "Berlingo", "C1", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Cactus",
      "C4 Picasso", "C4 SpaceTourer", "C4 X", "C5", "C5 Aircross", "C5 X",
      "DS3", "DS4", "DS5", "e-Berlingo", "e-C3", "e-C4", "e-C4 X", "Grand C4 SpaceTourer", "SpaceTourer"
    ],
    "CUPRA": ["Ateca", "Born", "Formentor", "Leon", "Tavascan", "Terramar"],
    "DACIA": ["Duster", "Jogger", "Logan MCV", "Sandero", "Sandero Stepway", "Spring"],
    "DS AUTOMOBILES": ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 7 Crossback", "DS 9"],
    "FIAT": ["500", "500C", "500e", "500L", "500X", "600", "600e", "Doblo", "Panda", "Punto", "Tipo"],
    "FORD": [
      "B-Max", "C-Max", "Capri", "EcoSport", "Edge", "Explorer", "Fiesta", "Focus",
      "Galaxy", "Grand C-Max", "Grand Tourneo Connect", "Ka", "Ka+", "Kuga",
      "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Ranger", "S-Max",
      "Tourneo Connect", "Tourneo Custom", "Transit Connect", "Transit Custom"
    ],
    "GENESIS": ["G70", "G80", "GV60", "GV70", "GV80"],
    "GWM ORA": ["03", "Funky Cat"],
    "HONDA": ["Civic", "CR-V", "CR-Z", "e", "e:Ny1", "FR-V", "HR-V", "Insight", "Jazz", "NSX", "ZR-V"],
    "HYUNDAI": [
      "Bayon", "i10", "i20", "i30", "i40", "i800", "Inster", "IONIQ", "IONIQ 5", "IONIQ 6",
      "ix20", "ix35", "Kona", "Nexo", "Santa Fe", "Staria", "Tucson"
    ],
    "INFINITI": ["Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX70"],
    "ISUZU": ["D-Max"],
    "JAECOO": ["7", "J7"],
    "JAGUAR": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "XE", "XF", "XJ", "XK"],
    "JEEP": ["Avenger", "Cherokee", "Compass", "Grand Cherokee", "Patriot", "Renegade", "Wrangler"],
    "KGM / SSANGYONG": ["Actyon", "Korando", "Musso", "Rexton", "Tivoli", "Torres"],
    "KIA": [
      "Carens", "Ceed", "EV3", "EV6", "EV9", "Niro", "Optima", "Picanto",
      "ProCeed", "Rio", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Venga", "XCeed"
    ],
    "LAND ROVER": [
      "Defender 90", "Defender 110", "Defender 130", "Discovery", "Discovery 4", "Discovery Sport",
      "Freelander 2", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"
    ],
    "LEAPMOTOR": ["C10", "T03"],
    "LEXUS": ["CT", "ES", "GS", "IS", "LBX", "LC", "LS", "NX", "RC", "RX", "RZ", "UX"],
    "LOTUS": ["Eletre", "Elise", "Emeya", "Emira", "Evora", "Exige"],
    "MASERATI": ["Ghibli", "GranCabrio", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"],
    "MAZDA": ["2", "2 Hybrid", "3", "5", "6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-80", "MX-30", "MX-5"],
    "MERCEDES": [
      "A-Class", "AMG GT", "B-Class", "C-Class", "CLA", "CLC", "CLE", "CLK", "CLS",
      "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV",
      "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "ML",
      "S-Class", "SL", "SLC", "SLK", "V-Class", "Vito", "X-Class"
    ],
    "MG": ["3", "4 EV", "5 EV", "Cyberster", "GS", "HS", "MG3", "MG4", "MG5", "ZS", "ZS EV"],
    "MINI": [
      "Aceman", "Clubman", "Convertible", "Cooper", "Cooper S", "Countryman",
      "Coupe", "Electric", "Hatch", "John Cooper Works", "One", "Paceman", "Roadster"
    ],
    "MITSUBISHI": ["ASX", "Colt", "Eclipse Cross", "L200", "Mirage", "Outlander", "Outlander PHEV", "Shogun", "Shogun Sport"],
    "NISSAN": [
      "350Z", "370Z", "Ariya", "Cube", "e-NV200", "GT-R", "Juke", "Leaf",
      "Micra", "Murano", "Navara", "Note", "NV200", "Pathfinder", "Pulsar", "Qashqai", "X-Trail"
    ],
    "OMODA": ["5", "E5", "9"],
    "PEUGEOT": [
      "107", "108", "207", "208", "2008", "308", "3008", "407", "408", "508", "5008",
      "e-208", "e-2008", "e-308", "e-3008", "e-5008", "Partner Tepee", "RCZ", "Rifter", "Traveller"
    ],
    "POLESTAR": ["1", "2", "3", "4"],
    "PORSCHE": ["718 Boxster", "718 Cayman", "911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
    "RENAULT": [
      "5 E-Tech", "Arkana", "Austral", "Captur", "Clio", "Grand Scenic", "Kadjar",
      "Kangoo", "Koleos", "Megane", "Megane E-Tech", "Rafale", "Scenic", "Scenic E-Tech", "Symbioz", "Twingo", "Zoe"
    ],
    "SAAB": ["9-3", "9-5"],
    "SEAT": ["Alhambra", "Altea", "Arona", "Ateca", "Exeo", "Ibiza", "Leon", "Mii", "Tarraco", "Toledo"],
    "SKODA": [
      "Citigo", "Elroq", "Enyaq", "Fabia", "Kamiq", "Karoq", "Kodiaq",
      "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti"
    ],
    "SMART": ["#1", "#3", "ForFour", "ForTwo"],
    "SUBARU": ["BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "Solterra", "WRX STI", "XV"],
    "SUZUKI": ["Across", "Alto", "Baleno", "Celerio", "Grand Vitara", "Ignis", "Jimny", "S-Cross", "Splash", "Swace", "Swift", "SX4", "Vitara"],
    "TESLA": ["Model 3", "Model S", "Model X", "Model Y"],
    "TOYOTA": [
      "Alphard", "Auris", "Avensis", "Aygo", "Aygo X", "bZ4X", "C-HR", "Camry", "Celica",
      "Corolla", "Estima", "GR86", "GR Supra", "GR Yaris", "GT86", "Highlander", "Hilux",
      "iQ", "Land Cruiser", "Mirai", "Prius", "Proace Verso", "RAV4", "Supra", "Urban Cruiser", "Verso", "Yaris", "Yaris Cross"
    ],
    "VAUXHALL": [
      "Adam", "Agila", "Ampera", "Antara", "Astra", "Cascada", "Combo Life", "Corsa", "Corsa-e",
      "Crossland", "Crossland X", "Frontera", "Grandland", "Grandland X", "Insignia",
      "Meriva", "Mokka", "Mokka-e", "Mokka X", "Viva", "Vivaro Life", "Zafira", "Zafira Tourer"
    ],
    "VOLKSWAGEN": [
      "Amarok", "Arteon", "Beetle", "Caddy", "Caddy Maxi Life", "California", "Caravelle", "CC",
      "Eos", "Fox", "Golf", "Golf Plus", "Golf SV", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz",
      "Jetta", "Multivan", "Passat", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc",
      "Taigo", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "up!"
    ],
    "VOLVO": [
      "C30", "C40", "C70", "EC40", "EX30", "EX40", "EX90",
      "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90",
      "XC40", "XC60", "XC70", "XC90"
    ]
  };

  const UK_MAKE_LABELS = {
    "ABARTH": "Abarth",
    "ALFA ROMEO": "Alfa Romeo",
    "ASTON MARTIN": "Aston Martin",
    "AUDI": "Audi",
    "BENTLEY": "Bentley",
    "BMW": "BMW",
    "BYD": "BYD",
    "CHEVROLET": "Chevrolet",
    "CHRYSLER": "Chrysler",
    "CITROEN": "Citroën",
    "CUPRA": "Cupra",
    "DACIA": "Dacia",
    "DS AUTOMOBILES": "DS Automobiles",
    "FIAT": "Fiat",
    "FORD": "Ford",
    "GENESIS": "Genesis",
    "GWM ORA": "GWM Ora",
    "HONDA": "Honda",
    "HYUNDAI": "Hyundai",
    "INFINITI": "Infiniti",
    "ISUZU": "Isuzu",
    "JAECOO": "Jaecoo",
    "JAGUAR": "Jaguar",
    "JEEP": "Jeep",
    "KGM / SSANGYONG": "KGM / SsangYong",
    "KIA": "Kia",
    "LAND ROVER": "Land Rover / Range Rover",
    "LEAPMOTOR": "Leapmotor",
    "LEXUS": "Lexus",
    "LOTUS": "Lotus",
    "MASERATI": "Maserati",
    "MAZDA": "Mazda",
    "MERCEDES": "Mercedes-Benz",
    "MG": "MG",
    "MINI": "MINI",
    "MITSUBISHI": "Mitsubishi",
    "NISSAN": "Nissan",
    "OMODA": "Omoda",
    "PEUGEOT": "Peugeot",
    "POLESTAR": "Polestar",
    "PORSCHE": "Porsche",
    "RENAULT": "Renault",
    "SAAB": "Saab",
    "SEAT": "SEAT",
    "SKODA": "Škoda",
    "SMART": "Smart",
    "SUBARU": "Subaru",
    "SUZUKI": "Suzuki",
    "TESLA": "Tesla",
    "TOYOTA": "Toyota",
    "VAUXHALL": "Vauxhall",
    "VOLKSWAGEN": "Volkswagen",
    "VOLVO": "Volvo"
  };

  root.UK_CAR_DIRECTORY = {
    makesModels: UK_CAR_MAKES_MODELS,
    makeLabels: UK_MAKE_LABELS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.UK_CAR_DIRECTORY;
  }
})(typeof self !== "undefined" ? self : window);
