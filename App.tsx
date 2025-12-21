
import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, 
    Archive, RotateCcw, Monitor, Smartphone, 
    LayoutDashboard, Share2, FileDown, FileUp,
    Home, Gift, PartyPopper, ShieldCheck, Lock
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

// Premium MSC Logo Component - Image Based
export const MSCLogo = ({ className = "h-16 w-auto" }: { className?: string }) => (
  <img 
    src="logo.png" 
    alt="Mithran Snacks Corner" 
    className={`${className} object-contain drop-shadow-md hover:scale-105 transition-transform duration-300 select-none`} 
    draggable={false}
  />
);

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
    const [showArchive, setShowArchive] = useState(false);
    const [logoClicks, setLogoClicks] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');

    const MAX_STAMPS = 4; // After 4 stamps, 5th is free.

    const refreshCustomerList = async () => {
        setIsSyncing(true);
        try {
            const list = await storageService.fetchCustomers(true);
            setCustomers(list);
        } catch (error) {
            console.error(error);
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

    const handleCustomerLogin = async (idOrMobile?: string) => {
        const input = idOrMobile || loginInput.trim();
        if (!input) return;
        setIsSyncing(true);
        try {
            const customer = await storageService.findCustomer(input);
            if (customer) {
                setCurrentCustomer(customer);
                setView('CUSTOMER_DASHBOARD');
            } else {
                alert('Access Denied: Member not found.');
            }
        } catch (error) {
            alert('Error accessing portal.');
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
                alert('Invalid Staff Credentials.');
            }
        } catch (error) {
            alert('Vault Access Error.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportCSV = () => {
        if (customers.length === 0) return;
        const headers = ['Name', 'Mobile', 'MemberID', 'Stamps', 'Redeems', 'LifetimeStamps', 'Archived'];
        const rows = customers.map(c => [
            c.name, c.mobile, c.customer_id, c.stamps, c.redeems, c.lifetime_stamps, c.is_deleted ? 'YES' : 'NO'
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `msc_database_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(l => l.trim());
            lines.shift();
            setIsSyncing(true);
            let imported = 0;
            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    try {
                        await storageService.addCustomer(parts[0].trim(), parts[1].trim());
                        imported++;
                    } catch (err) { console.error(err); }
                }
            }
            alert(`Import finished: ${imported} members.`);
            refreshCustomerList();
        };
        reader.readAsText(file);
    };

    const handleRedeem = async (customer: Customer) => {
        if (!confirm(`Redeem FREE snack for ${customer.name}?`)) return;
        setIsSyncing(true);
        try {
            await storageService.updateCustomer(customer.id, {
                stamps: 0,
                redeems: (customer.redeems || 0) + 1,
                lifetime_stamps: (customer.lifetime_stamps || 0) + (MAX_STAMPS + 1)
            });
            await refreshCustomerList();
        } catch (error) {
            alert('Redemption failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePermanentDelete = async (id: number, name: string) => {
        if (!confirm(`WARNING: Permanent deletion for ${name}. This cannot be undone.`)) return;
        setIsSyncing(true);
        try {
            await storageService.deleteCustomerPermanent(id);
            alert('Record erased.');
            await refreshCustomerList();
        } catch (error) {
            alert('Deletion failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDownloadCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            const dataUrl = await htmlToImage.toJpeg(node, { 
                quality: 0.95,
                pixelRatio: 4, 
                backgroundColor: '#ffffff' 
            });
            const link = document.createElement('a');
            link.download = `MSC-CARD-${previewCustomer?.customer_id}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            alert('Card generation failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleShareCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 3 });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `MSC-CARD-${previewCustomer?.customer_id}.png`, { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'Mithran Member Card',
                    text: `Elite Card for ${previewCustomer?.name}`
                });
            } else {
                handleDownloadCard();
            }
        } catch (error) {
            alert('Share not supported.');
        } finally {
            setIsSyncing(false);
        }
    };

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.mobile.includes(searchQuery) || 
                                c.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesArchive = showArchive ? c.is_deleted === true : c.is_deleted === false;
            return matchesSearch && matchesArchive;
        });

        return (
            <div className="min-h-screen bg-[#fcfcfd] text-slate-900 flex flex-col items-center w-full animate-in fade-in duration-500">
                <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 shadow-sm w-full flex justify-center">
                    <div className="max-w-7xl w-full px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => { setAdminUser(null); setView('LOGIN'); }} 
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Back to Customer Portal"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                            <MSCLogo className="h-10 w-auto" />
                            <h1 className="font-cinzel text-lg font-black text-slate-900 tracking-tight">ADMIN</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleExportCSV} className="p-2 text-slate-600 hover:text-blue-600 transition-all" title="Export CSV"><FileDown className="w-5 h-5"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-600 hover:text-blue-600 transition-all" title="Import CSV"><FileUp className="w-5 h-5"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-6 bg-slate-200 mx-2"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-red-600 transition-all shadow-md">Logout</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Forms and Actions */}
                    <div className="lg:col-span-4 space-y-8 flex flex-col items-center w-full">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl w-full relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <h3 className="relative font-cinzel text-md font-black text-slate-900 mb-8 flex items-center justify-center gap-3 uppercase tracking-widest border-b border-slate-50 pb-4">
                                <UserPlus className="w-5 h-5 text-blue-600" /> New Enrollment
                            </h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="relative space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input type="text" placeholder="e.g. Rahul Sharma" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-center" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                                    <input type="tel" placeholder="+91 00000 00000" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-center" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                </div>
                                <button className="w-full btn-magic py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 hover:shadow-blue-500/20 active:scale-95 transition-all" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Enroll Member
                                </button>
                            </form>
                        </div>

                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className={`w-full flex items-center justify-between p-7 rounded-[2rem] border-2 transition-all shadow-md group ${showArchive ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-900 hover:border-blue-500'}`}
                        >
                            <div className="flex items-center gap-4">
                                <Archive className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                                <span className="font-black text-xs uppercase tracking-widest">{showArchive ? 'Viewing Archive' : 'Open Archive'}</span>
                            </div>
                            <span className={`${showArchive ? 'bg-white/20' : 'bg-slate-100'} px-4 py-1.5 rounded-full text-[11px] font-black`}>
                                {customers.filter(c => c.is_deleted).length}
                            </span>
                        </button>
                    </div>

                    {/* Right Column: Database Table */}
                    <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px] w-full">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-center">
                            <div className="relative w-full max-w-xl">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Name or Mobile..." 
                                    className="w-full bg-white border border-slate-200 rounded-2xl pl-14 pr-16 py-4 text-slate-900 font-bold outline-none focus:border-blue-600 transition-all text-center text-sm shadow-inner" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button onClick={() => setShowScanner(true)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><QrCode className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5">Identity</th>
                                        <th className="px-8 py-5 text-center">Progression</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-32 text-center text-slate-300 font-cinzel text-lg tracking-widest uppercase italic opacity-50">Empty Archive</td>
                                        </tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="text-slate-900 font-black text-base leading-none mb-1.5">{c.name}</div>
                                                    <div className="text-[10px] text-blue-700 font-black tracking-widest uppercase flex items-center gap-2">
                                                        <span className="bg-blue-100 px-2 py-0.5 rounded">{c.customer_id}</span>
                                                        <span>{c.mobile}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    {!c.is_deleted ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            {c.stamps >= MAX_STAMPS ? (
                                                                <button 
                                                                    onClick={() => handleRedeem(c)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2 shadow-lg"
                                                                >
                                                                    <Gift className="w-4 h-4" /> Redeem Free
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white transition-all"><Minus className="w-4 h-4"/></button>
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="font-cinzel text-2xl font-black w-6 text-center leading-none">{c.stamps}</span>
                                                                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">of 4</span>
                                                                    </div>
                                                                    <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(MAX_STAMPS, c.stamps + 1) }).then(refreshCustomerList)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white transition-all"><Plus className="w-4 h-4"/></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">Deleted Record</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => setPreviewCustomer(c)} className="p-2.5 text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-700 hover:text-white transition-all shadow-sm" title="Preview Card"><CreditCard className="w-5 h-5"/></button>
                                                        {c.is_deleted ? (
                                                            <>
                                                                <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-2.5 text-green-700 bg-green-50 rounded-xl hover:bg-green-700 hover:text-white transition-all shadow-sm" title="Restore Member"><RotateCcw className="w-5 h-5"/></button>
                                                                <button onClick={() => handlePermanentDelete(c.id, c.name)} className="p-2.5 text-red-700 bg-red-50 rounded-xl hover:bg-red-700 hover:text-white transition-all shadow-sm" title="Delete Permanently"><Trash2 className="w-5 h-5"/></button>
                                                            </>
                                                        ) : (
                                                            <button onClick={async () => { if(confirm(`Archive ${c.name}?`)) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2.5 text-slate-400 bg-slate-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Archive Member"><Archive className="w-5 h-5"/></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col items-center overflow-x-hidden font-inter">
            {view === 'LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center w-full max-w-lg">
                    <div className="w-full p-14 sm:p-20 rounded-[4rem] bg-white border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                        <button onClick={handleLogoClick} className="mb-8 active:scale-95 transition-transform duration-300 flex items-center justify-center cursor-default max-w-[80%]">
                            <MSCLogo className="w-56 h-auto" />
                        </button>
                        <h1 className="font-cinzel text-5xl font-black text-slate-900 mb-2 tracking-tighter drop-shadow-sm">MITHRAN</h1>
                        <p className="font-magic text-sm tracking-[0.5em] text-blue-700 mb-16 uppercase font-black opacity-90">Exclusive Rewards</p>
                        
                        <div className="space-y-8 w-full">
                            <div className="space-y-3 flex flex-col items-center">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Access Member Portal</label>
                                <div className="relative w-full group">
                                    <input 
                                        type="text" 
                                        placeholder="Mobile or Member ID" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-8 pr-16 py-5 outline-none text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all text-center placeholder:text-slate-300 text-lg shadow-inner" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"><QrCode className="w-6 h-6" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50 transition-all">
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />} Enter Gateway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="fantasy-admin-bg flex flex-col items-center justify-center min-h-screen p-6 w-full">
                    {/* Magical floating orbs */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] animate-[float_8s_infinite_ease-in-out]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px] animate-[float_12s_infinite_ease-in-out_reverse]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-[pulse-glow_10s_infinite_ease-in-out]"></div>

                    <div className="w-full max-w-sm p-12 sm:p-14 rounded-[4rem] glass-panel flex flex-col items-center animate-in zoom-in-95 duration-700 relative z-10">
                        <div className="absolute -top-12 flex justify-center w-full">
                             <div className="p-3 bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl">
                                <MSCLogo className="h-20 w-auto" />
                             </div>
                        </div>

                        <div className="mt-12 w-full text-center">
                            <h2 className="font-cinzel text-3xl font-black text-white mb-2 tracking-[0.2em] drop-shadow-lg">STAFF VAULT</h2>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-12">Authorized Personnel Only</p>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-6 w-full">
                            <div className="space-y-2 relative">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] ml-4">Identity</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 opacity-50" />
                                    <input 
                                        type="text" 
                                        placeholder="Admin ID" 
                                        className="w-full magic-input rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none text-center tracking-widest text-lg" 
                                        onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] ml-4">Access Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 opacity-50" />
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="w-full magic-input rounded-2xl pl-16 pr-6 py-5 text-white font-bold outline-none text-center tracking-widest text-lg" 
                                        onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} 
                                        required 
                                    />
                                </div>
                            </div>
                            <button className="w-full btn-magic py-5 rounded-[2rem] text-white font-black uppercase text-[12px] tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] mt-4 transition-all active:scale-95 group overflow-hidden relative" disabled={isSyncing}>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin mx-auto"/> : "Unlock Gateway"}
                            </button>
                        </form>

                        <button onClick={() => setView('LOGIN')} className="mt-12 text-[11px] text-white/50 font-black uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-3 group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Return to Portal
                        </button>
                    </div>

                    <div className="mt-20 flex gap-4 opacity-20 relative z-10">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-screen bg-white p-6 pb-24 max-w-lg w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <header className="flex items-center justify-between mb-16 mt-8 w-full">
                        <MSCLogo className="h-24 w-auto" />
                        <div className="text-center">
                            <p className="text-blue-700 text-[10px] font-black uppercase tracking-[0.5em] mb-1.5 leading-none">ELITE MEMBER</p>
                            <h1 className="font-cinzel text-3xl font-black text-slate-900 tracking-tighter leading-none">Portal</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-4 bg-white text-slate-900 rounded-2xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-90 flex-shrink-0"><LogOut className="w-6 h-6" /></button>
                    </header>
                    
                    <div className="w-full max-w-[380px] flex justify-center drop-shadow-[0_40px_80px_rgba(37,99,235,0.3)] hover:scale-[1.02] transition-transform duration-500">
                        <MembershipCard customer={currentCustomer} />
                    </div>

                    <div className="bg-white rounded-[4rem] p-12 mt-16 border-2 border-slate-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] text-center w-full flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"></div>
                        <h3 className="font-cinzel text-sm font-black text-slate-950 mb-12 flex justify-center items-center gap-4 tracking-[0.3em] uppercase">
                            <Sparkles className="w-6 h-6 text-blue-600" /> Progression Status
                        </h3>
                        
                        {/* Stamp Progress Bar */}
                        <div className="flex justify-between items-center px-4 mb-6 w-full max-w-sm">
                            {[...Array(MAX_STAMPS)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>

                        {currentCustomer.stamps >= MAX_STAMPS ? (
                            <div className="mt-12 bg-green-50 border-2 border-green-200 rounded-[2.5rem] p-8 w-full animate-bounce shadow-lg">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <PartyPopper className="w-8 h-8 text-green-600" />
                                    <h4 className="font-cinzel text-xl font-black text-green-700">JACKPOT!</h4>
                                    <PartyPopper className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="text-[12px] font-black text-green-600 uppercase tracking-widest leading-relaxed">
                                    CONGRATULATIONS!<br/>YOUR 5TH SNACK IS ON THE HOUSE!
                                </p>
                            </div>
                        ) : (
                            <div className="mt-12 px-10 py-4 bg-blue-50 rounded-full inline-block border-2 border-blue-100 shadow-sm transition-all hover:bg-blue-100">
                                <p className="text-[11px] font-black text-blue-800 uppercase tracking-[0.3em]">{currentCustomer.stamps} / {MAX_STAMPS} BALLS COLLECTED</p>
                            </div>
                        )}
                        
                        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Collect 4 Balls to unlock the free secret
                        </p>
                    </div>
                </div>
            )}

            {view === 'ADMIN_DASHBOARD' && adminUser && renderAdminDashboard()}
            
            {showScanner && (
                <Scanner 
                    onScan={(data) => { 
                        if (view === 'ADMIN_DASHBOARD') {
                            setSearchQuery(data);
                        } else {
                            setLoginInput(data);
                            handleCustomerLogin(data);
                        }
                        setShowScanner(false); 
                    }} 
                    onClose={() => setShowScanner(false)} 
                />
            )}

            {previewCustomer && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
                    <div className="max-w-md w-full flex flex-col items-center animate-in zoom-in-95 duration-500 relative">
                        <button 
                            onClick={() => setPreviewCustomer(null)} 
                            className="absolute -top-16 right-0 text-white hover:bg-white/20 p-4 rounded-full transition-all z-50 active:scale-90"
                        >
                            <X className="w-10 h-10" />
                        </button>
                        
                        <div className="flex justify-center mb-10 w-full">
                            <div className="w-full max-w-[360px] shadow-[0_25px_50px_-12px_rgba(0,0,0,1)] rounded-[1.5rem] overflow-hidden ring-1 ring-white/10">
                                <MembershipCard customer={previewCustomer} />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 w-full">
                            <button 
                                onClick={handleDownloadCard} 
                                disabled={isSyncing} 
                                className="flex-1 bg-white text-slate-950 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Download className="w-6 h-6" />} Save JPG
                            </button>
                            <button 
                                onClick={handleShareCard} 
                                disabled={isSyncing} 
                                className="flex-1 bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Share2 className="w-6 h-6" />} Send Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
