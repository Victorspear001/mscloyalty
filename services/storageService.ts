
import { Customer, Admin } from '../types';
import { generateCustomerId } from '../constants';

const CUSTOMER_STORAGE_KEY = 'msc_customers_v1';
const ADMIN_STORAGE_KEY = 'msc_admins_v1';

export const storageService = {
  // --- Customer Methods ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  },

  addCustomer: (name: string, mobile: string): Customer => {
    const customers = storageService.getCustomers();
    const newCustomer: Customer = {
      id: Date.now(),
      name,
      mobile,
      customer_id: generateCustomerId(customers.length),
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

  updateCustomer: (id: number, updates: Partial<Customer>) => {
    const customers = storageService.getCustomers();
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    storageService.saveCustomers(updated);
  },

  deleteCustomerSoft: (id: number) => {
    storageService.updateCustomer(id, { is_deleted: true });
  },

  deleteCustomerHard: (id: number) => {
    const customers = storageService.getCustomers();
    storageService.saveCustomers(customers.filter(c => c.id !== id));
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

  addAdmin: (admin: Admin) => {
    const admins = storageService.getAdmins();
    if (admins.find(a => a.username === admin.username)) return false;
    storageService.saveAdmins([...admins, admin]);
    return true;
  },

  findAdmin: (username: string) => {
    return storageService.getAdmins().find(a => a.username === username);
  },

  updateAdminPassword: (username: string, newPassword: string) => {
    const admins = storageService.getAdmins();
    const updated = admins.map(a => a.username === username ? { ...a, password: newPassword } : a);
    storageService.saveAdmins(updated);
  }
};
