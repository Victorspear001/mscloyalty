
import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, Flame, 
    Mail, Lock, User, Gift, FileUp, FileDown,
    Archive, RotateCcw, Monitor, Smartphone
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
    const [adminRegData, setAdminRegData] = useState({ email: '', username: '', password: '', securityQuestion: 'Favorite Mithran Snack?', securityAnswer: '' });
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');

    const refreshCustomerList = async () => {
        setIsSyncing(true);
        try {
            const list = await storageService.fetchCustomers();
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
            alert('A mystical error occurred.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportCSV = () => {
        if (customers.length === 0) return;
        const headers = ['ID', 'Name', 'Mobile', 'MemberID', 'Stamps', 'Redeems', 'LifetimeStamps', 'Created'];
        const rows = customers.map(c => [
            c.id, c.name, c.mobile, c.customer_id, c.stamps, c.redeems, c.lifetime_stamps, c.created_at
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
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
            let successCount = 0;
            for (const line of lines) {
                const [id, name, mobile] = line.split(',');
                if (name && mobile) {
                    try {
                        await storageService.addCustomer(name.trim(), mobile.trim());
                        successCount++;
                    } catch (err) {
                        console.error("Import error for line:", line);
                    }
                }
            }
            alert(`Import finished: ${successCount} members added.`);
            refreshCustomerList();
        };
        reader.readAsText(file);
    };

    // Fix: Added handleRedeem to manage customer reward redemption
    const handleRedeem = async (customer: Customer) => {
        if (!confirm(`Redeem reward for ${customer.name}?`)) return;
        setIsSyncing(true);
        try {
            await storageService.updateCustomer(customer.id, {
                stamps: 0,
                redeems: (customer.redeems || 0) + 1,
                lifetime_stamps: (customer.lifetime_stamps || 0) + 1
            });
            await refreshCustomerList();
            alert('Reward redeemed successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to redeem reward.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Fix: Added handleAdminLogin to process staff authentication
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const admin = await storageService.findAdmin(adminLoginData.username);
            if (admin && admin.password === adminLoginData.password) {
                setAdminUser(admin);
                setView('ADMIN_DASHBOARD');
            } else {
                alert('Invalid staff credentials.');
            }
        } catch (error) {
            alert('Vault access error.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Fix: Added handleDownloadCard to export membership card as PNG
    const handleDownloadCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            const dataUrl = await htmlToImage.toPng(node, {
                backgroundColor: '#ffffff',
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `mithran-card-${previewCustomer?.customer_id || 'member'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Download error:', error);
            alert('Could not capture the card image.');
        } finally {
            setIsSyncing(false);
        }
    };

    const LogoImage = ({ className }: { className?: string }) => (
        <img 
            src={COMPANY_LOGO_URL} 
            alt="Mithran" 
            className={`${className} object-contain`}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=LOGO'; }}
        />
    );

    const renderAdminDashboard = () => {
        const activeCustomers = customers.filter(c => !c.is_deleted);
        const archivedCustomers = customers.filter(c => c.is_deleted);
        
        const displayList = showArchive ? archivedCustomers : activeCustomers;
        const filtered = displayList.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.mobile.includes(searchQuery) || 
            c.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 p-2 shadow-sm"><LogoImage className="w-full h-full" /></div>
                            <div>
                                <h1 className="font-cinzel text-xl font-black text-slate-900 leading-none">STAFF HUB</h1>
                                <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mt-1">Administrator Access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportCSV} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all" title="Export CSV"><FileDown className="w-5 h-5"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all" title="Import CSV"><FileUp className="w-5 h-5"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest"><LogOut className="w-4 h-4" /> Sign Out</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                            <h3 className="font-cinzel text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><UserPlus className="w-6 h-6 text-blue-600" /> New Member</h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                </div>
                                <button className="w-full btn-magic py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Enroll Now
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Archive className={`w-5 h-5 ${showArchive ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-xs font-bold text-slate-700">View Archive</span>
                            </div>
                            <button 
                                onClick={() => setShowArchive(!showArchive)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${showArchive ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showArchive ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search archives..." 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-14 py-3.5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                    />
                                    <button 
                                        onClick={() => setShowScanner(true)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                                    >
                                        <QrCode className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {showArchive ? 'Archived Records' : 'Active Members'}
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-4">Identity</th>
                                            <th className="px-8 py-4">Progress</th>
                                            <th className="px-8 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-cinzel italic tracking-widest">No souls found in this realm</td>
                                            </tr>
                                        ) : (
                                            filtered.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="text-slate-900 font-bold">{c.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-black tracking-wider">{c.customer_id} • {c.mobile}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {showArchive ? (
                                                            <span className="text-[10px] font-black uppercase text-slate-400">Archived on {new Date(c.created_at).toLocaleDateString()}</span>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors border border-slate-200"><Minus className="w-4 h-4"/></button>
                                                                <span className="font-cinzel text-lg font-black text-blue-600 w-4 text-center">{c.stamps}</span>
                                                                <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors border border-slate-200"><Plus className="w-4 h-4"/></button>
                                                                {c.stamps === 5 && (
                                                                    <button onClick={() => handleRedeem(c)} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">Redeem</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {showArchive ? (
                                                                <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => setPreviewCustomer(c)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><CreditCard className="w-4 h-4"/></button>
                                                                    <button onClick={async () => { if(confirm('Archive this member?')) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
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
                    </div>
                </main>
            </div>
        );
    };

    return (
        <div className="min-h-[100dvh]">
            {view === 'LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 text-center">
                    <div className="glass-card w-full max-w-sm p-10 sm:p-12 rounded-[3rem] animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                        <button onClick={handleLogoClick} className="mb-8 mx-auto w-28 h-28 bg-white rounded-[2rem] p-4 border border-blue-100 shadow-xl active:scale-95 transition-all flex items-center justify-center">
                            <LogoImage className="w-full h-full" />
                        </button>
                        <h1 className="font-cinzel text-4xl font-black text-slate-900 mb-2">MITHRAN</h1>
                        <p className="font-magic text-xs tracking-[0.4em] text-blue-600 mb-10 uppercase font-black">Bright Fantasy Lounge</p>
                        
                        <div className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Member Portal</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Member ID or Mobile" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none text-slate-900 font-bold focus:border-blue-500 transition-all" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><QrCode className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Access Portal
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-6 opacity-40">
                        <div className="flex items-center gap-2"><Smartphone className="w-4 h-4"/> <span className="text-[10px] font-bold">MOBILE READY</span></div>
                        <div className="flex items-center gap-2"><Monitor className="w-4 h-4"/> <span className="text-[10px] font-bold">DESKTOP OPTIMIZED</span></div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4">
                    <div className="glass-card w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl">
                        <h2 className="font-cinzel text-xl font-black text-slate-900 mb-8 text-center uppercase tracking-widest">Staff Portal</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <input type="text" placeholder="Username" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                            <input type="password" placeholder="Staff Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                            <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-xl" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : 'Open Vault'}
                            </button>
                        </form>
                        <button onClick={() => setView('LOGIN')} className="mt-8 w-full text-[10px] text-slate-400 font-black uppercase flex items-center justify-center gap-2 hover:text-slate-900 transition-colors"><ArrowLeft className="w-3 h-3" /> Back to Gates</button>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-[100dvh] p-4 pb-20 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="flex items-center justify-between mb-8 mt-4 px-2">
                        <div className="w-12 h-12 bg-white rounded-xl p-2 border border-slate-200 shadow-sm"><LogoImage className="w-full h-full" /></div>
                        <div className="text-center">
                            <p className="text-blue-600 text-[8px] font-black uppercase tracking-widest">Premium Member</p>
                            <h1 className="font-cinzel text-xl font-black text-slate-900">Mithran Hub</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 transition-colors shadow-sm"><LogOut className="w-5 h-5" /></button>
                    </header>
                    <div className="px-1"><MembershipCard customer={currentCustomer} /></div>
                    <div className="bg-white rounded-[3rem] p-10 mt-10 border border-slate-100 shadow-xl relative overflow-hidden text-center">
                        <h3 className="font-cinzel text-sm font-black text-slate-900 mb-8 flex justify-center items-center gap-2"><Sparkles className="w-4 h-4 text-blue-600" /> DRAGON BALLS COLLECTION</h3>
                        <div className="flex justify-between items-center px-4 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">{currentCustomer.stamps} of 5 Collected</p>
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
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="max-w-md w-full relative animate-in zoom-in duration-300 flex flex-col items-center">
                        <button onClick={() => setPreviewCustomer(null)} className="absolute -top-16 right-0 text-white p-2 hover:scale-110 transition-all"><X className="w-10 h-10" /></button>
                        <MembershipCard customer={previewCustomer} />
                        <div className="mt-8 flex gap-4 w-full px-4">
                            <button onClick={handleDownloadCard} disabled={isSyncing} className="flex-1 bg-white text-slate-900 border border-slate-200 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-all disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} Save Card Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
