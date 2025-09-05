"use client"

import React, { useState, useMemo } from 'react';
import { Package, Filter, Search, Plus, Edit, Trash2, AlertTriangle, Calendar, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { PantryItem } from '@/lib/types';

interface PantryManagerProps {
  pantryItems: PantryItem[];
  onAddItem: () => void;
  onEditItem: (item: PantryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export function PantryManager({ pantryItems, onAddItem, onEditItem, onDeleteItem }: PantryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredItems = useMemo(() => {
    return pantryItems.filter(item => {
      const matchesSearch = item.ingredientCanonical?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || item.ingredientCanonical?.category === categoryFilter;
      const matchesStorage = storageFilter === 'all' || item.storage === storageFilter;
      
      let matchesExpiry = true;
      if (expiryFilter === 'expiring-soon' && item.expiryAt) {
        matchesExpiry = differenceInDays(item.expiryAt, new Date()) <= 3;
      } else if (expiryFilter === 'expired' && item.expiryAt) {
        matchesExpiry = isBefore(item.expiryAt, new Date());
      } else if (expiryFilter === 'no-expiry') {
        matchesExpiry = !item.expiryAt;
      }
      
      return matchesSearch && matchesCategory && matchesStorage && matchesExpiry;
    });
  }, [pantryItems, searchQuery, categoryFilter, storageFilter, expiryFilter]);

  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return { status: 'no-expiry', text: 'No expiry', color: 'text-muted-foreground' };
    
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600 dark:text-red-400' };
    } else if (daysUntilExpiry <= 1) {
      return { status: 'expiring-today', text: 'Expires today', color: 'text-red-600 dark:text-red-400' };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'expiring-soon', text: `Expires in ${daysUntilExpiry} days`, color: 'text-orange-600 dark:text-orange-400' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-week', text: `Expires in ${daysUntilExpiry} days`, color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { status: 'good', text: `Expires in ${daysUntilExpiry} days`, color: 'text-green-600 dark:text-green-400' };
    }
  };

  const getStorageIcon = (storage: string) => {
    switch (storage) {
      case 'fridge':
        return '🧊';
      case 'freezer':
        return '❄️';
      default:
        return '📦';
    }
  };

  const getStorageColor = (storage: string) => {
    switch (storage) {
      case 'fridge':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'freezer':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      protein: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      vegetable: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      grain: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      oil: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      dairy: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      fruit: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300",
      spice: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  };

  const expiringSoonItems = pantryItems.filter(item => 
    item.expiryAt && differenceInDays(item.expiryAt, new Date()) <= 3
  );

  const expiredItems = pantryItems.filter(item => 
    item.expiryAt && isBefore(item.expiryAt, new Date())
  );

  const totalItems = pantryItems.length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your Pantry</h3>
        <Button onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <Package className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{expiringSoonItems.length}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{expiredItems.length}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {totalItems > 0 ? Math.round(((totalItems - expiringSoonItems.length - expiredItems.length) / totalItems) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Pantry Health</p>
              </div>
              <Package className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="protein">Protein</SelectItem>
                  <SelectItem value="vegetable">Vegetables</SelectItem>
                  <SelectItem value="grain">Grains</SelectItem>
                  <SelectItem value="oil">Oils</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="fruit">Fruits</SelectItem>
                  <SelectItem value="spice">Spices</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Storage</Label>
              <Select value={storageFilter} onValueChange={setStorageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Storage</SelectItem>
                  <SelectItem value="room">Room Temperature</SelectItem>
                  <SelectItem value="fridge">Refrigerator</SelectItem>
                  <SelectItem value="freezer">Freezer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Expiry</Label>
              <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon (≤3 days)</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="no-expiry">No Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Items ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon ({expiringSoonItems.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredItems.length})</TabsTrigger>
          <TabsTrigger value="by-storage">By Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No items found</h4>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button onClick={onAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  getExpiryStatus={getExpiryStatus}
                  getStorageIcon={getStorageIcon}
                  getStorageColor={getStorageColor}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          {expiringSoonItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">All good!</h4>
              <p className="text-muted-foreground">
                No items are expiring soon. Your pantry is well-managed.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiringSoonItems.map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                  getExpiryStatus={getExpiryStatus}
                  getStorageIcon={getStorageIcon}
                  getStorageColor={getStorageColor}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No expired items</h4>
              <p className="text-muted-foreground">
                Great job keeping your pantry fresh!
              </p>
            </Card>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {expiredItems.length} expired items. Consider removing them to maintain pantry hygiene.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredItems.map((item) => (
              <PantryItemCard
                key={item.id}
                item={item}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                getExpiryStatus={getExpiryStatus}
                getStorageIcon={getStorageIcon}
                getStorageColor={getStorageColor}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-storage" className="space-y-6">
          {['room', 'fridge', 'freezer'].map((storageType) => {
            const storageItems = filteredItems.filter(item => item.storage === storageType);
            return (
              <div key={storageType}>
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  {getStorageIcon(storageType)} {storageType.charAt(0).toUpperCase() + storageType.slice(1)} ({storageItems.length})
                </h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {storageItems.map((item) => (
                    <PantryItemCard
                      key={item.id}
                      item={item}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      getExpiryStatus={getExpiryStatus}
                      getStorageIcon={getStorageIcon}
                      getStorageColor={getStorageColor}
                      getCategoryColor={getCategoryColor}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
  getExpiryStatus: (expiryDate?: Date) => { status: string; text: string; color: string };
  getStorageIcon: (storage: string) => string;
  getStorageColor: (storage: string) => string;
  getCategoryColor: (category: string) => string;
}

function PantryItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  getExpiryStatus, 
  getStorageIcon, 
  getStorageColor, 
  getCategoryColor 
}: PantryItemCardProps) {
  const expiryStatus = getExpiryStatus(item.expiryAt);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-1">{item.ingredientCanonical?.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={getCategoryColor(item.ingredientCanonical?.category || 'other')}>
                {item.ingredientCanonical?.category}
              </Badge>
              <Badge variant="outline" className={getStorageColor(item.storage)}>
                {getStorageIcon(item.storage)} {item.storage}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{item.quantity} {item.unit}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expiry:</span>
            <span className={`font-medium ${expiryStatus.color}`}>
              {expiryStatus.text}
            </span>
          </div>

          {item.notes && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Notes:</span> {item.notes}
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs gap-1">
                  <Tag className="h-2 w-2" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
