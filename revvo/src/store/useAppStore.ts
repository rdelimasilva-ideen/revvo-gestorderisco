import { create } from 'zustand';

interface UserInfo {
  email: string;
  name?: string;
  picture?: string;
  loginType: 'local' | 'google';
}

interface AppState {
  currentUrl: string | null;
  currentPage: string | null;
  setCurrentUrl: (url: string | null) => void;
  setCurrentPage: (page: string | null) => void;
  isAuthenticated: boolean;
  sapToken: string | null;
  userInfo: UserInfo | null;
  setAuthentication: (token: string | null, userInfo?: UserInfo) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => {
  // Initialize userInfo from localStorage
  let initialUserInfo = null;
  try {
    const userInfoStr = localStorage.getItem('user_info');
    initialUserInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (e) {
    initialUserInfo = null;
  }

  return {
    currentUrl: null,
    currentPage: null,
    setCurrentUrl: (url) => set({ currentUrl: url, currentPage: null }),
    setCurrentPage: (page) => set({ currentPage: page, currentUrl: null }),
    isAuthenticated: !!localStorage.getItem('sap_token'),
    sapToken: localStorage.getItem('sap_token'),
    userInfo: initialUserInfo,
    setAuthentication: (token, userInfo) => {
      if (token) {
        localStorage.setItem('sap_token', token);
        if (userInfo) {
          localStorage.setItem('user_info', JSON.stringify(userInfo));
        }
        set({ isAuthenticated: true, sapToken: token, userInfo: userInfo || null });
      } else {
        localStorage.removeItem('sap_token');
        localStorage.removeItem('user_info');
        set({ isAuthenticated: false, sapToken: null, userInfo: null });
      }
    },
    logout: () => {
      // Limpeza completa do localStorage pelo authService será feita quando a função for chamada
      // Ainda assim, garantimos a limpeza das chaves principais aqui também
      localStorage.removeItem('sap_token');
      localStorage.removeItem('user_info');
      set({ isAuthenticated: false, sapToken: null, userInfo: null, currentUrl: null, currentPage: null });
    },
  };
});
