import { supabase } from './supabase'
import { IngredientCanonical, Recipe, PantryItem, ReceiptLineItem } from './types'

// For now, we'll use a demo user ID since we don't have auth set up yet
const DEMO_USER_ID = 'demo-user-id'

// Fallback data for when database is not set up
const FALLBACK_INGREDIENTS: IngredientCanonical[] = [
  {
    id: 'demo-1',
    name: 'Tomato',
    synonyms: ['tomatoes', 'roma tomato'],
    category: 'vegetable',
    defaultUnit: 'piece',
    shelfLifeDefaults: { room: 7, fridge: 14, freezer: 180 },
    nutritionRef: undefined
  },
  {
    id: 'demo-2',
    name: 'Chicken Breast',
    synonyms: ['chicken', 'poultry'],
    category: 'protein',
    defaultUnit: 'piece',
    shelfLifeDefaults: { room: 0, fridge: 3, freezer: 270 },
    nutritionRef: undefined
  },
  {
    id: 'demo-3',
    name: 'Pasta',
    synonyms: ['spaghetti', 'penne'],
    category: 'grain',
    defaultUnit: 'cup',
    shelfLifeDefaults: { room: 365, fridge: 365, freezer: 365 },
    nutritionRef: undefined
  },
  {
    id: 'demo-4',
    name: 'Olive Oil',
    synonyms: ['extra virgin olive oil'],
    category: 'oil',
    defaultUnit: 'tablespoon',
    shelfLifeDefaults: { room: 730, fridge: 730, freezer: 730 },
    nutritionRef: undefined
  }
]

const FALLBACK_RECIPES: Recipe[] = [
  {
    id: 'demo-recipe-1',
    title: 'Simple Tomato Pasta',
    cuisine: 'Italian',
    steps: [
      'Boil water and cook pasta according to package instructions',
      'Dice tomatoes and sauté in olive oil',
      'Combine pasta with tomato sauce',
      'Season with salt and pepper to taste'
    ],
    yields: 4,
    time: 20,
    difficulty: 'Easy',
    nutrition: { calories: 400, protein: 12, fat: 8, carbs: 70 },
    source: 'imported',
    ingredients: [
      {
        id: 'demo-ing-1',
        recipeId: 'demo-recipe-1',
        ingredientCanonicalId: 'demo-1',
        quantity: 4,
        unit: 'piece',
        optional: false,
        substitutions: []
      },
      {
        id: 'demo-ing-2',
        recipeId: 'demo-recipe-1',
        ingredientCanonicalId: 'demo-3',
        quantity: 2,
        unit: 'cup',
        optional: false,
        substitutions: []
      },
      {
        id: 'demo-ing-3',
        recipeId: 'demo-recipe-1',
        ingredientCanonicalId: 'demo-4',
        quantity: 2,
        unit: 'tablespoon',
        optional: false,
        substitutions: []
      }
    ]
  }
]

// In-memory storage for demo mode
let DEMO_PANTRY_ITEMS: PantryItem[] = []

