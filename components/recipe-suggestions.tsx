"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { ChefHat, Clock, Users, Filter, Search, Star, Zap, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Recipe, PantryItem } from '@/lib/types';
import { DataService } from '@/lib/data-service';

interface RecipeSuggestionsProps {
  onRecipeSelected: (recipe: Recipe) => void;
}

export function RecipeSuggestions({ onRecipeSelected }: RecipeSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<[number, number]>([0, 60]);
  const [servingsFilter, setServingsFilter] = useState<[number, number]>([1, 8]);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipes from Supabase
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setIsLoading(true);
        const loadedRecipes = await DataService.getRecipes();
        setRecipes(loadedRecipes);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Filter and rank recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCuisine = cuisineFilter === 'all' || recipe.cuisine === cuisineFilter;
      const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
      const matchesTime = recipe.time >= timeFilter[0] && recipe.time <= timeFilter[1];
      const matchesServings = recipe.yields >= servingsFilter[0] && recipe.yields <= servingsFilter[1];
      
      return matchesSearch && matchesCuisine && matchesDifficulty && matchesTime && matchesServings;
    });

    // Sort by time, then by difficulty
    filtered.sort((a, b) => {
      if (a.time !== b.time) {
        return a.time - b.time;
      }
      const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    return filtered;
  }, [recipes, searchQuery, cuisineFilter, difficultyFilter, timeFilter, servingsFilter]);

  const getCuisineIcon = (cuisine: string) => {
    const icons: Record<string, string> = {
      'Mediterranean': '🌊',
      'Asian': '🍜',
      'American': '🍔',
      'Italian': '🍝',
      'Mexican': '🌮',
      'Indian': '🍛',
      'French': '🥐',
      'Thai': '🍲',
      'Japanese': '🍱',
      'Greek': '🧀'
    };
    return icons[cuisine] || '🍽️';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    if (percentage >= 50) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Recipe Suggestions</h3>
          <p className="text-muted-foreground">
            Discover recipes you can make with your current ingredients
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          {recipes.length} recipes available
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Cuisine</Label>
              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All cuisines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="Asian">Asian</SelectItem>
                  <SelectItem value="American">American</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="Mexican">Mexican</SelectItem>
                  <SelectItem value="Indian">Indian</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Thai">Thai</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                  <SelectItem value="Greek">Greek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Time (minutes): {timeFilter[0]}-{timeFilter[1]}</Label>
              <Slider
                value={timeFilter}
                onValueChange={(value: number[]) => setTimeFilter(value as [number, number])}
                max={60}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Servings: {servingsFilter[0]}-{servingsFilter[1]}</Label>
              <Slider
                value={servingsFilter}
                onValueChange={(value: number[]) => setServingsFilter(value as [number, number])}
                max={8}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTimeFilter([0, 30]);
                    setDifficultyFilter('Easy');
                  }}
                >
                  Quick & Easy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCuisineFilter('all');
                    setDifficultyFilter('all');
                    setTimeFilter([0, 60]);
                    setServingsFilter([1, 8]);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe List */}
      <div className="space-y-4">
        {filteredRecipes.length === 0 ? (
          <Card className="p-8 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No recipes found</h4>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={onRecipeSelected}
                getCuisineIcon={getCuisineIcon}
                getDifficultyColor={getDifficultyColor}
                getMatchColor={getMatchColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  getCuisineIcon: (cuisine: string) => string;
  getDifficultyColor: (difficulty: string) => string;
  getMatchColor: (percentage: number) => string;
}

function RecipeCard({ 
  recipe, 
  onSelect, 
  getCuisineIcon, 
  getDifficultyColor, 
  getMatchColor 
}: RecipeCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {getCuisineIcon(recipe.cuisine)} {recipe.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {recipe.cuisine} cuisine • {recipe.difficulty}
            </CardDescription>
          </div>
          <div className="text-right space-y-2">
            <Badge variant="outline">{recipe.cuisine}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.time} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.yields} servings
          </div>
        </div>

        {/* Nutrition Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Calories:</span>
            <span className="ml-1 font-medium">{recipe.nutrition.calories}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Protein:</span>
            <span className="ml-1 font-medium">{recipe.nutrition.protein}g</span>
          </div>
          <div>
            <span className="text-muted-foreground">Fat:</span>
            <span className="ml-1 font-medium">{recipe.nutrition.fat}g</span>
          </div>
          <div>
            <span className="text-muted-foreground">Carbs:</span>
            <span className="ml-1 font-medium">{recipe.nutrition.carbs}g</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => onSelect(recipe)}
        >
          <ChefHat className="h-4 w-4 mr-2" />
          View Recipe
        </Button>
      </CardContent>
    </Card>
  );
}
