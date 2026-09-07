import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { Navbar } from './components/Navbar';
import { PantryManager } from './components/PantryManager';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeExplorer } from './components/RecipeExplorer';
import { RecommendationHub } from './components/RecommendationHub';
import { UserHistory } from './components/UserHistory';
import { UserProfileModal } from './components/UserProfileModal';
import { Ingredient, IngredientCategory, UserIngredient, UserProfile } from './types';

type DemoRole = 'user' | 'admin';
type AuthMode = 'login' | 'register';

const demoCredentials: Record<DemoRole, { email: string; password: string; name: string }> = {
  admin: { email: 'admin@gmail.com', password: 'admin123', name: 'Quản trị viên SmartMeal' },
  user: { email: 'user@gmail.com', password: 'user123', name: 'Người dùng SmartMeal' }
};

function AuthModal({
  initialRole,
  onClose,
  onAuthenticated
}: {
  initialRole: DemoRole;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<DemoRole>(initialRole);
  const [name, setName] = useState(demoCredentials[initialRole].name);
  const [email, setEmail] = useState(demoCredentials[initialRole].email);
  const [password, setPassword] = useState(demoCredentials[initialRole].password);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyRole = (nextRole: DemoRole) => {
    setRole(nextRole);
    setName(demoCredentials[nextRole].name);
    setEmail(demoCredentials[nextRole].email);
    setPassword(demoCredentials[nextRole].password);
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.message || 'Không thể xác thực tài khoản.');
      }
      onAuthenticated(data.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xác thực tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B312C]/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[36px] border border-[#EAE7E0] bg-white p-6 text-[#3D3D3D] card-shadow-lg sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-[#F9F7F2] p-2 text-[#7D857E] transition-colors hover:bg-[#F2EDE4]"
          aria-label="Đóng form đăng nhập"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#8BA08E]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4A5D4E]">
            <LogIn className="h-3.5 w-3.5" />
            Tài khoản SmartMeal
          </div>
          <h2 className="font-serif text-2xl font-normal text-[#3D3D3D]">
            {mode === 'login' ? 'Đăng nhập hệ thống' : 'Tạo tài khoản người dùng'}
          </h2>
          <p className="mt-1 text-xs text-[#7D857E]">
            Dùng tài khoản demo hoặc đăng ký tài khoản user để trải nghiệm phân quyền thật.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-[#F2EDE4] p-1.5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              mode === 'login' ? 'bg-[#4A5D4E] text-white shadow-sm' : 'text-[#606962] hover:bg-white/70'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              applyRole('user');
            }}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              mode === 'register' ? 'bg-[#4A5D4E] text-white shadow-sm' : 'text-[#606962] hover:bg-white/70'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {mode === 'login' && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyRole('user')}
              className={`rounded-2xl border px-3 py-2 text-xs font-bold transition-colors ${
                role === 'user'
                  ? 'border-[#8BA08E] bg-[#8BA08E]/15 text-[#4A5D4E]'
                  : 'border-[#EAE7E0] bg-[#F9F7F2] text-[#7D857E] hover:border-[#D1CEC7]'
              }`}
            >
              User demo
            </button>
            <button
              type="button"
              onClick={() => applyRole('admin')}
              className={`rounded-2xl border px-3 py-2 text-xs font-bold transition-colors ${
                role === 'admin'
                  ? 'border-[#C87D55] bg-[#D9AE94]/20 text-[#8C5D36]'
                  : 'border-[#EAE7E0] bg-[#F9F7F2] text-[#7D857E] hover:border-[#D1CEC7]'
              }`}
            >
              Admin demo
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block font-semibold text-[#3D3D3D]">Họ và tên</label>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 font-medium outline-none transition-colors focus:border-[#8BA08E]"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-semibold text-[#3D3D3D]">Email</label>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 font-medium outline-none transition-colors focus:border-[#8BA08E]"
              placeholder="user@gmail.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-[#3D3D3D]">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 font-medium outline-none transition-colors focus:border-[#8BA08E]"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-[#C87D55]/30 bg-[#D9AE94]/15 px-4 py-3 text-[#8C5D36]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4A5D4E] px-5 py-3 font-bold text-white card-shadow transition-colors hover:bg-[#3D4D40] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký user'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<string>('recommend');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [pantryItems, setPantryItems] = useState<UserIngredient[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<DemoRole>('user');

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

  const handleLoginDemo = (role: DemoRole) => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (activeTab === 'admin') {
      setActiveTab('recommend');
    }
    refreshAppData();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setFavorites([]);
      setPantryItems([]);
      if (activeTab === 'admin' || activeTab === 'pantry' || activeTab === 'history') setActiveTab('recommend');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleAddPantryItem = async (name: string, quantity: number, unit: string, category: IngredientCategory) => {
    if (!currentUser) {
      handleLoginDemo('user');
      return;
    }

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

  const handleTriggerCookFromPantry = (_items: { name: string; quantity: number; unit: string }[]) => {
    setActiveTab('recommend');
  };

  const handleToggleFavorite = async (recipeId: string) => {
    if (!currentUser) {
      handleLoginDemo('user');
      return;
    }

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

  const handleAddToShoppingList = (_name: string, _quantity: number, _unit: string, _recipeName: string) => {
    if (!currentUser) {
      handleLoginDemo('user');
      return;
    }
    setActiveTab('pantry');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D3D3D] flex flex-col font-sans selection:bg-[#8BA08E] selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginDemo={handleLoginDemo}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
        pantryCount={pantryItems.length}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'recommend' && (
          <RecommendationHub
            allIngredients={allIngredients}
            pantryItems={pantryItems}
            onSelectRecipe={id => setSelectedRecipeId(id)}
            onAddToShoppingList={handleAddToShoppingList}
            userDietaryPreferences={currentUser?.preferences?.dietaryTypes || ['Vietnamese', 'Healthy']}
            userPreferences={currentUser?.preferences}
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

        {activeTab === 'history' && currentUser?.role === 'user' && (
          <UserHistory onSelectRecipe={id => setSelectedRecipeId(id)} />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard allIngredients={allIngredients} onRefreshData={refreshAppData} />
        )}
      </main>

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

      {showProfileModal && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={updated => setCurrentUser({ ...currentUser, ...updated } as UserProfile)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          initialRole={authRole}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}

      <footer className="border-t border-[#EAE7E0] bg-[#F9F7F2] py-8 text-center text-xs text-[#7D857E]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#8BA08E] flex items-center justify-center text-white text-[10px] font-bold">SM</div>
            <span className="font-serif font-semibold text-[#4A5D4E]">SmartMeal</span>
            <span className="text-[#A9A296]">•</span>
            <span>Hệ thống Gợi ý Món ăn Thông minh</span>
          </div>
          <p>© 2026 SmartMeal • Khởi nguồn món ngon từ nguyên liệu tự nhiên & AI cá nhân hóa</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
