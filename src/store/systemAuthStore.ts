// Installation & Auth State Management synced directly with MySQL Backend
// No purely local or mock persistence; everything runs on MySQL Server

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  charset: string;
  ssl: boolean;
}

export interface BusinessConfig {
  companyNameAr: string;
  companyNameEn: string;
  currency: string;
  currencySymbol: string;
  country: string;
  taxNumber?: string;
  commercialRecord?: string;
  shopUnitName: string;
  freelanceUnitName: string;
  defaultSharedShopRatio: number;
  defaultSharedFreelanceRatio: number;
}

export interface AdminAccount {
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ACCOUNTANT' | 'BRANCH_MANAGER' | 'SALES_CASHIER' | 'TECH_SUPPORT';
}

export interface SystemInstallationState {
  isInstalled: boolean;
  installedAt?: string;
  databaseConfig?: DatabaseConfig;
  businessConfig?: BusinessConfig;
  adminAccount?: AdminAccount;
  jwtSecret?: string;
  envFileContent?: string;
  configFileContent?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  roleTitleAr: string;
  avatarColor: string;
  accessibleUnits: ('SHOP' | 'FREELANCE' | 'BOTH')[];
}

class SystemAuthStore {
  installationState: SystemInstallationState = { isInstalled: false };
  currentUser: CurrentUser | null = null;
  private isLoaded: boolean = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.checkStatusFromServer();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public async checkStatusFromServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        this.installationState = {
          isInstalled: Boolean(data.isInstalled),
          installedAt: data.installedAt,
          businessConfig: data.businessConfig,
          adminAccount: data.adminAccount
        };
      } else {
        this.installationState = { isInstalled: false };
      }
    } catch {
      this.installationState = { isInstalled: false };
    } finally {
      this.isLoaded = true;
      this.notify();
    }
    return this.installationState.isInstalled;
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  saveInstallation(state: Partial<SystemInstallationState>) {
    this.installationState = {
      ...this.installationState,
      ...state,
      isInstalled: true,
      installedAt: new Date().toISOString()
    };
    this.notify();
  }

  async resetInstallation() {
    try {
      await fetch('/api/system/reset', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    this.installationState = { isInstalled: false };
    this.currentUser = null;
    this.notify();
  }

  login(user: CurrentUser, rememberSession: boolean = true) {
    this.currentUser = user;
    if (rememberSession) {
      try {
        localStorage.setItem('dragon_erp_session_user', JSON.stringify(user));
      } catch (e) {
        console.error('Failed to save session to localStorage', e);
      }
    }
    this.notify();
  }

  loadSavedSession(): CurrentUser | null {
    try {
      const saved = localStorage.getItem('dragon_erp_session_user');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        return this.currentUser;
      }
    } catch (e) {
      console.error('Failed to parse saved session', e);
    }
    return null;
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem('dragon_erp_session_user');
    } catch (e) {
      console.error('Failed to remove session', e);
    }
    this.notify();
  }
}

export const systemAuthStore = new SystemAuthStore();
// Auto load session on startup
systemAuthStore.loadSavedSession();
