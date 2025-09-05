"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Package, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { IngredientCanonical, PantryItem } from '@/lib/types';
import { DataService } from '@/lib/data-service';

interface ManualIngredientEntryProps {
  onIngredientAdded: (ingredient: Omit<PantryItem, 'id' | 'userId' | 'addedAt'>) => void;
}

export function ManualIngredientEntry({ onIngredientAdded }: ManualIngredientEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientCanonical | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [storage, setStorage] = useState<'room' | 'fridge' | 'freezer'>('room');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [canonicalIngredients, setCanonicalIngredients] = useState<IngredientCanonical[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load canonical ingredients from Supabase
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setIsLoading(true);
        const ingredients = await DataService.getCanonicalIngredients();
        setCanonicalIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadIngredients();
  }, []);

  const filteredIngredients = canonicalIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.synonyms.some(synonym => 
      synonym.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleIngredientSelect = (ingredient: IngredientCanonical) => {
    setSelectedIngredient(ingredient);
    setUnit(ingredient.defaultUnit);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!selectedIngredient || !quantity || !unit) return;

    const newIngredient: Omit<PantryItem, 'id' | 'userId' | 'addedAt'> = {
      ingredientCanonicalId: selectedIngredient.id,
      quantity: parseFloat(quantity),
      unit,
      storage,
      expiryAt: expiryDate,
      source: 'manual',
      notes: notes.trim() || undefined,
      tags,
      ingredientCanonical: selectedIngredient
    };

    onIngredientAdded(newIngredient);
    
    // Reset form
    setSelectedIngredient(null);
    setQuantity('');
    setUnit('');
    setStorage('room');
    setExpiryDate(undefined);
    setNotes('');
    setTags([]);
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case 'fridge':
        return '🧊';
      case 'freezer':
        return '❄️';
      default:
        return '📦';
    }
  };

  const getStorageColor = (storageType: string) => {
    switch (storageType) {
      case 'fridge':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'freezer':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Ingredient Manually
        </CardTitle>
        <CardDescription>
          Search and add ingredients to your pantry with custom quantities and storage options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ingredient Search */}
        <div className="space-y-2">
          <Label htmlFor="ingredient-search">Ingredient</Label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between"
              >
                {selectedIngredient ? selectedIngredient.name : "Search ingredients..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search ingredients..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No ingredients found.</CommandEmpty>
                  <CommandGroup>
                    {filteredIngredients.map((ingredient) => (
                      <CommandItem
                        key={ingredient.id}
                        value={ingredient.name}
                        onSelect={() => handleIngredientSelect(ingredient)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ingredient.category}
                          </Badge>
                          {ingredient.name}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">Grams (g)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="ml">Milliliters (ml)</SelectItem>
                <SelectItem value="l">Liters (L)</SelectItem>
                <SelectItem value="cup">Cups</SelectItem>
                <SelectItem value="tbsp">Tablespoons</SelectItem>
                <SelectItem value="tsp">Teaspoons</SelectItem>
                <SelectItem value="unit">Units</SelectItem>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
                <SelectItem value="oz">Ounces (oz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Storage Location */}
        <div className="space-y-2">
          <Label htmlFor="storage">Storage Location</Label>
          <Select value={storage} onValueChange={(value: 'room' | 'fridge' | 'freezer') => setStorage(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room">
                <div className="flex items-center gap-2">
                  📦 Pantry/Room Temperature
                </div>
              </SelectItem>
              <SelectItem value="fridge">
                <div className="flex items-center gap-2">
                  🧊 Refrigerator
                </div>
              </SelectItem>
              <SelectItem value="freezer">
                <div className="flex items-center gap-2">
                  ❄️ Freezer
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={expiryDate}
                onSelect={setExpiryDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          
          {/* Quick expiry options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpiryDate(addDays(new Date(), 3))}
            >
              3 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpiryDate(addDays(new Date(), 7))}
            >
              1 week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpiryDate(addDays(new Date(), 30))}
            >
              1 month
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            placeholder="e.g., Organic, from farmer's market"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button variant="outline" size="sm" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Selected Ingredient Preview */}
        {selectedIngredient && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedIngredient.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Category: {selectedIngredient.category}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Default unit: {selectedIngredient.defaultUnit}
                  </p>
                </div>
                <Badge variant="outline">{selectedIngredient.category}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedIngredient || !quantity || !unit}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Pantry
        </Button>
      </CardContent>
    </Card>
  );
}
