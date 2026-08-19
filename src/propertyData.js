// --- COMPONENT MASTER REPAIR VALUES MATRIX ---
export const costMatrix = {
  1: { label: 'Siding / Cladding', min: 1500, max: 12000, cat: 'Exterior', icon: '🪵', isExterior: true },
  2: { label: 'Trim / Paint', min: 400, max: 3500, cat: 'Exterior', icon: '🎨', isExterior: true },
  3: { label: 'Windows (Exterior)', min: 300, max: 5000, cat: 'Exterior', icon: '🪟', isExterior: true },
  4: { label: 'Doors (Exterior)', min: 500, max: 2500, cat: 'Exterior', icon: '🚪', isExterior: true },
  5: { label: 'Driveway', min: 1200, max: 8500, cat: 'Exterior', icon: '🛣️', isExterior: true },
  6: { label: 'Deck / Patio', min: 800, max: 9000, cat: 'Exterior', icon: '🪴', isExterior: true },
  7: { label: 'Roof Covering', min: 5000, max: 16000, cat: 'Roof', icon: '🏠', isExterior: false },
  8: { label: 'Flashing', min: 400, max: 1500, cat: 'Roof', icon: '⚙️', isExterior: false },
  9: { label: 'Gutters', min: 300, max: 2500, cat: 'Roof', icon: '🌧️', isExterior: true },
  10: { label: 'Foundation', min: 2500, max: 20000, cat: 'Structure', icon: '🧱', isExterior: false },
  11: { label: 'Framing', min: 1500, max: 10000, cat: 'Structure', icon: '🏗️', isExterior: false },
  12: { label: 'Wall Structure', min: 1200, max: 7500, cat: 'Structure', icon: '📏', isExterior: false },
  13: { label: 'Ceiling Structure', min: 800, max: 5000, cat: 'Structure', icon: '🏢', isExterior: false },
  14: { label: 'Main Panel', min: 1500, max: 4500, cat: 'Electrical', icon: '🔌', isExterior: false },
  15: { label: 'Wiring', min: 2000, max: 12000, cat: 'Electrical', icon: '🧵', isExterior: false },
  16: { label: 'Outlets', min: 100, max: 600, cat: 'Electrical', icon: '🔘', isExterior: false },
  17: { label: 'Lighting Fixtures', min: 150, max: 1500, cat: 'Electrical', icon: '💡', isExterior: false },
  18: { label: 'Water Supply Lines', min: 1500, max: 9000, cat: 'Plumbing', icon: '🚰', isExterior: false },
  19: { label: 'Drain Pipes', min: 1000, max: 7000, cat: 'Plumbing', icon: '🪠', isExterior: false },
  20: { label: 'Water Heater', min: 800, max: 2800, cat: 'Plumbing', icon: '🔥', isExterior: false },
  21: { label: 'Fixtures (Sinks)', min: 200, max: 1200, cat: 'Plumbing', icon: '🚰', isExterior: false },
  22: { label: 'Toilets', min: 250, max: 900, cat: 'Plumbing', icon: '🚽', isExterior: false },
  23: { label: 'Showers / Tubs', min: 1200, max: 6500, cat: 'Plumbing', icon: '🛁', isExterior: false },
  24: { label: 'Furnace', min: 2500, max: 6800, cat: 'HVAC', icon: '🔥', isExterior: false },
  25: { label: 'Air Conditioning', min: 3500, max: 8500, cat: 'HVAC', icon: '❄️', isExterior: false },
  26: { label: 'Ductwork', min: 1500, max: 5000, cat: 'HVAC', icon: '📦', isExterior: false },
  27: { label: 'Thermostat', min: 120, max: 450, cat: 'HVAC', icon: '🌡️', isExterior: false },
  28: { label: 'Walls', min: 200, max: 2500, cat: 'Interior', icon: '🧾', isExterior: false },
  29: { label: 'Ceilings', min: 300, max: 3000, cat: 'Interior', icon: '🏢', isExterior: false },
  30: { label: 'Floors', min: 1500, max: 9500, cat: 'Interior', icon: '🪵', isExterior: false },
  31: { label: 'Interior Doors', min: 200, max: 1800, cat: 'Interior', icon: '🚪', isExterior: false },
  32: { label: 'Windows (Interior)', min: 250, max: 2200, cat: 'Interior', icon: '🪟', isExterior: false },
  33: { label: 'Cabinets', min: 2000, max: 15000, cat: 'Kitchen', icon: '🗄️', isExterior: false },
  34: { label: 'Countertops', min: 1500, max: 7000, cat: 'Kitchen', icon: '🔳', isExterior: false },
  35: { label: 'Appliances', min: 500, max: 4500, cat: 'Kitchen', icon: '🍽️', isExterior: false },
  36: { label: 'Sink / Faucet', min: 250, max: 1100, cat: 'Kitchen', icon: '🚰', isExterior: false },
  37: { label: 'Toilet', min: 200, max: 800, cat: 'Bathroom', icon: '🚽', isExterior: false },
  38: { label: 'Sink', min: 200, max: 900, cat: 'Bathroom', icon: '🚰', isExterior: false },
  39: { label: 'Shower / Tub', min: 1000, max: 6000, cat: 'Bathroom', icon: '🛁', isExterior: false },
  40: { label: 'Ventilation Fan', min: 150, max: 600, cat: 'Bathroom', icon: '🌬️', isExterior: false },
  41: { label: 'Garage Door', min: 700, max: 2600, cat: 'Garage', icon: '🚪', isExterior: false },
  42: { label: 'Opener', min: 250, max: 650, cat: 'Garage', icon: '⚙️', isExterior: false },
  43: { label: 'Structure', min: 800, max: 4500, cat: 'Garage', icon: '🧱', isExterior: false }
};

