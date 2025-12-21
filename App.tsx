
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
    Camera,
    ArrowLeft,
    UserPlus,
    RefreshCw,
    Sparkles,
    CreditCard,
    X,
    Flame
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

// Ensure your file is named logo.png and uploaded to the root directory
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
    const [logoError, setLogoError] = useState(false);

    // Secret Door Logic (Click logo 5 times)
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
        if (view === 'ADMIN_DASHBOARD') {
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
        if (!loginInput.trim()) return;
        setIsSyncing(true);
        try {
            const query = loginInput.trim().toUpperCase();
            const customer = await storageService.findCustomer(query);
            if (customer) {
                setCurrentCustomer(customer);
                setView('CUSTOMER_DASHBOARD');
            } else {
                alert('ID not found in our records!');
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
                alert('Invalid staff credentials!');
            }
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
                pixelRatio: 3,
                cacheBust: true,
            });
            const link = document.createElement('a');
            link.download = `mithran-pass-${customer.customer_id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            alert('Failed to generate image. Try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const LogoImage = ({ className, containerClass }: { className?: string, containerClass?: string }) => (
        <div className={containerClass}>
            {logoError ? (
                <div className={`flex items-center justify-center bg-blue-600/20 rounded-lg ${className}`}>
                    <Flame className="text-blue-400 w-1/2 h-1/2" />
                </div>
            ) : (
                <img 
                    src={COMPANY_LOGO} 
                    alt="Logo" 
                    className={className} 
                    onError={() => setLogoError(true)}
                />
            )}
        </div>
    );

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 sm:p-6 text-center">
            <div className="glass-card w-full max-w-sm sm:max-w-md p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] animate-in fade-in zoom-in-95 duration-700">
                <button onClick={handleLogoClick} className="mb-8 flex justify-center group active:scale-90 transition-all">
                    <LogoImage 
                        containerClass="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-3 border-2 border-blue-500/30 overflow-hidden shadow-2xl"
                        className="w-full h-full object-contain"
                    />
                </button>
                <h1 className="font-cinzel text-4xl sm:text-5xl font-black text-white mb-2 tracking-tighter">MITHRAN</h1>
                <p className="font-magic text-[10px] sm:text-xs tracking-[0.4em] text-cyan-400 mb-10 uppercase font-bold">Blue Fantasy Lounge</p>
                
                <div className="space-y-6 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest ml-3">Access Key</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="MSC ID or Mobile" 
                                className="w-full bg-slate-950/50 border-2 border-blue-900/50 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none text-white font-bold" 
                                value={loginInput} 
                                onChange={(e) => setLoginInput(e.target.value)}
                            />
                            <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-900/80 text-cyan-400 rounded-xl"><QrCode className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogin} 
                        disabled={isSyncing}
                        className="w-full btn-magic text-white font-cinzel py-4 rounded-2xl font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Enter Portal
                    </button>
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
            <div className="glass-card w-full max-w-sm p-8 rounded-[2rem] text-center">
                <LogoImage containerClass="w-16 h-16 bg-slate-900 rounded-xl mx-auto mb-6 p-2 border border-blue-500/20" className="w-full h-full object-contain" />
                <h2 className="font-cinzel text-2xl font-black text-white mb-8 uppercase tracking-widest">Staff Portal</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <input type="text" placeholder="Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl px-4 py-3 text-white font-bold outline-none" onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl px-4 py-3 text-white font-bold outline-none" onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} required />
                    <button className="w-full btn-magic text-white font-cinzel py-4 rounded-xl font-black uppercase tracking-widest text-xs" disabled={isSyncing}>Authorize Access</button>
                </form>
                <div className="mt-8 flex justify-between text-[10px] font-black uppercase text-blue-500/60">
                    <button onClick={() => setView('ADMIN_REGISTER')}>Register</button>
                    <button onClick={() => setView('ADMIN_RESET')}>Reset</button>
                </div>
                <button onClick={() => setView('LOGIN')} className="mt-6 text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-[100dvh] p-4 pb-20 max-w-lg mx-auto animate-in fade-in duration-500">
                <header className="flex items-center justify-between mb-8 mt-4">
                    <LogoImage containerClass="w-12 h-12 bg-slate-900/80 rounded-xl p-2 border border-blue-500/30" className="w-full h-full object-contain" />
                    <div className="text-center">
                        <p className="text-cyan-400 text-[8px] font-black uppercase tracking-widest">Exclusive Membership</p>
                        <h1 className="font-cinzel text-xl font-black text-white tracking-tight">Portal Hub</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-slate-900/60 text-blue-400 rounded-xl border border-blue-900/50"><LogOut className="w-5 h-5" /></button>
                </header>
                <MembershipCard customer={currentCustomer} />
                <div className="mt-6 flex justify-center">
                    <button onClick={() => handleShareCard(currentCustomer)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300 bg-white/5 px-6 py-3 rounded-xl border border-white/5 shadow-xl">
                        {isSharing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4"/>} Download ID
                    </button>
                </div>
                <div className="glass-card rounded-[2rem] p-8 mt-10 border border-blue-400/10">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="font-cinzel text-base font-black text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> DRAGON BALLS</h3>
                        <div className="bg-blue-600/20 px-4 py-1.5 rounded-full text-[10px] font-black border border-blue-500/30 text-blue-100">{currentCustomer.stamps} / 5</div>
                    </div>
                    <div className="flex justify-between items-center px-2">
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
            <div className="min-h-[100dvh] p-4 sm:p-6 bg-[#020617] text-slate-200">
                <header className="max-w-6xl w-full mx-auto flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <LogoImage containerClass="w-14 h-14 bg-slate-900 rounded-xl border-2 border-blue-900/50 p-2 shadow-xl" className="w-full h-full object-contain" />
                        <div>
                            <h1 className="font-cinzel text-2xl font-black text-white">HUB</h1>
                            <p className="text-[10px] text-cyan-400 uppercase font-black tracking-widest">Admin: {adminUser?.username}</p>
                        </div>
                    </div>
                    <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="p-3 bg-red-950/20 text-red-500 border border-red-900/50 rounded-xl"><LogOut className="w-5 h-5" /></button>
                </header>
                <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="glass-card rounded-[2.5rem] p-8 h-fit shadow-2xl">
                        <h3 className="font-cinzel text-lg font-black text-white mb-8 flex items-center gap-3"><UserPlus className="w-6 h-6 text-cyan-400" /> Enroll Member</h3>
                        <form onSubmit={(e) => { e.preventDefault(); storageService.addCustomer(newName, newMobile).then(() => { setNewName(''); setNewMobile(''); refreshCustomerList(); }); }} className="space-y-4">
                            <input type="text" placeholder="Full Name" className="w-full bg-slate-950 border-2 border-blue-900/30 rounded-xl px-5 py-4 text-white font-bold outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-950 border-2 border-blue-900/30 rounded-xl px-5 py-4 text-white font-bold outline-none" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                            <button className="w-full btn-magic text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Summon Magician</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px] shadow-2xl">
                        <div className="p-6 bg-slate-900/40 border-b border-blue-900/20">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                                <input type="text" placeholder="Find member by name, mobile or ID..." className="w-full bg-slate-950/60 border-2 border-blue-900/30 rounded-2xl pl-12 pr-4 py-4 text-white font-bold outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-[10px] text-blue-400 font-black uppercase tracking-widest border-b border-blue-900/30">
                                    <tr>
                                        <th className="px-8 py-6">Member</th>
                                        <th className="px-8 py-6">Stamps</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.id} className="border-b border-blue-900/10 hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="text-white font-bold">{c.name}</div>
                                                <div className="text-[10px] text-blue-500 uppercase">{c.customer_id}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-1.5 bg-slate-950 rounded-lg text-blue-500 border border-blue-900/30"><Minus className="w-4 h-4"/></button>
                                                    <span className="font-cinzel text-xl font-black text-white">{c.stamps}</span>
                                                    <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-1.5 bg-slate-950 rounded-lg text-blue-500 border border-blue-900/30"><Plus className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => setPreviewCustomer(c)} className="p-2 text-cyan-400 mr-2"><CreditCard /></button>
                                                <button onClick={async () => { if(confirm('Archive member?')) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2 text-red-500"><Trash2 className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    return (
        <div className="min-h-[100dvh]">
            {view === 'LOGIN' && renderLogin()}
            {view === 'ADMIN_LOGIN' && renderAdminLogin()}
            {view === 'ADMIN_REGISTER' && (/* Add simplified register view if needed */ null)}
            {view === 'ADMIN_RESET' && (/* Add simplified reset view if needed */ null)}
            {view === 'CUSTOMER_DASHBOARD' && renderCustomerDashboard()}
            {view === 'ADMIN_DASHBOARD' && adminUser && renderAdminDashboard()}
            
            {previewCustomer && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="max-w-sm w-full relative animate-in zoom-in duration-300">
                        <button onClick={() => setPreviewCustomer(null)} className="absolute -top-12 right-0 text-white p-2 active:scale-90"><X className="w-8 h-8" /></button>
                        <MembershipCard customer={previewCustomer} />
                        <button onClick={() => handleShareCard(previewCustomer)} className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 mt-8 shadow-2xl">
                             <Download className="w-4 h-4" /> Save Passport
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
