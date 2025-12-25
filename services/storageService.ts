
import { createClient } from '@supabase/supabase-js';
import { Customer, Admin } from '../types';

const SUPABASE_URL = 'https://teyzbkdywrwukpbrwfti.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXpia2R5d3J3dWtwYnJ3ZnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzc1OTcsImV4cCI6MjA4MTgxMzU5N30.ok3r9DstEcMuoxbgfjEHlP3O6EA-UIgHXR4Wbkn6l4A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  // --- Customer Methods ---
  fetchCustomers: async (includeDeleted = true): Promise<Customer[]> => {
    try {
      let query = supabase.from('customers').select('*');
      
      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Customer[];
    } catch (err) {
      console.error('Fetch Customers Error:', err);
      return [];
    }
  },

  addCustomer: async (name: string, mobile: string): Promise<Customer> => {
    const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const nextCount = (count || 0) + 1;
    const customerId = `MSC${nextCount.toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('customers')
      .insert([{
          name: name.trim(),
          mobile: mobile.trim(),
          customer_id: customerId,
          stamps: 0,
          redeems: 0,
          lifetime_stamps: 0,
          tier_1_claimed: false,
          is_deleted: false,
      }])
      .select().single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  updateCustomer: async (id: number, updates: Partial<Customer>) => {
    const { error } = await supabase.from('customers').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  deleteCustomerSoft: async (id: number) => {
    await storageService.updateCustomer(id, { is_deleted: true });
  },

  deleteCustomerPermanent: async (id: number) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  findCustomer: async (query: string): Promise<Customer | undefined> => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return undefined;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`customer_id.ilike.%${cleanQuery}%,mobile.eq.${cleanQuery}`)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      console.error('Find Customer Error:', error);
      return undefined;
    }
    return data as Customer;
  },

  // --- Admin Methods ---
  findAdmin: async (username: string): Promise<Admin | undefined> => {
    const cleanUsername = username.toLowerCase().trim();
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      username: data.username,
      password: data.password,
      email: data.email,
      securityQuestion: data.security_question,
      securityAnswer: data.security_answer
    } as Admin;
  },

  registerAdmin: async (admin: Admin): Promise<void> => {
    const { error } = await supabase.from('admins').insert([{
      username: admin.username.toLowerCase().trim(),
      password: admin.password,
      email: admin.email,
      security_question: admin.securityQuestion,
      security_answer: admin.securityAnswer
    }]);

    if (error) {
        if (error.code === '23505') throw new Error('Username or Email already exists.');
        throw new Error(error.message);
    }
  },

  updateAdminPassword: async (email: string, newPassword: string) => {
    const { error } = await supabase
      .from('admins')
      .update({ password: newPassword })
      .eq('email', email.toLowerCase().trim());

    if (error) throw new Error(error.message);
  },

  // --- Logo / Settings Methods ---
  getLogo: async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_logo')
        .maybeSingle();
      
      if (error || !data) return null;
      return data.value;
    } catch (err) {
      return null;
    }
  },

  saveLogo: async (base64Logo: string): Promise<void> => {
    // We use onConflict to ensure it updates based on the unique 'key' column
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'app_logo', value: base64Logo }, { onConflict: 'key' });
    
    if (error) {
      console.error("Supabase Save Logo Error:", error);
      throw new Error(error.message);
    }
  }
};
