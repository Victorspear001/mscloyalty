
import { Customer } from '../types';
import { generateCustomerId } from '../constants';

const STORAGE_KEY = 'msc_customers_v1';

export const storageService = {
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
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
      !c.is_deleted && (c.customer_id === query || c.mobile === query)
    );
  }
};
