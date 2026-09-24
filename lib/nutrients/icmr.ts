/**
 * ICMR-NIN aligned nutrient knowledge (adult sedentary–moderate reference).
 * Values synthesized from ICMR-NIN RDA/EAR guidance and Indian food composition
 * patterns for Annashakti kitchen-first experimentation. Not a substitute for
 * clinical nutrition advice.
 */

export type NutrientId =
  | "energy_kcal"
  | "protein_g"
  | "carbohydrate_g"
  | "fat_g"
  | "fiber_g"
  | "iron_mg"
  | "calcium_mg"
  | "zinc_mg"
  | "magnesium_mg"
  | "potassium_mg"
  | "vitamin_a_ug"
  | "vitamin_c_mg"
  | "vitamin_d_ug"
  | "vitamin_b12_ug"
  | "folate_ug"
  | "omega3_g"
  | "tryptophan_mg"
  | "choline_mg"
  | "polyphenols_mg";

export interface NutrientTarget {
  id: NutrientId;
  name: string;
  unit: string;
  /** ICMR-NIN / governing-body aligned adult reference (moderate activity male ~19–39). */
  rda: number;
  ear?: number;
  governingBody: "ICMR-NIN" | "FSSAI" | "WHO/FAO" | "NIH-ODS";
  role: string;
  indianFoodSources: string[];
}

export interface FoodItem {
  id: string;
  name: string;
  category: "grain" | "dal" | "vegetable" | "fruit" | "dairy" | "spice" | "fat" | "protein";
  per100g: Partial<Record<NutrientId, number>>;
  notes?: string;
}

export const NUTRIENT_TARGETS: NutrientTarget[] = [
  {
    id: "energy_kcal",
    name: "Energy",
    unit: "kcal",
    rda: 2710,
    ear: 2300,
    governingBody: "ICMR-NIN",
    role: "Daily energy availability for tissue repair and cognitive load.",
    indianFoodSources: ["millet roti", "rice", "ghee", "groundnuts"],
  },
  {
    id: "protein_g",
    name: "Protein",
    unit: "g",
    rda: 54,
    ear: 42.5,
    governingBody: "ICMR-NIN",
    role: "Muscle remodeling, neurotransmitter precursors, immune proteins.",
    indianFoodSources: ["moong dal", "toor dal", "paneer", "eggs", "curd"],
  },
  {
    id: "carbohydrate_g",
    name: "Carbohydrate",
    unit: "g",
    rda: 130,
    governingBody: "ICMR-NIN",
    role: "Primary fuel for CNS and high-strain glycogen replenishment.",
    indianFoodSources: ["ragi", "jowar", "brown rice", "banana"],
  },
  {
    id: "fat_g",
    name: "Total fat",
    unit: "g",
    rda: 30,
    governingBody: "ICMR-NIN",
    role: "Hormone synthesis, fat-soluble vitamin absorption, membrane integrity.",
    indianFoodSources: ["cold-pressed groundnut oil", "ghee", "sesame"],
  },
  {
    id: "fiber_g",
    name: "Dietary fiber",
    unit: "g",
    rda: 40,
    governingBody: "ICMR-NIN",
    role: "Gut microbiome substrate; glycemic buffering under load.",
    indianFoodSources: ["millets", "whole dals", "sabja", "vegetables"],
  },
  {
    id: "iron_mg",
    name: "Iron",
    unit: "mg",
    rda: 19,
    ear: 11,
    governingBody: "ICMR-NIN",
    role: "Oxygen transport; cognitive clarity under aerobic strain.",
    indianFoodSources: ["ragi", "amla + iron-rich greens", "jaggery", "liver"],
  },
  {
    id: "calcium_mg",
    name: "Calcium",
    unit: "mg",
    rda: 1000,
    ear: 800,
    governingBody: "ICMR-NIN",
    role: "Neuromuscular transmission, bone remodeling.",
    indianFoodSources: ["curd", "ragi", "sesame", "drumstick leaves"],
  },
  {
    id: "zinc_mg",
    name: "Zinc",
    unit: "mg",
    rda: 17,
    ear: 14,
    governingBody: "ICMR-NIN",
    role: "DNA repair enzymes, immune signaling, taste acuity.",
    indianFoodSources: ["pumpkin seeds", "whole grains", "legumes"],
  },
  {
    id: "magnesium_mg",
    name: "Magnesium",
    unit: "mg",
    rda: 385,
    ear: 325,
    governingBody: "ICMR-NIN",
    role: "ATP cofactor, HRV-supportive autonomic calm, sleep onset.",
    indianFoodSources: ["banana", "greens", "millets", "nuts"],
  },
  {
    id: "potassium_mg",
    name: "Potassium",
    unit: "mg",
    rda: 3500,
    governingBody: "WHO/FAO",
    role: "Electrolyte balance, vascular tone after sweat loss.",
    indianFoodSources: ["coconut water", "banana", "potato", "spinach"],
  },
  {
    id: "vitamin_a_ug",
    name: "Vitamin A (RE)",
    unit: "µg",
    rda: 1000,
    ear: 460,
    governingBody: "ICMR-NIN",
    role: "Epithelial integrity, visual cycle, immune modulation.",
    indianFoodSources: ["carrot", "palak", "ghee", "egg yolk"],
  },
  {
    id: "vitamin_c_mg",
    name: "Vitamin C",
    unit: "mg",
    rda: 80,
    ear: 65,
    governingBody: "ICMR-NIN",
    role: "Antioxidant recycling; non-heme iron absorption enhancer.",
    indianFoodSources: ["amla", "guava", "lemon", "capsicum"],
  },
  {
    id: "vitamin_d_ug",
    name: "Vitamin D",
    unit: "µg",
    rda: 15,
    governingBody: "ICMR-NIN",
    role: "Calcium homeostasis; emerging immune and mood pathways.",
    indianFoodSources: ["sunlight", "fortified milk", "egg yolk", "mushrooms"],
  },
  {
    id: "vitamin_b12_ug",
    name: "Vitamin B12",
    unit: "µg",
    rda: 2.2,
    ear: 2,
    governingBody: "ICMR-NIN",
    role: "Methylation cycles, myelin, erythrocyte maturation.",
    indianFoodSources: ["curd", "paneer", "eggs", "fish"],
  },
  {
    id: "folate_ug",
    name: "Folate",
    unit: "µg",
    rda: 300,
    ear: 180,
    governingBody: "ICMR-NIN",
    role: "One-carbon metabolism; DNA synthesis and repair.",
    indianFoodSources: ["leafy greens", "legumes", "citrus"],
  },
  {
    id: "omega3_g",
    name: "Omega-3 (ALA/EPA/DHA)",
    unit: "g",
    rda: 1.6,
    governingBody: "NIH-ODS",
    role: "Membrane fluidity, inflammatory resolution, neurocardiology tone.",
    indianFoodSources: ["flaxseed", "walnuts", "mustard oil", "fatty fish"],
  },
  {
    id: "tryptophan_mg",
    name: "Tryptophan",
    unit: "mg",
    rda: 280,
    governingBody: "WHO/FAO",
    role: "Serotonin → melatonin precursor pathway for sleep architecture.",
    indianFoodSources: ["paneer", "eggs", "sesame", "pumpkin seeds"],
  },
  {
    id: "choline_mg",
    name: "Choline",
    unit: "mg",
    rda: 550,
    governingBody: "NIH-ODS",
    role: "Acetylcholine synthesis; membrane phosphatidylcholine.",
    indianFoodSources: ["egg yolk", "soy", "mustard greens"],
  },
  {
    id: "polyphenols_mg",
    name: "Dietary polyphenols",
    unit: "mg",
    rda: 500,
    governingBody: "WHO/FAO",
    role: "Redox signaling modulators; gut–brain axis support.",
    indianFoodSources: ["turmeric", "green tea", "onion", "berries", "cocoa"],
  },
];

