
import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, 
    Gift, FileUp, FileDown, Archive, 
    RotateCcw, Monitor, Smartphone, LayoutDashboard,
    Share2
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

// Custom MSC Logo Component - Perfectly centered vector logo
export const MSCLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`${className} bg-slate-950 rounded-[22%] flex items-center justify-center border-2 border-slate-800 shadow-2xl overflow-hidden group flex-shrink-0`}>
    <span className="text-white font-cinzel font-black text-[32%] leading-none tracking-tighter select-none">MSC</span>
  </div>
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
        link.setAttribute("download", `mithran_database_${new Date().toISOString().split('T')[0]}.csv`);
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
            alert(`Import finished: ${imported} members enrolled.`);
            refreshCustomerList();
        };
        reader.readAsText(file);
    };

    const handleRedeem = async (customer: Customer) => {
        if (!confirm(`Redeem reward for ${customer.name}?`)) return;
        setIsSyncing(true);
        try {
            await storageService.updateCustomer(customer.id, {
                stamps: 0,
                redeems: (customer.redeems || 0) + 1,
                lifetime_stamps: (customer.lifetime_stamps || 0) + 5
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
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 3, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `mithran-card-${previewCustomer?.customer_id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            alert('Card save failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleShareCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 3, backgroundColor: '#ffffff' });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `mithran-card-${previewCustomer?.customer_id}.png`, { type: 'image/png' });

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
            alert('Share not supported on this device.');
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
            <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col items-center">
                <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 h-20 shadow-sm w-full flex justify-center">
                    <div className="max-w-7xl w-full px-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MSCLogo className="w-12 h-12" />
                            <div>
                                <h1 className="font-cinzel text-xl font-black text-slate-950 leading-none tracking-tight">ADMIN HUB</h1>
                                <p className="text-[10px] text-blue-700 font-black uppercase tracking-[0.2em] mt-1">Authorized Command</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleExportCSV} className="p-2.5 text-slate-950 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all" title="Export CSV"><FileDown className="w-6 h-6"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-950 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all" title="Import CSV"><FileUp className="w-6 h-6"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-red-700 transition-all shadow-md"><LogOut className="w-4 h-4" /> Sign Out</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
                    <div className="lg:col-span-4 space-y-6 flex flex-col items-center w-full">
                        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-2xl w-full">
                            <h3 className="font-cinzel text-lg font-black text-slate-950 mb-8 flex items-center justify-center gap-3 border-b-2 border-slate-50 pb-4"><UserPlus className="w-6 h-6 text-blue-700" /> NEW ENROLLMENT</h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black tracking-widest ml-1 uppercase">Member Name</label>
                                    <input type="text" placeholder="Full Name" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-950 font-black outline-none focus:border-blue-600 transition-all text-center" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black tracking-widest ml-1 uppercase">Mobile Number</label>
                                    <input type="tel" placeholder="+91 00000 00000" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-950 font-black outline-none focus:border-blue-600 transition-all text-center" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                </div>
                                <button className="w-full btn-magic py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5" />} Add Member
                                </button>
                            </form>
                        </div>

                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all shadow-lg ${showArchive ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-100 text-slate-950 hover:border-blue-600'}`}
                        >
                            <div className="flex items-center gap-4">
                                <Archive className="w-6 h-6" />
                                <span className="font-black text-xs uppercase tracking-[0.2em]">{showArchive ? 'Archived Records' : 'Open Archive'}</span>
                            </div>
                            <span className={`${showArchive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-950'} px-4 py-1.5 rounded-full text-[11px] font-black`}>
                                {customers.filter(c => c.is_deleted).length}
                            </span>
                        </button>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px] w-full">
                        <div className="p-8 border-b-2 border-slate-50 bg-slate-50/50 flex justify-center">
                            <div className="relative w-full max-w-2xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-950" />
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Name or Mobile..." 
                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-16 pr-16 py-5 text-slate-950 font-black outline-none focus:border-blue-600 transition-all shadow-inner text-center" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button onClick={() => setShowScanner(true)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><QrCode className="w-6 h-6"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-[11px] text-slate-950 font-black uppercase tracking-[0.2em] border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-10 py-5">Identity</th>
                                        <th className="px-10 py-5 text-center">Progression</th>
                                        <th className="px-10 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-10 py-32 text-center">
                                                <p className="font-cinzel text-xl tracking-widest uppercase text-slate-300">No Records Found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-10 py-8">
                                                    <div className="text-slate-950 font-black text-lg leading-none mb-2">{c.name}</div>
                                                    <div className="text-[11px] text-blue-800 font-black tracking-wider uppercase">{c.customer_id} • {c.mobile}</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    {!c.is_deleted ? (
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-2 rounded-xl border-2 border-slate-200 text-slate-950 hover:bg-slate-950 hover:text-white transition-all"><Minus className="w-5 h-5"/></button>
                                                            <span className="font-cinzel text-2xl font-black text-slate-950 w-6 text-center">{c.stamps}</span>
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-2 rounded-xl border-2 border-slate-200 text-slate-950 hover:bg-slate-950 hover:text-white transition-all"><Plus className="w-5 h-5"/></button>
                                                            {c.stamps === 5 && (
                                                                <button onClick={() => handleRedeem(c)} className="ml-3 bg-blue-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">REDEEM</button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <span className="text-[11px] font-black uppercase text-red-600 bg-red-50 px-4 py-2 rounded-full border-2 border-red-200">DELETED RECORD</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        {c.is_deleted ? (
                                                            <>
                                                                <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-3 text-blue-700 bg-blue-50 rounded-2xl hover:bg-blue-700 hover:text-white transition-all shadow-md"><RotateCcw className="w-5 h-5"/></button>
                                                                <button onClick={() => handlePermanentDelete(c.id, c.name)} className="p-3 text-red-700 bg-red-50 rounded-2xl hover:bg-red-700 hover:text-white transition-all shadow-md"><Trash2 className="w-5 h-5"/></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setPreviewCustomer(c)} className="p-3 text-blue-700 bg-blue-50 rounded-2xl hover:bg-blue-700 hover:text-white transition-all shadow-md"><CreditCard className="w-5 h-5"/></button>
                                                                <button onClick={async () => { if(confirm(`Archive ${c.name}?`)) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-3 text-slate-500 bg-slate-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-md"><Archive className="w-5 h-5"/></button>
                                                            </>
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
        <div className="min-h-screen bg-white text-slate-950 flex flex-col items-center">
            {view === 'LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center w-full">
                    <div className="w-full max-w-sm p-12 sm:p-16 rounded-[4.5rem] bg-white border-2 border-slate-100 shadow-[0_48px_128px_-16px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-blue-700 to-cyan-500"></div>
                        <button onClick={handleLogoClick} className="mb-14 w-40 h-40 transition-transform active:scale-90 hover:rotate-3 duration-500 flex items-center justify-center">
                            <MSCLogo className="w-full h-full" />
                        </button>
                        <h1 className="font-cinzel text-5xl font-black text-slate-950 mb-3 tracking-tighter">MITHRAN</h1>
                        <p className="font-magic text-sm tracking-[0.5em] text-blue-700 mb-16 uppercase font-black opacity-95">Elite Membership</p>
                        
                        <div className="space-y-8 w-full">
                            <div className="space-y-3 flex flex-col items-center">
                                <label className="text-[11px] font-black text-slate-950 uppercase tracking-[0.3em]">Access Portal</label>
                                <div className="relative w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Member ID or Mobile" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 outline-none text-slate-950 font-black focus:border-blue-600 focus:bg-white transition-all text-center placeholder:text-slate-300" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-700 hover:text-white transition-all shadow-lg"><QrCode className="w-6 h-6" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />} ENTER HUB
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-20 flex items-center gap-12 opacity-90 text-slate-950">
                        <div className="flex flex-col items-center gap-3"><Smartphone className="w-7 h-7"/> <span className="text-[10px] font-black uppercase tracking-[0.2em]">MOBILE</span></div>
                        <div className="flex flex-col items-center gap-3"><Monitor className="w-7 h-7"/> <span className="text-[10px] font-black uppercase tracking-[0.2em]">DESKTOP</span></div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 w-full">
                    <div className="w-full max-w-sm p-14 rounded-[4rem] bg-white border-2 border-slate-100 shadow-2xl flex flex-col items-center">
                        <div className="w-24 h-24 mb-10"><MSCLogo className="w-full h-full" /></div>
                        <h2 className="font-cinzel text-2xl font-black text-slate-950 mb-12 text-center uppercase tracking-widest border-b-2 border-slate-50 pb-6 w-full">STAFF VAULT</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-6 w-full">
                            <div className="space-y-2 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-950 tracking-widest uppercase">Admin Identity</label>
                                <input type="text" placeholder="Username" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-7 py-5 text-slate-950 font-black outline-none focus:border-blue-600 transition-all shadow-inner text-center" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                            </div>
                            <div className="space-y-2 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-950 tracking-widest uppercase">Secret Passkey</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-7 py-5 text-slate-950 font-black outline-none focus:border-blue-600 transition-all shadow-inner text-center" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                            </div>
                            <button className="w-full btn-magic py-6 rounded-2xl text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl flex items-center justify-center gap-4 mt-4 active:scale-95" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <LayoutDashboard className="w-6 h-6"/>} AUTHORIZE
                            </button>
                        </form>
                        <button onClick={() => setView('LOGIN')} className="mt-12 w-full text-[11px] text-slate-800 font-black uppercase flex items-center justify-center gap-3 hover:text-blue-700 transition-colors tracking-[0.2em]"><ArrowLeft className="w-5 h-5" /> BACK TO PORTAL</button>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-screen bg-white p-4 pb-24 max-w-lg w-full flex flex-col items-center animate-in fade-in duration-700">
                    <header className="flex items-center justify-between mb-16 mt-10 px-4 w-full">
                        <MSCLogo className="w-16 h-16 shadow-2xl" />
                        <div className="text-center">
                            <p className="text-blue-700 text-[11px] font-black uppercase tracking-[0.5em] mb-2 leading-none">MITHRAN ELITE</p>
                            <h1 className="font-cinzel text-3xl font-black text-slate-950 tracking-tight leading-none">Member</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-4 bg-white text-slate-950 rounded-2xl border-2 border-slate-100 hover:bg-slate-950 hover:text-white transition-all shadow-lg active:scale-90 flex-shrink-0"><LogOut className="w-6 h-6" /></button>
                    </header>
                    
                    <div className="w-full px-2 flex justify-center drop-shadow-[0_40px_80px_rgba(37,99,235,0.25)]">
                        <MembershipCard customer={currentCustomer} />
                    </div>

                    <div className="bg-white rounded-[4.5rem] p-16 mt-16 border-2 border-slate-50 shadow-2xl relative overflow-hidden text-center w-full flex flex-col items-center">
                        <h3 className="font-cinzel text-base font-black text-slate-950 mb-14 flex justify-center items-center gap-4 tracking-[0.3em] uppercase"><Sparkles className="w-6 h-6 text-blue-700" /> Collection Status</h3>
                        <div className="flex justify-between items-center px-4 mb-6 w-full max-w-sm">
                            {[...Array(5)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                        <div className="mt-14 px-10 py-4 bg-blue-50 rounded-full inline-block border-2 border-blue-100 shadow-sm">
                             <p className="text-[11px] font-black text-blue-800 uppercase tracking-[0.3em]">{currentCustomer.stamps} / 5 STAMPS COLLECTED</p>
                        </div>
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
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 sm:p-10">
                    <div className="max-w-[520px] w-full relative animate-in zoom-in-95 duration-500 flex flex-col items-center">
                        <button 
                            onClick={() => setPreviewCustomer(null)} 
                            className="absolute -top-16 sm:-top-20 right-0 text-white hover:bg-white/10 p-4 rounded-full transition-all active:scale-75 z-50"
                        >
                            <X className="w-8 h-8 sm:w-10 sm:h-10" />
                        </button>
                        
                        <div className="w-full flex flex-col items-center">
                            <div className="w-full shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden flex justify-center">
                                <MembershipCard customer={previewCustomer} />
                            </div>

                            <div className="mt-16 flex flex-col sm:flex-row gap-6 w-full">
                                <button 
                                    onClick={handleDownloadCard} 
                                    disabled={isSyncing} 
                                    className="flex-1 bg-white text-slate-950 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Download className="w-6 h-6" />} DOWNLOAD
                                </button>
                                <button 
                                    onClick={handleShareCard} 
                                    disabled={isSyncing} 
                                    className="flex-1 bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Share2 className="w-6 h-6" />} SHARE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