export const categoriesData = [
  { name: 'Exterior', icon: '🌿' }, { name: 'Roof', icon: '🏠' }, { name: 'Structure', icon: '🧱' },
  { name: 'Electrical', icon: '⚡' }, { name: 'Plumbing', icon: '🚿' }, { name: 'HVAC', icon: '❄️' },
  { name: 'Interior', icon: '🛋️' }, { name: 'Kitchen', icon: '🍳' }, { name: 'Bathroom', icon: '🛁' },
  { name: 'Garage', icon: '🚗' }
];

// --- 50-STATE REAL RESIDENTIAL CONSTRUCTION COST INDEXES ---
// Derived from national labor-market indices and regional contractor pricing indexes (National Avg = ~750 baseline)
export const stateCostMultipliers = {
  AL: 670, AK: 1080, AZ: 740, AR: 650, CA: 1015,
  CO: 865, CT: 960, DE: 865, FL: 825, GA: 700,
  HI: 1160, ID: 775, IL: 910, IN: 735, IA: 725,
  KS: 725, KY: 700, LA: 710, ME: 825, MD: 915,
  MA: 990, MI: 790, MN: 835, MS: 640, MO: 725,
  MT: 775, NE: 735, NV: 825, NH: 865, NJ: 975,
  NM: 735, NY: 1050, NC: 710, ND: 760, OH: 745,
  OK: 670, OR: 885, PA: 885, RI: 900, SC: 700,
  SD: 700, TN: 700, TX: 735, UT: 810, VT: 840,
  VA: 885, WA: 940, WV: 700, WI: 810, WY: 760,
  DC: 1030, DEFAULT: 750
};

export const calculatePrecisePropertyCosts = (property) => {
  const { sqft = 2000, stories = 1, state = 'DEFAULT' } = property;
  
  // 1. Dynamic Window Calculations based on SqFt, Stories, and State
  let baseWindowCount = Math.round(sqft / 175);
  if (stories >= 2) {
    baseWindowCount = Math.round(baseWindowCount * 1.15);
  }
  
  const costPerWindow = stateCostMultipliers[state.toUpperCase()] || stateCostMultipliers.DEFAULT;
  const totalCalculatedWindowCost = baseWindowCount * costPerWindow;

  // 2. Filter Matrix Items (Excluding exterior sub-categories)
  const interiorSubCategories = Object.entries(costMatrix)
    .map(([id, item]) => ({ id: Number(id), ...item }))
    .filter(item => !item.isExterior);

  return {
    estimatedWindowCount: baseWindowCount,
    costPerWindow,
    totalCalculatedWindowCost,
    interiorSubCategories
  };
};