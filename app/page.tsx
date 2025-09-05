"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ReceiptScanner } from '@/components/receipt-scanner'
import { ManualIngredientEntry } from '@/components/manual-ingredient-entry'
import { PantryManager } from '@/components/pantry-manager'
import { RecipeSuggestions } from '@/components/recipe-suggestions'
import { ReceiptLineItem, PantryItem, Recipe } from '@/lib/types'
import { DataService } from '@/lib/data-service'

export default function Home() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([])
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>({
    id: '',
    title: 'Select a recipe to get started',
    cuisine: '',
    steps: [],
    yields: 0,
    time: 0,
    difficulty: 'Easy',
    nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
    source: 'imported',
    ingredients: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [pantry, recipes] = await Promise.all([
          DataService.getPantryItems(),
          DataService.getRecipes()
        ])
        setPantryItems(pantry)
        setSuggestedRecipes(recipes)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleReceiptProcessed = async (lineItems: ReceiptLineItem[]) => {
    try {
      const success = await DataService.processReceipt(lineItems)
      if (success) {
        // Refresh pantry items
        const updatedPantry = await DataService.getPantryItems()
        setPantryItems(updatedPantry)
        alert('Receipt processed successfully! Items added to pantry.')
      } else {
        alert('Failed to process receipt. Please try again.')
      }
    } catch (error) {
      console.error('Error processing receipt:', error)
      alert('Error processing receipt. Please try again.')
    }
  }

  const handleIngredientAdded = async (ingredient: Omit<PantryItem, 'id' | 'userId' | 'addedAt'>) => {
    try {
      const newItem = await DataService.addPantryItem(ingredient)
      if (newItem) {
        setPantryItems(prev => [newItem, ...prev])
        alert('Ingredient added to pantry!')
      } else {
        alert('Failed to add ingredient. Please try again.')
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
      alert('Error adding ingredient. Please try again.')
    }
  }

  const handleEditItem = async (item: PantryItem) => {
    // In a real app, this would open an edit modal
    console.log('Edit item:', item)
    alert('Edit functionality coming soon!')
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const success = await DataService.deletePantryItem(itemId)
      if (success) {
        setPantryItems(prev => prev.filter(item => item.id !== itemId))
        alert('Item deleted from pantry!')
      } else {
        alert('Failed to delete item. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    }
  }

  const handleRecipeSelected = (recipe: Recipe) => {
    setCurrentRecipe(recipe)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading KitchenWise...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🍳 KitchenWise
          </h1>
          <p className="text-xl text-muted-foreground">
            Smart Cooking Assistant - Cook smarter, waste less, eat better
          </p>
        </div>

        <main className="max-w-6xl mx-auto">
          <Tabs defaultValue="scan" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scan">📷 Scan Receipt</TabsTrigger>
              <TabsTrigger value="pantry">📦 Pantry</TabsTrigger>
              <TabsTrigger value="recipes">🍽️ Recipes</TabsTrigger>
              <TabsTrigger value="cooking">👨‍🍳 AI Cooking Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="space-y-6">
              <ReceiptScanner onReceiptProcessed={handleReceiptProcessed} />
            </TabsContent>

            <TabsContent value="pantry" className="space-y-6">
              <PantryManager
                pantryItems={pantryItems}
                onAddItem={() => {
                  // This will be handled by the dialog
                }}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <span className="mr-2">➕</span>
                    Add Ingredient Manually
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Ingredient to Pantry</DialogTitle>
                  </DialogHeader>
                  <ManualIngredientEntry onIngredientAdded={handleIngredientAdded} />
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="recipes" className="space-y-6">
              <RecipeSuggestions onRecipeSelected={handleRecipeSelected} />
            </TabsContent>

            <TabsContent value="cooking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    AI Cooking Guide
                  </CardTitle>
                  <CardDescription>
                    Get step-by-step cooking instructions tailored to your available ingredients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">{currentRecipe.title}</h3>
                    {currentRecipe.cuisine && (
                      <Badge variant="outline" className="mb-4">
                        {currentRecipe.cuisine} Cuisine
                      </Badge>
                    )}
                    {currentRecipe.steps.length > 0 ? (
                      <div className="space-y-3 text-left">
                        {currentRecipe.steps.map((step, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
                            <Badge variant="secondary" className="flex-shrink-0">
                              {index + 1}
                            </Badge>
                            <p className="text-sm">{step}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Select a recipe from the Recipes tab to get started with cooking instructions.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
