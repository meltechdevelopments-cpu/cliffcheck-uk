// ============================================================================
// CLIFFCHECK UK — CORE ENGINE, GEARBOX, DPF, TAX & HAGGLING INTELLIGENCE
// Shared between the Phone/Web App and the Chrome Browser Add-On
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
    return String(str || "").trim().toUpperCase();
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
  // Input: { registration, make, model, derivative, year, firstUsedDate,
  //          fuelType, engineSizeCc, transmission, mileage, askingPrice, motTests }
  // --------------------------------------------------------------------------
  function analyzeVehicle(raw) {
    const make = norm(raw.make);
    const model = norm(raw.model);
    const deriv = norm(raw.derivative);
    const fullText = `${make} ${model} ${deriv}`;
    const fuel = norm(raw.fuelType);
    const isDiesel = fuel.includes("DIESEL");
    const isHybrid = fuel.includes("HYBRID") || fullText.includes("HYBRID");
    const isEV = (fuel === "ELECTRIC" || fullText.includes("ELECTRIC")) && !isHybrid;
    const year = Number(raw.year) || (raw.firstUsedDate ? parseInt(String(raw.firstUsedDate).slice(0, 4), 10) : 2018);
    const ageYears = Math.max(0, CURRENT_YEAR - year);
    const cc = Number(raw.engineSizeCc) || 0;
    const litres = parseEngineLitres(cc, deriv);
    const mileage = Math.max(0, Number(raw.mileage) || 0);
    const gearbox = norm(raw.transmission || (/(AUTO|DSG|STRONIC|S TRONIC|POWERSHIFT|TIPTRONIC|DCT|CVT|STEPTRONIC)/.test(fullText) ? "AUTOMATIC" : "MANUAL"));
    const isAuto = gearbox.includes("AUTO") || /(DSG|POWERSHIFT|CVT|DCT|STRONIC)/.test(fullText);

    const cliffs = [];

    // ========================================================================
    // CHECK 1: TIMING DRIVE (WET BELTS, STRETCH-PRONE CHAINS & DRY CAMBELTS)
    // ========================================================================
    let timingMatched = false;

    // 1A. Ford 1.0 EcoBoost (Wet belt 2012-2019; Chain 2020+ WITH wet oil-pump belt!)
    if (
      make === "FORD" &&
      !isDiesel &&
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
            dueText: mileage >= dueMiles
              ? `OVERDUE by ${(mileage - dueMiles).toLocaleString()} miles (unless already replaced)`
              : ageYears >= dueYears
              ? `AGE-DUE NOW (${ageYears} yrs old — rubber degrades in hot engine oil)`
              : `Due in ~${Math.max(0, milesLeft).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s)`,
            plainReason:
              "This engine runs its rubber timing belt inside hot engine oil. Rubber fragments shed into the sump and clog the oil pick-up strainer ('EcoBoom' failure). UK Ford specialists strongly advise replacement + sump strainer clean by 6–7 years or 60,000 miles — NOT Ford's old 10-year brochure figure.",
            proofToAsk:
              "Itemised garage VAT invoice explicitly showing 'Wet Timing Belt Kit, Oil Pump Belt & Sump Off Strainer Clean' (a normal service stamp does NOT cover this)."
          });
        } else {
          // 2020+ MHEV Chain-driven 1.0 EcoBoost still uses a wet oil-pump belt!
          cliffs.push({
            id: "ford-ecoboost-mhev-oilbelt",
            category: "Wet Oil-Pump Drive Belt",
            severity: mileage >= 55000 || ageYears >= 6 ? "HIGH" : "MEDIUM",
            title: "2020+ EcoBoost Chain Model — Hidden Wet Oil-Pump Belt",
            costMin: 750,
            costMax: 1150,
            dueText: mileage >= 65000 ? "Inspection / replacement due around 65k–80k miles" : "Watch from 60,000 miles / 6 years",
            plainReason:
              "Later 1.0 EcoBoost engines switched the main timing drive to a chain, BUT still use a rubber belt running in oil to drive the oil pump, which has a active recall/inspection history on select automatic builds.",
            proofToAsk: "Full timely annual oil-change invoices using exact Ford WSS-M2C948-B 5W-20 oil + recall check."
          });
        }
      }
    }

    // 1B. PSA / Stellantis 1.2 PureTech / Vauxhall 1.2 Turbo Wet Belt (2014–2023)
    if (
      !timingMatched &&
      !isDiesel &&
      /PEUGEOT|CITROEN|CITROËN|DS|VAUXHALL|OPEL|TOYOTA/.test(make) &&
      ((cc >= 1180 && cc <= 1220) || litres === 1.2 || fullText.includes("PURETECH")) &&
      year >= 2014 &&
      !(year >= 2024 && isHybrid)
    ) {
      // Exclude old Vauxhall 1.2 4-cylinder Corsa E (1229cc)
      if (cc !== 1229) {
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
              ? `OVERDUE by ${(mileage - dueMiles).toLocaleString()} miles (revised 62k schedule)`
              : ageYears >= dueYears
              ? `AGE-DUE NOW (${ageYears} yrs old vs revised 6-year limit)`
              : `Due in ~${Math.max(0, dueMiles - mileage).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s)`,
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
            ? "DUE / OVERDUE NOW unless invoice-verified"
            : `Approaching specialist 60k–70k / 6-yr cliff (${(dueMiles - mileage).toLocaleString()} mi left)`,
        plainReason:
          "Ford slashed the 2.0 EcoBlue wet-belt interval after premature snaps wrote off engines well before 100k miles.",
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
        dueText: mileage >= 60000 || ageYears >= 6 ? "DUE NOW (6 yrs / 60k–75k miles)" : "Due at 6 years / ~60,000 miles",
        plainReason:
          "Most buyers assume all Hondas use bulletproof metal chains, but the 1.0 turbo uses a wet belt in oil that requires expensive specialist tooling.",
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
        dueText: mileage >= 55000 ? `HIGH-RISK WINDOW NOW (${mileage.toLocaleString()} miles)` : "Risk climbs sharply from 55,000 miles",
        plainReason:
          "2-year / 21,000-mile factory oil intervals allow soot dilution to stretch the rear-mounted timing chains (gearbox-out job to replace).",
        proofToAsk:
          "Cold-start engine listen (must NOT rattle for 2–3 seconds on first morning start) + annual 10k-mile oil change receipts or upgraded chain invoice."
      });
    }

    // 1F. BMW / MINI 2.0d N47 / High-Mileage B47 Rear Chain
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
          title: "BMW N47 2.0d Rear Timing Chain Rattle Risk",
          costMin: 1350,
          costMax: 2100,
          dueText: `Active risk at ${mileage.toLocaleString()} miles unless already upgraded`,
          plainReason:
            "The timing chain sits at the back of the engine against the bulkhead, requiring engine/gearbox removal when guides wear.",
          proofToAsk: "Cold-start metallic rattle check + proof of <10k mile oil services or chain replacement invoice."
        });
      } else if (mileage >= 85000) {
        cliffs.push({
          id: "bmw-b47-chain",
          category: "High-Mileage Chain & EGR Recall Check",
          severity: "MEDIUM",
          title: "BMW B47 2.0d Chain & EGR Cooler Check",
          costMin: 450,
          costMax: 1500,
          dueText: "Inspect cold-start chain noise & confirm free BMW EGR recall completed",
          plainReason:
            "Post-2015 B47 engines are much stronger than N47, but suffer coolant-leaking EGR coolers (recall item) and chain wear past 100k if run on 18k-mile oil intervals.",
          proofToAsk: "Confirm zero coolant loss + BMW EGR recall completion."
        });
      }
    }

    // 1G. Nissan / Renault 1.2 DIG-T / TCe Timing Chain & Oil Consumption (2013-2018)
    if (
      !timingMatched &&
      /NISSAN|RENAULT|DACIA/.test(make) &&
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
        dueText: mileage >= 45000 ? `HIGH-RISK WINDOW (${mileage.toLocaleString()} miles)` : "Watch closely from 45,000 miles",
        plainReason:
          "Well-known HRA2DDT / H5Ft 1.2 turbo issue where low-tension piston rings burn oil, starving the hydraulic timing chain tensioner.",
        proofToAsk: "Check dipstick oil level on arrival + listen for metallic rattle on cold start."
      });
    }

    // 1H. Standard Dry Cambelt + Water Pump Schedule (VW/Audi/Skoda/SEAT TDI/TSI, Volvo, Ford TDCi, etc.)
    if (!timingMatched && !isEV) {
      const likelyChainMakes = /TOYOTA|LEXUS|MAZDA|HYUNDAI|KIA|BMW|MERCEDES|SUZUKI/;
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
                ? `DUE BY AGE/MILEAGE (${ageYears} yrs / ${mileage.toLocaleString()} mi)`
                : `Due within ~${Math.max(0, dueMiles - mileage).toLocaleString()} miles or ${Math.max(0, dueYears - ageYears)} yr(s)`,
            plainReason:
              "Sellers routinely trade cars in at 5–7 years / 55k–75k miles to avoid paying £550–£850 for a cambelt and water pump kit.",
            proofToAsk: "Ask seller directly: 'Has the cambelt and water pump been done, and do you have the itemised invoice?'"
          });
        }
      }
    }

    // ========================================================================
    // CHECK 2: AUTOMATIC GEARBOX & AWD HALDEX FLUID CLIFFS
    // ========================================================================
    if (isAuto && !isEV && !isHybrid) {
      if (/VOLKSWAGEN|VW|AUDI|SKODA|ŠKODA|SEAT|CUPRA/.test(make)) {
        const isSmallDryDsg = !isDiesel && litres > 0 && litres <= 1.5;
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
                "1.0–1.5 petrol VWs/Audis use the sealed DQ200 dry-clutch DSG. Slipping between 1st–2nd gear or slow engagement in reverse signals worn clutch packs or mechatronic accumulator wear.",
              proofToAsk: "Test uphill creep and brisk 1st-to-2nd pull when warm — walk away if there is any shudder."
            });
          }
        } else {
          // Wet-clutch DSG (2.0 TSI / 2.0 TDI) — strict 38k-40k mile oil & filter cliff!
          const nextMultiple = Math.ceil(Math.max(1, mileage) / 40000) * 40000;
          const distToCliff = nextMultiple - mileage;
          const justPassed = mileage >= 38000 && mileage % 40000 < 12000;
          if (distToCliff <= 7000 || justPassed || mileage >= 36000) {
            cliffs.push({
              id: "vag-wet-dsg-service",
              category: "Automatic Gearbox Cliff",
              severity: mileage >= 37000 ? "HIGH" : "MEDIUM",
              title: "DSG / S tronic 40,000-Mile Gearbox Oil & Filter Cliff",
              costMin: 290,
              costMax: 420,
              dueText:
                mileage >= 38000
                  ? `VERIFY 40k SERVICE DONE (current: ${mileage.toLocaleString()} mi)`
                  : `Due in ${(40000 - mileage).toLocaleString()} miles (at 40,000 mi)`,
              plainReason:
                "Wet-clutch DSG gearboxes require fresh fluid and filter every 38,000–40,000 miles. Skipping it causes £1,500–£2,200 mechatronic valve-body failure.",
              proofToAsk: "Specific invoice showing 'DSG Gearbox Oil & Filter Change' around 38k–40k (and 80k) miles."
            });
          }
        }
      } else if (make === "FORD" && year <= 2019) {
        cliffs.push({
          id: "ford-powershift-cliff",
          category: "Powershift Gearbox Cliff",
          severity: "CRITICAL",
          title: "Ford Powershift 37,500-Mile Oil & Filter Cliff",
          costMin: 310,
          costMax: 430,
          dueText: "Strict 3-year / 37,500-mile mandatory service (failure = £2,000+)",
          plainReason:
            "Ford Powershift dual-clutch automatics fail catastrophically (£1,800–£2,800) if even one 37,500-mile / 3-year fluid & filter change was skipped.",
          proofToAsk: "Demand documented Powershift oil & filter receipts every 37,500 miles — walk away without them."
        });
      } else if (mileage >= 52000) {
        cliffs.push({
          id: "auto-zf-fluid-cliff",
          category: "Automatic Gearbox Fluid Window",
          severity: "MEDIUM",
          title: "60,000-Mile Automatic Transmission Fluid & Pan Service",
          costMin: 380,
          costMax: 580,
          dueText: mileage >= 60000 ? "Recommended now (60k–75k specialist window)" : `Recommended in ~${(60000 - mileage).toLocaleString()} miles`,
          plainReason:
            "Car brochures call automatic gearbox oil 'sealed for life', but gearbox maker ZF explicitly advises fresh fluid & pan filter at 60,000–75,000 miles to prevent harsh shifts.",
          proofToAsk: "Check for smooth cold & hot shifts; factor £450 preventative gearbox service if over 60k miles."
        });
      }
    }

    // ========================================================================
    // CHECK 3: DIESEL LOW-MILEAGE SHORT-TRIP DPF & ADBLUE TRAP
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
        proofToAsk: "Plug in a £20 OBD scanner on viewing to check 'DPF Soot Mass' & confirm zero AdBlue countdown resets."
      });
    }

    // ========================================================================
    // CHECK 4: UK £40,000+ LIST-PRICE "EXPENSIVE CAR ROAD TAX" TRAP (YEARS 2-6)
    // ========================================================================
    const premiumMakes = /BMW|MERCEDES|AUDI|LAND ROVER|RANGE ROVER|JAGUAR|PORSCHE|VOLVO|LEXUS|TESLA|POLESTAR|ALFA ROMEO/;
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
        dueText: `Extra £425/yr supplement on top of £195 tax until ${year + 6}`,
        plainReason:
          "Even if this used car only costs £20k–£28k today, UK DVLA charges ~£620/year road tax until Year 6 if its brand-new sticker price (including paint & optional packs!) was £40,000.01 or higher.",
        proofToAsk: "Ask dealer to confirm exact annual VED tax band or check GOV.UK Vehicle Tax status before paying deposit."
      });
    }

    // ========================================================================
    // CHECK 5: MOT HISTORY MILEAGE DROP (CLOCKING) & OIL-LEAK ADVISORIES
    // ========================================================================
    const motTests = Array.isArray(raw.motTests) ? raw.motTests : [];
    if (motTests.length >= 2) {
      // Sort oldest to newest
      const sorted = [...motTests]
        .filter((t) => Number(t.mileage || t.odometerValue) > 0)
        .sort((a, b) => String(a.date || a.completedDate).localeCompare(String(b.date || b.completedDate)));
      for (let i = 1; i < sorted.length; i++) {
        const prev = Number(sorted[i - 1].mileage || sorted[i - 1].odometerValue);
        const curr = Number(sorted[i].mileage || sorted[i].odometerValue);
        if (curr < prev - 100) {
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

    // Check MOT advisories for oil leaks / undertrays / corrosion
    const latestAdvisories = motTests[0] && Array.isArray(motTests[0].advisories) ? motTests[0].advisories : [];
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

    const carLabel = `${year} ${make} ${model}`.trim();
    const hagglingScript =
      cliffs.length === 0
        ? `Hi, I'm interested in the ${carLabel} (${mileage.toLocaleString()} miles). Could you confirm you hold full annual service invoices (not just stamps) and 2 keys? Ready to view this week if all checks out.`
        : `Hi, I'm genuinely interested in the ${carLabel} at ${mileage.toLocaleString()} miles and ready to move quickly. Before I come down, do you have the itemised garage VAT invoice confirming the ${cliffs[0].category.toLowerCase()} (${cliffs[0].title.replace(/ Cliff| Risk| Warning/g, "")}) has already been completed? Without documented proof, UK specialist cost on that work is £${cliffs[0].costMin.toLocaleString()}–£${cliffs[0].costMax.toLocaleString()}, so I'd need to factor ~£${suggestedDiscount.toLocaleString()} into my offer (or have it completed prior to collection). Let me know!`;

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
      overallVerdict,
      verdictLabel,
      cliffCount: cliffs.length,
      totalExposureMin: totalMin,
      totalExposureMax: totalMax,
      suggestedDiscount,
      cliffs,
      hagglingScript
    };
  }

  root.CliffEngine = {
    DEMO_VEHICLES,
    analyzeVehicle
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.CliffEngine;
  }
})(typeof self !== "undefined" ? self : window);