export class DataService {
  // Ingredient Management
  static async getCanonicalIngredients(): Promise<IngredientCanonical[]> {
    try {
      const { data, error } = await supabase
        .from('ingredient_canonical')
        .select('*')
        .order('name')
      
      if (error) {
        console.warn('Database not set up yet, using fallback data:', error.message)
        return FALLBACK_INGREDIENTS
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        synonyms: item.synonyms || [],
        category: item.category,
        defaultUnit: item.default_unit,
        density: item.density || undefined,
        shelfLifeDefaults: item.shelf_life_defaults,
        nutritionRef: item.nutrition_ref || undefined
      }))
    } catch (error) {
      console.warn('Error fetching canonical ingredients, using fallback:', error)
      return FALLBACK_INGREDIENTS
    }
  }

  static async findIngredientByName(name: string): Promise<IngredientCanonical | undefined> {
    try {
      const normalizedName = name.toLowerCase().trim()
      
      const { data, error } = await supabase
        .from('ingredient_canonical')
        .select('*')
        .or(`name.ilike.%${normalizedName}%,synonyms.cs.{${normalizedName}}`)
        .limit(1)
      
      if (error || !data || data.length === 0) {
        // Fallback to local search
        return FALLBACK_INGREDIENTS.find(ingredient => 
          ingredient.name.toLowerCase().includes(normalizedName) ||
          ingredient.synonyms.some(synonym => synonym.toLowerCase().includes(normalizedName))
        )
      }
      
      const item = data[0]
      return {
        id: item.id,
        name: item.name,
        synonyms: item.synonyms || [],
        category: item.category,
        defaultUnit: item.default_unit,
        density: item.density || undefined,
        shelfLifeDefaults: item.shelf_life_defaults,
        nutritionRef: item.nutrition_ref || undefined
      }
    } catch (error) {
      console.warn('Error finding ingredient by name, using fallback search:', error)
      const normalizedName = name.toLowerCase().trim()
      return FALLBACK_INGREDIENTS.find(ingredient => 
        ingredient.name.toLowerCase().includes(normalizedName) ||
        ingredient.synonyms.some(synonym => synonym.toLowerCase().includes(normalizedName))
      )
    }
  }

  // Pantry Management
  static async getPantryItems(): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select(`
          *,
          ingredient_canonical (
            id,
            name,
            synonyms,
            category,
            default_unit,
            density,
            shelf_life_defaults,
            nutrition_ref
          )
        `)
        .eq('user_id', DEMO_USER_ID)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('Database not set up yet, using demo pantry:', error.message)
        return DEMO_PANTRY_ITEMS
      }
      
      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        ingredientCanonicalId: item.ingredient_canonical_id,
        quantity: item.quantity,
        unit: item.unit,
        storage: item.storage,
        expiryAt: item.expiry_at ? new Date(item.expiry_at) : undefined,
        source: item.source,
        addedAt: new Date(item.created_at),
        notes: item.notes || undefined,
        tags: item.tags || [],
        ingredientCanonical: item.ingredient_canonical ? {
          id: item.ingredient_canonical.id,
          name: item.ingredient_canonical.name,
          synonyms: item.ingredient_canonical.synonyms || [],
          category: item.ingredient_canonical.category,
          defaultUnit: item.ingredient_canonical.default_unit,
          density: item.ingredient_canonical.density || undefined,
          shelfLifeDefaults: item.ingredient_canonical.shelf_life_defaults,
          nutritionRef: item.ingredient_canonical.nutrition_ref || undefined
        } : undefined
      }))
    } catch (error) {
      console.warn('Error fetching pantry items, using demo pantry:', error)
      return DEMO_PANTRY_ITEMS
    }
  }

  static async addPantryItem(item: Omit<PantryItem, 'id' | 'userId' | 'addedAt'>): Promise<PantryItem | null> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert({
          user_id: DEMO_USER_ID,
          ingredient_canonical_id: item.ingredientCanonicalId,
          quantity: item.quantity,
          unit: item.unit,
          storage: item.storage,
          expiry_at: item.expiryAt?.toISOString(),
          source: item.source,
          notes: item.notes,
          tags: item.tags
        })
        .select(`
          *,
          ingredient_canonical (
            id,
            name,
            synonyms,
            category,
            default_unit,
            density,
            shelf_life_defaults,
            nutrition_ref
          )
        `)
        .single()
      
      if (error) {
        console.warn('Database not set up yet, adding to demo pantry:', error.message)
        // Add to demo pantry
        const mockItem: PantryItem = {
          id: `demo-${Date.now()}`,
          userId: DEMO_USER_ID,
          ingredientCanonicalId: item.ingredientCanonicalId,
          quantity: item.quantity,
          unit: item.unit,
          storage: item.storage,
          expiryAt: item.expiryAt,
          source: item.source,
          addedAt: new Date(),
          notes: item.notes,
          tags: item.tags || [],
          ingredientCanonical: FALLBACK_INGREDIENTS.find(i => i.id === item.ingredientCanonicalId)
        }
        DEMO_PANTRY_ITEMS.unshift(mockItem)
        return mockItem
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        ingredientCanonicalId: data.ingredient_canonical_id,
        quantity: data.quantity,
        unit: data.unit,
        storage: data.storage,
        expiryAt: data.expiry_at ? new Date(data.expiry_at) : undefined,
        source: data.source,
        addedAt: new Date(data.created_at),
        notes: data.notes || undefined,
        tags: data.tags || [],
        ingredientCanonical: data.ingredient_canonical ? {
          id: data.ingredient_canonical.id,
          name: data.ingredient_canonical.name,
          synonyms: data.ingredient_canonical.synonyms || [],
          category: data.ingredient_canonical.category,
          defaultUnit: data.ingredient_canonical.default_unit,
          density: data.ingredient_canonical.density || undefined,
          shelfLifeDefaults: data.ingredient_canonical.shelf_life_defaults,
          nutritionRef: data.ingredient_canonical.nutrition_ref || undefined
        } : undefined
      }
    } catch (error) {
      console.warn('Error adding pantry item, adding to demo pantry:', error)
      const mockItem: PantryItem = {
        id: `demo-${Date.now()}`,
        userId: DEMO_USER_ID,
        ingredientCanonicalId: item.ingredientCanonicalId,
        quantity: item.quantity,
        unit: item.unit,
        storage: item.storage,
        expiryAt: item.expiryAt,
        source: item.source,
        addedAt: new Date(),
        notes: item.notes,
        tags: item.tags || [],
        ingredientCanonical: FALLBACK_INGREDIENTS.find(i => i.id === item.ingredientCanonicalId)
      }
      DEMO_PANTRY_ITEMS.unshift(mockItem)
      return mockItem
    }
  }

  static async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<boolean> {
    try {
      const updateData: any = {}
      
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity
      if (updates.unit !== undefined) updateData.unit = updates.unit
      if (updates.storage !== undefined) updateData.storage = updates.storage
      if (updates.expiryAt !== undefined) updateData.expiry_at = updates.expiryAt?.toISOString()
      if (updates.notes !== undefined) updateData.notes = updates.notes
      if (updates.tags !== undefined) updateData.tags = updates.tags
      
      const { error } = await supabase
        .from('pantry_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID)
      
      if (error) {
        console.warn('Database not set up yet, updating demo pantry:', error.message)
        // Update demo pantry
        const index = DEMO_PANTRY_ITEMS.findIndex(item => item.id === id)
        if (index !== -1) {
          DEMO_PANTRY_ITEMS[index] = { ...DEMO_PANTRY_ITEMS[index], ...updates }
          return true
        }
        return false
      }
      
      return true
    } catch (error) {
      console.warn('Error updating pantry item, updating demo pantry:', error)
      const index = DEMO_PANTRY_ITEMS.findIndex(item => item.id === id)
      if (index !== -1) {
        DEMO_PANTRY_ITEMS[index] = { ...DEMO_PANTRY_ITEMS[index], ...updates }
        return true
      }
      return false
    }
  }

  static async deletePantryItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID)
      
      if (error) {
        console.warn('Database not set up yet, deleting from demo pantry:', error.message)
        // Delete from demo pantry
        DEMO_PANTRY_ITEMS = DEMO_PANTRY_ITEMS.filter(item => item.id !== id)
        return true
      }
      
      return true
    } catch (error) {
      console.warn('Error deleting pantry item, deleting from demo pantry:', error)
      DEMO_PANTRY_ITEMS = DEMO_PANTRY_ITEMS.filter(item => item.id !== id)
      return true
    }
  }

  // Recipe Management
  static async getRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_canonical_id,
            quantity,
            unit,
            optional,
            substitutions
          )
        `)
        .order('title')
      
      if (error) {
        console.warn('Database not set up yet, using fallback recipes:', error.message)
        return FALLBACK_RECIPES
      }
      
      return data.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        cuisine: recipe.cuisine,
        steps: recipe.steps,
        yields: recipe.yields,
        time: recipe.time,
        difficulty: recipe.difficulty,
        image: recipe.image_url || undefined,
        url: recipe.url || undefined,
        author: recipe.author || undefined,
        nutrition: recipe.nutrition,
        source: recipe.source,
        ingredients: recipe.recipe_ingredients.map((ingredient: any) => ({
          id: ingredient.id,
          recipeId: recipe.id,
          ingredientCanonicalId: ingredient.ingredient_canonical_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          optional: ingredient.optional,
          substitutions: ingredient.substitutions || []
        }))
      }))
    } catch (error) {
      console.warn('Error fetching recipes, using fallback:', error)
      return FALLBACK_RECIPES
    }
  }

  // Recipe Matching
  static async getAvailableIngredients(): Promise<Record<string, { quantity: number; unit: string }>> {
    const pantryItems = await this.getPantryItems()
    const available: Record<string, { quantity: number; unit: string }> = {}
    
    pantryItems.forEach(item => {
      if (item.ingredientCanonical) {
        available[item.ingredientCanonical.id] = {
          quantity: item.quantity,
          unit: item.unit
        }
      }
    })
    
    return available
  }

  static async canMakeRecipe(recipe: Recipe): Promise<{ canMake: boolean; missingIngredients: string[]; matchPercentage: number }> {
    const available = await this.getAvailableIngredients()
    const missing: string[] = []
    let requiredIngredients = 0
    let availableIngredients = 0
    
    recipe.ingredients.forEach(ingredient => {
      if (!ingredient.optional) {
        requiredIngredients++
        const availableIngredient = available[ingredient.ingredientCanonicalId]
        
        if (availableIngredient) {
          // Simple quantity check - in a real app, you'd do unit conversion
          if (availableIngredient.quantity >= ingredient.quantity) {
            availableIngredients++
          } else {
            missing.push(`${ingredient.ingredientCanonicalId} (need ${ingredient.quantity} ${ingredient.unit}, have ${availableIngredient.quantity} ${availableIngredient.unit})`)
          }
        } else {
          missing.push(ingredient.ingredientCanonicalId)
        }
      }
    })
    
    const matchPercentage = requiredIngredients > 0 ? Math.round((availableIngredients / requiredIngredients) * 100) : 0
    
    return {
      canMake: missing.length === 0,
      missingIngredients: missing,
      matchPercentage
    }
  }

  // Receipt Processing
  static async processReceipt(lineItems: ReceiptLineItem[]): Promise<boolean> {
    try {
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: DEMO_USER_ID,
          ocr_status: 'completed',
          parse_status: 'completed',
          confidence_summary: { overall: 0.9, items: lineItems.length }
        })
        .select()
        .single()
      
      if (receiptError) {
        console.warn('Database not set up yet, cannot process receipt:', receiptError.message)
        return false
      }
      
      // Insert line items
      const lineItemData = lineItems.map(item => ({
        receipt_id: receipt.id,
        raw_text: item.rawText,
        name_canonical_id: item.nameCanonicalId,
        quantity: item.quantity,
        unit: item.unit,
        size_text: item.sizeText,
        confidence: item.confidence,
        parsed_name: item.parsedName,
        parsed_quantity: item.parsedQuantity,
        parsed_unit: item.parsedUnit
      }))
      
      const { error: lineItemsError } = await supabase
        .from('receipt_line_items')
        .insert(lineItemData)
      
      if (lineItemsError) {
        console.warn('Database not set up yet, cannot insert line items:', lineItemsError.message)
        return false
      }
      
      // Add items to pantry
      for (const item of lineItems) {
        if (item.nameCanonicalId) {
          await this.addPantryItem({
            ingredientCanonicalId: item.nameCanonicalId,
            quantity: item.quantity,
            unit: item.unit,
            storage: 'fridge', // Default to fridge for receipt items
            source: 'receipt',
            notes: `Added from receipt scan`,
            tags: []
          })
        }
      }
      
      return true
    } catch (error) {
      console.warn('Error processing receipt, returning false:', error)
      return false
    }
  }
}
