import React from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  Refrigerator,
  ShoppingBag,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  pantryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  pantryCount
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#EAE7E0] text-[#3D3D3D] card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('recommend')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-emerald-950">
                  SmartMeal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-emerald-900/60 border border-zinc-200">
                  BETA
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/60 hidden sm:block">Food Recommendation System</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#F2EDE4]/70 p-1.5 rounded-full border border-[#EAE7E0]">
            <button
              id="nav-tab-recommend"
              onClick={() => setActiveTab('recommend')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'recommend'
                  ? 'bg-[#4A5D4E] text-white shadow-sm'
                  : 'text-[#606962] hover:text-[#3D3D3D] hover:bg-white/80'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'recommend' ? 'text-amber-200' : 'text-[#8BA08E]'}`} />
              Gợi ý món
            </button>

            <button
              id="nav-tab-pantry"
              onClick={() => setActiveTab('pantry')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 relative ${
                activeTab === 'pantry'
                  ? 'bg-[#4A5D4E] text-white shadow-sm'
                  : 'text-[#606962] hover:text-[#3D3D3D] hover:bg-white/80'
              }`}
            >
              <Refrigerator className={`w-3.5 h-3.5 ${activeTab === 'pantry' ? 'text-emerald-200' : 'text-[#8BA08E]'}`} />
              Tủ lạnh của tôi
              {pantryCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'pantry' ? 'bg-white/20 text-white' : 'bg-[#D9AE94]/30 text-[#8C4E2D]'
                }`}>
                  {pantryCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-explorer"
              onClick={() => setActiveTab('explorer')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'explorer'
                  ? 'bg-[#4A5D4E] text-white shadow-sm'
                  : 'text-[#606962] hover:text-[#3D3D3D] hover:bg-white/80'
              }`}
            >
              <UtensilsCrossed className={`w-3.5 h-3.5 ${activeTab === 'explorer' ? 'text-amber-200' : 'text-[#8BA08E]'}`} />
              Kho công thức
            </button>

            <button
              id="nav-tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'planner'
                  ? 'bg-[#4A5D4E] text-white shadow-sm'
                  : 'text-[#606962] hover:text-[#3D3D3D] hover:bg-white/80'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'planner' ? 'text-amber-200' : 'text-[#8BA08E]'}`} />
              Đi chợ
            </button>

            {currentUser?.role === 'admin' && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-[#C87D55] text-white shadow-sm'
                    : 'text-[#C87D55] hover:bg-[#D9AE94]/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Quản trị Admin
              </button>
            )}
          </nav>

          {/* User Menu & Role Switcher */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE7E0] hover:border-[#D1CEC7] transition-colors text-left card-shadow"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-[#8BA08E]/40"
                  />
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-[#3D3D3D] leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] text-[#8BA08E] uppercase font-semibold">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7D857E] ml-0.5" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white border border-[#EAE7E0] shadow-2xl p-2 z-50 text-sm">
                    <div className="p-3 border-b border-[#F2EDE4]">
                      <p className="font-semibold text-[#3D3D3D]">{currentUser.name}</p>
                      <p className="text-xs text-[#7D857E] truncate">{currentUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {currentUser.preferences.dietaryTypes.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded-full text-[10px] bg-[#F2EDE4] text-[#4A5D4E] font-medium border border-[#EAE7E0]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        id="user-menu-profile-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl text-[#3D3D3D] hover:bg-[#F2EDE4] flex items-center gap-2 font-medium text-xs"
                      >
                        <User className="w-4 h-4 text-[#8BA08E]" />
                        Sở thích & Hồ sơ cá nhân
                      </button>

                      <div className="my-1 border-t border-[#F2EDE4]" />

                      <button
                        id="user-menu-logout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl text-[#B85244] hover:bg-[#B85244]/10 flex items-center gap-2 font-medium text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="auth-login-btn"
                  onClick={onOpenAuth}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 scrollbar-none border-t border-zinc-200 px-4">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'recommend' ? 'bg-emerald-500 text-white shadow' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            Gợi ý món
          </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'pantry' ? 'bg-emerald-500 text-white shadow' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            Tủ lạnh ({pantryCount})
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'explorer' ? 'bg-emerald-500 text-white shadow' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            Công thức
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'planner' ? 'bg-emerald-500 text-white shadow' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            Đi chợ
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'admin' ? 'bg-emerald-100 text-white shadow' : 'bg-zinc-100 text-zinc-800'
              }`}
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