export const INDIAN_FOODS: FoodItem[] = [
  {
    id: "ragi_roti",
    name: "Ragi roti",
    category: "grain",
    per100g: {
      energy_kcal: 328,
      protein_g: 7.3,
      carbohydrate_g: 72,
      fiber_g: 11.5,
      iron_mg: 3.9,
      calcium_mg: 364,
      magnesium_mg: 137,
    },
  },
  {
    id: "moong_dal",
    name: "Moong dal (cooked)",
    category: "dal",
    per100g: {
      energy_kcal: 105,
      protein_g: 7.0,
      carbohydrate_g: 17,
      fiber_g: 4.2,
      iron_mg: 1.4,
      folate_ug: 159,
      zinc_mg: 0.8,
    },
  },
  {
    id: "curd",
    name: "Dahi / curd",
    category: "dairy",
    per100g: {
      energy_kcal: 60,
      protein_g: 3.5,
      calcium_mg: 149,
      vitamin_b12_ug: 0.4,
      tryptophan_mg: 45,
    },
  },
  {
    id: "amla",
    name: "Amla",
    category: "fruit",
    per100g: {
      energy_kcal: 44,
      vitamin_c_mg: 600,
      fiber_g: 3.4,
      polyphenols_mg: 1200,
    },
  },
  {
    id: "palak",
    name: "Palak (spinach)",
    category: "vegetable",
    per100g: {
      energy_kcal: 23,
      iron_mg: 2.7,
      folate_ug: 194,
      magnesium_mg: 79,
      vitamin_a_ug: 469,
      potassium_mg: 558,
    },
  },
  {
    id: "flaxseed",
    name: "Flaxseed (alsi)",
    category: "fat",
    per100g: {
      energy_kcal: 534,
      omega3_g: 22.8,
      fiber_g: 27,
      magnesium_mg: 392,
      zinc_mg: 4.3,
    },
  },
  {
    id: "egg",
    name: "Egg (whole)",
    category: "protein",
    per100g: {
      energy_kcal: 155,
      protein_g: 13,
      choline_mg: 294,
      vitamin_b12_ug: 1.1,
      vitamin_d_ug: 2,
      tryptophan_mg: 167,
    },
  },
  {
    id: "banana",
    name: "Banana",
    category: "fruit",
    per100g: {
      energy_kcal: 89,
      carbohydrate_g: 23,
      potassium_mg: 358,
      magnesium_mg: 27,
      vitamin_b12_ug: 0,
    },
  },
  {
    id: "turmeric_milk",
    name: "Haldi doodh base",
    category: "spice",
    per100g: {
      energy_kcal: 65,
      polyphenols_mg: 180,
      calcium_mg: 120,
      vitamin_d_ug: 0.5,
    },
    notes: "Curcumin + dairy fat improves absorption context.",
  },
  {
    id: "coconut_water",
    name: "Tender coconut water",
    category: "fruit",
    per100g: {
      energy_kcal: 19,
      potassium_mg: 250,
      magnesium_mg: 25,
    },
  },
];

export function getNutrientMap(): Record<NutrientId, NutrientTarget> {
  return Object.fromEntries(
    NUTRIENT_TARGETS.map((n) => [n.id, n]),
  ) as Record<NutrientId, NutrientTarget>;
}
