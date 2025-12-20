
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
    X,
    Share
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

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
    const [isSharing, setIsSharing] = useState(false);

    // Secret Door Logic
    const [logoClicks, setLogoClicks] = useState(0);

    // Form states
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');
    const [adminForm, setAdminForm] = useState({ username: '', password: '', securityQuestion: '', securityAnswer: '' });
    const [resetForm, setResetForm] = useState({ username: '', securityAnswer: '', newPassword: '' });

    const refreshCustomerList = async () => {
        setIsSyncing(true);
        try {
            const list = await storageService.fetchCustomers();
            setCustomers(list);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (view === 'ADMIN_DASHBOARD' || view === 'ADMIN_HISTORY') {
            refreshCustomerList();
        }
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

    const handleLogin = async () => {
        setIsSyncing(true);
        try {
            const query = loginInput.trim().toUpperCase();
            const customer = await storageService.findCustomer(query);
            if (customer) {
                setCurrentCustomer(customer);
                setView('CUSTOMER_DASHBOARD');
            } else {
                alert('Wizard ID not found in the mystical archives!');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const admin = await storageService.findAdmin(adminForm.username);
            if (admin && admin.password === adminForm.password) {
                setAdminUser(admin);
                setView('ADMIN_DASHBOARD');
            } else {
                alert('Arcane key invalid!');
            }
        } finally {
            setIsSyncing(false);
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
        const admin = await storageService.findAdmin(resetForm.username);
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
        try {
            const newMember = await storageService.addCustomer(newName, newMobile);
            setNewName('');
            setNewMobile('');
            await refreshCustomerList();
            alert(`New Magician: ${newMember.name} enrolled! ID: ${newMember.customer_id}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const updateStamps = async (id: number, delta: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        let newStamps = Math.min(Math.max(customer.stamps + delta, 0), 5);
        
        setIsSyncing(true);
        try {
            await storageService.updateCustomer(id, { 
                stamps: newStamps,
                lifetime_stamps: delta > 0 ? customer.lifetime_stamps + 1 : customer.lifetime_stamps
            });
            await refreshCustomerList();
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRedeem = async (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        
        setIsSyncing(true);
        try {
            await storageService.updateCustomer(id, {
                stamps: 0,
                redeems: customer.redeems + 1
            });
            await refreshCustomerList();
            alert('Free Snack Granted! Dragon Balls reset.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleShareCard = async (customer: Customer) => {
        const node = document.getElementById('membership-card');
        if (!node) return;

        setIsSharing(true);
        try {
            const dataUrl = await htmlToImage.toPng(node, {
                quality: 1,
                pixelRatio: 2,
                cacheBust: true,
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `mithran-id-${customer.customer_id}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Mithran Magic ID - ${customer.name}`,
                    text: `My Mithran membership ID: ${customer.customer_id}.`,
                });
            } else {
                const link = document.createElement('a');
                link.download = `mithran-id-${customer.customer_id}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            alert('Failed to share card.');
        } finally {
            setIsSharing(false);
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
        link.download = `mithran_backup_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 sm:p-6 overflow-hidden relative">
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] sm:w-[32rem] opacity-[0.03] pointer-events-none grayscale brightness-200 blur-sm" alt="" />
            <div className="glass-card w-full max-w-sm sm:max-w-md p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <button onClick={handleLogoClick} className="mb-6 sm:mb-10 flex justify-center group active:scale-90 transition-all">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-1.5 border-2 border-blue-500/40 overflow-hidden shadow-2xl relative">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-[1.4rem] sm:rounded-[1.8rem] group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </button>
                <h1 className="font-cinzel text-4xl sm:text-6xl font-black text-white mb-1 sm:mb-2 tracking-tighter">MITHRAN</h1>
                <p className="font-magic text-[10px] sm:text-sm tracking-[0.4em] sm:tracking-[0.5em] text-cyan-400 mb-8 sm:mb-14 uppercase font-bold opacity-90">Blue Fantasy Lounge</p>
                <div className="space-y-6 sm:space-y-8 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest ml-3 opacity-70">Arcane Access Key</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="ID or Mobile" 
                                className="w-full bg-slate-950/50 border-2 border-blue-900/50 rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-4 sm:py-6 focus:border-cyan-500/50 outline-none text-white font-bold text-lg sm:text-xl transition-all" 
                                value={loginInput} 
                                onChange={(e) => setLoginInput(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-blue-900/80 text-cyan-400 rounded-xl sm:rounded-2xl hover:bg-blue-600 active:scale-90 transition-all"><QrCode className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogin} 
                        disabled={isSyncing}
                        className="w-full btn-magic text-white font-cinzel py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black tracking-widest uppercase flex items-center justify-center gap-3 sm:gap-4 shadow-xl border border-blue-400/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSyncing ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />} Manifest Portal
                    </button>
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 relative">
            <div className="glass-card w-full max-w-sm p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] text-center relative z-10 animate-in slide-in-from-bottom-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-blue-500/20 p-2 shadow-2xl">
                    <img src={COMPANY_LOGO} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h2 className="font-cinzel text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10 tracking-tight">Staff Sanctum</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4 sm:space-y-5 mb-8">
                    <input type="text" placeholder="Wizard Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} />
                    <input type="password" placeholder="Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 focus:border-cyan-500 outline-none" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} />
                    <button className="w-full btn-magic text-white font-cinzel py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50" disabled={isSyncing}>
                         {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : null} Authorize Entry
                    </button>
                </form>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-500/60 mb-8">
                    <button onClick={() => setView('ADMIN_REGISTER')} className="hover:text-cyan-400">Enlist</button>
                    <button onClick={() => setView('ADMIN_RESET')} className="hover:text-cyan-400">Forgot Key?</button>
                </div>
                <button onClick={() => setView('LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 relative">
            <div className="glass-card w-full max-w-sm p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] text-center relative z-10 animate-in slide-in-from-bottom-8">
                <h2 className="font-cinzel text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10 tracking-tight">Staff Enlistment</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4 sm:space-y-5 mb-8">
                    <input type="text" placeholder="Wizard Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} required />
                    <input type="password" placeholder="Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} required />
                    <input type="text" placeholder="Security Question" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})} required />
                    <input type="text" placeholder="Security Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})} required />
                    <button className="w-full btn-magic text-white font-cinzel py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50" disabled={isSyncing}>
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null} Enlist Staff
                    </button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back to Sanctuary</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 relative">
            <div className="glass-card w-full max-w-sm p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] text-center relative z-10 animate-in slide-in-from-bottom-8">
                <h2 className="font-cinzel text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10 tracking-tight">Restore Arcane Key</h2>
                <form onSubmit={handleAdminReset} className="space-y-4 sm:space-y-5 mb-8">
                    <input type="text" placeholder="Wizard Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setResetForm({...resetForm, username: e.target.value})} required />
                    <input type="text" placeholder="Security Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})} required />
                    <input type="password" placeholder="New Arcane Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white font-bold placeholder:text-blue-900 outline-none" onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})} required />
                    <button className="w-full btn-magic text-white font-cinzel py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50" disabled={isSyncing}>
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null} Restore Access
                    </button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-[100dvh] p-4 pb-20 max-w-lg mx-auto animate-in fade-in duration-1000 relative">
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 opacity-[0.04] pointer-events-none grayscale brightness-200" alt="" />
                <div className="mt-4 sm:mt-8 mb-6 sm:mb-10 flex items-center justify-between relative z-10">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-blue-500/30">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="text-center">
                        <p className="text-cyan-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Exclusive Rewards</p>
                        <h1 className="font-cinzel text-lg sm:text-2xl font-black text-white tracking-tight">Portal Hub</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 sm:p-4 bg-slate-900/60 text-blue-400 rounded-xl sm:rounded-2xl border border-blue-900/50 hover:bg-red-900/20 active:scale-90 transition-all">
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
                <div className="mb-8 sm:mb-14 relative z-10">
                    <MembershipCard customer={currentCustomer} />
                    <div className="mt-6 flex justify-center">
                        <button 
                            disabled={isSharing}
                            onClick={() => handleShareCard(currentCustomer)} 
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:text-cyan-400 bg-white/5 px-6 py-3 rounded-xl border border-white/5 disabled:opacity-50 transition-all"
                        >
                            {isSharing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4"/>} 
                            Share Pass
                        </button>
                    </div>
                </div>
                <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden z-10 border border-blue-400/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-8 sm:mb-12">
                        <div>
                            <h3 className="font-cinzel text-base sm:text-xl font-black text-white mb-0.5 sm:mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> DRAGON BALLS</h3>
                            <p className="text-[9px] sm:text-[11px] text-blue-300/80 font-bold uppercase tracking-widest">{5 - currentCustomer.stamps} to gift</p>
                        </div>
                        <div className="bg-blue-600/20 px-3 py-1 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-black border border-blue-500/30 text-blue-100 whitespace-nowrap">
                            {currentCustomer.stamps} / 5
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-1 sm:px-2">
                        {[...Array(5)].map((_, i) => (
                            <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => 
            !c.is_deleted && (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery) || c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return (
            <div className="min-h-[100dvh] p-4 sm:p-6 bg-[#020617] text-slate-200 relative flex flex-col">
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] sm:w-[40rem] opacity-[0.02] pointer-events-none grayscale brightness-200 blur-md" alt="" />
                <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 gap-6 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 rounded-xl border-2 border-blue-900/50 p-1 shadow-xl">
                            <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div>
                            <h1 className="font-cinzel text-2xl sm:text-4xl font-black text-white tracking-tighter">HUB</h1>
                            <p className="text-[9px] sm:text-[11px] text-cyan-400 uppercase font-black tracking-widest">{adminUser?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={exportCSV} className="flex-1 sm:flex-none bg-slate-900 border border-blue-900/50 px-4 sm:px-8 py-3 sm:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-900 transition-all">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-3 sm:p-4 bg-red-950/20 text-red-500 border border-red-900/50 rounded-xl active:scale-90 transition-all"><LogOut className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                    </div>
                </header>
                <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 relative z-10 flex-1 overflow-hidden">
                    <div className="glass-card rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 h-fit shadow-2xl border border-blue-400/10">
                        <h3 className="font-cinzel text-lg sm:text-2xl font-black text-white mb-6 sm:mb-8 flex items-center gap-3">
                            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" /> Summon
                        </h3>
                        <form onSubmit={handleAddCustomer} className="space-y-4 sm:space-y-6">
                            <input type="text" placeholder="Magician Name" className="w-full bg-slate-950/80 border-2 border-blue-900/30 rounded-xl sm:rounded-2xl px-5 py-4 sm:py-5 text-white font-bold placeholder-blue-900/50 focus:border-cyan-500 outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            <input type="tel" placeholder="Mobile Crystal" className="w-full bg-slate-950/80 border-2 border-blue-900/30 rounded-xl sm:rounded-2xl px-5 py-4 sm:py-5 text-white font-bold placeholder-blue-900/50 focus:border-cyan-500 outline-none" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                            <button className="w-full btn-magic text-white py-4 sm:py-6 rounded-xl sm:rounded-3xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest mt-2 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Enlist
                            </button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 glass-card rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden flex flex-col min-h-[400px] sm:min-h-[650px] shadow-2xl border border-blue-400/10 mb-8">
                        <div className="p-4 sm:p-8 border-b border-blue-900/20 flex items-center gap-3 sm:gap-6 bg-slate-900/20">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
                                <input type="text" placeholder="Search members..." className="w-full bg-slate-950/60 border-2 border-blue-900/30 rounded-xl sm:rounded-[2rem] pl-10 sm:pl-16 pr-4 py-3 sm:py-5 text-white placeholder-blue-900/40 outline-none text-sm sm:text-lg font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <button onClick={() => setShowScanner(true)} className="p-3 sm:p-5 bg-blue-900/30 text-cyan-400 rounded-xl sm:rounded-2xl border border-blue-700/50 shadow-xl active:scale-90 transition-all"><Camera className="w-5 h-5 sm:w-8 sm:h-8"/></button>
                        </div>
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[600px] sm:min-w-0">
                                <thead className="bg-slate-900 sticky top-0 text-[8px] sm:text-[10px] text-blue-400 font-black uppercase tracking-widest border-b border-blue-900/30 z-20">
                                    <tr>
                                        <th className="px-6 sm:px-10 py-4 sm:py-7">Member</th>
                                        <th className="px-6 sm:px-10 py-4 sm:py-7">Stamps</th>
                                        <th className="px-6 sm:px-10 py-4 sm:py-7 text-center">Reward</th>
                                        <th className="px-6 sm:px-10 py-4 sm:py-7 text-right">Arcane</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-900/10">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-900/5 transition-colors">
                                            <td className="px-6 sm:px-10 py-4 sm:py-8">
                                                <div className="font-black text-white text-sm sm:text-lg tracking-tight">{c.name}</div>
                                                <div className="text-[8px] sm:text-[10px] text-blue-500/80 font-black tracking-widest uppercase">{c.customer_id}</div>
                                            </td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-8">
                                                <div className="flex items-center gap-3 sm:gap-6">
                                                    <button onClick={() => updateStamps(c.id, -1)} className="p-2 sm:p-3 bg-slate-950 border border-blue-900/50 rounded-lg sm:rounded-xl text-blue-500 active:scale-90 transition-all" disabled={isSyncing}><Minus className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                                                    <span className="font-cinzel text-xl sm:text-3xl font-black text-white">{c.stamps}</span>
                                                    <button onClick={() => updateStamps(c.id, 1)} className="p-2 sm:p-3 bg-slate-950 border border-blue-900/50 rounded-lg sm:rounded-xl text-blue-500 active:scale-90 transition-all" disabled={isSyncing}><Plus className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                                                </div>
                                            </td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-8 text-center">
                                                {c.stamps === 5 ? (
                                                    <button onClick={() => handleRedeem(c.id)} className="bg-cyan-600 text-white text-[8px] sm:text-[10px] px-3 sm:px-6 py-1.5 sm:py-3 rounded-full font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-50" disabled={isSyncing}>Claim</button>
                                                ) : (
                                                    <div className="w-16 sm:w-32 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden">
                                                        <div className="h-full bg-blue-600" style={{ width: `${(c.stamps/5)*100}%` }}></div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-8 text-right">
                                                <div className="flex justify-end gap-2 sm:gap-4">
                                                    <button onClick={() => setPreviewCustomer(c)} className="p-2 sm:p-3 text-cyan-400 hover:text-white transition-all"><CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                                    <button onClick={async () => { if(confirm('Delete?')) { await storageService.deleteCustomerSoft(c.id); await refreshCustomerList(); } }} className="p-2 sm:p-3 text-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
                {previewCustomer && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="max-w-sm w-full relative animate-in zoom-in duration-300">
                            <button onClick={() => setPreviewCustomer(null)} className="absolute -top-12 right-0 text-white p-2 active:scale-90"><X className="w-8 h-8" /></button>
                            <MembershipCard customer={previewCustomer} />
                            <div className="mt-8 text-center space-y-4">
                                <h3 className="font-cinzel text-xl text-white tracking-widest uppercase">ID SCROLL</h3>
                                <div className="flex flex-col gap-3">
                                    <button 
                                        disabled={isSharing}
                                        onClick={() => handleShareCard(previewCustomer)} 
                                        className="btn-magic py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50"
                                    >
                                        {isSharing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share Identity
                                    </button>
                                    <button onClick={() => setPreviewCustomer(null)} className="bg-slate-900 border border-blue-900/50 py-4 rounded-xl text-blue-300 font-black uppercase text-[10px] tracking-widest">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-[100dvh]">
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
