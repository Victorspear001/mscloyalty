
import { createClient } from '@supabase/supabase-js';
import { Customer, Admin } from '../types';

const SUPABASE_URL = 'https://teyzbkdywrwukpbrwfti.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXpia2R5d3J3dWtwYnJ3ZnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzc1OTcsImV4cCI6MjA4MTgxMzU5N30.ok3r9DstEcMuoxbgfjEHlP3O6EA-UIgHXR4Wbkn6l4A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  // --- Customer Methods ---
  fetchCustomers: async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Customer[];
    } catch (err) {
      console.error('Fetch Customers Error:', err);
      return [];
    }
  },

  addCustomer: async (name: string, mobile: string): Promise<Customer> => {
    // Generate MSC ID based on count
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

  findCustomer: async (query: string): Promise<Customer | undefined> => {
    const cleanQuery = query.trim();
    // Search by exact mobile or like MSC ID
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
  addAdmin: async (admin: Admin): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = admin.username.toLowerCase().trim();
    const cleanEmail = admin.email.toLowerCase().trim();
    const cleanAnswer = admin.securityAnswer.toLowerCase().trim();

    const { error } = await supabase
      .from('admins')
      .insert([{
          username: cleanUsername,
          password: admin.password,
          email: cleanEmail,
          security_question: admin.securityQuestion,
          security_answer: cleanAnswer,
      }]);
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, message: "Username or Email is already registered in our magical scrolls." };
      }
      return { success: false, message: "Vault Error: " + error.message };
    }
    return { success: true, message: "Staff identity manifest successful!" };
  },

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

  findAdminByEmail: async (email: string): Promise<Admin | undefined> => {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', cleanEmail)
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
    const cleanEmail = email.toLowerCase().trim();
    const { error } = await supabase
      .from('admins')
      .update({ password: newPassword })
      .eq('email', cleanEmail);

    if (error) throw new Error(error.message);
  }
};
