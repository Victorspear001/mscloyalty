
import React, { useState, useEffect } from 'react';
import { 
    Shield, QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, Camera, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, Flame, Mail, Lock, User
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
    const [logoError, setLogoError] = useState(false);

    // Secret Door Logic
    const [logoClicks, setLogoClicks] = useState(0);

    // Admin Form states
    const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
    const [adminRegData, setAdminRegData] = useState({ email: '', username: '', password: '', securityQuestion: 'Your first snack?', securityAnswer: '' });
    const [adminResetData, setAdminResetData] = useState({ email: '', securityAnswer: '', newPassword: '' });
    
    // Customer add form
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');

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
        if (view === 'ADMIN_DASHBOARD') refreshCustomerList();
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

    const handleCustomerLogin = async () => {
        if (!loginInput.trim()) return;
        setIsSyncing(true);
        try {
            const customer = await storageService.findCustomer(loginInput.trim().toUpperCase());
            if (customer) {
                setCurrentCustomer(customer);
                setView('CUSTOMER_DASHBOARD');
            } else {
                alert('Member not found!');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const admin = await storageService.findAdmin(adminLoginData.username);
            if (admin && admin.password === adminLoginData.password) {
                setAdminUser(admin);
                setView('ADMIN_DASHBOARD');
            } else {
                alert('Invalid Username or Password');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdminRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const success = await storageService.addAdmin({
                username: adminRegData.username,
                password: adminRegData.password,
                email: adminRegData.email,
                securityQuestion: adminRegData.securityQuestion,
                securityAnswer: adminRegData.securityAnswer
            });
            if (success) {
                alert('Registration successful! Please login.');
                setView('ADMIN_LOGIN');
            } else {
                alert('Username or Email already exists.');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAdminReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const admin = await storageService.findAdminByEmail(adminResetData.email);
            if (admin && admin.securityAnswer.toLowerCase() === adminResetData.securityAnswer.toLowerCase()) {
                await storageService.updateAdminPassword(adminResetData.email, adminResetData.newPassword);
                alert('Password reset successful!');
                setView('ADMIN_LOGIN');
            } else {
                alert('Email or Security Answer is incorrect.');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const LogoImage = ({ className }: { className?: string }) => (
        <div className="flex items-center justify-center">
            {logoError ? (
                <Flame className={`text-blue-400 ${className}`} />
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
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 text-center">
            <div className="glass-card w-full max-w-sm p-8 sm:p-12 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-700">
                <button onClick={handleLogoClick} className="mb-8 mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-slate-900/80 rounded-[2rem] p-3 border-2 border-blue-500/30 shadow-2xl overflow-hidden">
                    <LogoImage className="w-full h-full object-contain" />
                </button>
                <h1 className="font-cinzel text-4xl font-black text-white mb-2">MITHRAN</h1>
                <p className="font-magic text-xs tracking-[0.4em] text-cyan-400 mb-10 uppercase">Blue Fantasy Lounge</p>
                <div className="space-y-6 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest ml-3">Member Key</label>
                        <div className="relative">
                            <input type="text" placeholder="ID or Mobile" className="w-full bg-slate-950/50 border-2 border-blue-900/50 rounded-2xl px-6 py-4 outline-none text-white font-bold" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} />
                            <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-900/80 text-cyan-400 rounded-xl"><QrCode className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <button onClick={handleCustomerLogin} disabled={isSyncing} className="w-full btn-magic text-white font-cinzel py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Enter
                    </button>
                </div>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
            <div className="glass-card w-full max-w-sm p-8 rounded-[2rem]">
                <div className="w-16 h-16 bg-slate-900 rounded-xl mx-auto mb-6 p-2 border border-blue-500/20"><LogoImage className="w-full h-full object-contain" /></div>
                <h2 className="font-cinzel text-xl font-black text-white mb-8 text-center uppercase">Staff Access</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="text" placeholder="Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="password" placeholder="Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                    </div>
                    <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs" disabled={isSyncing}>Sign In</button>
                </form>
                <div className="mt-8 flex justify-between text-[10px] font-black uppercase text-blue-500/60">
                    <button onClick={() => setView('ADMIN_REGISTER')}>Sign Up</button>
                    <button onClick={() => setView('ADMIN_RESET')}>Forgot Key?</button>
                </div>
                <button onClick={() => setView('LOGIN')} className="mt-6 w-full text-[10px] text-slate-500 font-black uppercase flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Back to Portal</button>
            </div>
        </div>
    );

    const renderAdminRegister = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
            <div className="glass-card w-full max-w-md p-8 rounded-[2rem]">
                <h2 className="font-cinzel text-xl font-black text-white mb-6 text-center uppercase">Register Staff</h2>
                <form onSubmit={handleAdminRegister} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="email" placeholder="Email Address (For Recovery)" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminRegData({...adminRegData, email: e.target.value})} required />
                    </div>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="text" placeholder="Desired Username" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminRegData({...adminRegData, username: e.target.value})} required />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="password" placeholder="Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminRegData({...adminRegData, password: e.target.value})} required />
                    </div>
                    <div className="pt-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Security: {adminRegData.securityQuestion}</label>
                        <input type="text" placeholder="Your Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl px-4 py-3 text-white outline-none" onChange={(e) => setAdminRegData({...adminRegData, securityAnswer: e.target.value})} required />
                    </div>
                    <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs" disabled={isSyncing}>Create Account</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="mt-6 w-full text-[10px] text-slate-500 font-black uppercase flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Already registered? Login</button>
            </div>
        </div>
    );

    const renderAdminReset = () => (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
            <div className="glass-card w-full max-w-sm p-8 rounded-[2rem]">
                <h2 className="font-cinzel text-xl font-black text-white mb-6 text-center uppercase">Restore Key</h2>
                <form onSubmit={handleAdminReset} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="email" placeholder="Email Address" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminResetData({...adminResetData, email: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Security Answer</label>
                        <input type="text" placeholder="Your Answer" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl px-4 py-3 text-white outline-none" onChange={(e) => setAdminResetData({...adminResetData, securityAnswer: e.target.value})} required />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="password" placeholder="New Password" className="w-full bg-slate-950 border-2 border-blue-900 rounded-xl pl-12 pr-4 py-3 text-white outline-none" onChange={(e) => setAdminResetData({...adminResetData, newPassword: e.target.value})} required />
                    </div>
                    <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs" disabled={isSyncing}>Reset Password</button>
                </form>
                <button onClick={() => setView('ADMIN_LOGIN')} className="mt-6 w-full text-[10px] text-slate-500 font-black uppercase flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </div>
        </div>
    );

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => 
            !c.is_deleted && (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery) || c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return (
            <div className="min-h-[100dvh] p-4 sm:p-6 bg-[#020617] text-slate-200">
                <header className="max-w-6xl w-full mx-auto flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl border-2 border-blue-900/50 p-2 shadow-xl"><LogoImage className="w-full h-full object-contain" /></div>
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
                                <input type="text" placeholder="Search members..." className="w-full bg-slate-950/60 border-2 border-blue-900/30 rounded-2xl pl-12 pr-4 py-4 text-white font-bold outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        return (
            <div className="min-h-[100dvh] p-4 pb-20 max-w-lg mx-auto animate-in fade-in duration-500">
                <header className="flex items-center justify-between mb-8 mt-4">
                    <div className="w-12 h-12 bg-slate-900/80 rounded-xl p-2 border border-blue-500/30"><LogoImage className="w-full h-full object-contain" /></div>
                    <div className="text-center">
                        <p className="text-cyan-400 text-[8px] font-black uppercase tracking-widest">Exclusive Membership</p>
                        <h1 className="font-cinzel text-xl font-black text-white tracking-tight">Portal Hub</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-slate-900/60 text-blue-400 rounded-xl border border-blue-900/50"><LogOut className="w-5 h-5" /></button>
                </header>
                <MembershipCard customer={currentCustomer} />
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

    return (
        <div className="min-h-[100dvh]">
            {view === 'LOGIN' && renderLogin()}
            {view === 'ADMIN_LOGIN' && renderAdminLogin()}
            {view === 'ADMIN_REGISTER' && renderAdminRegister()}
            {view === 'ADMIN_RESET' && renderAdminReset()}
            {view === 'CUSTOMER_DASHBOARD' && renderCustomerDashboard()}
            {view === 'ADMIN_DASHBOARD' && adminUser && renderAdminDashboard()}
            
            {previewCustomer && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="max-w-sm w-full relative animate-in zoom-in duration-300">
                        <button onClick={() => setPreviewCustomer(null)} className="absolute -top-12 right-0 text-white p-2 active:scale-90"><X className="w-8 h-8" /></button>
                        <MembershipCard customer={previewCustomer} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
