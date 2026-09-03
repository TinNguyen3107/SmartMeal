import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RecommendationHub } from './components/RecommendationHub';
import { PantryManager } from './components/PantryManager';
import { RecipeExplorer } from './components/RecipeExplorer';
import { MealPlanShopping, ShoppingItem } from './components/MealPlanShopping';
import { AdminDashboard } from './components/AdminDashboard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { Ingredient, UserProfile, UserIngredient, IngredientCategory } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('recommend');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [pantryItems, setPantryItems] = useState<UserIngredient[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Load initial application data
  const refreshAppData = async () => {
    try {
      const [resMe, resIng, resPantry, resFav] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/ingredients'),
        fetch('/api/user/pantry'),
        fetch('/api/user/favorites')
      ]);

      const dataMe = await resMe.json();
      const dataIng = await resIng.json();
      const dataPantry = await resPantry.json();
      const dataFav = await resFav.json();

      setCurrentUser(dataMe.user || null);
      setAllIngredients(dataIng.ingredients || []);
      setPantryItems(dataPantry.items || []);
      setFavorites(dataFav.favoriteIds || []);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  // Auth Handler
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    refreshAppData();
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Pantry Management Handlers
  const handleAddPantryItem = async (name: string, quantity: number, unit: string, category: IngredientCategory) => {
    try {
      const res = await fetch('/api/user/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, unit, category })
      });
      const data = await res.json();
      if (data.success && data.items) {
        setPantryItems(data.items);
      }
    } catch (e) {
      console.error('Add pantry item error:', e);
    }
  };

  const handleRemovePantryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/user/pantry/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPantryItems(data.items || []);
      }
    } catch (e) {
      console.error('Remove pantry item error:', e);
    }
  };

  // Trigger recommendation from Pantry
  const handleTriggerCookFromPantry = (items: { name: string; quantity: number; unit: string }[]) => {
    setActiveTab('recommend');
  };

  // Favorite toggle
  const handleToggleFavorite = async (recipeId: string) => {
    try {
      const res = await fetch('/api/user/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
      });
      const data = await res.json();
      setFavorites(data.favoriteIds || []);
    } catch (e) {
      console.error('Toggle favorite error:', e);
    }
  };

  // Shopping list management
  const handleAddToShoppingList = (name: string, quantity: number, unit: string, recipeName: string) => {
    const existing = shoppingList.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setShoppingList(prev =>
        prev.map(i =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      );
    } else {
      const newItem: ShoppingItem = {
        id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        quantity,
        unit: unit || 'phần',
        recipeName,
        isBought: false
      };
      setShoppingList(prev => [newItem, ...prev]);
    }
    alert(`🛒 Đã thêm "${name} (${quantity} ${unit})" vào danh sách đi chợ!`);
  };

  const handleToggleBuyItem = (id: string) => {
    setShoppingList(prev =>
      prev.map(i => (i.id === id ? { ...i, isBought: !i.isBought } : i))
    );
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(i => i.id !== id));
  };

  const handleAddCustomShoppingItem = (name: string, quantity: number, unit: string) => {
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      name,
      quantity,
      unit,
      isBought: false
    };
    setShoppingList(prev => [newItem, ...prev]);
  };

  const handleClearBought = () => {
    setShoppingList(prev => prev.filter(i => !i.isBought));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-emerald-950 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
        pantryCount={pantryItems.length}
      />

      {/* Main Views Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'recommend' && (
          <RecommendationHub
            allIngredients={allIngredients}
            pantryItems={pantryItems}
            onSelectRecipe={id => setSelectedRecipeId(id)}
            onAddToShoppingList={handleAddToShoppingList}
            userDietaryPreferences={currentUser?.preferences?.dietaryTypes || ['Vietnamese', 'Healthy']}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryManager
            pantryItems={pantryItems}
            allIngredients={allIngredients}
            onAddPantryItem={handleAddPantryItem}
            onRemovePantryItem={handleRemovePantryItem}
            onTriggerRecommendation={handleTriggerCookFromPantry}
          />
        )}

        {activeTab === 'explorer' && (
          <RecipeExplorer
            onSelectRecipe={id => setSelectedRecipeId(id)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'planner' && (
          <MealPlanShopping
            shoppingList={shoppingList}
            onToggleBuyItem={handleToggleBuyItem}
            onRemoveShoppingItem={handleRemoveShoppingItem}
            onAddCustomShoppingItem={handleAddCustomShoppingItem}
            onClearBought={handleClearBought}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            allIngredients={allIngredients}
            onRefreshData={refreshAppData}
          />
        )}
      </main>

      {/* Recipe Detail & Cooking Modal */}
      {selectedRecipeId && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
          pantryItems={pantryItems}
          isFavorite={favorites.includes(selectedRecipeId)}
          onToggleFavorite={handleToggleFavorite}
          onAddToShoppingList={handleAddToShoppingList}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={updated => setCurrentUser({ ...currentUser, ...updated } as UserProfile)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-emerald-900/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">SM</div>
            <span className="font-bold text-emerald-950">SmartMeal</span>
            <span className="text-emerald-600">•</span>
            <span>Hệ thống Gợi ý Món ăn</span>
          </div>
          <p>© 2026 SmartMeal.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
