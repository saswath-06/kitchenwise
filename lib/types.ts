export interface IngredientCanonical {
  id: string;
  name: string;
  synonyms: string[];
  category: 'protein' | 'vegetable' | 'grain' | 'oil' | 'dairy' | 'fruit' | 'spice' | 'other';
  defaultUnit: string;
  density?: number; // g/mL for liquids
  shelfLifeDefaults: {
    room: number; // days
    fridge: number; // days
    freezer: number; // days
  };
  nutritionRef?: string;
}

export interface PantryItem {
  id: string;
  userId: string;
  ingredientCanonicalId: string;
  quantity: number;
  unit: string;
  storage: 'room' | 'fridge' | 'freezer';
  expiryAt?: Date;
  source: 'receipt' | 'manual';
  addedAt: Date;
  notes?: string;
  tags: string[];
  ingredientCanonical?: IngredientCanonical;
}

export interface ReceiptLineItem {
  id: string;
  receiptId: string;
  rawText: string;
  nameCanonicalId?: string;
  quantity: number;
  unit: string;
  sizeText?: string;
  confidence: {
    name: number;
    quantity: number;
    unit: number;
  };
  parsedName?: string;
  parsedQuantity?: number;
  parsedUnit?: string;
}

export interface Receipt {
  id: string;
  userId: string;
  retailer?: string;
  capturedAt: Date;
  pages: string[]; // image URLs
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceSummary: {
    overall: number;
    items: number;
  };
  lineItems: ReceiptLineItem[];
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  steps: string[];
  yields: number;
  time: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  image?: string;
  url?: string;
  author?: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  source: 'imported' | 'user' | 'community';
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientCanonicalId: string;
  quantity: number;
  unit: string;
  optional: boolean;
  substitutions: string[];
}

export interface CookingSession {
  id: string;
  userId: string;
  recipeId: string;
  startedAt: Date;
  finalizedAt?: Date;
  stepsGenerated: boolean;
  usedIngredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
  macrosActual: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface User {
  id: string;
  email: string;
  authProvider: string;
  preferences: {
    units: 'metric' | 'imperial';
    diet: string[];
    cuisines: string[];
    allergens: string[];
    equipment: string[];
  };
  created: Date;
  updated: Date;
}

export interface NutritionProfile {
  id: string;
  ingredientCanonicalId: string;
  per100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
    sugar?: number;
  };
  perUnit?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}
