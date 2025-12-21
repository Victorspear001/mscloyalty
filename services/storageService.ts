
import { createClient } from '@supabase/supabase-js';
import { Customer, Admin } from '../types';

const supabaseUrl = (process.env.SUPABASE_URL || 'https://your-project-url.supabase.co') as string;
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || 'your-anon-key-here') as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const storageService = {
  // --- Customer Methods ---
  fetchCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as Customer[];
  },

  addCustomer: async (name: string, mobile: string): Promise<Customer> => {
    const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const nextCount = (count || 0) + 1;
    const customerId = `MSC${nextCount.toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('customers')
      .insert([{
          name, mobile, customer_id: customerId,
          stamps: 0, redeems: 0, lifetime_stamps: 0,
          tier_1_claimed: false, is_deleted: false,
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

  findCustomer: async (query: string): Promise<Customer | undefined> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`customer_id.ilike.${query},mobile.eq.${query}`)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) return undefined;
    return data as Customer;
  },

  // --- Admin Methods ---
  addAdmin: async (admin: Admin): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase
      .from('admins')
      .insert([{
          username: admin.username.toLowerCase().trim(),
          password: admin.password,
          email: admin.email.toLowerCase().trim(),
          security_question: admin.securityQuestion,
          security_answer: admin.securityAnswer.toLowerCase().trim(),
      }]);
    
    if (error) {
      if (error.code === '23505') return { success: false, message: "Username or Email already exists in the archives." };
      return { success: false, message: error.message };
    }
    return { success: true, message: "Successfully manifested." };
  },

  findAdmin: async (username: string): Promise<Admin | undefined> => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username.toLowerCase().trim())
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

  findAdminByEmail: async (email: string): Promise<Admin | undefined> => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
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

  updateAdminPassword: async (email: string, newPassword: string) => {
    const { error } = await supabase
      .from('admins')
      .update({ password: newPassword })
      .eq('email', email.toLowerCase().trim());

    if (error) throw new Error(error.message);
  }
};
