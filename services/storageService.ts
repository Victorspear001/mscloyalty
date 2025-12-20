
import { createClient } from '@supabase/supabase-js';
import { Customer, Admin } from '../types';

/**
 * PASTE YOUR SUPABASE CREDENTIALS HERE
 * 1. Go to your Supabase Project Settings > API
 * 2. Copy the "Project URL" and "anon public" Key
 */
const supabaseUrl = (process.env.SUPABASE_URL || 'https://teyzbkdywrwukpbrwfti.supabase.co') as string;
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXpia2R5d3J3dWtwYnJ3ZnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzc1OTcsImV4cCI6MjA4MTgxMzU5N30.ok3r9DstEcMuoxbgfjEHlP3O6EA-UIgHXR4Wbkn6l4A') as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedCustomers: Customer[] = [];

export const storageService = {
  // --- Customer Methods ---
  getCustomers: (): Customer[] => {
    return cachedCustomers;
  },

  fetchCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    cachedCustomers = data as Customer[];
    return cachedCustomers;
  },

  addCustomer: async (name: string, mobile: string): Promise<Customer> => {
    // Generate MSC ID based on current count
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const nextCount = (count || 0) + 1;
    const customerId = `MSC${nextCount.toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name,
          mobile,
          customer_id: customerId,
          stamps: 0,
          redeems: 0,
          lifetime_stamps: 0,
          tier_1_claimed: false,
          is_deleted: false,
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to enlist magician: ${error.message}`);
    }

    return data as Customer;
  },

  updateCustomer: async (id: number, updates: Partial<Customer>) => {
    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update scroll: ${error.message}`);
    }
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
  addAdmin: async (admin: Admin): Promise<boolean> => {
    const { error } = await supabase
      .from('admins')
      .insert([
        {
          username: admin.username,
          password: admin.password,
          security_question: admin.securityQuestion,
          security_answer: admin.securityAnswer,
        }
      ]);

    return !error;
  },

  findAdmin: async (username: string): Promise<Admin | undefined> => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !data) return undefined;
    
    return {
      username: data.username,
      password: data.password,
      securityQuestion: data.security_question,
      securityAnswer: data.security_answer
    } as Admin;
  },

  updateAdminPassword: async (username: string, newPassword: string) => {
    const { error } = await supabase
      .from('admins')
      .update({ password: newPassword })
      .eq('username', username);

    if (error) {
      throw new Error(`Failed to reforge key: ${error.message}`);
    }
  }
};
