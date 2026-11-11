// ============================================================================
// CLIFFCHECK UK — CORE ENGINE, GEARBOX, AWD, DPF, EV, TAX & HAGGLING ENGINE
// Shared between the Phone/Web App and the Mozilla Firefox & Chrome Add-Ons
// ============================================================================
(function (root) {
  const CURRENT_YEAR = 2026;

  // Built-in realistic UK sample plates so buyers (and you!) can test 1-click demos
  // even before connecting the live DVSA MOT API key.
  const DEMO_VEHICLES = {
    FD18ECO: {
      registration: "FD18 ECO",
      make: "FORD",
      model: "FIESTA",
      derivative: "1.0T EcoBoost Zetec 5dr",
      year: 2018,
      firstUsedDate: "2018-05-14",
      fuelType: "Petrol",
      engineSizeCc: 998,
      transmission: "Manual",
      mileage: 57420,
      askingPrice: 7495,
      primaryColour: "Magnetic Grey",
      motStatus: "PASSED",
      motExpiryDate: "2027-05-13",
      motTests: [
        { date: "2026-05-09", mileage: 56810, result: "PASSED", advisories: ["Slight oil misting around lower timing cover"] },
        { date: "2025-05-11", mileage: 49200, result: "PASSED", advisories: [] },
        { date: "2024-05-10", mileage: 41050, result: "PASSED", advisories: ["Front brake pads wearing thin"] }
      ]
    },
    PG19PTC: {
      registration: "PG19 PTC",
      make: "PEUGEOT",
      model: "2008",
      derivative: "1.2 PureTech Allure SUV",
      year: 2019,
      firstUsedDate: "2019-09-02",
      fuelType: "Petrol",
      engineSizeCc: 1199,
      transmission: "Manual",
      mileage: 54200,
      askingPrice: 8990,
      primaryColour: "Pearl White",
      motStatus: "PASSED",
      motExpiryDate: "2027-09-01",
      motTests: [
        { date: "2026-08-25", mileage: 53100, result: "PASSED", advisories: [] },
        { date: "2025-08-29", mileage: 44800, result: "PASSED", advisories: [] }
      ]
    },
    VW19DSG: {
      registration: "VW19 DSG",
      make: "VOLKSWAGEN",
      model: "GOLF",
      derivative: "2.0 TSI GTI Performance DSG 5dr",
      year: 2019,
      firstUsedDate: "2019-03-22",
      fuelType: "Petrol",
      engineSizeCc: 1984,
      transmission: "Automatic",
      awd: false,
      mileage: 38900,
      askingPrice: 18495,
      primaryColour: "Tornado Red",
      motStatus: "PASSED",
      motExpiryDate: "2027-03-21",
      motTests: [
        { date: "2026-03-18", mileage: 36400, result: "PASSED", advisories: [] },
        { date: "2025-03-19", mileage: 29100, result: "PASSED", advisories: [] }
      ]
    },
    LR18ING: {
      registration: "LR18 ING",
      make: "LAND ROVER",
      model: "RANGE ROVER EVOQUE",
      derivative: "2.0 TD4 HSE Dynamic Auto 4WD",
      year: 2018,
      firstUsedDate: "2018-06-18",
      fuelType: "Diesel",
      engineSizeCc: 1999,
      transmission: "Automatic",
      awd: true,
      mileage: 68500,
      askingPrice: 14250,
      primaryColour: "Santorini Black",
      motStatus: "PASSED",
      motExpiryDate: "2027-06-17",
      motTests: [
        { date: "2026-06-10", mileage: 67200, result: "PASSED", advisories: ["Undertray fitted obscuring some underside components"] },
        { date: "2025-06-14", mileage: 64100, result: "PASSED", advisories: [] },
        { date: "2024-06-12", mileage: 61300, result: "PASSED", advisories: [] }
      ]
    },
    BM22LUX: {
      registration: "BM22 LUX",
      make: "BMW",
      model: "3 SERIES",
      derivative: "320d M Sport Saloon Auto",
      year: 2022,
      firstUsedDate: "2022-09-15",
      fuelType: "Diesel",
      engineSizeCc: 1995,
      transmission: "Automatic",
      mileage: 21400,
      askingPrice: 24995,
      primaryColour: "Portimao Blue",
      motStatus: "PASSED",
      motExpiryDate: "2027-09-14",
      motTests: [
        { date: "2026-09-10", mileage: 20900, result: "PASSED", advisories: [] }
      ]
    },
    TY20HYB: {
      registration: "TY20 HYB",
      make: "TOYOTA",
      model: "COROLLA",
      derivative: "1.8 VVT-i Hybrid Icon Tech CVT",
      year: 2020,
      firstUsedDate: "2020-07-08",
      fuelType: "Hybrid Electric",
      engineSizeCc: 1798,
      transmission: "Automatic",
      mileage: 44200,
      askingPrice: 14600,
      primaryColour: "Silver Metallic",
      motStatus: "PASSED",
      motExpiryDate: "2027-07-07",
      motTests: [
        { date: "2026-07-02", mileage: 43100, result: "PASSED", advisories: [] },
        { date: "2025-07-04", mileage: 33800, result: "PASSED", advisories: [] }
      ]
    }
  };

  function norm(str) {
    return String(str || "")
      .trim()
      .toUpperCase()
      .replace(/Ë/g, "E")
      .replace(/Š/g, "S");
  }

  function normMake(rawMake) {
    const m = norm(rawMake);
    if (m === "MERCEDES-BENZ") return "MERCEDES";
    if (m === "DS AUTOMOBILES") return "DS";
    if (m === "VW") return "VOLKSWAGEN";
    return m;
  }

  function parseEngineLitres(cc, derivative) {
    const numCc = Number(cc) || 0;
    if (numCc > 400) {
      return Math.round((numCc / 1000) * 10) / 10;
    }
    if (numCc > 0 && numCc < 10) {
      return Math.round(numCc * 10) / 10;
    }
    const m = String(derivative || "").match(/\b([0-6]\.[0-9])\b/);
    return m ? parseFloat(m[1]) : 0;
  }

  // --------------------------------------------------------------------------
  // MAIN CLIFF ANALYSER
  // --------------------------------------------------------------------------
  function analyzeVehicle(raw) {
    const make = normMake(raw.make);
    const model = norm(raw.model);
    const deriv = norm(raw.derivative);
    const fullText = `${make} ${model} ${deriv}`;
    const fuel = norm(raw.fuelType);
    const isDiesel = fuel.includes("DIESEL");
    const isHybrid = fuel.includes("HYBRID") || fullText.includes("HYBRID") || fullText.includes("PHEV") || fullText.includes("DM-I");
    const isEV = (fuel === "ELECTRIC" || fullText.includes("ELECTRIC") || /\b(EV|ID\.3|ID\.4|ID\.5|ID\.7|MODEL 3|MODEL Y|LEAF|ZOE|ENYAQ|IONIQ 5|IONIQ 6|BORN|TAYCAN|POLESTAR 2|MG4)\b/.test(fullText)) && !isHybrid && !isDiesel;
    const year = Number(raw.year) || (raw.firstUsedDate ? parseInt(String(raw.firstUsedDate).slice(0, 4), 10) : 2018);
    const ageYears = Math.max(0, CURRENT_YEAR - year);
    const cc = Number(raw.engineSizeCc) || 0;
    const litres = isEV ? 0 : parseEngineLitres(cc, deriv);
    const mileage = Math.max(0, Number(raw.mileage) || 0);
    const gearbox = norm(
      raw.transmission ||
        (/(AUTO|DSG|STRONIC|S TRONIC|POWERSHIFT|TIPTRONIC|DCT|CVT|STEPTRONIC|DUALOGIC|TCT|EAT8|EAT6|7G-DCT|9G-TRONIC)/.test(fullText)
          ? "AUTOMATIC"
          : "MANUAL")
    );
    const isAuto = isEV || gearbox.includes("AUTO") || /(DSG|POWERSHIFT|CVT|DCT|STRONIC|DUALOGIC|TCT|EAT8|EAT6)/.test(fullText);
    const isAwd = Boolean(raw.awd) || /\b(4MOTION|QUATTRO|4WD|AWD|4X4|ALL4|XDRIVE|4MATIC|GOLF R|AUDI S3|RS3|TIGUAN R)\b/.test(fullText);

    const cliffs = [];

    // ========================================================================
    // CHECK 1: TIMING DRIVE (WET BELTS, STRETCH-PRONE CHAINS & DRY CAMBELTS)
    // ========================================================================
    let timingMatched = false;

    // 1A. Ford 1.0 EcoBoost (Wet belt 2012-2019; Chain 2020+ WITH wet oil-pump belt!)
    if (
      make === "FORD" &&
      !isDiesel &&
      !isEV &&
      (litres === 1.0 || (cc >= 990 && cc <= 1010) || fullText.includes("ECOBOOST"))
    ) {
      if (litres <= 1.1 || cc <= 1050 || !litres) {
        timingMatched = true;
        if (year <= 2019 || (year === 2020 && /FIESTA|ECOSPORT|FOCUS/.test(model))) {
          const dueMiles = 60000;
          const dueYears = 7;
          const milesLeft = dueMiles - mileage;
          const overdueOrImminent = mileage >= 48000 || ageYears >= 6;
          cliffs.push({
            id: "ford-ecoboost-wetbelt",
            category: "Wet Timing Belt ('Belt-in-Oil')",
            severity: overdueOrImminent ? "CRITICAL" : "HIGH",
            title: "Ford 1.0 EcoBoost Oil-Bath Wet Belt Cliff",
            costMin: 1050,
            costMax: 1550,
            dueText:
              mileage >= dueMiles
                ? `OVERDUE by ${(mileage - dueMiles).toLocaleString()} miles (unless seller has garage invoice)`
                : ageYears >= dueYears
                ? `AGE-DUE NOW (${ageYears} yrs old — unless seller has garage invoice)`
                : `Due within ~${Math.max(0, milesLeft).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s) unless already done`,
            plainReason:
              "This engine runs its rubber timing belt inside hot engine oil. Rubber fragments shed into the sump and clog the oil pick-up strainer ('EcoBoom' failure). UK Ford specialists strongly advise replacement + sump strainer clean by 6–7 years or 60,000 miles — NOT Ford's old 10-year brochure figure.",
            proofToAsk:
              "Itemised garage VAT invoice explicitly showing 'Wet Timing Belt Kit, Oil Pump Belt & Sump Off Strainer Clean' (a normal service stamp does NOT cover this)."
          });
        } else {
          cliffs.push({
            id: "ford-ecoboost-mhev-oilbelt",
            category: "Wet Oil-Pump Drive Belt",
            severity: mileage >= 55000 || ageYears >= 6 ? "HIGH" : "MEDIUM",
            title: "2020+ EcoBoost Chain Model — Hidden Wet Oil-Pump Belt",
            costMin: 750,
            costMax: 1150,
            dueText: mileage >= 65000 ? "Inspection / replacement due around 65k–80k miles unless invoice-verified" : "Watch from 60,000 miles / 6 years",
            plainReason:
              "Later 1.0 EcoBoost engines switched the main timing drive to a chain, BUT still use a rubber belt running in oil to drive the oil pump, which has recall/inspection history on select builds.",
            proofToAsk: "Full timely annual oil-change invoices using exact Ford WSS-M2C948-B 5W-20 oil + recall check."
          });
        }
      }
    }

    // 1B. PSA / Stellantis 1.2 PureTech / Vauxhall / Jeep / Toyota 1.2 Turbo Wet Belt (2014–2023)
    if (
      !timingMatched &&
      !isDiesel &&
      !isEV &&
      /PEUGEOT|CITROEN|DS|VAUXHALL|OPEL|TOYOTA|JEEP/.test(make) &&
      ((cc >= 1180 && cc <= 1220) || litres === 1.2 || fullText.includes("PURETECH")) &&
      year >= 2014 &&
      !(year >= 2024 && isHybrid)
    ) {
      if (cc !== 1229 && cc !== 1242) {
        timingMatched = true;
        const dueMiles = 62000;
        const dueYears = 6;
        const overdueOrImminent = mileage >= 46000 || ageYears >= 5;
        cliffs.push({
          id: "psa-puretech-wetbelt",
          category: "Wet Timing Belt ('Belt-in-Oil')",
          severity: overdueOrImminent ? "CRITICAL" : "HIGH",
          title: "1.2 PureTech / Turbo Wet Timing Belt Cliff",
          costMin: 650,
          costMax: 980,
          dueText:
            mileage >= dueMiles
              ? `OVERDUE by ${(mileage - dueMiles).toLocaleString()} miles unless seller has garage invoice`
              : ageYears >= dueYears
              ? `AGE-DUE NOW (${ageYears} yrs old vs revised 6-year schedule — unless invoice-verified)`
              : `Due within ~${Math.max(0, dueMiles - mileage).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s) unless already done`,
          plainReason:
            "Manufacturer cut the replacement schedule down to 6 years / 62,000 miles because the oil-bathed belt swells and sheds fibres that block the oil strainer and brake vacuum pump. You can actually spot belt cracking by shining a torch through the oil filler cap!",
          proofToAsk:
            "Itemised invoice for '1.2 PureTech Wet Timing Belt + Sump Strainer Clean' AND shine a phone torch into the oil filler cap to inspect belt edges for cracks."
        });
      }
    }

    // 1C. Ford 2.0 EcoBlue Diesel Wet Belt (2016+)
    if (
      !timingMatched &&
      make === "FORD" &&
      isDiesel &&
      (litres === 2.0 || (cc >= 1990 && cc <= 2005) || fullText.includes("ECOBLUE")) &&
      year >= 2016
    ) {
      timingMatched = true;
      const dueMiles = 65000;
      const dueYears = 6;
      cliffs.push({
        id: "ford-ecoblue-wetbelt",
        category: "Wet Timing Belt ('Belt-in-Oil')",
        severity: mileage >= 50000 || ageYears >= 5 ? "CRITICAL" : "HIGH",
        title: "Ford 2.0 EcoBlue Diesel Wet Belt Cliff",
        costMin: 950,
        costMax: 1400,
        dueText:
          mileage >= dueMiles || ageYears >= dueYears
            ? "DUE / OVERDUE NOW unless seller has garage invoice"
            : `Approaching specialist 60k–70k / 6-yr cliff (${(dueMiles - mileage).toLocaleString()} mi left)`,
        plainReason:
          "Ford shortened the 2.0 EcoBlue wet-belt interval after premature snaps wrote off engines well before 100k miles.",
        proofToAsk: "Dated VAT invoice for genuine Ford EcoBlue wet belt & tensioner replacement."
      });
    }

    // 1D. Honda Civic 1.0 VTEC Turbo Wet Belt (2017-2021)
    if (
      !timingMatched &&
      make === "HONDA" &&
      !isDiesel &&
      (litres === 1.0 || (cc >= 985 && cc <= 1005)) &&
      year >= 2017
    ) {
      timingMatched = true;
      cliffs.push({
        id: "honda-10-wetbelt",
        category: "Hidden Wet Timing Belt",
        severity: mileage >= 48000 || ageYears >= 6 ? "CRITICAL" : "HIGH",
        title: "Honda 1.0 VTEC Turbo Oil-Bath Wet Belt",
        costMin: 950,
        costMax: 1450,
        dueText: mileage >= 60000 || ageYears >= 6 ? "DUE NOW (6 yrs / 60k–75k miles) unless seller has invoice" : "Due at 6 years / ~60,000 miles",
        plainReason:
          "Most buyers assume all Hondas use metal chains, but the 1.0 turbo uses a wet belt in oil that requires expensive specialist tooling.",
        proofToAsk: "Honda dealer or specialist wet-belt replacement invoice."
      });
    }

    // 1E. Jaguar Land Rover 2.0 Ingenium Timing Chain Stretch (2015-2021)
    if (
      !timingMatched &&
      /LAND ROVER|JAGUAR|RANGE ROVER/.test(`${make} ${model}`) &&
      (litres === 2.0 || (cc >= 1990 && cc <= 2005)) &&
      year >= 2015 &&
      year <= 2021
    ) {
      timingMatched = true;
      cliffs.push({
        id: "jlr-ingenium-chain",
        category: "Rear Timing Chain Stretch Trap",
        severity: mileage >= 50000 ? "CRITICAL" : "HIGH",
        title: "JLR 2.0 Ingenium Rear Timing Chain & Guide Risk",
        costMin: 1600,
        costMax: 2600,
        dueText: mileage >= 55000 ? `HIGH-RISK WINDOW NOW (${mileage.toLocaleString()} miles) unless upgraded` : "Risk climbs sharply from 55,000 miles",
        plainReason:
          "2-year / 21,000-mile factory oil intervals allow soot dilution to stretch the rear-mounted timing chains (gearbox-out job to replace).",
        proofToAsk:
          "Cold-start engine listen (must NOT rattle for 2–3 seconds on first morning start) + annual 10k-mile oil change receipts or upgraded chain invoice."
      });
    }

    // 1F. BMW / MINI 2.0d N47 / B47 Rear Chain + MINI 1.6 Prince (N14/N18) Chain
    if (
      !timingMatched &&
      /BMW|MINI/.test(make) &&
      isDiesel &&
      (litres === 2.0 || (cc >= 1990 && cc <= 2000))
    ) {
      timingMatched = true;
      if (year <= 2015) {
        cliffs.push({
          id: "bmw-n47-chain",
          category: "Rear Timing Chain Trap",
          severity: mileage >= 65000 ? "CRITICAL" : "HIGH",
          title: "BMW/MINI N47 2.0d Rear Timing Chain Rattle Risk",
          costMin: 1350,
          costMax: 2100,
          dueText: `Active risk at ${mileage.toLocaleString()} miles unless seller has chain invoice`,
          plainReason:
            "The timing chain sits at the back of the engine against the bulkhead, requiring engine/gearbox removal when guides wear.",
          proofToAsk: "Cold-start metallic rattle check + proof of <10k mile oil services or chain replacement invoice."
        });
      } else if (mileage >= 80000) {
        cliffs.push({
          id: "bmw-b47-chain",
          category: "High-Mileage Chain & EGR Recall Check",
          severity: "MEDIUM",
          title: "BMW B47 2.0d Chain & EGR Cooler Check",
          costMin: 450,
          costMax: 1500,
          dueText: "Inspect cold-start chain noise & confirm free BMW EGR recall completed",
          plainReason:
            "Post-2015 B47 engines are stronger than N47, but suffer coolant-leaking EGR coolers (recall item) and chain wear past 100k if run on 18k-mile oil intervals.",
          proofToAsk: "Confirm zero coolant loss + BMW EGR recall completion."
        });
      }
    } else if (
      !timingMatched &&
      /MINI|PEUGEOT|CITROEN|DS/.test(make) &&
      !isDiesel &&
      (litres === 1.6 || (cc >= 1590 && cc <= 1605)) &&
      year >= 2007 &&
      year <= 2016
    ) {
      timingMatched = true;
      cliffs.push({
        id: "mini-psa-prince-chain",
        category: "Prince 1.6 Timing Chain & Tensioner Trap",
        severity: mileage >= 50000 ? "CRITICAL" : "HIGH",
        title: "1.6 THP / MINI Cooper S (N14/N18) Timing Chain & Oil-Burn Check",
        costMin: 850,
        costMax: 1450,
        dueText: `High-risk past 50,000 miles (currently ${mileage.toLocaleString()} mi) unless seller has chain invoice`,
        plainReason:
          "The joint BMW/PSA 1.6 Prince engine burns oil through valve stem seals and starves its hydraulic timing chain tensioner ('death rattle' on cold start).",
        proofToAsk: "Start engine stone-cold to check for rattle + ask for timing chain kit & tensioner invoice."
      });
    }

    // 1G. Nissan / Renault / Dacia / Mercedes 1.2 DIG-T / TCe Timing Chain (2013-2018)
    if (
      !timingMatched &&
      /NISSAN|RENAULT|DACIA|MERCEDES/.test(make) &&
      !isDiesel &&
      (litres === 1.2 || (cc >= 1190 && cc <= 1205)) &&
      year >= 2013 &&
      year <= 2018
    ) {
      timingMatched = true;
      cliffs.push({
        id: "nissan-renault-12-chain",
        category: "Timing Chain & Oil-Burn Trap",
        severity: mileage >= 42000 ? "CRITICAL" : "HIGH",
        title: "1.2 DIG-T / TCe Timing Chain Stretch & Piston Ring Risk",
        costMin: 1100,
        costMax: 1650,
        dueText: mileage >= 45000 ? `HIGH-RISK WINDOW (${mileage.toLocaleString()} miles) unless upgraded` : "Watch closely from 45,000 miles",
        plainReason:
          "Well-known HRA2DDT / H5Ft 1.2 turbo issue where low-tension piston rings burn oil, starving the hydraulic timing chain tensioner.",
        proofToAsk: "Check dipstick oil level on arrival + listen for metallic rattle on cold start."
      });
    }

    // 1H. Mazda 2.2 Skyactiv-D Diesel Carbon / Injector Seal / Oil Strainer Cliff (2012-2021)
    if (
      !timingMatched &&
      make === "MAZDA" &&
      isDiesel &&
      (litres === 2.2 || (cc >= 2180 && cc <= 2200))
    ) {
      timingMatched = true;
      cliffs.push({
        id: "mazda-22-skyactiv-d",
        category: "Diesel Injector Washer & Sump Strainer Cliff",
        severity: mileage >= 55000 ? "CRITICAL" : "HIGH",
        title: "Mazda 2.2 Skyactiv-D Injector Seal & Oil Strainer Blockage Risk",
        costMin: 850,
        costMax: 1750,
        dueText: mileage >= 55000 ? `CRITICAL CHECK AT ${mileage.toLocaleString()} MILES unless invoice-verified` : "Specialist preventive check due by 55k–60k miles",
        plainReason:
          "Copper injector washers leak combustion gas into the rocker cover, turning engine oil into carbon sludge that blocks the sump oil strainer and starves the turbo and camshaft.",
        proofToAsk: "Specialist invoice for upgraded injector washers, intake decoke & sump strainer inspection."
      });
    }

    // 1I. Fiat / Alfa Romeo / Jeep 1.4 MultiAir Filter & Brick Check
    if (
      !timingMatched &&
      /FIAT|ALFA ROMEO|ABARTH|JEEP/.test(make) &&
      !isDiesel &&
      (litres === 1.4 || (cc >= 1360 && cc <= 1375)) &&
      year >= 2010
    ) {
      timingMatched = true;
      cliffs.push({
        id: "fiat-alfa-14-cambelt-multiair",
        category: "Cambelt & MultiAir Oil-Strainer Cliff",
        severity: mileage >= 50000 || ageYears >= 5 ? "HIGH" : "MEDIUM",
        title: "1.4 Turbo / MultiAir 5-Year Cambelt & Micro-Filter Cliff",
        costMin: 480,
        costMax: 950,
        dueText: ageYears >= 5 || mileage >= 60000 ? "DUE BY 5-YEAR / 60k SCHEDULE unless seller has invoice" : "Due every 5 years / 60,000 miles",
        plainReason:
          "These 1.4 engines have a strict 5-year cambelt + water pump schedule, and MultiAir versions fail (£950+ actuator unit) if the tiny in-block MultiAir oil strainer wasn't cleaned using exact Selenia/C2 oil.",
        proofToAsk: "Dated invoice for cambelt + water pump within the last 5 years + annual correct-spec oil changes."
      });
    }

    // 1J. Standard Dry Cambelt + Water Pump Schedule (VW/Audi/Skoda/SEAT TDI/TSI, Volvo, Dacia, etc.)
    if (!timingMatched && !isEV) {
      const likelyChainMakes = /TOYOTA|LEXUS|MAZDA|HYUNDAI|KIA|GENESIS|BMW|MERCEDES|SUZUKI|SUBARU|NISSAN|MITSUBISHI|HONDA|MG|TESLA|BYD|POLESTAR/;
      if (!likelyChainMakes.test(make)) {
        const dueMiles = 75000;
        const dueYears = 6;
        if (mileage >= 55000 || ageYears >= 5) {
          cliffs.push({
            id: "standard-cambelt-waterpump",
            category: "Cambelt & Water Pump Cliff",
            severity: mileage >= 70000 || ageYears >= 6 ? "HIGH" : "MEDIUM",
            title: "Scheduled Cambelt & Water Pump Window",
            costMin: 520,
            costMax: 850,
            dueText:
              mileage >= dueMiles || ageYears >= dueYears
                ? `DUE BY AGE/MILEAGE (${ageYears} yrs / ${mileage.toLocaleString()} mi) unless seller has invoice`
                : `Due within ~${Math.max(0, dueMiles - mileage).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s) unless already done`,
            plainReason:
              "Sellers routinely trade cars in at 5–7 years / 55k–75k miles to avoid paying £550–£850 for a cambelt and water pump kit.",
            proofToAsk: "Ask seller directly: 'Has the cambelt and water pump been done, and do you have the itemised garage invoice?'"
          });
        }
      }
    }

    // ========================================================================
    // CHECK 2: AUTOMATIC / MANUAL GEARBOX & AWD HALDEX FLUID CLIFFS
    // ========================================================================
    if (isAuto && !isEV && !isHybrid) {
      if (/VOLKSWAGEN|AUDI|SKODA|SEAT|CUPRA|PORSCHE/.test(make)) {
        const isSmallDryDsg = !isDiesel && litres > 0 && litres <= 1.5 && make !== "PORSCHE";
        if (isSmallDryDsg) {
          if (mileage >= 45000) {
            cliffs.push({
              id: "vag-dq200-dry-dsg",
              category: "7-Speed Dry-Clutch DSG Check",
              severity: mileage >= 65000 ? "HIGH" : "MEDIUM",
              title: "DQ200 7-Speed DSG Clutch-Pack & Mechatronic Check",
              costMin: 950,
              costMax: 1650,
              dueText: "Test-drive judder check essential at current mileage",
              plainReason:
                "1.0–1.5 petrol VWs/Audis/Škodas/SEATs use the DQ200 dry-clutch DSG. Slipping between 1st–2nd gear or slow engagement in reverse signals worn clutch packs or mechatronic pressure loss.",
              proofToAsk: "Test uphill creep and brisk 1st-to-2nd pull when warm — walk away if there is any shudder."
            });
          }
        } else {
          const nextMultiple = Math.ceil(Math.max(1, mileage) / 40000) * 40000;
          const distToCliff = nextMultiple - mileage;
          const justPassed = mileage >= 38000 && mileage % 40000 < 12000;
          if (distToCliff <= 7000 || justPassed || mileage >= 36000) {
            cliffs.push({
              id: "vag-wet-dsg-service",
              category: "Automatic Gearbox Cliff",
              severity: mileage >= 37000 ? "HIGH" : "MEDIUM",
              title: "DSG / S tronic / PDK 40,000-Mile Gearbox Oil & Filter Cliff",
              costMin: 290,
              costMax: 450,
              dueText:
                mileage >= 38000
                  ? `VERIFY 40k SERVICE DONE (current: ${mileage.toLocaleString()} mi) unless seller has invoice`
                  : `Due in ${(40000 - mileage).toLocaleString()} miles (at 40,000 mi)`,
              plainReason:
                "Wet-clutch dual-clutch gearboxes require fresh fluid and filter every 38,000–40,000 miles. Skipping it risks £1,500–£2,200 mechatronic valve-body failure.",
              proofToAsk: "Specific invoice showing 'DSG / S tronic Gearbox Oil & Filter Change' around 38k–40k (and 80k) miles."
            });
          }
        }
      } else if (/FORD|VOLVO/.test(make) && year <= 2019 && (litres <= 2.0 || !litres)) {
        cliffs.push({
          id: "ford-volvo-powershift-cliff",
          category: "Powershift Gearbox Cliff",
          severity: "CRITICAL",
          title: "Powershift 37,500-Mile Gearbox Oil & Filter Cliff",
          costMin: 310,
          costMax: 430,
          dueText: "Strict 3-year / 37,500-mile mandatory service unless seller has receipts",
          plainReason:
            "Powershift dual-clutch automatics fail (£1,800–£2,800) if even one 37,500-mile / 3-year fluid & filter change was skipped.",
          proofToAsk: "Demand documented Powershift oil & filter receipts every 37,500 miles — walk away without them."
        });
      } else if (/NISSAN/.test(make) && year <= 2019) {
        cliffs.push({
          id: "nissan-cvt-cliff",
          category: "Xtronic / CVT Gearbox Check",
          severity: mileage >= 50000 ? "HIGH" : "MEDIUM",
          title: "Nissan CVT / Xtronic Fluid & Judder Check",
          costMin: 320,
          costMax: 2200,
          dueText: "Check smooth acceleration under load + NS-3 CVT fluid history",
          plainReason:
            "Nissan Juke/Qashqai/Micra CVT automatics suffer belt/stepper-motor judder if fluid is never refreshed past 40k–50k miles.",
          proofToAsk: "Test-drive warm at 30–50 mph gentle throttle for rev flaring or shudder + check CVT fluid receipt."
        });
      } else if (mileage >= 52000) {
        cliffs.push({
          id: "auto-zf-fluid-cliff",
          category: "Automatic Gearbox Fluid Window",
          severity: "MEDIUM",
          title: "60,000-Mile Automatic Transmission Fluid & Filter Service",
          costMin: 380,
          costMax: 580,
          dueText: mileage >= 60000 ? "Recommended now (60k–75k specialist window) unless already done" : `Recommended in ~${(60000 - mileage).toLocaleString()} miles`,
          plainReason:
            "Car brochures call automatic gearbox oil 'sealed for life', but gearbox maker ZF explicitly advises fresh fluid & pan filter at 60,000–75,000 miles to prevent harsh shifts.",
          proofToAsk: "Check for smooth cold & hot shifts; factor £450 preventative gearbox service if over 60k miles without receipt."
        });
      }
    } else if (!isAuto && /VAUXHALL|ALFA ROMEO|FIAT/.test(make) && litres >= 1.2 && litres <= 1.9 && year <= 2019 && mileage >= 45000) {
      // M32 6-speed manual bearing whine check
      cliffs.push({
        id: "m32-manual-bearing-check",
        category: "M32 6-Speed Manual Bearing Check",
        severity: "HIGH",
        title: "M32 6-Speed Manual Gearbox Bearing Movement Check",
        costMin: 550,
        costMax: 950,
        dueText: "Essential 1st/5th/6th gear lever movement test on viewing",
        plainReason:
          "Many 6-speed manual Corsa/Astra/Mokka/MiTo models use the M32 gearbox, famous for end-case bearing wear. Caught early it's a £600 bearing rebuild; left late it cracks the casing.",
        proofToAsk: "On test drive, watch the gearstick when lifting on/off the accelerator in 1st, 5th & 6th gear — it must NOT jerk back and forth or whine."
      });
    }

    // Haldex / AWD Rear Coupling Oil & Pump Strainer (VW Tiguan 4Motion, Golf R, Audi S3/Q3, Volvo AWD, Evoque)
    if (isAwd && !isEV && mileage >= 28000) {
      cliffs.push({
        id: "haldex-awd-cliff",
        category: "4WD / Haldex Coupling Service Cliff",
        severity: mileage >= 38000 ? "MEDIUM" : "LOW",
        title: "30k–40k Mile AWD / Haldex Coupling Oil & Pump Gauze Clean",
        costMin: 165,
        costMax: 290,
        dueText: `Due every 3 years / 30k–40k miles unless seller has garage invoice`,
        plainReason:
          "On 4Motion / quattro / 4WD SUVs & hot hatches, main dealers often change Haldex oil without removing the pump to clean its tiny gauze strainer — burning out the £450 AWD pump.",
        proofToAsk: "Ask for Haldex / AWD coupling service invoice including pump gauze filter clean."
      });
    }

    // ========================================================================
    // CHECK 3: EV BATTERY COOLANT & REDUCTION GEAR CHECK (ELECTRIC CARS)
    // ========================================================================
    if (isEV && (mileage >= 35000 || ageYears >= 3)) {
      if (/HYUNDAI|KIA|GENESIS/.test(make) && year <= 2023) {
        cliffs.push({
          id: "kia-hyundai-ev-coolant",
          category: "EV Low-Conductivity Battery Coolant Cliff",
          severity: "HIGH",
          title: "EV BSC-1/BSC-2 Low-Conductivity Battery Coolant Flush",
          costMin: 320,
          costMax: 580,
          dueText: "Scheduled every 3–4 years / ~37,500–40,000 miles unless dealer invoice shown",
          plainReason:
            "Kia Niro EV / Kona Electric / IONIQ models require a special low-conductivity blue battery coolant flush using dealer vacuum equipment — sellers often skip this £350–£550 service right before selling.",
          proofToAsk: "Ask seller for main-dealer service invoice explicitly listing 'Low-Conductivity Battery Coolant Replacement'."
        });
      } else {
        cliffs.push({
          id: "ev-brake-suspension-tyre",
          category: "EV Suspension Bush, Brake Disc & SoH Check",
          severity: "MEDIUM",
          title: "EV Battery Health (SoH %) & Heavy-Kerb Suspension Check",
          costMin: 250,
          costMax: 750,
          dueText: "Verify Battery State of Health (SoH) certificate before deposit",
          plainReason:
            "Electric vehicles avoid timing belts, but heavy battery weight wears lower suspension arms early and regenerative braking lets rear brake discs rust and fail MOTs from under-use.",
          proofToAsk: "Request printed Battery State-of-Health (SoH %) diagnostic readout + inspect inner tyre edges & rear brake discs for heavy rust pitting."
        });
      }
    }

    // ========================================================================
    // CHECK 4: DIESEL LOW-MILEAGE SHORT-TRIP DPF & ADBLUE TRAP
    // ========================================================================
    const avgAnnualMiles = ageYears > 0 ? Math.round(mileage / ageYears) : mileage;
    if (isDiesel && year >= 2015 && ageYears >= 3 && avgAnnualMiles > 0 && avgAnnualMiles < 6800) {
      cliffs.push({
        id: "diesel-low-miles-dpf",
        category: "Low-Mileage Diesel DPF / AdBlue Trap",
        severity: "HIGH",
        title: `Short-Trip Diesel Warning (Only ~${avgAnnualMiles.toLocaleString()} mi/yr)`,
        costMin: 750,
        costMax: 1650,
        dueText: "Immediate DPF soot-load & AdBlue check advised before purchase",
        plainReason:
          `Buyers think low mileage is good, but averaging just ${avgAnnualMiles.toLocaleString()} miles/yr on a modern Euro 6 diesel means short school/shop runs where the exhaust never gets hot enough to clear the DPF filter or prevent AdBlue crystal blockages.`,
        proofToAsk: "Plug in a £20 OBD scanner on viewing to check 'DPF Soot Mass' & confirm zero AdBlue countdown warnings."
      });
    }

    // ========================================================================
    // CHECK 5: UK £40,000+ LIST-PRICE "EXPENSIVE CAR ROAD TAX" TRAP (YEARS 2-6)
    // ========================================================================
    const premiumMakes = /BMW|MERCEDES|AUDI|LAND ROVER|RANGE ROVER|JAGUAR|PORSCHE|VOLVO|LEXUS|TESLA|POLESTAR|ALFA ROMEO|MASERATI|GENESIS|LOTUS|ASTON MARTIN|BENTLEY/;
    const askingPrice = Number(raw.askingPrice) || 0;
    if (
      year >= 2021 &&
      year <= 2025 &&
      (premiumMakes.test(`${make} ${model}`) || askingPrice >= 23000)
    ) {
      const yearsOfExtraTaxLeft = Math.max(1, 6 - ageYears);
      cliffs.push({
        id: "uk-luxury-ved-trap",
        category: "Hidden UK £620/yr Road Tax Trap",
        severity: "MEDIUM",
        title: `Likely £620/yr '£40k New List Price' Road Tax (${yearsOfExtraTaxLeft} yr(s) left)`,
        costMin: 425 * yearsOfExtraTaxLeft,
        costMax: 425 * yearsOfExtraTaxLeft,
        dueText: `Extra £425/yr supplement on top of £195 tax until ${year + 6} (if original list > £40k)`,
        plainReason:
          "Even if this used car only costs £20k–£28k today, UK DVLA charges ~£620/year road tax until Year 6 if its brand-new sticker price (including paint & optional packs — and from April 2025, new EVs too!) was over £40,000.",
        proofToAsk: "Ask dealer to confirm exact annual VED tax band or check GOV.UK Vehicle Tax status before paying deposit."
      });
    }

    // ========================================================================
    // CHECK 6: FULL MOT HISTORY, ADVISORIES, MILEAGE CLOCKING & CRASH CLUES
    // ========================================================================
    function formatUkDate(isoStr) {
      if (!isoStr) return "";
      const m = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return String(isoStr).slice(0, 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mo = months[parseInt(m[2], 10) - 1] || m[2];
      return `${parseInt(m[3], 10)} ${mo} ${m[1]}`;
    }

    const motTests = Array.isArray(raw.motTests) ? raw.motTests : [];
    let mileageDropped = false;

    if (motTests.length >= 2) {
      const sorted = [...motTests]
        .filter((t) => Number(t.mileage || t.odometerValue) > 0)
        .sort((a, b) => String(a.date || a.completedDate).localeCompare(String(b.date || b.completedDate)));
      for (let i = 1; i < sorted.length; i++) {
        const prev = Number(sorted[i - 1].mileage || sorted[i - 1].odometerValue);
        const curr = Number(sorted[i].mileage || sorted[i].odometerValue);
        if (curr < prev - 100) {
          mileageDropped = true;
          cliffs.unshift({
            id: "mot-mileage-drop",
            category: "MOT Odometer Discrepancy",
            severity: "CRITICAL",
            title: `Mileage Dropped on MOT Record (${prev.toLocaleString()} → ${curr.toLocaleString()} mi)`,
            costMin: 1500,
            costMax: 4000,
            dueText: "STOP — Investigate potential clocking / instrument cluster swap",
            plainReason:
              "Official MOT history shows a later MOT recorded LOWER mileage than an earlier test.",
            proofToAsk: "Run full Finance/Salvage/Mileage History check immediately and demand written explanation."
          });
          break;
        }
      }
    }

    const latestTest = motTests[0] || null;
    const latestAdvisories = latestTest && Array.isArray(latestTest.advisories) ? latestTest.advisories : [];
    const latestFailures = latestTest && Array.isArray(latestTest.failures) ? latestTest.failures : [];
    const oilOrRustAdv = latestAdvisories.find((a) => /oil|corro|rust|subframe|leak|timing/i.test(a));
    if (oilOrRustAdv) {
      cliffs.push({
        id: "mot-advisory-flag",
        category: "Latest MOT Advisory Clue",
        severity: "MEDIUM",
        title: `MOT Advisory Spotted: "${oilOrRustAdv}"`,
        costMin: 180,
        costMax: 650,
        dueText: "Logged on most recent MOT certificate",
        plainReason:
          "Advisories pass the MOT on the day, so dealers rarely fix them before putting the car on the forecourt — leaving you with the bill at next year's MOT.",
        proofToAsk: "Ask whether this advisory item was rectified during pre-sale prep (and ask for workshop sheet)."
      });
    }

    // Build complete MOT & Accident-Clue Cross-Reference Report
    const cleanCurrentReg = String(raw.registration || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    const previousPlatesSet = new Set();
    const crashClues = [];
    let passCount = 0;
    let failCount = 0;

    // Sort newest-first for timeline display
    const newestFirst = [...motTests].sort((a, b) =>
      String(b.date || b.completedDate || "").localeCompare(String(a.date || a.completedDate || ""))
    );

    const historyRows = newestFirst.map((t, idx) => {
      const resStr = String(t.result || t.testResult || "PASSED").toUpperCase();
      if (resStr.includes("PASS")) passCount++;
      else if (resStr.includes("FAIL")) failCount++;

      const testMiles = Number(t.mileage || t.odometerValue) || 0;
      const olderTest = newestFirst[idx + 1];
      const olderMiles = olderTest ? Number(olderTest.mileage || olderTest.odometerValue) || 0 : 0;
      const milesDelta = olderTest && testMiles > 0 && olderMiles > 0 ? testMiles - olderMiles : null;

      const regAtTestClean = String(t.regAtTest || t.registrationAtTimeOfTest || "")
        .replace(/\s+/g, "")
        .toUpperCase();
      if (
        regAtTestClean &&
        cleanCurrentReg &&
        !/CHECK/.test(cleanCurrentReg) &&
        regAtTestClean !== cleanCurrentReg
      ) {
        previousPlatesSet.add(regAtTestClean);
      }

      const advs = Array.isArray(t.advisories) ? t.advisories : [];
      const fails = Array.isArray(t.failures) ? t.failures : [];
      const combinedItems = [...fails, ...advs];
      const dateUk = formatUkDate(t.date || t.completedDate || "");

      // Scan every MOT test item for crash / structural / airbag clues
      combinedItems.forEach((txt) => {
        if (
          /\b(srs|airbag|supplementary restraint|pre-tensioner|chassis|subframe|crossmember|structural|accident|impact|body panel|bumper.*insecure|sharp edge|bent|distorted|misaligned)\b/i.test(
            txt
          ) &&
          !/tyre|wiper|bulb|disc/i.test(txt)
        ) {
          if (crashClues.length < 6) {
            crashClues.push(`${dateUk || "MOT"}: "${txt}"`);
          }
        }
      });

      return {
        rawDateIso: String(t.date || t.completedDate || "").slice(0, 10),
        dateUk: dateUk || "Recorded MOT",
        expiryUk: formatUkDate(t.expiryDate || ""),
        result: resStr.includes("FAIL") ? "FAILED" : "PASSED",
        mileage: testMiles,
        milesDelta,
        regAtTest: regAtTestClean,
        advisories: advs,
        failures: fails,
        isCleanPass: !resStr.includes("FAIL") && advs.length === 0 && fails.length === 0
      };
    });

    // Check for >= 16 month off-road gap between consecutive PASSED MOTs (classic salvage/off-road repair gap)
    const passedRows = historyRows.filter((r) => r.result === "PASSED" && r.rawDateIso);
    for (let i = 0; i < passedRows.length - 1; i++) {
      const dNewer = Date.parse(passedRows[i].rawDateIso);
      const dOlder = Date.parse(passedRows[i + 1].rawDateIso);
      if (!isNaN(dNewer) && !isNaN(dOlder)) {
        const monthsGap = Math.round((dNewer - dOlder) / (1000 * 60 * 60 * 24 * 30.44));
        if (monthsGap >= 16) {
          crashClues.push(
            `${monthsGap}-month off-road gap between passed MOTs (${passedRows[i + 1].dateUk} → ${passedRows[i].dateUk}) — ask why the car was off the road (SORN storage vs accident repair).`
          );
        }
      }
    }

    const previousPlates = Array.from(previousPlatesSet);
    if (previousPlates.length > 0) {
      crashClues.unshift(
        `Plate change spotted in MOT history (previously tested on: ${previousPlates.join(", ")}) — ask if cherished transfer, and cross-check previous plate too.`
      );
    }

    const latestRow = historyRows[0] || null;
    const expiryIso = (latestTest && latestTest.expiryDate) || raw.motExpiryDate || "";
    const isMotExpired = expiryIso ? String(expiryIso).slice(0, 10) < "2026-11-09" : false;

    // Detect Repeat / Ignored MOT Advisories across consecutive passed MOTs ("Owner Care Score")
    const neglectCategories = [
      { name: "Underbody / brake-pipe corrosion", rx: /corro|rust|oxid/i },
      { name: "Engine / gearbox oil leak", rx: /\boil leak|oil mist/i },
      { name: "Suspension arm / bush / pin wear", rx: /suspension arm|bush|ball joint|drop link|anti-roll/i },
      { name: "Shock absorber leak / misting", rx: /shock absorber|damper/i },
      { name: "Brake disc / pad wear", rx: /brake disc|brake pad/i },
      { name: "Exhaust leak / mounting corrosion", rx: /exhaust/i }
    ];
    const repeatNeglect = [];
    if (historyRows.length >= 2) {
      neglectCategories.forEach((cat) => {
        // Only flag faults that are STILL unfixed on the latest MOT after already appearing on prior MOT(s)
        let streak = 0;
        for (let i = 0; i < historyRows.length; i++) {
          const items = [...(historyRows[i].advisories || []), ...(historyRows[i].failures || [])];
          if (items.some((txt) => cat.rx.test(txt))) {
            streak++;
          } else if (historyRows[i].result === "PASSED") {
            break;
          }
        }
        if (streak >= 2) {
          repeatNeglect.push(`${cat.name} still unfixed across last ${streak} MOTs`);
        }
      });
    }

    let ownerCareLabel = "Spec Check Mode";
    let ownerCareSub = "Enter UK plate for MOT care score";
    let ownerCareTone = "neutral";
    if (historyRows.length > 0) {
      if (repeatNeglect.length > 0) {
        ownerCareLabel = `🟠 ${repeatNeglect.length} Repeat MOT Fault${repeatNeglect.length === 1 ? "" : "s"}`;
        ownerCareSub = "Same advisory ignored 2+ yrs";
        ownerCareTone = "warn";
      } else if (latestAdvisories.length === 0 && !isMotExpired && latestRow && latestRow.result === "PASSED") {
        ownerCareLabel = "🟢 Well-Kept MOTs";
        ownerCareSub = "Past advisories sorted promptly";
        ownerCareTone = "good";
      } else {
        ownerCareLabel = `🟡 ${latestAdvisories.length} Open Advisory${latestAdvisories.length === 1 ? "" : "s"}`;
        ownerCareSub = "Check latest MOT items below";
        ownerCareTone = "warn";
      }
    }

    const motReport = {
      hasMotData: historyRows.length > 0,
      totalTests: historyRows.length,
      passCount,
      failCount,
      passRatePct: historyRows.length > 0 ? Math.round((passCount / historyRows.length) * 100) : 100,
      latestResult: latestRow ? latestRow.result : "",
      latestDateUk: latestRow ? latestRow.dateUk : "",
      expiryDateUk: formatUkDate(expiryIso),
      isMotExpired,
      isLatestClean: Boolean(latestRow && latestRow.isCleanPass && !isMotExpired),
      latestAdvisories,
      latestFailures,
      mileageConsistent: !mileageDropped,
      previousPlates,
      crashClues,
      repeatNeglect,
      ownerCareLabel,
      ownerCareSub,
      ownerCareTone,
      historyRows
    };

    // ========================================================================
    // UK RUNNING COSTS: ULEZ / BIRMINGHAM CAZ, ROAD TAX & INSURANCE BRACKET
    // ========================================================================
    const firstUsedIso = String(raw.firstUsedDate || "");
    let ulezStatus = "free"; // "free" | "borderline" | "charge"
    let ulezLabel = "✅ ULEZ & Brum CAZ Free";
    let ulezSub = "Exempt from £8–£12.50/day zones";

    if (isEV) {
      ulezLabel = "✅ ULEZ & Brum CAZ Free";
      ulezSub = "Zero-emission exempt";
    } else if (isDiesel) {
      if (year >= 2016 || (firstUsedIso && firstUsedIso >= "2015-09-01")) {
        ulezLabel = "✅ ULEZ & Brum CAZ Free";
        ulezSub = "Euro 6 diesel exempt";
      } else if (year === 2015 && !firstUsedIso) {
        ulezStatus = "borderline";
        ulezLabel = "⚠️ 2015 Diesel — Check Euro 6";
        ulezSub = "Confirm Euro 6 on V5C for CAZ/ULEZ";
      } else {
        ulezStatus = "charge";
        ulezLabel = "🚨 CAZ / ULEZ Charge Applies";
        ulezSub = "£8/day Brum CAZ · £12.50/day ULEZ";
      }
    } else {
      if (year >= 2006) {
        ulezLabel = "✅ ULEZ & Brum CAZ Free";
        ulezSub = "Euro 4+ petrol exempt";
      } else {
        ulezStatus = "charge";
        ulezLabel = "⚠️ Check ULEZ / CAZ";
        ulezSub = "Pre-2006 petrol may pay daily fee";
      }
    }

    const hasLuxuryTaxCliff = cliffs.some((c) => c.id === "uk-luxury-ved-trap");
    let roadTaxShort = "~£195/yr Tax";
    if (hasLuxuryTaxCliff) {
      roadTaxShort = "⚠️ ~£620/yr Tax";
    } else if (year <= 2016 || (firstUsedIso && firstUsedIso < "2017-04-01")) {
      if (isEV || (isHybrid && litres <= 1.8)) roadTaxShort = "£0–£20/yr Tax";
      else if (litres > 0 && litres <= 1.2) roadTaxShort = "£20–£160/yr Tax";
      else if (litres >= 2.0 && !isDiesel) roadTaxShort = "£255–£415+/yr Tax";
      else roadTaxShort = "CO2-Banded Tax";
    }

    const highInsSpec =
      /LAND ROVER|RANGE ROVER|JAGUAR|PORSCHE|TESLA|BMW|MERCEDES|MASERATI|ALFA ROMEO/.test(make) ||
      /\b(GTI|GTD|GTE|R\b|AMG|M SPORT|S3|S4|RS|VRS|ST\b|TYPE R|COOPER S|JCW)\b/.test(`${model} ${deriv}`);
    const lowInsSpec =
      !isEV &&
      litres > 0 &&
      litres <= 1.25 &&
      /FIESTA|CORSA|POLO|IBIZA|FABIA|AYGO|YARIS|C1|108|208|UP|PICANTO|I10|MICRA|SWIFT|KA|PANDA|500|SANDERO|CLIO/.test(
        `${make} ${model}`
      );

    const insShort = highInsSpec ? "High Ins." : lowInsSpec ? "Low Ins." : "Mid Ins.";
    const insSub = highInsSpec
      ? "Get insurance quote before viewing"
      : lowInsSpec
      ? "First-car / learner friendly tier"
      : "Typical family insurance bracket";

    const runningCosts = {
      ulezStatus,
      ulezLabel,
      ulezSub,
      roadTaxShort,
      insShort,
      taxInsLabel: `${roadTaxShort} · ${insShort}`,
      taxInsSub: hasLuxuryTaxCliff ? "£40k+ list-price VED band risk" : insSub,
      taxInsTone: hasLuxuryTaxCliff || highInsSpec ? "warn" : "good"
    };

    const crossReference = {
      colour: raw.primaryColour || "",
      firstUsedDateUk: formatUkDate(raw.firstUsedDate || ""),
      engineSizeCc: cc || 0,
      fuelType: raw.fuelType || "Petrol",
      recallStatus: raw.hasOutstandingRecall || "",
      dvla: raw.dvlaCrossRef
        ? {
            taxStatus: raw.dvlaCrossRef.taxStatus || "",
            taxDueDateUk: formatUkDate(raw.dvlaCrossRef.taxDueDate || ""),
            lastV5CIssuedUk: formatUkDate(raw.dvlaCrossRef.dateOfLastV5CIssued || ""),
            markedAsScrapped: Boolean(raw.dvlaCrossRef.markedAsScrapped),
            markedForExport: Boolean(raw.dvlaCrossRef.markedForExport),
            euroStatus: raw.dvlaCrossRef.euroStatus || "",
            co2Emissions: raw.dvlaCrossRef.co2Emissions || 0,
            luxuryTaxEndDateUk: formatUkDate(raw.dvlaCrossRef.artEndDate || "")
          }
        : null
    };

    // ========================================================================
    // TOTAL EXPOSURE & NEGOTIATION SCRIPT GENERATION
    // ========================================================================
    const totalMin = cliffs.reduce((sum, c) => sum + c.costMin, 0);
    const totalMax = cliffs.reduce((sum, c) => sum + c.costMax, 0);

    let overallVerdict = "LOW_RISK";
    let verdictLabel = "Clean Spec — Low Upcoming Cliff Risk";
    if (cliffs.some((c) => c.severity === "CRITICAL")) {
      overallVerdict = "CRITICAL";
      verdictLabel = "High Cliff Alert — Verify Invoices or Negotiate Hard";
    } else if (cliffs.some((c) => c.severity === "HIGH")) {
      overallVerdict = "HIGH";
      verdictLabel = "Upcoming Service Cliff — Factor Into Offer Price";
    } else if (cliffs.length > 0) {
      overallVerdict = "MEDIUM";
      verdictLabel = "Moderate Items to Check Before Paying Deposit";
    }

    const suggestedDiscount =
      cliffs.length === 0
        ? 0
        : Math.round((totalMin * 0.65) / 50) * 50;

    const recommendedOfferPrice =
      askingPrice > 0 ? Math.max(500, askingPrice - suggestedDiscount) : 0;

    // Tailored 5-Point Forecourt Inspection Checklist (tickable on phone at viewing!)
    const forecourtChecklist = [];

    if (cliffs.some((c) => c.id === "psa-puretech-wetbelt")) {
      forecourtChecklist.push("Unscrew oil filler cap & shine phone torch onto the wet belt — walk away if belt edges look cracked, swollen, or frayed.");
    } else if (!isEV) {
      forecourtChecklist.push("Touch bonnet BEFORE engine is started — confirm it is stone-cold so any 2–3 sec cold-start timing rattle isn't hidden.");
    } else {
      forecourtChecklist.push("Ask for printed Battery State-of-Health (SoH %) readout & test both slow AC and rapid DC charge port Flap/pins.");
    }

    if (isAuto && !isEV) {
      forecourtChecklist.push("Gearbox test: check smooth creep in Reverse on a slight slope + brisk 1st-to-2nd shift once warm (zero judder or flare).");
    } else if (!isEV) {
      forecourtChecklist.push("Clutch test: at 30 mph in 4th gear, press accelerator firmly — revs must rise in lockstep with road speed (no slip).");
    } else {
      forecourtChecklist.push("Inspect rear brake discs through alloy wheels for heavy rust pitting (common MOT fail on EVs due to regen braking).");
    }

    if (isAwd) {
      forecourtChecklist.push("4WD / Haldex check: do a slow full-lock turn in a car park — ensure zero rear-axle skipping, thumping, or binding.");
    } else if (isDiesel) {
      forecourtChecklist.push("Switch ignition to Stage 2 (before cranking): confirm DPF, Engine & AdBlue lights illuminate and go out cleanly after start.");
    } else {
      forecourtChecklist.push("Check coolant expansion bottle when cold: level on MAX, clean pink/blue/green colour, zero oily film or mayonnaise under oil cap.");
    }

    forecourtChecklist.push("Demand itemised garage VAT invoices (showing actual parts fitted) — a rubber stamp in a book does NOT prove belt/gearbox work.");
    forecourtChecklist.push("Match the 17-digit VIN at the base of the windscreen against the V5C logbook & check 2 working remote keys are present.");

    const carLabel = `${year} ${make} ${model}`.trim();
    const advNoteForScript =
      latestAdvisories.length > 0
        ? ` Also, were the ${latestAdvisories.length} advisory item(s) on the latest MOT sorted?`
        : "";
    const hagglingScript =
      cliffs.length === 0
        ? `Hi, I'm interested in the ${carLabel} (${mileage.toLocaleString()} miles). Could you confirm you hold full annual service invoices (not just stamps), V5C in your name, and 2 keys?${advNoteForScript} Ready to view this week if all checks out.`
        : `Hi, I'm genuinely interested in the ${carLabel} at ${mileage.toLocaleString()} miles and ready to move quickly. Before I come down, do you have the itemised garage VAT invoice confirming the ${cliffs[0].category.toLowerCase()} (${cliffs[0].title.replace(/ Cliff| Risk| Warning/g, "")}) has already been completed? Without documented proof, UK specialist cost on that work is £${cliffs[0].costMin.toLocaleString()}–£${cliffs[0].costMax.toLocaleString()}, so I'd need to factor ~£${suggestedDiscount.toLocaleString()} into my offer (or have it completed prior to collection).${advNoteForScript} Let me know!`;

    return {
      vehicleSummary: {
        registration: raw.registration || "SPEC CHECK",
        carLabel,
        derivative: raw.derivative || `${litres ? litres.toFixed(1) + "L " : ""}${raw.fuelType || ""}`.trim(),
        year,
        ageYears,
        mileage,
        avgAnnualMiles,
        fuelType: raw.fuelType || "Petrol",
        transmission: isAuto ? "Automatic" : "Manual",
        askingPrice
      },
      motReport,
      runningCosts,
      crossReference,
      overallVerdict,
      verdictLabel,
      cliffCount: cliffs.length,
      totalExposureMin: totalMin,
      totalExposureMax: totalMax,
      suggestedDiscount,
      recommendedOfferPrice,
      forecourtChecklist,
      cliffs,
      hagglingScript
    };
  }

  // Parse pasted text from AutoTrader App, Facebook Marketplace, Gumtree or eBay Motors!
  function parseAdvertText(rawText, carDirectory) {
    const text = String(rawText || "").trim();
    if (!text) return null;
    const upper = text.toUpperCase();

    let foundMake = "";
    let foundModel = "";
    const dir = carDirectory && carDirectory.makesModels ? carDirectory.makesModels : {};
    const makeKeys = Object.keys(dir).sort((a, b) => b.length - a.length);

    const aliases = {
      "VW ": "VOLKSWAGEN",
      "MERCEDES-BENZ": "MERCEDES",
      "MERC ": "MERCEDES",
      "RANGE ROVER": "LAND ROVER",
      "CITROËN": "CITROEN",
      "ŠKODA": "SKODA"
    };

    for (const [alias, target] of Object.entries(aliases)) {
      if (upper.includes(alias)) {
        foundMake = target;
        break;
      }
    }

    if (!foundMake) {
      for (const mk of makeKeys) {
        if (new RegExp("\\b" + mk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text)) {
          foundMake = mk;
          break;
        }
      }
    }

    if (foundMake && dir[foundMake]) {
      const modelsSorted = [...dir[foundMake]].sort((a, b) => b.length - a.length);
      for (const mod of modelsSorted) {
        if (new RegExp("\\b" + mod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text)) {
          foundModel = mod;
          break;
        }
      }
    }

    const yearMatch =
      text.match(/\b(200[1-9]|201[0-9]|202[0-6])\s*\((?:\d{2}\s*reg|Private)/i) ||
      text.match(/\b(200[3-9]|201[0-9]|202[0-6])\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    let mileage = 0;
    const milesExplicit = text.match(/\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,6})\s*(?:miles|mi\b|mls)/i);
    const milesK = text.match(/\b([0-9]{1,3}(?:\.[0-9])?)\s*k\s*(?:miles|mi)?\b/i);
    if (milesExplicit) {
      mileage = parseInt(milesExplicit[1].replace(/,/g, ""), 10) || 0;
    } else if (milesK) {
      mileage = Math.round(parseFloat(milesK[1]) * 1000);
    }

    const litreMatch = text.match(
      /\b([0-6]\.[0-9])\s*(?:L|litre|T|TSI|TFSI|TDI|EcoBoost|PureTech|EcoBlue|Skyactiv|VTEC|MultiAir|THP|DIG-T|TCe|d|i)?\b/i
    );
    const litres = litreMatch ? parseFloat(litreMatch[1]) : 0;

    let fuelType = "Petrol";
    if (/\b(Diesel|TDI|BlueHDi|EcoBlue|dCi|CDTi|TD4|SD4|Skyactiv-D)\b/i.test(text)) fuelType = "Diesel";
    else if (/\b(Hybrid|PHEV|Plug-in|e-Hybrid|Self-Charging)\b/i.test(text)) fuelType = "Hybrid Electric";
    else if (/\b(Electric|100%\s*Electric|Zero\s*Emissions|\bEV\b|kWh)\b/i.test(text) && !litres) fuelType = "Electric";

    const transmission = /\b(Automatic|Auto|DSG|S\s*tronic|Powershift|Tiptronic|CVT|DCT|Steptronic|EAT8|EAT6)\b/i.test(text)
      ? "Automatic"
      : "Manual";

    const awd = /\b(4Motion|quattro|4WD|AWD|xDrive|4MATIC|ALL4|4x4)\b/i.test(text);

    const priceMatch = text.match(/£\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})/);
    const askingPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) || 0 : 0;

    return {
      make: foundMake,
      model: foundModel,
      derivative: text.slice(0, 120),
      year,
      fuelType,
      litres,
      engineSizeCc: Math.round(litres * 1000),
      transmission,
      awd,
      mileage,
      askingPrice
    };
  }

  root.CliffEngine = {
    DEMO_VEHICLES,
    analyzeVehicle,
    parseAdvertText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.CliffEngine;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
