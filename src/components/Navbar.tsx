import React from 'react';
import {
  ChevronDown,
  History,
  LogOut,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  User,
  UtensilsCrossed
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onLoginDemo: (role: 'user' | 'admin') => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  pantryCount: number;
}

const baseTabs = [
  { id: 'recommend', label: 'Gợi ý món', icon: Sparkles },
  { id: 'explorer', label: 'Kho công thức', icon: UtensilsCrossed }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginDemo,
  onLogout,
  onOpenProfile,
  pantryCount
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const tabs = [
    ...baseTabs,
    ...(currentUser?.role === 'user'
      ? [
          { id: 'pantry', label: `Tủ lạnh của tôi${pantryCount ? ` (${pantryCount})` : ''}`, icon: Refrigerator },
          { id: 'history', label: 'Lịch sử gợi ý', icon: History }
        ]
      : []),
    ...(currentUser?.role === 'admin'
      ? [{ id: 'admin', label: 'Quản trị Admin', icon: ShieldCheck }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#EAE7E0] text-[#3D3D3D] card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-2 sm:gap-4">
          <div
            id="brand-logo"
            onClick={() => setActiveTab('recommend')}
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#8BA08E] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[#4A5D4E]">SmartMeal</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2EDE4] text-[#7D857E] border border-[#EAE7E0]">
                  Natural AI
                </span>
              </div>
              <p className="text-[11px] text-[#7D857E] hidden sm:block">Gợi ý món ngon từ nguyên liệu tự nhiên</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1.5 bg-[#F2EDE4]/70 p-1.5 rounded-full border border-[#EAE7E0] overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isAdmin = tab.id === 'admin';
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? isAdmin ? 'bg-[#C87D55] text-white shadow-sm' : 'bg-[#4A5D4E] text-white shadow-sm'
                      : isAdmin ? 'text-[#C87D55] hover:bg-[#D9AE94]/20' : 'text-[#606962] hover:text-[#3D3D3D] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : isAdmin ? 'text-[#C87D55]' : 'text-[#8BA08E]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
                        {currentUser.preferences.dietaryTypes.map(diet => (
                          <span key={diet} className="px-2 py-0.5 rounded-full text-[10px] bg-[#F2EDE4] text-[#4A5D4E] font-medium border border-[#EAE7E0]">
                            {diet}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="py-1">
                      {currentUser.role === 'user' && (
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
                      )}

                      <div className="my-1 border-t border-[#F2EDE4]" />
                      <div className="px-3 py-1 text-[10px] text-[#7D857E] font-bold uppercase tracking-wider">Tài khoản demo</div>
                      <button
                        id="switch-to-user-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLoginDemo('user');
                        }}
                        className="w-full px-3 py-1.5 text-left rounded-xl text-xs flex items-center justify-between font-medium text-[#3D3D3D] hover:bg-[#F2EDE4]"
                      >
                        <span>Người dùng (User)</span>
                        {currentUser.role === 'user' && <span className="text-[10px] text-[#8BA08E]">Đang chọn</span>}
                      </button>
                      <button
                        id="switch-to-admin-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLoginDemo('admin');
                        }}
                        className="w-full px-3 py-1.5 text-left rounded-xl text-xs flex items-center justify-between font-medium text-[#3D3D3D] hover:bg-[#F2EDE4]"
                      >
                        <span>Quản trị viên (Admin)</span>
                        {currentUser.role === 'admin' && <span className="text-[10px] text-[#C87D55]">Đang chọn</span>}
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
                  id="guest-login-user-btn"
                  onClick={() => onLoginDemo('user')}
                  className="whitespace-nowrap rounded-full bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#3D4D40] sm:px-4"
                >
                  Đăng nhập
                </button>
                <button
                  id="guest-login-admin-btn"
                  onClick={() => onLoginDemo('admin')}
                  className="whitespace-nowrap rounded-full border border-[#D1CEC7] bg-[#F2EDE4] px-3 py-2 text-xs font-semibold text-[#4A5D4E] transition-colors hover:bg-[#EAE7E0] sm:px-4"
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 scrollbar-none border-t border-[#EAE7E0]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? tab.id === 'admin' ? 'bg-[#C87D55] text-white shadow' : 'bg-[#4A5D4E] text-white shadow'
                  : tab.id === 'admin' ? 'bg-[#D9AE94]/20 text-[#C87D55]' : 'bg-[#F2EDE4] text-[#606962]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
