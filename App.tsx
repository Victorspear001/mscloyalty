import React, { useState, useEffect } from 'react';
import { 
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
    Lock,
    UserPlus,
    RefreshCw,
    Sparkles,
    Wand2,
    FileDown,
    CreditCard,
    X
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import MagicOrb from './components/MagicOrb';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';

/** 
 * --- GITHUB LOGO UPLOAD GUIDE ---
 * 1. Go to your GitHub repository and upload your PNG logo.
 * 2. Click on the image file in the GitHub file list.
 * 3. Click the "Download" button or "Raw" button.
 * 4. Copy that URL (it should start with 'https://raw.githubusercontent.com/...')
 * 5. Replace the URL below with your new link.
 */
const COMPANY_LOGO = "https://github.com/Victorspear001/mscloyalty/blob/ae02fee5949e40df3cdc2ed04e1a1e7fa7df33b3/logo.png";

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [adminUser, setAdminUser] = useState<Admin | null>(null);
    const [loginInput, setLoginInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI Modals
    const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);

    // Secret Door Logic
    const [logoClicks, setLogoClicks] = useState(0);

    // Form states
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');
    const [adminForm, setAdminForm] = useState({ username: '', password: '', securityQuestion: '', securityAnswer: '' });
    const [resetForm, setResetForm] = useState({ username: '', securityAnswer: '', newPassword: '' });

    useEffect(() => {
        setCustomers(storageService.getCustomers());
    }, [view]);

    const handleLogoClick = () => {
        const next = logoClicks + 1;
        if (next >= 5) {
            setView('ADMIN_LOGIN');
            setLogoClicks(0);
        } else {
            setLogoClicks(next);
        }
    };

    const handleLogin = () => {
        const query = loginInput.trim().toUpperCase();
        const customer = storageService.findCustomer(query);
        if (customer) {
            setCurrentCustomer(customer);
            setView('CUSTOMER_DASHBOARD');
        } else {
            alert('Oh no! We couldn\'t find your magic portal. Visit the counter to register!');
        }
    };

    const handleAdminRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const success = storageService.addAdmin(adminForm);
        if (success) {
            alert('New staff wizard added!');
            setView('ADMIN_LOGIN');
        } else {
            alert('That wizard name is already taken.');
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(adminForm.username);
        if (admin && admin.password === adminForm.password) {
            setAdminUser(admin);
            setView('ADMIN_DASHBOARD');
        } else {
            alert('Invalid magical key.');
        }
    };

    const handleAdminReset = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(resetForm.username);
        if (admin && admin.securityAnswer === resetForm.securityAnswer) {
            storageService.updateAdminPassword(resetForm.username, resetForm.newPassword);
            alert('Magic key restored!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Security spell failed. Answer mismatch.');
        }
    };

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) return;
        const newMember = storageService.addCustomer(newName, newMobile);
        setNewName('');
        setNewMobile('');
        setCustomers(storageService.getCustomers());
        alert(`New Magician: ${newMember.name} enrolled! ID: ${newMember.customer_id}`);
    };

    const updateStamps = (id: number, delta: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        let newStamps = Math.min(Math.max(customer.stamps + delta, 0), 5);
        storageService.updateCustomer(id, { 
            stamps: newStamps,
            lifetime_stamps: delta > 0 ? customer.lifetime_stamps + 1 : customer.lifetime_stamps
        });
        setCustomers(storageService.getCustomers());
    };

    const handleRedeem = (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        storageService.updateCustomer(id, {
            stamps: 0,
            redeems: customer.redeems + 1
        });
        setCustomers(storageService.getCustomers());
    };

    const handleSoftDelete = (id: number) => {
        if (window.confirm('Archive this magician to the vault?')) {
            storageService.deleteCustomerSoft(id);
            setCustomers(storageService.getCustomers());
        }
    };

    const handleHardDelete = (id: number) => {
        if (window.confirm('Permanently banish this record? This cannot be undone!')) {
            storageService.deleteCustomerHard(id);
            setCustomers(storageService.getCustomers());
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Name', 'Mobile', 'Customer ID', 'Stamps', 'Redeems', 'Lifetime Stamps', 'Status', 'Joined Date'];
        const csvRows = customers.map(c => [
            c.id, `"${c.name}"`, `"${c.mobile}"`, c.customer_id, c.stamps, c.redeems, c.lifetime_stamps, c.is_deleted ? 'Archived' : 'Active', new Date(c.created_at).toLocaleDateString()
        ].join(','));
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mithran_magic_backup_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                
                <button 
                  onClick={handleLogoClick}
                  className="mb-8 flex justify-center group active:scale-90 transition-transform relative"
                >
                    <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-blue-900/50 overflow-hidden">
                        <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform" />
                    </div>
                </button>

                <h1 className="font-cinzel text-5xl font-black text-blue-200 mb-1 tracking-tighter">MITHRAN</h1>
                <p className="font-magic text-sm tracking-[0.5em] text-cyan-400 mb-12 uppercase font-bold opacity-80">Blue Fantasy Lounge</p>
                
                <div className="space-y-6 mb-12 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] ml-2">Magical Key</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="ID or Mobile"
                                className="w-full bg-slate-900/50 border-2 border-blue-900/50 rounded-3xl px-8 py-6 focus:ring-8 focus:ring-blue-400/10 focus:border-blue-400 outline-none transition-all placeholder:text-blue-900 font-bold text-lg text-white"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-4 top-4 p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-900/50">
                                <QrCode className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogin} 
                        className="w-full bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 text-white font-cinzel tracking-[0.3em] py-6 rounded-[2rem] shadow-2xl shadow-blue-900/50 hover:shadow-blue-400/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-sm font-black"
                    >
                        <Sparkles className="w-5 h-5 animate-pulse" /> ASCEND PORTAL
                    </button>
                </div>
                
                <div className="flex justify-center gap-4 opacity-30">
                    {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i*0.3}s` }}></div>)}
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-blue-950 rounded-3xl flex items-center justify-center text-blue-400 shadow-2xl border border-blue-900">
                        <Lock className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="font-cinzel text-3xl font-black text-blue-100 mb-2 uppercase tracking-tight">Staff Sanctuary</h2>
                <p className="font-magic text-[12px] text-blue-400 uppercase tracking-widest mb-10 font-bold">Arcane Access Only</p>
                
                <form onSubmit={handleAdminLogin} className="space-y-5 text-left mb-10">
                    <input 
                        type="text"
                        placeholder="Wizard ID"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Magic Key"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                        required
                    />
                    <button className="w-full bg-blue-600 text-white font-cinzel tracking-widest py-6 rounded-2xl shadow-2xl hover:bg-blue-500 transition-all font-black">
                        UNLOCK HUB
                    </button>
                </form>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setView('ADMIN_REGISTER')} className="text-[11px] text-blue-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <UserPlus className="w-4 h-4" /> Recruit
                    </button>
                    <button onClick={() => setView('ADMIN_RESET')} className="text-[11px] text-indigo-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Reset Key
                    </button>
                  </div>
                  <button onClick={() => setView('LOGIN')} className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-4">
                    Return to World
                  </button>
                </div>
            </div>
        </div>
    );

    // Added missing render function for ADMIN_REGISTER view
    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-blue-950 rounded-3xl flex items-center justify-center text-blue-400 shadow-2xl border border-blue-900">
                        <UserPlus className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="font-cinzel text-3xl font-black text-blue-100 mb-2 uppercase tracking-tight">Recruit Wizard</h2>
                <p className="font-magic text-[12px] text-blue-400 uppercase tracking-widest mb-10 font-bold">Forge a new staff bond</p>
                
                <form onSubmit={handleAdminRegister} className="space-y-4 text-left mb-10">
                    <input 
                        type="text"
                        placeholder="Wizard Username"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Magic Key (Password)"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                        required
                    />
                    <input 
                        type="text"
                        placeholder="Security Question (e.g. First Wand?)"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})}
                        required
                    />
                    <input 
                        type="text"
                        placeholder="Secret Answer"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})}
                        required
                    />
                    <button className="w-full bg-blue-600 text-white font-cinzel tracking-widest py-5 rounded-2xl shadow-2xl hover:bg-blue-500 transition-all font-black">
                        BIND OATH
                    </button>
                </form>

                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[11px] text-blue-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Sanctuary
                </button>
            </div>
        </div>
    );

    // Added missing render function for ADMIN_RESET view
    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-blue-950 rounded-3xl flex items-center justify-center text-blue-400 shadow-2xl border border-blue-900">
                        <RefreshCw className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="font-cinzel text-3xl font-black text-blue-100 mb-2 uppercase tracking-tight">Restore Key</h2>
                <p className="font-magic text-[12px] text-blue-400 uppercase tracking-widest mb-10 font-bold">Recall the ancient secret</p>
                
                <form onSubmit={handleAdminReset} className="space-y-4 text-left mb-10">
                    <input 
                        type="text"
                        placeholder="Wizard Username"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setResetForm({...resetForm, username: e.target.value})}
                        required
                    />
                    <input 
                        type="text"
                        placeholder="Security Answer"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="New Magic Key"
                        className="w-full bg-slate-900/80 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white font-bold"
                        onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})}
                        required
                    />
                    <button className="w-full bg-blue-600 text-white font-cinzel tracking-widest py-5 rounded-2xl shadow-2xl hover:bg-blue-500 transition-all font-black">
                        REFORGE KEY
                    </button>
                </form>

                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[11px] text-blue-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Sanctuary
                </button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mt-10 mb-10 flex items-center justify-between">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl p-1 shadow-xl border-2 border-blue-900/50">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="text-center">
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Ethereal Snacker</p>
                        <h1 className="font-cinzel text-2xl font-black text-white">Member Hall</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-4 bg-slate-900/50 text-blue-400 rounded-2xl shadow-lg border border-blue-900/50 hover:bg-slate-800 transition-colors">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-12">
                    <MembershipCard customer={currentCustomer} />
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setPreviewCustomer(currentCustomer)}
                            className="glass-panel rounded-2xl py-5 flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 text-blue-200 font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        >
                            <Download className="w-5 h-5 text-cyan-400" /> Save Card
                        </button>
                        <button className="glass-panel rounded-2xl py-5 flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 text-blue-200 font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
                            <Share2 className="w-5 h-5 text-blue-500" /> Spread Joy
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <h3 className="font-cinzel text-lg font-black text-white tracking-widest uppercase">Arcane Collection</h3>
                    </div>
                    <div className="glass-panel rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-12 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">STAMP ORBS</p>
                                <p className="text-xs text-blue-100 font-bold">{5 - currentCustomer.stamps} to Free Reward!</p>
                            </div>
                            <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/50">{currentCustomer.stamps} / 5</div>
                        </div>
                        <div className="grid grid-cols-5 gap-y-16 gap-x-3 justify-items-center relative z-10">
                            {[...Array(5)].map((_, i) => (
                                <MagicOrb key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                    </div>
                </div>

                {currentCustomer.stamps === 5 && (
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-white/20 animate-pulse">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Snack Victory</p>
                            <p className="text-xl font-cinzel font-black">FREE REWARD UNLOCKED</p>
                        </div>
                    </div>
                )}

                <div className="text-center opacity-30 py-8">
                    <p className="text-[10px] text-blue-400 font-black tracking-[0.5em] uppercase">Mithran Magic Corner • Est 2024</p>
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
            <div className="min-h-screen bg-[#020617] p-6 text-slate-200">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl p-1 shadow-lg border border-blue-900">
                                <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <div>
                                <h1 className="font-cinzel text-3xl font-black text-white">ARCANE HUB</h1>
                                <p className="text-[10px] text-blue-400 uppercase tracking-[0.4em] font-black">Wizard: {adminUser?.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setView('ADMIN_DASHBOARD')} className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ADMIN_DASHBOARD' ? 'bg-blue-600 text-white shadow-2xl' : 'bg-slate-900 text-blue-200 border border-blue-900'}`}>Active Magic</button>
                            <button onClick={() => setView('ADMIN_HISTORY')} className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ADMIN_HISTORY' ? 'bg-blue-600 text-white shadow-2xl' : 'bg-slate-900 text-blue-200 border border-blue-900'}`}>Vault</button>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-4 bg-red-950 text-red-400 rounded-2xl border border-red-900 shadow-sm"><LogOut className="w-6 h-6" /></button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="glass-panel rounded-[3rem] p-10 shadow-2xl">
                                <h3 className="font-cinzel text-xl font-black text-white mb-8 flex items-center gap-3"><UserPlus className="w-6 h-6 text-blue-400" /> Enroll</h3>
                                <form onSubmit={handleAddCustomer} className="space-y-6">
                                    <input type="text" placeholder="Magician Name" className="w-full bg-slate-950 border border-blue-900 rounded-2xl px-6 py-5 outline-none focus:border-blue-500 font-bold text-white" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                    <input type="tel" placeholder="Mobile Crystal" className="w-full bg-slate-950 border border-blue-900 rounded-2xl px-6 py-5 outline-none focus:border-blue-500 font-bold text-white" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                    <button className="w-full bg-blue-600 text-white font-cinzel py-6 rounded-[2rem] shadow-2xl hover:bg-blue-500 transition-all font-black tracking-widest uppercase text-xs">SUMMON MEMBER</button>
                                </form>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl border border-blue-800/30">
                                <h4 className="font-cinzel text-2xl font-black mb-2">Arcane Scrolls</h4>
                                <p className="text-sm text-blue-200 mb-8 leading-relaxed">Download a magical archive of all recorded magicians.</p>
                                <button onClick={exportCSV} className="w-full bg-white text-blue-900 font-black text-[11px] py-5 rounded-2xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                                    <Download className="w-5 h-5"/> Download CSV
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 h-full">
                            <div className="glass-panel rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full min-h-[700px]">
                                <div className="p-8 border-b border-white/5 flex items-center gap-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Find member..." 
                                            className="w-full bg-slate-950 border border-blue-900 rounded-[2rem] pl-16 pr-8 py-5 outline-none focus:border-blue-500 text-white font-bold" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                    <button onClick={() => setShowScanner(true)} className="p-5 bg-blue-900/50 text-blue-400 rounded-[1.5rem] border border-blue-800 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-900/50"><Camera className="w-7 h-7"/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900 sticky top-0 text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5 z-10">
                                            <tr>
                                                <th className="px-10 py-6">Magician</th>
                                                <th className="px-10 py-6">Orbs (5)</th>
                                                <th className="px-10 py-6 text-center">Reward</th>
                                                <th className="px-10 py-6 text-right">Arcane</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filtered.map(c => (
                                                <tr key={c.id} className={`${c.is_deleted ? 'opacity-30 grayscale' : ''} hover:bg-blue-900/10 transition-colors group`}>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center font-black text-blue-300 text-lg shadow-xl border border-blue-700">
                                                                {c.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-white text-base">{c.name}</div>
                                                                <div className="text-[10px] text-blue-500 font-black tracking-widest uppercase">{c.customer_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <button onClick={() => updateStamps(c.id, -1)} className="p-3 bg-slate-950 border border-blue-900 rounded-xl text-blue-400 hover:bg-blue-900 transition-all"><Minus className="w-5 h-5"/></button>
                                                            <div className="flex flex-col items-center min-w-[40px]">
                                                                <span className="font-cinzel text-2xl font-black text-white leading-none">{c.stamps}</span>
                                                            </div>
                                                            <button onClick={() => updateStamps(c.id, 1)} className="p-3 bg-slate-950 border border-blue-900 rounded-xl text-blue-400 hover:bg-blue-900 transition-all"><Plus className="w-5 h-5"/></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        {c.stamps === 5 && (
                                                            <button 
                                                                onClick={() => handleRedeem(c.id)}
                                                                className="bg-blue-600 text-white text-[10px] px-5 py-2.5 rounded-full font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all"
                                                            >
                                                                Claim Reward
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                              onClick={() => setPreviewCustomer(c)} 
                                                              className="p-3 text-cyan-400 bg-cyan-900/30 border border-cyan-800 rounded-xl hover:bg-cyan-600 hover:text-white transition-all"
                                                            >
                                                              <CreditCard className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                              onClick={() => view === 'ADMIN_HISTORY' ? handleHardDelete(c.id) : handleSoftDelete(c.id)} 
                                                              className="p-3 text-red-400 bg-red-950/30 border border-red-900 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                            >
                                                              <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ID Card Modal Portal */}
                {previewCustomer && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="max-w-md w-full relative">
                            <button 
                                onClick={() => setPreviewCustomer(null)}
                                className="absolute -top-12 right-0 text-white hover:text-blue-400 transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <div className="mb-8">
                                <MembershipCard customer={previewCustomer} />
                            </div>
                            <div className="text-center space-y-4">
                                <h3 className="font-cinzel text-xl text-white">Magical Identity Scroll</h3>
                                <p className="text-slate-400 text-sm">Save this scroll for the magician's gallery.</p>
                                <button 
                                    onClick={() => { alert('Scroll captured and saved!'); setPreviewCustomer(null); }}
                                    className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" /> CAPTURE SCROLL
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showScanner && <Scanner onScan={(data) => { setSearchQuery(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
            </div>
        );
    };

    return (
        <div className="min-h-screen">
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
