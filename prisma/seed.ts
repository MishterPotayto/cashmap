import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CashMap database...");

  // ═══════════════════════════════════════
  // 1. CATEGORIES
  // ═══════════════════════════════════════
  const categories = [
    // INCOME
    { name: "Income", group: "INCOME" as const },
    // BILLS
    { name: "Insurance", group: "BILLS" as const },
    { name: "Utilities", group: "BILLS" as const },
    { name: "Rates", group: "BILLS" as const },
    { name: "Inland Revenue", group: "BILLS" as const },
    { name: "Loan", group: "BILLS" as const },
    { name: "Credit Card Payment", group: "BILLS" as const },
    // LIVING_COSTS
    { name: "Groceries", group: "LIVING_COSTS" as const },
    { name: "Petrol", group: "LIVING_COSTS" as const },
    { name: "Dining Out", group: "LIVING_COSTS" as const },
    { name: "Cafes", group: "LIVING_COSTS" as const },
    { name: "Takeaways", group: "LIVING_COSTS" as const },
    { name: "Public Transport", group: "LIVING_COSTS" as const },
    { name: "Taxis", group: "LIVING_COSTS" as const },
    { name: "Carparking", group: "LIVING_COSTS" as const },
    { name: "Health and Beauty", group: "LIVING_COSTS" as const },
    { name: "Childcare", group: "LIVING_COSTS" as const },
    { name: "Child Care Costs", group: "LIVING_COSTS" as const },
    { name: "Gym", group: "LIVING_COSTS" as const },
    { name: "Household", group: "LIVING_COSTS" as const },
    // DISCRETIONARY
    { name: "Retail", group: "DISCRETIONARY" as const },
    { name: "Subscriptions", group: "DISCRETIONARY" as const },
    { name: "Alcohol and Tobacco", group: "DISCRETIONARY" as const },
    { name: "Gambling", group: "DISCRETIONARY" as const },
    { name: "Donations", group: "DISCRETIONARY" as const },
    { name: "Vehicle", group: "DISCRETIONARY" as const },
    // OTHER
    { name: "Bank Transfers", group: "OTHER" as const },
    { name: "Interest", group: "OTHER" as const },
    { name: "Dishonours", group: "OTHER" as const },
    { name: "Misc Paypal", group: "OTHER" as const },
    { name: "Not Categorised Party", group: "OTHER" as const },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, group: cat.group, isSystem: true },
    });
    categoryMap[cat.name] = created.id;
  }
  console.log(`  ✓ ${categories.length} categories seeded`);

  // ═══════════════════════════════════════
  // 2. FEATURE GATES
  // ═══════════════════════════════════════
  const featureGates = [
    { key: "csv.upload", name: "CSV Upload", defaultEnabled: true },
    { key: "categorisation.auto", name: "Auto Categorisation", defaultEnabled: true },
    { key: "categorisation.ai", name: "AI Categorisation", defaultEnabled: true },
    { key: "budget.setup", name: "Budget Setup", defaultEnabled: true },
    { key: "budget.waterfall", name: "Budget Waterfall View", defaultEnabled: true },
    { key: "reports.category_breakdown", name: "Category Spending Report", defaultEnabled: true },
    { key: "reports.budget_vs_actual", name: "Budget vs Actual Report", defaultEnabled: false },
    { key: "reports.trends", name: "Spending Trends Report", defaultEnabled: false },
    { key: "reports.income_vs_expenses", name: "Income vs Expenses Report", defaultEnabled: false },
    { key: "goals.basic", name: "Goals (up to 3)", defaultEnabled: true },
    { key: "goals.unlimited", name: "Unlimited Goals", defaultEnabled: false },
    { key: "adviser.client_management", name: "Client Management", defaultEnabled: false },
    { key: "adviser.client_view", name: "View Client Dashboards", defaultEnabled: false },
    { key: "adviser.org_mappings", name: "Organisation Mapping Rules", defaultEnabled: false },
    { key: "adviser.client_alerts", name: "Client Activity Alerts", defaultEnabled: false },
    { key: "export.no_branding", name: "Exports Without CashMap Branding", defaultEnabled: false },
    { key: "history.6months", name: "6 Month History", defaultEnabled: true },
    { key: "history.unlimited", name: "Unlimited History", defaultEnabled: false },
  ];

  const featureMap: Record<string, string> = {};
  for (const fg of featureGates) {
    const created = await prisma.featureGate.upsert({
      where: { key: fg.key },
      update: {},
      create: fg,
    });
    featureMap[fg.key] = created.id;
  }
  console.log(`  ✓ ${featureGates.length} feature gates seeded`);

  // ═══════════════════════════════════════
  // 3. SUBSCRIPTION PLANS
  // ═══════════════════════════════════════
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      priceCents: 0,
      interval: "MONTH",
      maxClients: null,
      isActive: true,
    },
  });

  const proMonthly = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro-monthly" },
    update: {},
    create: {
      name: "Pro Monthly",
      slug: "pro-monthly",
      priceCents: 2900,
      interval: "MONTH",
      maxClients: 50,
      isActive: true,
    },
  });

  const proAnnual = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro-annual" },
    update: {},
    create: {
      name: "Pro Annual",
      slug: "pro-annual",
      priceCents: 24900,
      interval: "YEAR",
      maxClients: 50,
      isActive: true,
    },
  });

  // Link features to plans
  const freeFeatureKeys = featureGates
    .filter((f) => f.defaultEnabled)
    .map((f) => f.key);
  const allFeatureKeys = featureGates.map((f) => f.key);

  for (const key of freeFeatureKeys) {
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: freePlan.id, featureId: featureMap[key] } },
      update: {},
      create: { planId: freePlan.id, featureId: featureMap[key] },
    });
  }

  for (const key of allFeatureKeys) {
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: proMonthly.id, featureId: featureMap[key] } },
      update: {},
      create: { planId: proMonthly.id, featureId: featureMap[key] },
    });
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: proAnnual.id, featureId: featureMap[key] } },
      update: {},
      create: { planId: proAnnual.id, featureId: featureMap[key] },
    });
  }
  console.log("  ✓ 3 subscription plans seeded with feature links");

  // ═══════════════════════════════════════
  // 4. MAPPING RULES
  // ═══════════════════════════════════════

  // Helper to create a mapping rule
  async function createRule(
    lookupText: string,
    displayName: string,
    categoryName: string,
    priority: number
  ) {
    const catId = categoryMap[categoryName];
    if (!catId) {
      console.warn(`  ⚠ Category not found: "${categoryName}" for rule "${lookupText}"`);
      return;
    }
    await prisma.mappingRule.create({
      data: {
        lookupText,
        displayName,
        categoryId: catId,
        priority,
        source: "SYSTEM",
      },
    });
  }

  // Priority 3 — Edge case overrides (checked FIRST)
  const edgeCases: [string, string, string][] = [
    ["Pak N Save Fuel", "Pak N Save Fuel", "Petrol"],
    ["YouTubePremium", "YouTubePremium", "Subscriptions"],
    ["Bill Payment", "Not Categorised Party", "Not Categorised Party"],
  ];

  for (const [lookup, display, cat] of edgeCases) {
    await createRule(lookup, display, cat, 3);
  }
  console.log(`  ✓ ${edgeCases.length} edge case rules seeded`);

  // Priority 1 — Exact merchant matches (checked SECOND)
  const exactMerchants: [string, string, string][] = [
    ["AIA", "AIA", "Insurance"],
    ["2degreebroadband", "2degreebroadband", "Utilities"],
    ["2degrees", "2degrees", "Utilities"],
    ["Afterpay", "Afterpay", "Credit Card Payment"],
    ["Alibaba", "Alibaba", "Retail"],
    ["AliExpress", "AliExpress", "Retail"],
    ["AMAZON PRIME", "AMAZON PRIME", "Subscriptions"],
    ["Apple", "Apple", "Subscriptions"],
    ["ASB BANK Insurance", "ASB BANK Insurance", "Insurance"],
    ["BP", "BP", "Petrol"],
    ["Briscoes", "Briscoes", "Retail"],
    ["BUNNINGS", "BUNNINGS", "Retail"],
    ["Burger King", "Burger King", "Takeaways"],
    ["Chemist Warehouse", "Chemist Warehouse", "Health and Beauty"],
    ["City Mission", "City Mission", "Donations"],
    ["Coca Cola", "Coca Cola", "Takeaways"],
    ["COLUMBUS", "COLUMBUS", "Cafes"],
    ["Countdown", "Countdown", "Groceries"],
    ["DELVREASY", "DELVREASY", "Takeaways"],
    ["Disney", "Disney", "Subscriptions"],
    ["Domino", "Domino's", "Takeaways"],
    ["Farmers", "Farmers", "Retail"],
    ["Fidelity", "Fidelity", "Insurance"],
    ["Flick Energy", "Flick Energy", "Utilities"],
    ["FOUR SQUARE", "FOUR SQUARE", "Groceries"],
    ["Fresh Choice", "Fresh Choice", "Groceries"],
    ["Gem Credit", "Gem Credit", "Credit Card Payment"],
    ["Gem Credit Card", "Gem Credit", "Credit Card Payment"],
    ["GEM VISA", "Gem Credit", "Credit Card Payment"],
    ["Genesis", "Genesis", "Utilities"],
    ["Google", "Google", "Subscriptions"],
    ["Home Improvement", "Home Improvement", "Retail"],
    ["I.R.D", "I.R.D", "Inland Revenue"],
    ["Inland Revenue", "Inland Revenue", "Inland Revenue"],
    ["IRD", "IRD", "Inland Revenue"],
    ["Just Us Kids", "Just Us Kids", "Retail"],
    ["KCDC RATES", "KCDC RATES", "Rates"],
    ["KFC", "KFC", "Takeaways"],
    ["Kids Can", "Kids Can", "Donations"],
    ["Kmart", "Kmart", "Retail"],
    ["LIQUORLAND", "LIQUORLAND", "Groceries"],
    ["Lone Star", "Lone Star", "Dining Out"],
    ["McDonald", "McDonald's", "Takeaways"],
    ["Microsoft", "Microsoft", "Subscriptions"],
    ["Mighty APE", "Mighty APE", "Retail"],
    ["MITRE 10", "MITRE 10", "Retail"],
    ["Moore Wilson", "Moore Wilson", "Groceries"],
    ["MyLotto", "MyLotto", "Retail"],
    ["Neon", "Neon", "Subscriptions"],
    ["Netflix", "Netflix", "Subscriptions"],
    ["New World", "New World", "Groceries"],
    ["New Zealand Racing", "New Zealand Racing", "Gambling"],
    ["Northland Waste", "Northland Waste", "Household"],
    ["NZ Inland Revenue Benefits", "NZ Inland Revenue Benefits", "Inland Revenue"],
    ["NZ Transport Agency", "NZ Transport Agency", "Vehicle"],
    ["Orcon", "Orcon", "Utilities"],
    ["Osteopath", "Osteopath", "Health and Beauty"],
    ["Pak n Save", "Pak n Save", "Groceries"],
    ["Pak'n Save", "Pak n Save", "Groceries"],
    ["Paper Plus", "Paper Plus", "Retail"],
    ["Partners Life", "Partners Life", "Insurance"],
    ["PAYMENT RECEIVED THANK YOU NZL", "WESTPACNZ Credit Card Repayment", "Credit Card Payment"],
    ["PLACEMAKERS", "PLACEMAKERS", "Retail"],
    ["Postie", "Postie", "Retail"],
    ["Q CARD", "Q CARD", "Credit Card Payment"],
    ["REPCO", "REPCO", "Vehicle"],
    ["Shivaay Spices", "Shivaay Spices", "Groceries"],
    ["Shosha", "Shosha", "Retail"],
    ["Snapper", "Snapper", "Public Transport"],
    ["Spark", "Spark", "Utilities"],
    ["SPCA", "SPCA", "Donations"],
    ["Spotlight", "Spotlight", "Retail"],
    ["St Pierre", "St Pierre", "Takeaways"],
    ["Starlink", "Starlink", "Utilities"],
    ["Subway", "Subway", "Takeaways"],
    ["The Baby Factory", "The Baby Factory", "Retail"],
    ["The Warehouse", "The Warehouse", "Retail"],
    ["TRADE DEPOT", "TRADE DEPOT", "Retail"],
    ["Trustpower", "Trustpower", "Utilities"],
    ["TWO DEGREES", "2 Degrees", "Utilities"],
    ["UBER EATS", "UBER EATS", "Takeaways"],
    ["UBER* EATS", "UBER EATS", "Takeaways"],
    ["UNARRANGED OVERDRAFT FEE", "UNARRANGED OVERDRAFT FEE", "Dishonours"],
    ["UNIMED", "UNIMED", "Insurance"],
    ["Vero Ins", "Vero Insurance", "Insurance"],
    ["Waitomo App", "Waitomo App", "Petrol"],
    ["Warehouse Stationery", "Warehouse Stationery", "Retail"],
    ["WCC PARKING", "WCC PARKING", "Vehicle"],
    ["WESTPACNZ Credit Card Repayment", "WESTPACNZ Credit Card Repayment", "Credit Card Payment"],
    ["WHITCOULL", "WHITCOULLS", "Retail"],
    ["Woolworths", "Woolworths", "Groceries"],
    ["Z Energy", "Z Energy", "Petrol"],
    ["UBER TRIP", "UBER TRIP", "Taxis"],
    ["Kindle", "Kindle", "Subscriptions"],
    ["Spotify", "Spotify", "Subscriptions"],
    ["Contact Energy", "Contact Energy", "Utilities"],
    ["WOMENS REFUGE", "WOMENS REFUGE", "Donations"],
    ["LES MILLS", "LES MILLS", "Gym"],
    ["Door Dash", "Door Dash", "Takeaways"],
    ["Southern Cross", "Southern Cross", "Insurance"],
    ["Heartland Bank Ltd", "Heartland Bank Ltd", "Loan"],
    ["COSTCO", "COSTCO", "Groceries"],
    ["CARE PARK", "CARE PARK", "Carparking"],
    ["Cityfitness", "Cityfitness", "Gym"],
    ["CALTEX", "CALTEX", "Petrol"],
    ["PAYMYPARK", "PAYMYPARK", "Carparking"],
    ["MOJO", "MOJO", "Cafes"],
    ["TEMU", "TEMU", "Retail"],
    ["DONUT KING", "DONUT KING", "Takeaways"],
    ["GILMOURS", "GILMOURS", "Groceries"],
    ["PARKMATE", "PARKMATE", "Carparking"],
    ["MOBIL", "MOBIL", "Petrol"],
    ["GULL WAIONE", "GULL WAIONE", "Petrol"],
    ["Z Seaview", "Z Seaview", "Petrol"],
    ["Playschool", "Playschool", "Childcare"],
    ["RESOLUTION LIFE", "RESOLUTION LIFE", "Insurance"],
  ];

  for (const [lookup, display, cat] of exactMerchants) {
    await createRule(lookup, display, cat, 1);
  }
  console.log(`  ✓ ${exactMerchants.length} exact merchant rules seeded`);

  // Priority 2 — Keyword/generic matches (checked LAST)
  const keywords: [string, string, string][] = [
    ["Automotive", "Automotive", "Vehicle"],
    ["Bakery", "Bakery", "Takeaways"],
    ["Barber", "Barber", "Health and Beauty"],
    ["Cafe", "Cafe", "Cafes"],
    ["Chemist", "Chemist", "Health and Beauty"],
    ["Child Care", "Child Care", "Child Care Costs"],
    ["Child Care Centre", "Child Care Centre", "Child Care Costs"],
    ["Childcare", "Childcare", "Child Care Costs"],
    ["Dairy", "Dairy", "Groceries"],
    ["Day Spa", "Day Spa", "Health and Beauty"],
    ["Food", "Food", "Takeaways"],
    ["Fuel", "Fuel", "Petrol"],
    ["Groceries", "Groceries", "Groceries"],
    ["Hairdressers", "Hairdressers", "Health and Beauty"],
    ["Insurance", "Insurance", "Insurance"],
    ["Massage", "Massage", "Health and Beauty"],
    ["Medical", "Medical", "Health and Beauty"],
    ["Paypal", "Paypal", "Misc Paypal"],
    ["Petrol", "Petrol", "Petrol"],
    ["Pharmacy", "Pharmacy", "Health and Beauty"],
    ["Physio", "Physio", "Health and Beauty"],
    ["Restaurant", "Restaurant", "Dining Out"],
    ["Takeaway", "Takeaway", "Takeaways"],
    ["Tobacco", "Tobacco", "Alcohol and Tobacco"],
    ["Salary", "Salary", "Income"],
    ["Wages", "Wages", "Income"],
    ["Kebab", "Kebab", "Takeaways"],
    ["Coffee", "Coffee", "Takeaways"],
    ["Pizz", "Pizz", "Takeaways"],
    ["Beauty", "Beauty", "Health and Beauty"],
    ["MB TRANSFER", "MB TRANSFER", "Bank Transfers"],
    ["Interest", "Interest", "Interest"],
    ["SUPERETTE", "SUPERETTE", "Groceries"],
    ["CAR PARK", "CAR PARK", "Carparking"],
    ["Daycare", "Daycare", "Childcare"],
    ["Liquor", "Liquor", "Alcohol and Tobacco"],
  ];

  for (const [lookup, display, cat] of keywords) {
    await createRule(lookup, display, cat, 2);
  }
  console.log(`  ✓ ${keywords.length} keyword rules seeded`);

  const totalRules = edgeCases.length + exactMerchants.length + keywords.length;
  console.log(`\n✅ Seeding complete! ${totalRules} mapping rules total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
