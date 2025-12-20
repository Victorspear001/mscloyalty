
import { Customer, Admin } from '../types';

const CUSTOMER_STORAGE_KEY = 'msc_customers_v1';
const ADMIN_STORAGE_KEY = 'msc_admins_v1';
const METADATA_KEY = 'msc_metadata_v1';

// Simulate network latency for that "backend" feel
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const storageService = {
  // --- Metadata / ID Logic ---
  getMetadata: () => {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : { lastIdCount: 0 };
  },

  saveMetadata: (metadata: { lastIdCount: number }) => {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  },

  generateUniqueId: (): string => {
    const metadata = storageService.getMetadata();
    const newCount = metadata.lastIdCount + 1;
    storageService.saveMetadata({ lastIdCount: newCount });
    const padded = newCount.toString().padStart(4, '0');
    return `MSC${padded}`;
  },

  // --- Customer Methods ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  },

  addCustomer: async (name: string, mobile: string): Promise<Customer> => {
    await delay(600); // Simulate database write
    const customers = storageService.getCustomers();
    const newCustomer: Customer = {
      id: Date.now(),
      name,
      mobile,
      customer_id: storageService.generateUniqueId(),
      stamps: 0,
      redeems: 0,
      lifetime_stamps: 0,
      tier_1_claimed: false,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    storageService.saveCustomers([...customers, newCustomer]);
    return newCustomer;
  },

  updateCustomer: async (id: number, updates: Partial<Customer>) => {
    await delay(300);
    const customers = storageService.getCustomers();
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    storageService.saveCustomers(updated);
  },

  deleteCustomerSoft: async (id: number) => {
    await storageService.updateCustomer(id, { is_deleted: true });
  },

  findCustomer: (query: string): Customer | undefined => {
    const customers = storageService.getCustomers();
    return customers.find(c => 
      !c.is_deleted && (c.customer_id.toUpperCase() === query.toUpperCase() || c.mobile === query)
    );
  },

  // --- Admin Methods ---
  getAdmins: (): Admin[] => {
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAdmins: (admins: Admin[]) => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  },

  addAdmin: async (admin: Admin): Promise<boolean> => {
    await delay(800);
    const admins = storageService.getAdmins();
    if (admins.find(a => a.username === admin.username)) return false;
    storageService.saveAdmins([...admins, admin]);
    return true;
  },

  findAdmin: (username: string) => {
    return storageService.getAdmins().find(a => a.username === username);
  },

  updateAdminPassword: async (username: string, newPassword: string) => {
    await delay(500);
    const admins = storageService.getAdmins();
    const updated = admins.map(a => a.username === username ? { ...a, password: newPassword } : a);
    storageService.saveAdmins(updated);
  }
};
