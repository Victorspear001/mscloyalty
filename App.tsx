
import React, { useState, useEffect } from 'react';
import { 
    User, 
    Shield, 
    QrCode, 
    Download, 
    Share2, 
    Plus, 
    Minus, 
    History, 
    LogOut, 
    Search, 
    Trash2, 
    Database, 
    Camera,
    Gift,
    Trophy,
    ArrowLeft,
    Key,
    Lock,
    HelpCircle,
    UserPlus,
    RefreshCw
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [adminUser, setAdminUser] = useState<Admin | null>(null);
    const [loginInput, setLoginInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Form states
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');
    const [adminForm, setAdminForm] = useState({ username: '', password: '', securityQuestion: '', securityAnswer: '' });
    const [resetForm, setResetForm] = useState({ username: '', securityAnswer: '', newPassword: '' });

    useEffect(() => {
        setCustomers(storageService.getCustomers());
    }, [view]);

    const handleLogin = () => {
        const query = loginInput.trim().toUpperCase();
        const customer = storageService.findCustomer(query);
        if (customer) {
            setCurrentCustomer(customer);
            setView('CUSTOMER_DASHBOARD');
        } else {
            alert('No profile found. Please visit our counter to register!');
        }
    };

    const handleAdminRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const success = storageService.addAdmin(adminForm);
        if (success) {
            alert('Admin registered successfully!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Username already exists.');
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(adminForm.username);
        if (admin && admin.password === adminForm.password) {
            setAdminUser(admin);
            setView('ADMIN_DASHBOARD');
        } else {
            alert('Invalid credentials.');
        }
    };

    const handleAdminReset = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(resetForm.username);
        if (admin && admin.securityAnswer === resetForm.securityAnswer) {
            storageService.updateAdminPassword(resetForm.username, resetForm.newPassword);
            alert('Password reset successful!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Security answer mismatch or username not found.');
        }
    };

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) return;
        storageService.addCustomer(newName, newMobile);
        setNewName('');
        setNewMobile('');
        setCustomers(storageService.getCustomers());
        alert('Customer registered successfully!');
    };

    const updateStamps = (id: number, delta: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        let newStamps = Math.min(Math.max(customer.stamps + delta, 0), 6);
        storageService.updateCustomer(id, { 
            stamps: newStamps,
            lifetime_stamps: delta > 0 ? customer.lifetime_stamps + 1 : customer.lifetime_stamps
        });
        setCustomers(storageService.getCustomers());
    };

    const handleClaimTier1 = (id: number) => {
        storageService.updateCustomer(id, { tier_1_claimed: true });
        setCustomers(storageService.getCustomers());
    };

    const handleRedeem = (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        storageService.updateCustomer(id, {
            stamps: 0,
            redeems: customer.redeems + 1,
            tier_1_claimed: false 
        });
        setCustomers(storageService.getCustomers());
    };

    const handleSoftDelete = (id: number) => {
        if (confirm('Deactivate this customer?')) {
            storageService.deleteCustomerSoft(id);
            setCustomers(storageService.getCustomers());
        }
    };

    const handleHardDelete = (id: number) => {
        if (confirm('PERMANENTLY DELETE this customer from records? This cannot be undone.')) {
            storageService.deleteCustomerHard(id);
            setCustomers(storageService.getCustomers());
        }
    };

    // Fix: Added missing exportCSV function to handle data export to CSV format
    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Mobile', 'Customer ID', 'Stamps', 'Redeems', 'Lifetime Stamps', 'Tier 1 Claimed', 'Status', 'Joined Date'];
        const csvRows = customers.map(c => [
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            `"${c.mobile.replace(/"/g, '""')}"`,
            c.customer_id,
            c.stamps,
            c.redeems,
            c.lifetime_stamps,
            c.tier_1_claimed,
            c.is_deleted ? 'Archived' : 'Active',
            new Date(c.created_at).toLocaleDateString()
        ].join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `msc_loyalty_backup_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
            <div className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] text-center fairy-border relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <button 
                  onClick={() => setView('ADMIN_LOGIN')}
                  className="mb-6 flex justify-center group"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Trophy className="w-10 h-10 text-blue-600 group-hover:rotate-12 transition-transform" />
                    </div>
                </button>
                <h1 className="font-cinzel text-4xl font-bold text-blue-900 mb-1">MITHRAN</h1>
                <p className="font-cinzel text-[10px] tracking-[0.4em] text-blue-500 mb-10 uppercase font-bold opacity-80">Snacks Corner</p>
                
                <div className="space-y-6 mb-8 text-left">
                    <div>
                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1 mb-2 block">Quick Access</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="MSC ID or Mobile"
                                className="w-full bg-white/60 border border-blue-200 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-blue-300 font-medium"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-4 top-4 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30">
                                <QrCode className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogin} 
                        className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-cinzel tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                    >
                        <Search className="w-5 h-5" /> EXPLORE WORLD
                    </button>
                </div>
                <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.2em]">Crafted for the elite snackers</p>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] text-center fairy-border animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center text-white">
                        <Lock className="w-8 h-8" />
                    </div>
                </div>
                <h2 className="font-cinzel text-2xl font-bold text-blue-900 mb-2 uppercase">Staff Command</h2>
                <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-8 font-bold">Encrypted Access Required</p>
                
                <form onSubmit={handleAdminLogin} className="space-y-4 text-left mb-8">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest ml-1">Username</label>
                        <input 
                            type="text"
                            className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10"
                            onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest ml-1">Master Key</label>
                        <input 
                            type="password"
                            className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10"
                            onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                            required
                        />
                    </div>
                    <button className="w-full bg-blue-900 text-white font-cinzel tracking-widest py-5 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-black transition-all">
                        AUTHORIZE
                    </button>
                </form>

                <div className="flex flex-col gap-3">
                  <button onClick={() => setView('ADMIN_REGISTER')} className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    <UserPlus className="w-3 h-3" /> New Staff Member
                  </button>
                  <button onClick={() => setView('ADMIN_RESET')} className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Lost Your Key?
                  </button>
                  <button onClick={() => setView('LOGIN')} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Back to Terminal
                  </button>
                </div>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] text-center fairy-border animate-in zoom-in-95 duration-500">
                <h2 className="font-cinzel text-2xl font-bold text-blue-900 mb-8 uppercase">Register Staff</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4 text-left mb-6">
                    <input type="text" placeholder="Username" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} required />
                    <select className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})} required>
                        <option value="">Select Security Question</option>
                        <option value="pet">First Pet's Name?</option>
                        <option value="city">Your Birth City?</option>
                        <option value="snack">Favorite MSC Snack?</option>
                    </select>
                    <input type="text" placeholder="Security Answer" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})} required />
                    <button className="w-full bg-blue-600 text-white font-cinzel tracking-widest py-5 rounded-2xl shadow-xl">CREATE RECORD</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[10px] text-blue-400 font-bold uppercase">Back to Login</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] text-center fairy-border animate-in zoom-in-95 duration-500">
                <h2 className="font-cinzel text-2xl font-bold text-blue-900 mb-8 uppercase">Reset Master Key</h2>
                <form onSubmit={handleAdminReset} className="space-y-4 text-left mb-6">
                    <input type="text" placeholder="Username" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setResetForm({...resetForm, username: e.target.value})} required />
                    <input type="text" placeholder="Security Answer" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})} required />
                    <input type="password" placeholder="New Password" className="w-full bg-white/60 border border-blue-200 rounded-2xl px-5 py-4 outline-none" onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})} required />
                    <button className="w-full bg-indigo-600 text-white font-cinzel tracking-widest py-5 rounded-2xl shadow-xl">RESTORE ACCESS</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[10px] text-blue-400 font-bold uppercase">Back to Login</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-screen p-4 pb-20 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mt-8 mb-8 flex items-center justify-between">
                    <button onClick={() => setView('ADMIN_LOGIN')} className="group flex flex-col items-center">
                        <div className="p-2 bg-white rounded-2xl shadow-sm border border-blue-50 group-hover:bg-blue-600 transition-colors duration-300">
                            <Trophy className="w-6 h-6 text-blue-600 group-hover:text-white" />
                        </div>
                        <span className="text-[8px] font-bold text-blue-300 uppercase mt-1">Staff Door</span>
                    </button>
                    <div className="text-center">
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Mithran Elite</p>
                        <h1 className="font-cinzel text-2xl font-bold text-blue-900">Digital Lounge</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-blue-50 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-10 animate-in zoom-in-95 delay-150 duration-700 fill-mode-both">
                    <MembershipCard customer={currentCustomer} />
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <button className="glass-panel rounded-2xl py-4 flex items-center justify-center gap-3 border border-white hover:bg-blue-600 hover:text-white transition-all text-blue-900 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/5">
                            <Download className="w-4 h-4" /> Download
                        </button>
                        <button className="glass-panel rounded-2xl py-4 flex items-center justify-center gap-3 border border-white hover:bg-blue-600 hover:text-white transition-all text-blue-900 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/5">
                            <Share2 className="w-4 h-4" /> Spread Joy
                        </button>
                    </div>
                </div>

                <div className="mb-10 animate-in slide-in-from-bottom-4 delay-300 duration-700 fill-mode-both">
                    <h3 className="font-cinzel text-sm font-bold text-blue-900 tracking-widest mb-4 px-2 uppercase">Your Saga</h3>
                    <div className="glass-panel rounded-[2rem] p-8 border-2 border-white shadow-2xl bg-gradient-to-b from-white to-blue-50/30">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">STAMP PROGRESS</p>
                                <p className="text-xs text-blue-900 font-bold">{6 - currentCustomer.stamps} to Mastery!</p>
                            </div>
                            <span className="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20">{currentCustomer.stamps} / 6</span>
                        </div>
                        <div className="grid grid-cols-3 gap-y-12 gap-x-4 justify-items-center">
                            {[...Array(6)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    {currentCustomer.stamps >= 3 && !currentCustomer.tier_1_claimed && (
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/20">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                                <Gift className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Mini Milestone Reach</p>
                                <p className="text-lg font-cinzel leading-none">10% OFF UNLOCKED</p>
                            </div>
                        </div>
                    )}
                    {currentCustomer.stamps === 6 && (
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/20 animate-pulse">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Ultimate Victory</p>
                                <p className="text-lg font-cinzel leading-none">FREE SNACK READY</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center opacity-40">
                    <p className="text-[10px] text-blue-400 font-bold tracking-[0.4em] uppercase">Mithran Snacks Corner • MSC Loyalty v1.5</p>
                </div>
            </div>
        );
    };

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => 
            (view === 'ADMIN_HISTORY' || !c.is_deleted) && 
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery) || c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return (
            <div className="min-h-screen bg-[#f8fafc] p-6">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-900 rounded-xl text-white shadow-lg shadow-blue-900/20"><Shield className="w-5 h-5"/></div>
                                <h1 className="font-cinzel text-3xl font-bold text-blue-900">LOYALTY HUB</h1>
                            </div>
                            <p className="text-[10px] text-blue-400 uppercase tracking-[0.3em] font-bold">Admin: {adminUser?.username}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setView('ADMIN_DASHBOARD')} className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'ADMIN_DASHBOARD' ? 'bg-blue-900 text-white shadow-xl' : 'bg-white text-blue-900 hover:bg-blue-50'}`}>Active List</button>
                            <button onClick={() => setView('ADMIN_HISTORY')} className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'ADMIN_HISTORY' ? 'bg-blue-900 text-white shadow-xl' : 'bg-white text-blue-900 hover:bg-blue-50'}`}>Archive</button>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><LogOut className="w-5 h-5" /></button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Registration Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-blue-50">
                                <h3 className="font-cinzel text-lg font-bold text-blue-900 mb-6 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> New Member</h3>
                                <form onSubmit={handleAddCustomer} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                        <input type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                                        <input type="tel" placeholder="9876543210" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                    </div>
                                    <button className="w-full bg-blue-600 text-white font-cinzel py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all font-bold tracking-widest uppercase">ENROLL MEMBER</button>
                                </form>
                            </div>

                            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <Database className="w-6 h-6 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase bg-white/10 px-3 py-1 rounded-full">System Safe</span>
                                </div>
                                <h4 className="font-cinzel text-xl font-bold mb-1">Local Storage</h4>
                                <p className="text-xs text-indigo-200 mb-6">Database encrypted in client session</p>
                                <button onClick={exportCSV} className="w-full bg-white text-indigo-900 font-bold text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-black/10 flex items-center justify-center gap-2"><Download className="w-4 h-4"/> Export Full Backup</button>
                            </div>
                        </div>

                        {/* Search & List Panel */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[2.5rem] shadow-xl border border-blue-50 overflow-hidden flex flex-col h-full min-h-[600px]">
                                <div className="p-6 border-b border-blue-50 flex items-center gap-4 bg-slate-50/30">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Find by Name, Mobile or ID..." 
                                            className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-14 pr-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm font-medium" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                    <button onClick={() => setShowScanner(true)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Camera className="w-5 h-5"/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 sticky top-0 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-5">Profile</th>
                                                <th className="px-8 py-5">Collection</th>
                                                <th className="px-8 py-5 text-center">Eligibility</th>
                                                <th className="px-8 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filtered.map(c => (
                                                <tr key={c.id} className={`${c.is_deleted ? 'opacity-40 grayscale' : ''} hover:bg-blue-50/20 transition-colors group`}>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                                {c.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-blue-900 text-sm">{c.name}</div>
                                                                <div className="text-[10px] text-blue-400 font-bold font-mono tracking-tighter">{c.customer_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => updateStamps(c.id, -1)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Minus className="w-4 h-4"/></button>
                                                            <div className="flex flex-col items-center min-w-[32px]">
                                                                <span className="font-cinzel text-lg font-bold text-blue-900 leading-none">{c.stamps}</span>
                                                                <span className="text-[8px] text-blue-300 font-bold uppercase">Balls</span>
                                                            </div>
                                                            <button onClick={() => updateStamps(c.id, 1)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-500 transition-colors"><Plus className="w-4 h-4"/></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col gap-2 items-center">
                                                            {c.stamps >= 3 && (
                                                                <button 
                                                                    disabled={c.tier_1_claimed}
                                                                    onClick={() => handleClaimTier1(c.id)}
                                                                    className={`text-[9px] px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg transition-all ${c.tier_1_claimed ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-200 active:scale-95'}`}
                                                                >
                                                                    {c.tier_1_claimed ? 'Mini Used' : 'Give Mini'}
                                                                </button>
                                                            )}
                                                            {c.stamps === 6 && (
                                                                <button 
                                                                    onClick={() => handleRedeem(c.id)}
                                                                    className="bg-orange-500 text-white text-[9px] px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all"
                                                                >
                                                                    Give Grand
                                                                </button>
                                                            )}
                                                            {c.stamps < 3 && <span className="text-[9px] text-slate-300 font-bold italic uppercase">Pending...</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                          onClick={() => view === 'ADMIN_HISTORY' ? handleHardDelete(c.id) : handleSoftDelete(c.id)} 
                                                          className={`p-3 rounded-2xl transition-all ${view === 'ADMIN_HISTORY' ? 'text-red-600 bg-red-50 hover:bg-red-600 hover:text-white' : 'text-slate-300 bg-slate-50 hover:bg-red-50 hover:text-red-600'}`}
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filtered.length === 0 && <div className="p-20 text-center text-slate-300 text-sm font-medium">No records found.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {showScanner && <Scanner onScan={(data) => { setSearchQuery(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
            </div>
        );
    };

    return (
        <div className="min-h-screen text-slate-900 bg-slate-50">
            {view === 'LOGIN' && renderLogin()}
            {view === 'ADMIN_LOGIN' && renderAdminLogin()}
            {view === 'ADMIN_REGISTER' && renderAdminRegister()}
            {view === 'ADMIN_RESET' && renderAdminReset()}
            {view === 'CUSTOMER_DASHBOARD' && renderCustomerDashboard()}
            {(view === 'ADMIN_DASHBOARD' || view === 'ADMIN_HISTORY') && adminUser && renderAdminDashboard()}
        </div>
    );
};

export default App;
