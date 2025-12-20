
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
    CreditCard
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import MagicOrb from './components/MagicOrb';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';

/** 
 * HOW TO UPLOAD LOGO TO GITHUB:
 * 1. Upload your PNG to a GitHub repository.
 * 2. Click on the file, then click the "Raw" button.
 * 3. Copy that URL and paste it below in COMPANY_LOGO.
 */
const COMPANY_LOGO = "https://img.freepik.com/premium-vector/chef-boy-cartoon-mascot-logo-design_188253-3801.jpg";

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [adminUser, setAdminUser] = useState<Admin | null>(null);
    const [loginInput, setLoginInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
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
        // Limit to 5 stamps (4 paid + 1 free)
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

    const handleMagicalDownload = (customerName: string = "Member") => {
        alert(`Casting capture spell... The Magic ID for ${customerName} has been saved to your scrolls!`);
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                
                {/* Secret Door Logo - Counts removed as requested */}
                <button 
                  onClick={handleLogoClick}
                  className="mb-8 flex justify-center group active:scale-90 transition-transform relative"
                >
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-2xl border-4 border-pink-200 overflow-hidden">
                        <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-2xl group-hover:rotate-6 transition-transform" />
                    </div>
                </button>

                <h1 className="font-cinzel text-5xl font-black text-blue-900 mb-1 tracking-tighter">MITHRAN</h1>
                <p className="font-magic text-sm tracking-[0.5em] text-pink-500 mb-12 uppercase font-bold opacity-80">Magic Lounge</p>
                
                <div className="space-y-6 mb-12 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-2">Your Magic Pass</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="MSC ID or Mobile"
                                className="w-full bg-white/80 border-2 border-pink-100 rounded-3xl px-8 py-6 focus:ring-8 focus:ring-pink-400/10 focus:border-pink-400 outline-none transition-all placeholder:text-blue-200 font-bold text-lg"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-4 top-4 p-3 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-2xl shadow-xl shadow-pink-200">
                                <QrCode className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogin} 
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-cinzel tracking-[0.3em] py-6 rounded-[2rem] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-sm font-black"
                    >
                        <Sparkles className="w-5 h-5 animate-pulse" /> ENTER KINGDOM
                    </button>
                </div>
                
                <div className="flex justify-center gap-4 opacity-50">
                    {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-pink-300 animate-pulse" style={{ animationDelay: `${i*0.3}s` }}></div>)}
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500 border-indigo-200">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-indigo-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/30">
                        <Lock className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="font-cinzel text-3xl font-black text-indigo-900 mb-2 uppercase tracking-tight">Staff Portal</h2>
                <p className="font-magic text-[12px] text-indigo-400 uppercase tracking-widest mb-10 font-bold">Wizards Only Area</p>
                
                <form onSubmit={handleAdminLogin} className="space-y-5 text-left mb-10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-3">Wizard ID</label>
                        <input 
                            type="text"
                            className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 font-bold"
                            onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-3">Magic Key</label>
                        <input 
                            type="password"
                            className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 font-bold"
                            onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                            required
                        />
                    </div>
                    <button className="w-full bg-indigo-900 text-white font-cinzel tracking-widest py-6 rounded-2xl shadow-2xl shadow-indigo-900/40 hover:bg-black transition-all font-black">
                        UNLOCK PORTAL
                    </button>
                </form>

                <div className="flex flex-col gap-4">
                  <button onClick={() => setView('ADMIN_REGISTER')} className="text-[11px] text-indigo-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Recruit Staff
                  </button>
                  <button onClick={() => setView('ADMIN_RESET')} className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">
                    Forgot Key?
                  </button>
                  <button onClick={() => setView('LOGIN')} className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-4">
                    Return to World
                  </button>
                </div>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500 border-indigo-200">
                <h2 className="font-cinzel text-3xl font-black text-indigo-900 mb-2 uppercase tracking-tight">Recruit Staff</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4 text-left mb-6">
                    <input 
                        type="text" 
                        placeholder="Wizard Name" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Magic Key" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Security Question" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})}
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Security Answer" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})}
                        required 
                    />
                    <button className="w-full bg-indigo-900 text-white font-cinzel tracking-widest py-5 rounded-2xl font-black">RECRUIT</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Back to Portal</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500 border-indigo-200">
                <h2 className="font-cinzel text-3xl font-black text-indigo-900 mb-2 uppercase tracking-tight">Restore Magic</h2>
                <form onSubmit={handleAdminReset} className="space-y-4 text-left mb-6">
                    <input 
                        type="text" 
                        placeholder="Wizard Name" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setResetForm({...resetForm, username: e.target.value})}
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Security Answer" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="New Magic Key" 
                        className="w-full bg-white/80 border-2 border-indigo-100 rounded-2xl px-6 py-4 outline-none font-bold"
                        onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})}
                        required 
                    />
                    <button className="w-full bg-indigo-900 text-white font-cinzel tracking-widest py-5 rounded-2xl font-black">RESTORE</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Back to Portal</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mt-10 mb-10 flex items-center justify-between">
                    <div className="w-14 h-14 bg-white rounded-2xl p-1 shadow-xl border-2 border-pink-100">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="text-center">
                        <p className="text-pink-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Elite Snacker</p>
                        <h1 className="font-cinzel text-2xl font-black text-blue-900">Member Lounge</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-4 bg-white text-rose-400 rounded-2xl shadow-lg border border-pink-50 hover:bg-rose-50 transition-colors">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-12">
                    <MembershipCard customer={currentCustomer} />
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleMagicalDownload(currentCustomer.name)}
                            className="glass-panel rounded-2xl py-5 flex items-center justify-center gap-3 border border-white hover:bg-white text-blue-900 font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        >
                            <Download className="w-5 h-5 text-pink-500" /> Save Scroll
                        </button>
                        <button className="glass-panel rounded-2xl py-5 flex items-center justify-center gap-3 border border-white hover:bg-white text-blue-900 font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
                            <Share2 className="w-5 h-5 text-indigo-500" /> Spread Joy
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-cinzel text-lg font-black text-blue-900 tracking-widest uppercase">Magic Collection</h3>
                    </div>
                    <div className="glass-panel rounded-[3rem] p-10 border-4 border-white shadow-2xl bg-gradient-to-b from-white to-pink-50/30 relative">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">STAMP ORBS</p>
                                <p className="text-xs text-blue-900 font-bold">{5 - currentCustomer.stamps} to Free Snack!</p>
                            </div>
                            <div className="bg-pink-500 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-pink-200">{currentCustomer.stamps} / 5</div>
                        </div>
                        <div className="grid grid-cols-5 gap-y-16 gap-x-3 justify-items-center">
                            {[...Array(5)].map((_, i) => (
                                <MagicOrb key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-12">
                    {currentCustomer.stamps === 5 && (
                        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-500 text-white p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border-4 border-white animate-pulse">
                            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border-2 border-white/30">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Ultimate Snack Victory</p>
                                <p className="text-xl font-cinzel font-black leading-none text-white">FREE SNACK READY</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center opacity-40 py-8">
                    <p className="text-[10px] text-pink-500 font-black tracking-[0.5em] uppercase">Mithran Magic Corner • Est 2024</p>
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
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg border border-indigo-100">
                                <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <div>
                                <h1 className="font-cinzel text-3xl font-black text-indigo-900">LOYALTY HUB</h1>
                                <p className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-black">Staff Wizard: {adminUser?.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setView('ADMIN_DASHBOARD')} className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ADMIN_DASHBOARD' ? 'bg-indigo-900 text-white shadow-2xl' : 'bg-white text-indigo-900 hover:bg-indigo-50 border border-indigo-50'}`}>Active Magic</button>
                            <button onClick={() => setView('ADMIN_HISTORY')} className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ADMIN_HISTORY' ? 'bg-indigo-900 text-white shadow-2xl' : 'bg-white text-indigo-900 hover:bg-indigo-50 border border-indigo-50'}`}>The Vault</button>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><LogOut className="w-6 h-6" /></button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-4 border-white">
                                <h3 className="font-cinzel text-xl font-black text-indigo-900 mb-8 flex items-center gap-3"><UserPlus className="w-6 h-6 text-indigo-600" /> New Member</h3>
                                <form onSubmit={handleAddCustomer} className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Apprentice Name</label>
                                        <input type="text" placeholder="Name" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 font-bold" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mobile Crystal</label>
                                        <input type="tel" placeholder="Mobile" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 font-bold" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                    </div>
                                    <button className="w-full bg-indigo-600 text-white font-cinzel py-6 rounded-[2rem] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all font-black tracking-[0.2em] uppercase text-xs">ENROLL MAGICIAN</button>
                                </form>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl border-4 border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <Database className="w-8 h-8 text-indigo-300" />
                                    <span className="text-[10px] font-black uppercase bg-white/10 px-4 py-2 rounded-full border border-white/20">Kingdom Secure</span>
                                </div>
                                <h4 className="font-cinzel text-2xl font-black mb-2">Arcane Storage</h4>
                                <p className="text-sm text-indigo-200 mb-8 leading-relaxed">System database is currently localized to this device scroll.</p>
                                <button onClick={exportCSV} className="w-full bg-white text-indigo-900 font-black text-[11px] py-5 rounded-2xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                                    <Download className="w-5 h-5"/> Download Archive
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 h-full">
                            <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col h-full min-h-[700px]">
                                <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-slate-50/50">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Summon member..." 
                                            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-400 shadow-sm font-bold" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                    <button onClick={() => setShowScanner(true)} className="p-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-100"><Camera className="w-7 h-7"/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/80 sticky top-0 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 z-10">
                                            <tr>
                                                <th className="px-10 py-6">Member Profile</th>
                                                <th className="px-10 py-6">Orbs (Max 5)</th>
                                                <th className="px-10 py-6 text-center">Reward</th>
                                                <th className="px-10 py-6 text-right">Magic Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filtered.map(c => (
                                                <tr key={c.id} className={`${c.is_deleted ? 'opacity-40 grayscale bg-slate-100' : ''} hover:bg-indigo-50/40 transition-colors group`}>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-xl group-hover:scale-110 transition-transform">
                                                                {c.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-indigo-900 text-base">{c.name}</div>
                                                                <div className="text-[10px] text-pink-500 font-black tracking-widest uppercase mt-1">{c.customer_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <button onClick={() => updateStamps(c.id, -1)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"><Minus className="w-5 h-5"/></button>
                                                            <div className="flex flex-col items-center min-w-[40px]">
                                                                <span className="font-cinzel text-2xl font-black text-indigo-900 leading-none">{c.stamps}</span>
                                                                <span className="text-[9px] text-indigo-300 font-black uppercase tracking-tighter">/ 5</span>
                                                            </div>
                                                            <button onClick={() => updateStamps(c.id, 1)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"><Plus className="w-5 h-5"/></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        <div className="flex flex-col gap-3 items-center">
                                                            {c.stamps === 5 && (
                                                                <button 
                                                                    onClick={() => handleRedeem(c.id)}
                                                                    className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] px-5 py-2.5 rounded-full font-black uppercase tracking-widest shadow-xl shadow-orange-200 active:scale-95 transition-all"
                                                                >
                                                                    Claim 5th Free
                                                                </button>
                                                            )}
                                                            {c.stamps < 5 && <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Collecting...</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                              onClick={() => handleMagicalDownload(c.name)} 
                                                              title="Download Magic ID"
                                                              className="p-3 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                                            >
                                                              <CreditCard className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                              onClick={() => view === 'ADMIN_HISTORY' ? handleHardDelete(c.id) : handleSoftDelete(c.id)} 
                                                              className={`p-3 rounded-xl transition-all ${view === 'ADMIN_HISTORY' ? 'text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white' : 'text-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-600'}`}
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
                {showScanner && <Scanner onScan={(data) => { setSearchQuery(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
            </div>
        );
    };

    return (
        <div className="min-h-screen text-slate-900">
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
