
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

/**
 * --- LOGO USAGE ---
 * Using the 'logo.png' uploaded to the root directory.
 */
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

    const handleAdminRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const success = storageService.addAdmin(adminForm);
        if (success) {
            alert('New staff recruited!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Wizard name already exists!');
        }
    };

    const handleAdminReset = (e: React.FormEvent) => {
        e.preventDefault();
        const admin = storageService.findAdmin(resetForm.username);
        if (admin && admin.securityAnswer === resetForm.securityAnswer) {
            storageService.updateAdminPassword(resetForm.username, resetForm.newPassword);
            alert('Magical key restored!');
            setView('ADMIN_LOGIN');
        } else {
            alert('Security check failed!');
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
        link.download = `mithran_magic_backup_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden relative">
            {/* Background Watermark Logo */}
            <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 opacity-5 pointer-events-none grayscale brightness-200" alt="" />
            
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center relative z-10 animate-in fade-in duration-700">
                <button 
                  onClick={handleLogoClick}
                  className="mb-8 flex justify-center active:scale-95 transition-transform"
                >
                    <div className="w-28 h-28 bg-slate-900/50 rounded-3xl p-1 border-2 border-blue-500/30 overflow-hidden shadow-2xl">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-2xl" />
                    </div>
                </button>

                <h1 className="font-cinzel text-5xl font-black text-white mb-1 tracking-tighter">MITHRAN</h1>
                <p className="font-magic text-sm tracking-[0.4em] text-cyan-400 mb-12 uppercase font-bold opacity-80">Blue Fantasy Lounge</p>
                
                <div className="space-y-6 text-left mb-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest ml-2">Passcode</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="ID or Mobile"
                                className="w-full bg-slate-900/40 border border-blue-900 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-blue-500/10 focus:border-cyan-500 outline-none text-white font-bold text-lg transition-all"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-cyan-400">
                                <QrCode className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogin} 
                        className="w-full btn-magic text-white font-cinzel py-5 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl"
                    >
                        <Sparkles className="w-4 h-4" /> Enter Sanctum
                    </button>
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
             <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 opacity-5 pointer-events-none grayscale brightness-200" alt="" />
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500 relative z-10">
                <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-6 border border-blue-500/20 shadow-lg">
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="font-cinzel text-3xl font-black text-white mb-8">Admin Access</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4 mb-6">
                    <input type="text" placeholder="Wizard Name" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white font-bold" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} />
                    <input type="password" placeholder="Arcane Key" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white font-bold" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} />
                    <button className="w-full btn-magic text-white font-cinzel py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Authorize</button>
                </form>
                <div className="flex flex-col gap-2">
                    <button onClick={() => setView('ADMIN_REGISTER')} className="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-cyan-400">Recruit Staff</button>
                    <button onClick={() => setView('ADMIN_RESET')} className="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-cyan-400">Forgotten Key?</button>
                    <button onClick={() => setView('LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-4">Return Home</button>
                </div>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500">
                <h2 className="font-cinzel text-3xl font-black text-white mb-6">Recruit Staff</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4 mb-6">
                    <input type="text" placeholder="Wizard Name" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} />
                    <input type="password" placeholder="Key" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} />
                    <input type="text" placeholder="Security Q" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white" onChange={(e) => setAdminForm({...adminForm, securityQuestion: e.target.value})} />
                    <input type="text" placeholder="Answer" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white" onChange={(e) => setAdminForm({...adminForm, securityAnswer: e.target.value})} />
                    <button className="w-full btn-magic text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Register</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-xs text-blue-400">Back</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] text-center animate-in slide-in-from-bottom-8 duration-500">
                <h2 className="font-cinzel text-3xl font-black text-white mb-6">Restore Access</h2>
                <form onSubmit={handleAdminReset} className="space-y-4 mb-6">
                    <input type="text" placeholder="Wizard Name" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white font-bold" value={resetForm.username} onChange={(e) => setResetForm({...resetForm, username: e.target.value})} required />
                    <input type="text" placeholder="Security Answer" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white font-bold" value={resetForm.securityAnswer} onChange={(e) => setResetForm({...resetForm, securityAnswer: e.target.value})} required />
                    <input type="password" placeholder="New Arcane Key" className="w-full bg-slate-900 border border-blue-900 rounded-2xl px-6 py-4 text-white font-bold" value={resetForm.newPassword} onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})} required />
                    <button className="w-full btn-magic text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Reset Key</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-xs text-blue-400">Back</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto animate-in fade-in duration-1000 relative">
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 opacity-5 pointer-events-none grayscale brightness-200" alt="" />
                
                <div className="mt-10 mb-8 flex items-center justify-between relative z-10">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl p-1 border border-blue-500/30 shadow-xl">
                        <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="text-center">
                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1">Mithran Loyalty</p>
                        <h1 className="font-cinzel text-xl font-black text-white">Member Sanctum</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-slate-900/50 text-blue-400 rounded-xl border border-blue-900/50 hover:bg-slate-800 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-10 relative z-10">
                    <MembershipCard customer={currentCustomer} />
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden z-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="font-cinzel text-lg font-black text-white mb-1">DRAGON BALLS</h3>
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{5 - currentCustomer.stamps} More for Reward!</p>
                        </div>
                        <div className="bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg">{currentCustomer.stamps} / 5</div>
                    </div>
                    <div className="flex justify-between gap-2">
                        {[...Array(5)].map((_, i) => (
                            <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                        ))}
                    </div>
                </div>

                {currentCustomer.stamps === 5 && (
                    <div className="mt-8 bg-gradient-to-br from-blue-600 to-cyan-700 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl border border-cyan-400/30 animate-pulse relative z-10">
                        <Trophy className="w-10 h-10 text-white" />
                        <div>
                            <p className="text-xs font-black uppercase text-blue-200">Victory!</p>
                            <h4 className="font-cinzel text-xl font-black text-white uppercase tracking-tight">Free Snack Ready</h4>
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
                <img src={COMPANY_LOGO} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 opacity-5 pointer-events-none grayscale brightness-200" alt="" />
                
                <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl border border-blue-900 p-1 shadow-lg">
                            <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div>
                            <h1 className="font-cinzel text-2xl font-black text-white tracking-tighter">ARCANE HUB</h1>
                            <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Wizard: {adminUser?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportCSV} className="bg-slate-900 border border-blue-900 px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-950 transition-colors shadow-lg">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-3 bg-red-950/30 text-red-400 border border-red-900 rounded-xl shadow-lg hover:bg-red-900/50 transition-colors"><LogOut className="w-5 h-5" /></button>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    <div className="glass-card rounded-[2.5rem] p-8 h-fit shadow-2xl">
                        <h3 className="font-cinzel text-xl font-black text-white mb-6 flex items-center gap-3">
                            <UserPlus className="w-6 h-6 text-cyan-400" /> New Member
                        </h3>
                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full bg-slate-950 border border-blue-900 rounded-xl px-4 py-4 text-white font-bold placeholder-blue-900/50" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            <input type="tel" placeholder="Mobile" className="w-full bg-slate-950 border border-blue-900 rounded-xl px-4 py-4 text-white font-bold placeholder-blue-900/50" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                            <button className="w-full btn-magic text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 shadow-lg">Summon Magician</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-slate-900/30">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search magical archives..." 
                                    className="w-full bg-slate-950 border border-blue-900 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-blue-900/50" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                            </div>
                            <button onClick={() => setShowScanner(true)} className="p-4 bg-blue-900/50 text-cyan-400 rounded-xl border border-blue-800 shadow-lg"><Camera className="w-6 h-6"/></button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 sticky top-0 text-[10px] text-blue-400 font-black uppercase tracking-widest border-b border-blue-900/20">
                                    <tr>
                                        <th className="px-8 py-5">Magician</th>
                                        <th className="px-8 py-5">Stamps</th>
                                        <th className="px-8 py-5 text-center">Reward</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-blue-900/10 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="font-black text-white">{c.name}</div>
                                                <div className="text-[10px] text-blue-500 font-black">{c.customer_id}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => updateStamps(c.id, -1)} className="p-2 bg-slate-900 border border-blue-900 rounded-lg text-blue-400 hover:bg-blue-800 transition-colors"><Minus className="w-4 h-4"/></button>
                                                    <span className="font-cinzel text-xl font-black text-white min-w-[20px] text-center">{c.stamps}</span>
                                                    <button onClick={() => updateStamps(c.id, 1)} className="p-2 bg-slate-900 border border-blue-900 rounded-lg text-blue-400 hover:bg-blue-800 transition-colors"><Plus className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {c.stamps === 5 && (
                                                    <button onClick={() => handleRedeem(c.id)} className="bg-cyan-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg">Claim</button>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setPreviewCustomer(c)} className="p-2.5 text-cyan-400 bg-cyan-900/30 border border-cyan-800 rounded-lg hover:bg-cyan-800 transition-colors shadow-sm"><CreditCard className="w-4 h-4" /></button>
                                                    <button onClick={() => { if(confirm('Archive?')) storageService.deleteCustomerSoft(c.id); setCustomers(storageService.getCustomers()); }} className="p-2.5 text-red-400 bg-red-900/30 border border-red-900 rounded-lg hover:bg-red-800 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Magical ID Preview Modal */}
                {previewCustomer && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
                        <div className="max-w-md w-full relative animate-in zoom-in duration-300">
                            <button onClick={() => setPreviewCustomer(null)} className="absolute -top-12 right-0 text-white hover:text-cyan-400"><X className="w-8 h-8" /></button>
                            <MembershipCard customer={previewCustomer} />
                            <div className="mt-8 text-center space-y-4">
                                <h3 className="font-cinzel text-xl text-white">Arcane Identity Scroll</h3>
                                <button onClick={() => { alert('ID Scroll saved to library!'); setPreviewCustomer(null); }} className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-2xl">
                                    <Download className="w-5 h-5" /> CAPTURE IDENTITY
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
