export type UnitCategory = 'Length' | 'Weight' | 'Area' | 'Volume';

export interface Unit {
  id: string;
  name: string;
  factorToStandard: number; // Factor to multiply by to get to standard unit (e.g. meter for length)
}

export const units: Record<UnitCategory, Unit[]> = {
  Length: [
    { id: 'm', name: 'Meter (m)', factorToStandard: 1 },
    { id: 'cm', name: 'Centimeter (cm)', factorToStandard: 0.01 },
    { id: 'in', name: 'Inch (in)', factorToStandard: 0.0254 },
    { id: 'ft', name: 'Feet (ft)', factorToStandard: 0.3048 },
  ],
  Weight: [
    { id: 'kg', name: 'Kilogram (kg)', factorToStandard: 1 },
    { id: 'g', name: 'Gram (g)', factorToStandard: 0.001 },
    { id: 'lb', name: 'Pound (lb)', factorToStandard: 0.453592 },
    { id: 'oz', name: 'Ounce (oz)', factorToStandard: 0.0283495 },
  ],
  Area: [
    { id: 'sqm', name: 'Sq Meter (m²)', factorToStandard: 1 },
    { id: 'sqft', name: 'Sq Feet (ft²)', factorToStandard: 0.092903 },
    { id: 'acre', name: 'Acre', factorToStandard: 4046.86 },
    { id: 'hectare', name: 'Hectare', factorToStandard: 10000 },
  ],
  Volume: [
    { id: 'l', name: 'Liter (L)', factorToStandard: 1 },
    { id: 'ml', name: 'Milliliter (mL)', factorToStandard: 0.001 },
    { id: 'gal', name: 'Gallon (US)', factorToStandard: 3.78541 },
  ]
};

export function convertUnit(value: number, fromUnitId: string, toUnitId: string, category: UnitCategory): number | null {
  if (isNaN(value)) return null;

  const categoryUnits = units[category];
  const fromUnit = categoryUnits.find(u => u.id === fromUnitId);
  const toUnit = categoryUnits.find(u => u.id === toUnitId);

  if (!fromUnit || !toUnit) return null;

  // Convert to standard first
  const standardValue = value * fromUnit.factorToStandard;
  // Convert standard to target
  return standardValue / toUnit.factorToStandard;
}

export function evaluateExpression(num1: number, num2: number, operator: string): number {
  switch (operator) {
    case '+': return num1 + num2;
    case '-': return num1 - num2;
    case '*': return num1 * num2;
    case '/': return num2 !== 0 ? num1 / num2 : 0;
    case '%': return (num1 * num2) / 100;
    default: return num2;
  }
}
