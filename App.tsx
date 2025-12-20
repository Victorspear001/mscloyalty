
import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    QrCode, 
    Download, 
    Share2, 
    Plus, 
    Minus, 
    LogOut, 
    Search, 
    Trash2, 
    Database, 
    Camera,
    Trophy,
    ArrowLeft,
    Lock,
    UserPlus,
    RefreshCw,
    Sparkles,
    CreditCard,
    X
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';

const COMPANY_LOGO = "logo.png";

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [adminUser, setAdminUser] = useState<Admin | null>(null);
    const [loginInput, setLoginInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

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
            alert('Wizard ID not found in the mystical archives!');
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(adminForm.username);
        if (admin && admin.password === adminForm.password) {
            setAdminUser(admin);
            setView('ADMIN_DASHBOARD');
        } else {
            alert('Arcane key invalid!');
        }
    };

    const handleAdminRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        const success = await storageService.addAdmin(adminForm);
        setIsSyncing(false);
        if (success) {
            alert('New staff recruited and saved to the scrolls!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Wizard name already exists!');
        }
    };

    const handleAdminReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        const admin = storageService.findAdmin(resetForm.username);
        if (admin && admin.securityAnswer === resetForm.securityAnswer) {
            await storageService.updateAdminPassword(resetForm.username, resetForm.newPassword);
            setIsSyncing(false);
            alert('Magical key restored!');
            setView('ADMIN_LOGIN');
        } else {
            setIsSyncing(false);
            alert('Security check failed!');
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) return;
        setIsSyncing(true);
        const newMember = await storageService.addCustomer(newName, newMobile);
        setIsSyncing(false);
        setNewName('');
        setNewMobile('');
        setCustomers(storageService.getCustomers());
        alert(`New Magician: ${newMember.name} enrolled! ID: ${newMember.customer_id}`);
    };

    const updateStamps = async (id: number, delta: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        let newStamps = Math.min(Math.max(customer.stamps + delta, 0), 5);
        
        setIsSyncing(true);
        await storageService.updateCustomer(id, { 
            stamps: newStamps,
            lifetime_stamps: delta > 0 ? customer.lifetime_stamps + 1 : customer.lifetime_stamps
        });
        setIsSyncing(false);
        setCustomers(storageService.getCustomers());
    };

    const handleRedeem = async (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        
        setIsSyncing(true);
        await storageService.updateCustomer(id, {
            stamps: 0,
            redeems: customer.redeems + 1
        });
        setIsSyncing(false);
        setCustomers(storageService.getCustomers());
        alert('Free Snack Granted! Dragon Balls reset.');
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
        link.download = `mithran_backup_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden relative">
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] opacity-[0.03] pointer-events-none grayscale brightness-200 blur-sm" alt="" />
            
            <div className="glass-card w-full max-w-md p-10 rounded-[4rem] text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000 shadow-[0_0_100px_rgba(30,58,138,0.4)] border border-blue-400/20">
                <button onClick={handleLogoClick} className="mb-10 flex justify-center group active:scale-95 transition-all duration-500">
                    <div className="w-32 h-32 bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-2 border-2 border-blue-500/40 overflow-hidden shadow-2xl relative">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </button>
                <h1 className="font-cinzel text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">MITHRAN</h1>
                <p className="font-magic text-sm tracking-[0.5em] text-cyan-400 mb-14 uppercase font-bold opacity-90">Blue Fantasy Lounge</p>
                <div className="space-y-8 text-left mb-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em] ml-4 opacity-70">Arcane Access Key</label>
                        <div className="relative group">
                            <input type="text" placeholder="ID or Mobile Crystal" className="w-full bg-slate-950/50 border-2 border-blue-900/50 rounded-3xl px-8 py-6 focus:ring-8 focus:ring-blue-500/10 focus:border-cyan-500/50 outline-none text-white font-bold text-xl transition-all duration-500 placeholder:text-blue-900/40" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                            <button onClick={() => setShowScanner(true)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-900/80 text-cyan-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg border border-blue-400/20"><QrCode className="w-6 h-6" /></button>
                        </div>
                    </div>
                    <button onClick={handleLogin} className="w-full btn-magic text-white font-cinzel py-6 rounded-3xl text-sm font-black tracking-[0.2em] uppercase flex items-center justify-center gap-4 shadow-[0_20px_40px_-10px_rgba(29,78,216,0.5)] border border-blue-400/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Sparkles className="w-5 h-5 animate-pulse" /> Manifest Portal
                    </button>
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] opacity-[0.03] pointer-events-none grayscale brightness-200 blur-sm" alt="" />
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-12 duration-700 relative z-10 border border-blue-400/20">
                <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20 p-2 shadow-2xl">
                    <img src={COMPANY_LOGO} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h2 className="font-cinzel text-4xl font-black text-white mb-10 tracking-tight">Staff Sanctum</h2>
                <form onSubmit={handleAdminLogin} className="space-y-5 mb-10">
                    <input type="text" placeholder="Wizard Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-5 text-white font-bold placeholder:text-blue-900 focus:border-cyan-500 outline-none transition-all" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} />
                    <input type="password" placeholder="Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-5 text-white font-bold placeholder:text-blue-900 focus:border-cyan-500 outline-none transition-all" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} />
                    <button className="w-full btn-magic text-white font-cinzel py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl border border-blue-400/20">Authorize Entry</button>
                </form>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-6">
                        <button onClick={() => setView('ADMIN_REGISTER')} className="text-[11px] text-blue-400 font-black uppercase tracking-widest hover:text-cyan-400 transition-colors">Recruit Wizard</button>
                        <button onClick={() => setView('ADMIN_RESET')} className="text-[11px] text-blue-400 font-black uppercase tracking-widest hover:text-cyan-400 transition-colors underline underline-offset-4 decoration-blue-900">Restore Key</button>
                    </div>
                    <button onClick={() => setView('LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-2 hover:text-white transition-all">
                       <ArrowLeft className="w-3 h-3" /> Back to Reality
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] opacity-[0.03] pointer-events-none grayscale brightness-200 blur-sm" alt="" />
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in zoom-in-95 duration-500 border border-blue-400/20 z-10">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl p-1.5 border border-blue-900/50 mx-auto mb-6">
                    <img src={COMPANY_LOGO} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h2 className="font-cinzel text-3xl font-black text-white mb-8">Forge Staff Bond</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4 mb-8">
                    <input type="text" placeholder="New Wizard Name" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} />
                    <input type="password" placeholder="Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} />
                    <input type="text" placeholder="Security Question" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})} />
                    <input type="text" placeholder="Secret Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})} />
                    <button className="w-full btn-magic text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Bind Oath
                    </button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-xs text-blue-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Return to Sanctuary</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] opacity-[0.03] pointer-events-none grayscale brightness-200 blur-sm" alt="" />
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in zoom-in-95 duration-500 border border-blue-400/20 z-10">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl p-1.5 border border-blue-900/50 mx-auto mb-6">
                    <img src={COMPANY_LOGO} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h2 className="font-cinzel text-3xl font-black text-white mb-8">Recall Ancient Key</h2>
                <form onSubmit={handleAdminReset} className="space-y-4 mb-8">
                    <input type="text" placeholder="Wizard Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500 outline-none" value={resetForm.username} onChange={(e) => setResetForm({...resetForm, username: e.target.value})} required />
                    <input type="text" placeholder="Your Secret Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500 outline-none" value={resetForm.securityAnswer} onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})} required />
                    <input type="password" placeholder="New Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-2xl px-6 py-4 text-white font-bold focus:border-cyan-500 outline-none" value={resetForm.newPassword} onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})} required />
                    <button className="w-full btn-magic text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Reforge Key
                    </button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-xs text-blue-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto animate-in fade-in duration-1000 relative">
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 opacity-[0.04] pointer-events-none grayscale brightness-200" alt="" />
                
                <div className="mt-10 mb-10 flex items-center justify-between relative z-10">
                    <div className="w-14 h-14 bg-slate-900/80 backdrop-blur-md rounded-2xl p-1.5 border border-blue-500/30 shadow-2xl">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="text-center">
                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1 drop-shadow-md">Exclusive Rewards</p>
                        <h1 className="font-cinzel text-2xl font-black text-white tracking-tight">Portal Hub</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-4 bg-slate-900/60 text-blue-400 rounded-2xl border border-blue-900/50 hover:bg-red-900/20 hover:text-red-400 transition-all duration-300 shadow-xl backdrop-blur-md">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-14 relative z-10">
                    <MembershipCard customer={currentCustomer} />
                </div>

                <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden z-10 border border-blue-400/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="font-cinzel text-xl font-black text-white mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400" /> DRAGON BALLS</h3>
                            <p className="text-[11px] text-blue-300/80 font-bold uppercase tracking-widest">{5 - currentCustomer.stamps} orbs to summon gift</p>
                        </div>
                        <div className="bg-blue-600/20 px-5 py-2 rounded-full text-[11px] font-black border border-blue-500/30 shadow-lg text-blue-100">
                            {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin inline mr-2" /> : null}
                            {currentCustomer.stamps} / 5
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-2">
                        {[...Array(5)].map((_, i) => (
                            <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                        ))}
                    </div>
                </div>

                {currentCustomer.stamps === 5 && (
                    <div className="mt-10 bg-gradient-to-br from-blue-600 via-indigo-700 to-cyan-800 p-10 rounded-[3rem] flex items-center gap-8 shadow-[0_30px_60px_-15px_rgba(29,78,216,0.5)] border border-cyan-400/40 animate-pulse relative z-10 overflow-hidden group">
                        <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20">
                            <Trophy className="w-12 h-12 text-yellow-300 drop-shadow-2xl" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-blue-100 tracking-[0.3em] mb-1">Epic Milestone</p>
                            <h4 className="font-cinzel text-3xl font-black text-white uppercase tracking-tighter leading-none">Free Snack Ready</h4>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => 
            !c.is_deleted && (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery) || c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return (
            <div className="min-h-screen p-6 bg-[#020617] text-slate-200 relative">
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] opacity-[0.02] pointer-events-none grayscale brightness-200 blur-md" alt="" />
                
                <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-8 relative z-10 pt-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl border-2 border-blue-900/50 p-1.5 shadow-2xl transition-transform hover:rotate-6">
                            <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div>
                            <h1 className="font-cinzel text-4xl font-black text-white tracking-tighter drop-shadow-lg">ARCANE HUB</h1>
                            <p className="text-[11px] text-cyan-400 uppercase font-black tracking-[0.4em] mt-1 drop-shadow-md">Master Wizard: {adminUser?.username}</p>
                        </div>
                    </div>
                    {isSyncing && (
                        <div className="px-4 py-2 bg-blue-900/40 rounded-full border border-blue-400/20 text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2 animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Etching Scrolls...
                        </div>
                    )}
                    <div className="flex gap-4">
                        <button onClick={exportCSV} className="bg-slate-900 border border-blue-900/50 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-900 hover:text-white transition-all shadow-xl backdrop-blur-md">
                            <Download className="w-5 h-5 text-cyan-400" /> Export Archives
                        </button>
                        <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-4 bg-red-950/20 text-red-500 border border-red-900/50 rounded-2xl shadow-xl hover:bg-red-600 hover:text-white transition-all duration-300 backdrop-blur-md"><LogOut className="w-6 h-6" /></button>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                    <div className="glass-card rounded-[3.5rem] p-10 h-fit shadow-2xl border border-blue-400/10">
                        <h3 className="font-cinzel text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <UserPlus className="w-8 h-8 text-cyan-400" /> Summon Member
                        </h3>
                        <form onSubmit={handleAddCustomer} className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 ml-2">Name of Disciple</p>
                                <input type="text" placeholder="Full Name" className="w-full bg-slate-950/80 border-2 border-blue-900/30 rounded-2xl px-6 py-5 text-white font-bold placeholder-blue-900/50 focus:border-cyan-500 outline-none transition-all" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 ml-2">Mobile Crystal</p>
                                <input type="tel" placeholder="Phone Number" className="w-full bg-slate-950/80 border-2 border-blue-900/30 rounded-2xl px-6 py-5 text-white font-bold placeholder-blue-900/50 focus:border-cyan-500 outline-none transition-all" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                            </div>
                            <button className="w-full btn-magic text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] mt-4 shadow-2xl border border-blue-400/10 flex items-center justify-center gap-2">
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Enlist Magician
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 glass-card rounded-[3.5rem] overflow-hidden flex flex-col min-h-[650px] shadow-2xl border border-blue-400/10 backdrop-blur-2xl">
                        <div className="p-8 border-b border-blue-900/20 flex items-center gap-6 bg-slate-900/20 backdrop-blur-md">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input type="text" placeholder="Scry magical archives for members..." className="w-full bg-slate-950/60 border-2 border-blue-900/30 rounded-[2rem] pl-16 pr-8 py-5 text-white placeholder-blue-900/40 focus:border-cyan-500 outline-none transition-all text-lg font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <button onClick={() => setShowScanner(true)} className="p-5 bg-blue-900/30 text-cyan-400 rounded-2xl border border-blue-700/50 shadow-2xl hover:bg-blue-600 hover:text-white transition-all"><Camera className="w-8 h-8"/></button>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 sticky top-0 text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] border-b border-blue-900/30 shadow-sm z-20 backdrop-blur-xl">
                                    <tr>
                                        <th className="px-10 py-7">Magician Identity</th>
                                        <th className="px-10 py-7">Dragon Balls (5)</th>
                                        <th className="px-10 py-7 text-center">Reward Status</th>
                                        <th className="px-10 py-7 text-right">Arcane Tools</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-900/10">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-900/10 transition-colors group/row">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center font-bold text-blue-400 border border-blue-800/40 shadow-inner">{c.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="font-black text-white text-lg tracking-tight">{c.name}</div>
                                                        <div className="text-[10px] text-blue-500/80 font-black tracking-widest uppercase">{c.customer_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <button onClick={() => updateStamps(c.id, -1)} className="p-3 bg-slate-950 border border-blue-900/50 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-90"><Minus className="w-5 h-5"/></button>
                                                    <div className="flex flex-col items-center min-w-[30px]">
                                                       <span className="font-cinzel text-3xl font-black text-white leading-none drop-shadow-md">{c.stamps}</span>
                                                    </div>
                                                    <button onClick={() => updateStamps(c.id, 1)} className="p-3 bg-slate-950 border border-blue-900/50 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-90"><Plus className="w-5 h-5"/></button>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {c.stamps === 5 ? (
                                                    <button onClick={() => handleRedeem(c.id)} className="bg-cyan-600 text-white text-[10px] px-6 py-3 rounded-full font-black uppercase tracking-widest hover:bg-cyan-500 hover:scale-105 transition-all shadow-2xl border border-white/10">Claim Feast</button>
                                                ) : (
                                                    <div className="w-full flex justify-center">
                                                        <div className="w-32 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                            <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(c.stamps/5)*100}%` }}></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-4">
                                                    <button onClick={() => setPreviewCustomer(c)} className="p-3 text-cyan-400 bg-cyan-900/20 border border-cyan-800/40 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-lg"><CreditCard className="w-5 h-5" /></button>
                                                    <button onClick={() => { if(confirm('Exile this magician?')) storageService.deleteCustomerSoft(c.id).then(() => setCustomers(storageService.getCustomers())); }} className="p-3 text-red-500 bg-red-950/20 border border-red-900/40 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Modal remains the same but ensure QR logic is included */}
                {previewCustomer && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="max-w-md w-full relative animate-in zoom-in duration-500">
                            <button onClick={() => setPreviewCustomer(null)} className="absolute -top-16 right-0 text-white hover:text-cyan-400 transition-colors p-2"><X className="w-10 h-10" /></button>
                            <MembershipCard customer={previewCustomer} />
                            <div className="mt-12 text-center space-y-6">
                                <h3 className="font-cinzel text-2xl text-white tracking-widest uppercase drop-shadow-lg">Arcane Identity Scroll</h3>
                                <div className="flex gap-4">
                                    <button onClick={() => setPreviewCustomer(null)} className="flex-1 bg-slate-900 border border-blue-900/50 py-5 rounded-2xl text-blue-300 font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition-all">Close Scroll</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
