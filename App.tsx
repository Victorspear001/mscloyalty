
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
import { COMPANY_LOGO_URL } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

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
                alert('Portal Access Denied: Member not found.');
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
        if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${name}? This action cannot be undone.`)) return;
        setIsSyncing(true);
        try {
            await storageService.deleteCustomerPermanent(id);
            alert('Member permanently erased from the scrolls.');
            await refreshCustomerList();
        } catch (error) {
            alert('Permanent deletion failed.');
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
            alert('Failed to save card image.');
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
                    text: `Membership card for ${previewCustomer?.name}`
                });
            } else {
                // Fallback for browsers that don't support sharing files
                handleDownloadCard();
            }
        } catch (error) {
            console.error('Share error:', error);
            alert('Sharing is not supported on this device/browser.');
        } finally {
            setIsSyncing(false);
        }
    };

    const LogoImage = ({ className }: { className?: string }) => (
        <img 
            src={COMPANY_LOGO_URL} 
            alt="Mithran" 
            className={`${className} object-contain`}
            onError={(e) => {
                (e.target as HTMLImageElement).src = 'logo.png';
                (e.target as HTMLImageElement).onerror = () => {
                    (e.target as HTMLImageElement).src = 'https://img.icons8.com/fluency/96/sparkling.png';
                };
            }}
        />
    );

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.mobile.includes(searchQuery) || 
                                c.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesArchive = showArchive ? c.is_deleted === true : c.is_deleted === false;
            return matchesSearch && matchesArchive;
        });

        return (
            <div className="min-h-screen bg-white text-slate-900">
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100 h-20">
                    <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                                <LogoImage className="w-full h-full" />
                            </div>
                            <div>
                                <h1 className="font-cinzel text-lg font-black tracking-tight">ADMIN HUB</h1>
                                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest leading-none mt-1">Authorized Personnel Only</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleExportCSV} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Export CSV"><FileDown className="w-5 h-5"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Import CSV"><FileUp className="w-5 h-5"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-6 bg-slate-100 mx-1"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-4 h-4" /> Sign Out</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                            <h3 className="font-cinzel text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><UserPlus className="w-6 h-6 text-blue-600" /> New Enrollment</h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="space-y-4">
                                <input type="text" placeholder="Member Full Name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                <button className="w-full btn-magic py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Add to Kingdom
                                </button>
                            </form>
                        </div>

                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className={`w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all ${showArchive ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Archive className="w-5 h-5" />
                                <span className="font-bold text-xs uppercase tracking-widest">{showArchive ? 'Viewing Archived Members' : 'Go to Archive'}</span>
                            </div>
                            <span className={`${showArchive ? 'bg-white/20' : 'bg-slate-100'} px-3 py-1 rounded-full text-[10px] font-black`}>
                                {customers.filter(c => c.is_deleted).length}
                            </span>
                        </button>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder={`Search ${showArchive ? 'archive' : 'active members'}...`} 
                                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-14 py-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button onClick={() => setShowScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><QrCode className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4">Identity</th>
                                        <th className="px-8 py-4">Status / Stamps</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Search className="w-12 h-12" />
                                                    <p className="font-cinzel text-lg tracking-widest uppercase italic">The scrolls are empty</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="text-slate-900 font-bold text-base leading-none mb-1.5">{c.name}</div>
                                                    <div className="text-[10px] text-blue-500 font-black tracking-wider uppercase">{c.customer_id} • {c.mobile}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {!c.is_deleted ? (
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 active:scale-90 transition-all"><Minus className="w-4 h-4"/></button>
                                                            <span className="font-cinzel text-xl font-black text-slate-900 w-4 text-center">{c.stamps}</span>
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 active:scale-90 transition-all"><Plus className="w-4 h-4"/></button>
                                                            {c.stamps === 5 && (
                                                                <button onClick={() => handleRedeem(c)} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shadow-md">Redeem</button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 w-fit">
                                                            <Archive className="w-3 h-3" /> Archived Record
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {c.is_deleted ? (
                                                            <>
                                                                <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Restore Member"><RotateCcw className="w-4 h-4"/></button>
                                                                <button onClick={() => handlePermanentDelete(c.id, c.name)} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Permanently Delete"><Trash2 className="w-4 h-4"/></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setPreviewCustomer(c)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="View Membership Card"><CreditCard className="w-4 h-4"/></button>
                                                                <button onClick={async () => { if(confirm(`Archive ${c.name}?`)) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2.5 text-slate-400 bg-slate-100 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Archive Member"><Archive className="w-4 h-4"/></button>
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
        <div className="min-h-screen">
            {view === 'LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-white relative">
                    <div className="w-full max-w-sm p-10 sm:p-14 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        <button onClick={handleLogoClick} className="mb-12 mx-auto w-36 h-36 bg-slate-50 rounded-[3rem] p-6 border border-slate-100 shadow-inner flex items-center justify-center transition-all active:scale-95 hover:shadow-lg">
                            <LogoImage className="w-full h-full" />
                        </button>
                        <h1 className="font-cinzel text-4xl font-black text-slate-900 mb-2 tracking-tight">MITHRAN</h1>
                        <p className="font-magic text-xs tracking-[0.4em] text-blue-600 mb-14 uppercase font-black opacity-80">Elite Loyalty Hub</p>
                        
                        <div className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Portal Key</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Member ID or Mobile" 
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-7 py-5 outline-none text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><QrCode className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Access Portal
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-16 flex items-center gap-10 opacity-30">
                        <div className="flex flex-col items-center gap-2"><Smartphone className="w-5 h-5 text-slate-900"/> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Mobile Ready</span></div>
                        <div className="flex flex-col items-center gap-2"><Monitor className="w-5 h-5 text-slate-900"/> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Desktop Optimized</span></div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
                    <div className="w-full max-w-sm p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl">
                        <div className="w-20 h-20 mx-auto mb-8 bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 flex items-center justify-center shadow-inner"><LogoImage className="w-full h-full"/></div>
                        <h2 className="font-cinzel text-xl font-black text-slate-900 mb-10 text-center uppercase tracking-[0.2em]">Staff Vault</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Identity</label>
                                <input type="text" placeholder="Username" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Access Key</label>
                                <input type="password" placeholder="Vault Key" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                            </div>
                            <button className="w-full btn-magic py-5 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 mt-4" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <LayoutDashboard className="w-5 h-5"/>} Authorize
                            </button>
                        </form>
                        <button onClick={() => setView('LOGIN')} className="mt-10 w-full text-[10px] text-slate-400 font-black uppercase flex items-center justify-center gap-2 hover:text-blue-600 transition-colors tracking-widest"><ArrowLeft className="w-4 h-4" /> Return Home</button>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-screen bg-white p-4 pb-20 max-w-lg mx-auto animate-in slide-in-from-bottom-10 duration-700">
                    <header className="flex items-center justify-between mb-12 mt-8 px-2">
                        <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] p-2.5 border border-slate-100 shadow-sm flex items-center justify-center"><LogoImage className="w-full h-full" /></div>
                        <div className="text-center">
                            <p className="text-blue-600 text-[9px] font-black uppercase tracking-[0.4em] mb-1.5 opacity-70">Member Identity</p>
                            <h1 className="font-cinzel text-2xl font-black text-slate-900 tracking-tight">Mithran Hub</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"><LogOut className="w-5 h-5" /></button>
                    </header>
                    
                    <div className="px-1 drop-shadow-2xl">
                        <MembershipCard customer={currentCustomer} />
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-12 mt-12 border border-slate-100 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
                        <h3 className="font-cinzel text-sm font-black text-slate-900 mb-12 flex justify-center items-center gap-3 tracking-widest"><Sparkles className="w-5 h-5 text-blue-600" /> MAGIC COLLECTION</h3>
                        <div className="flex justify-between items-center px-2 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                        <div className="mt-12 px-8 py-3 bg-blue-50/80 rounded-full inline-block border border-blue-100 shadow-sm">
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none">{currentCustomer.stamps} of 5 Balls Collected</p>
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
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4">
                    <div className="max-w-xl w-full relative animate-in zoom-in duration-300 flex flex-col items-center">
                        {/* Perfect alignment container for the card */}
                        <div className="w-full relative flex flex-col items-center">
                            <button 
                                onClick={() => setPreviewCustomer(null)} 
                                className="absolute -top-16 right-0 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all active:scale-90"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            
                            <div className="w-full shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
                                <MembershipCard customer={previewCustomer} />
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:px-4">
                                <button 
                                    onClick={handleDownloadCard} 
                                    disabled={isSyncing} 
                                    className="flex-1 bg-white text-slate-900 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5" />} Save Card
                                </button>
                                <button 
                                    onClick={handleShareCard} 
                                    disabled={isSyncing} 
                                    className="flex-1 bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Share2 className="w-5 h-5" />} Share Card
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
