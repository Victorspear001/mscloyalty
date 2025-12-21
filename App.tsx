
import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, 
    Gift, FileUp, FileDown, Archive, 
    RotateCcw, Monitor, Smartphone, LayoutDashboard
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
            const list = await storageService.fetchCustomers();
            // Note: Storage service filter active by default, but we might want all for CSV
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
                alert('Portal Access Denied: We could not find that Member ID.');
            }
        } catch (error) {
            alert('Error accessing the magical portal.');
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
        const headers = ['Name', 'Mobile', 'MemberID', 'Stamps', 'Redeems', 'LifetimeStamps'];
        const rows = customers.map(c => [
            c.name, c.mobile, c.customer_id, c.stamps, c.redeems, c.lifetime_stamps
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `mithran_members_${new Date().toISOString().split('T')[0]}.csv`);
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
            lines.shift(); // Remove header

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
            alert(`Magic Manifest Updated: ${imported} members enrolled.`);
            refreshCustomerList();
        };
        reader.readAsText(file);
    };

    const handleRedeem = async (customer: Customer) => {
        if (!confirm(`Redeem reward for ${customer.name}? This resets balls to 0.`)) return;
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

    const handleDownloadCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `mithran-card-${previewCustomer?.customer_id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            alert('Failed to save card.');
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
                // If the user's logo.png is missing, we show a helpful fallback icon instead of a broken image
                (e.target as HTMLImageElement).src = 'https://img.icons8.com/fluency/96/sparkling.png';
            }}
        />
    );

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.mobile.includes(searchQuery) || 
                                c.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesArchive = showArchive ? c.is_deleted : !c.is_deleted;
            return matchesSearch && matchesArchive;
        });

        return (
            <div className="min-h-screen bg-white">
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl p-1.5 border border-slate-100"><LogoImage className="w-full h-full" /></div>
                            <div>
                                <h1 className="font-cinzel text-lg font-black text-slate-900 leading-none">ADMIN HUB</h1>
                                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-1">Staff Portal Access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportCSV} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Export CSV"><FileDown className="w-5 h-5"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Import CSV"><FileUp className="w-5 h-5"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-6 bg-slate-100 mx-2"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-4 h-4" /> Exit</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Enroll Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="font-cinzel text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><UserPlus className="w-6 h-6 text-blue-600" /> New Enrollment</h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="space-y-4">
                                <input type="text" placeholder="Full Name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                <button className="w-full btn-magic py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Enroll Member
                                </button>
                            </form>
                        </div>

                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${showArchive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Archive className="w-5 h-5" />
                                <span className="font-bold text-xs uppercase tracking-widest">{showArchive ? 'Viewing Archive' : 'Open Archive'}</span>
                            </div>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">{customers.filter(c => c.is_deleted).length}</span>
                        </button>
                    </div>

                    {/* Table Side */}
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by ID, Name or Mobile..." 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-12 py-3.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button onClick={() => setShowScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><QrCode className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4">Member</th>
                                        <th className="px-8 py-4">Stamps</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-cinzel tracking-widest">No souls match your query</td></tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="text-slate-900 font-bold">{c.name}</div>
                                                    <div className="text-[10px] text-blue-500 font-black tracking-wider uppercase">{c.customer_id} • {c.mobile}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {!c.is_deleted ? (
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 active:scale-90"><Minus className="w-4 h-4"/></button>
                                                            <span className="font-cinzel text-xl font-black text-slate-900 w-4 text-center">{c.stamps}</span>
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 active:scale-90"><Plus className="w-4 h-4"/></button>
                                                            {c.stamps === 5 && (
                                                                <button onClick={() => handleRedeem(c)} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">Redeem</button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-bold uppercase italic">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {c.is_deleted ? (
                                                            <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setPreviewCustomer(c)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><CreditCard className="w-4 h-4"/></button>
                                                                <button onClick={async () => { if(confirm('Archive member?')) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
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
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-white">
                    <div className="w-full max-w-sm p-10 sm:p-12 rounded-[3rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        <button onClick={handleLogoClick} className="mb-10 mx-auto w-32 h-32 bg-slate-50 rounded-[2.5rem] p-5 border border-slate-100 shadow-inner flex items-center justify-center transition-transform active:scale-95">
                            <LogoImage className="w-full h-full" />
                        </button>
                        <h1 className="font-cinzel text-4xl font-black text-slate-900 mb-2">MITHRAN</h1>
                        <p className="font-magic text-xs tracking-[0.4em] text-blue-600 mb-12 uppercase font-black">Elite Hub</p>
                        
                        <div className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Enter Secret Key</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Member ID or Mobile" 
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none text-slate-900 font-bold focus:border-blue-500 transition-all placeholder:text-slate-300" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><QrCode className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Access Portal
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-12 flex items-center gap-8 opacity-40">
                        <div className="flex flex-col items-center gap-2"><Smartphone className="w-5 h-5 text-slate-900"/> <span className="text-[9px] font-black uppercase tracking-tighter">Mobile View</span></div>
                        <div className="flex flex-col items-center gap-2"><Monitor className="w-5 h-5 text-slate-900"/> <span className="text-[9px] font-black uppercase tracking-tighter">PC Optimized</span></div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
                    <div className="w-full max-w-sm p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl">
                        <div className="w-16 h-16 mx-auto mb-8 bg-slate-50 rounded-2xl p-3 border border-slate-100"><LogoImage className="w-full h-full"/></div>
                        <h2 className="font-cinzel text-xl font-black text-slate-900 mb-8 text-center uppercase tracking-widest">Staff Vault</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <input type="text" placeholder="Username" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                            <input type="password" placeholder="Vault Key" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/10" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                            <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <LayoutDashboard className="w-4 h-4"/>} Authorize
                            </button>
                        </form>
                        <button onClick={() => setView('LOGIN')} className="mt-8 w-full text-[10px] text-slate-400 font-black uppercase flex items-center justify-center gap-2 hover:text-blue-600 transition-colors"><ArrowLeft className="w-3 h-3" /> Return Home</button>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-screen bg-white p-4 pb-20 max-w-lg mx-auto animate-in slide-in-from-bottom-10 duration-700">
                    <header className="flex items-center justify-between mb-10 mt-6 px-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-sm"><LogoImage className="w-full h-full" /></div>
                        <div className="text-center">
                            <p className="text-blue-600 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Mithran Elite</p>
                            <h1 className="font-cinzel text-2xl font-black text-slate-900">Member Hub</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-red-600 transition-all"><LogOut className="w-5 h-5" /></button>
                    </header>
                    <div className="px-1"><MembershipCard customer={currentCustomer} /></div>
                    <div className="bg-white rounded-[3.5rem] p-12 mt-10 border border-slate-100 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                        <h3 className="font-cinzel text-sm font-black text-slate-900 mb-10 flex justify-center items-center gap-3"><Sparkles className="w-4 h-4 text-blue-600" /> MAGIC COLLECTION</h3>
                        <div className="flex justify-between items-center px-2 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                        <div className="mt-10 px-6 py-2 bg-blue-50 rounded-full inline-block">
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{currentCustomer.stamps} of 5 Balls Found</p>
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
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="max-w-md w-full relative animate-in zoom-in duration-300 flex flex-col items-center">
                        <button onClick={() => setPreviewCustomer(null)} className="absolute -top-16 right-0 text-white p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-10 h-10" /></button>
                        <div className="w-full"><MembershipCard customer={previewCustomer} /></div>
                        <div className="mt-10 flex gap-4 w-full px-6">
                            <button onClick={handleDownloadCard} disabled={isSyncing} className="flex-1 bg-white text-slate-900 border border-slate-100 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-50 transition-all disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} Save High-Res Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
