
import React, { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Download, Plus, Minus, LogOut, 
    Search, Trash2, ArrowLeft, UserPlus, 
    RefreshCw, Sparkles, CreditCard, X, 
    Archive, RotateCcw, Monitor, Smartphone, 
    LayoutDashboard, Share2, FileDown, FileUp
} from 'lucide-react';
import { AppView, Customer, Admin } from './types';
import { storageService } from './services/storageService';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';
import MembershipCard from './components/MembershipCard';
import * as htmlToImage from 'html-to-image';

// Premium MSC Logo Component - Optimized "MSC" text fit and texture
export const MSCLogo = ({ className = "w-14 h-14" }: { className?: string }) => (
  <div className={`${className} bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-[22%] flex items-center justify-center border-2 border-slate-700 shadow-2xl overflow-hidden flex-shrink-0 relative group`}>
    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
    <span className="relative z-10 text-white font-cinzel font-black text-[45%] leading-none tracking-tighter select-none drop-shadow-md">MSC</span>
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
        link.setAttribute("download", `database_${new Date().toISOString().split('T')[0]}.csv`);
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

    const handleDownloadCard = async () => {
        const node = document.getElementById('membership-card');
        if (!node) return;
        setIsSyncing(true);
        try {
            // High quality output
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
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center w-full">
                <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 shadow-sm w-full flex justify-center">
                    <div className="max-w-7xl w-full px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MSCLogo className="w-10 h-10" />
                            <h1 className="font-cinzel text-lg font-black text-slate-900 tracking-tight">ADMIN</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Added missing FileDown and FileUp icons to imports and using them here */}
                            <button onClick={handleExportCSV} className="p-2 text-slate-700 hover:text-blue-700 transition-all"><FileDown className="w-5 h-5"/></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-700 hover:text-blue-700 transition-all"><FileUp className="w-5 h-5"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button onClick={() => { setAdminUser(null); setView('LOGIN'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-red-700 transition-all">Sign Out</button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 space-y-6 flex flex-col items-center w-full">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm w-full">
                            <h3 className="font-cinzel text-md font-black text-slate-900 mb-6 flex items-center justify-center gap-2 uppercase tracking-wider"><UserPlus className="w-5 h-5 text-blue-700" /> New Enrollment</h3>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                setIsSyncing(true);
                                storageService.addCustomer(newName, newMobile).then(() => { 
                                    setNewName(''); setNewMobile(''); refreshCustomerList(); 
                                }).finally(() => setIsSyncing(false)); 
                            }} className="space-y-4">
                                <input type="text" placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:border-blue-600 transition-all text-center" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                <input type="tel" placeholder="Mobile" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none focus:border-blue-600 transition-all text-center" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                                <button className="w-full btn-magic py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95" disabled={isSyncing}>
                                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Enroll
                                </button>
                            </form>
                        </div>

                        <button 
                            onClick={() => setShowArchive(!showArchive)}
                            className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all shadow-sm ${showArchive ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-900 hover:border-blue-600'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Archive className="w-5 h-5" />
                                <span className="font-black text-[10px] uppercase tracking-widest">{showArchive ? 'Viewing Archive' : 'Archive'}</span>
                            </div>
                            <span className={`${showArchive ? 'bg-white/20' : 'bg-slate-100'} px-3 py-1 rounded-full text-[10px] font-black`}>
                                {customers.filter(c => c.is_deleted).length}
                            </span>
                        </button>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px] w-full">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-center">
                            <div className="relative w-full max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search members..." 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-12 py-3 text-slate-900 font-bold outline-none focus:border-blue-600 transition-all text-center text-sm" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button onClick={() => setShowScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><QrCode className="w-4 h-4"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] text-slate-900 font-black uppercase tracking-widest border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Identity</th>
                                        <th className="px-6 py-4 text-center">Balls</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-20 text-center text-slate-300 font-cinzel">No records</td>
                                        </tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900 font-bold text-sm leading-none mb-1">{c.name}</div>
                                                    <div className="text-[10px] text-blue-800 font-black tracking-wider uppercase">{c.customer_id}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!c.is_deleted ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.max(0, c.stamps - 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white transition-all"><Minus className="w-3.5 h-3.5"/></button>
                                                            <span className="font-cinzel text-lg font-black w-6 text-center">{c.stamps}</span>
                                                            <button onClick={() => storageService.updateCustomer(c.id, { stamps: Math.min(5, c.stamps + 1) }).then(refreshCustomerList)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white transition-all"><Plus className="w-3.5 h-3.5"/></button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">Deleted</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setPreviewCustomer(c)} className="p-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all" title="Preview Card"><CreditCard className="w-4 h-4"/></button>
                                                        {c.is_deleted ? (
                                                            <button onClick={async () => { await storageService.updateCustomer(c.id, { is_deleted: false }); refreshCustomerList(); }} className="p-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-700 hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button>
                                                        ) : (
                                                            <button onClick={async () => { if(confirm(`Archive ${c.name}?`)) { await storageService.deleteCustomerSoft(c.id); refreshCustomerList(); } }} className="p-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Archive className="w-4 h-4"/></button>
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
        <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center overflow-x-hidden">
            {view === 'LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center w-full max-w-lg">
                    <div className="w-full p-12 sm:p-16 rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.12)] relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-700 to-cyan-500"></div>
                        <button onClick={handleLogoClick} className="mb-12 w-32 h-32 active:scale-95 transition-transform duration-500 flex items-center justify-center">
                            <MSCLogo className="w-full h-full" />
                        </button>
                        <h1 className="font-cinzel text-4xl font-black text-slate-900 mb-2 tracking-tighter">MITHRAN</h1>
                        <p className="font-magic text-xs tracking-[0.4em] text-blue-700 mb-12 uppercase font-black">Elite Hub</p>
                        
                        <div className="space-y-6 w-full">
                            <div className="space-y-2 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Portal Key</label>
                                <div className="relative w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Mobile or ID" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all text-center placeholder:text-slate-300" 
                                        value={loginInput} 
                                        onChange={(e) => setLoginInput(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleCustomerLogin()} 
                                    />
                                    <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-700 hover:text-white transition-all"><QrCode className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <button onClick={() => handleCustomerLogin()} disabled={isSyncing} className="w-full btn-magic py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'ADMIN_LOGIN' && (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 w-full">
                    <div className="w-full max-sm p-12 rounded-[3rem] bg-white border border-slate-200 shadow-xl flex flex-col items-center">
                        <MSCLogo className="w-20 h-20 mb-8" />
                        <h2 className="font-cinzel text-xl font-black text-slate-900 mb-10 text-center uppercase tracking-widest border-b border-slate-50 pb-4 w-full">Security Check</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-5 w-full">
                            <input type="text" placeholder="Username" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:border-blue-600 text-center" onChange={(e) => setAdminLoginData({...adminLoginData, username: e.target.value})} required />
                            <input type="password" placeholder="Passkey" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:border-blue-600 text-center" onChange={(e) => setAdminLoginData({...adminLoginData, password: e.target.value})} required />
                            <button className="w-full btn-magic py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl mt-2" disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : "Authorize"}
                            </button>
                        </form>
                        <button onClick={() => setView('LOGIN')} className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                    </div>
                </div>
            )}

            {view === 'CUSTOMER_DASHBOARD' && currentCustomer && (
                <div className="min-h-screen bg-white p-6 pb-24 max-w-lg w-full flex flex-col items-center animate-in fade-in duration-700">
                    <header className="flex items-center justify-between mb-12 mt-6 w-full">
                        <MSCLogo className="w-14 h-14 shadow-lg" />
                        <div className="text-center">
                            <p className="text-blue-700 text-[10px] font-black uppercase tracking-[0.4em] mb-1 leading-none">MITHRAN</p>
                            <h1 className="font-cinzel text-2xl font-black text-slate-900 tracking-tight leading-none">Member</h1>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-3 bg-white text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white transition-all flex-shrink-0"><LogOut className="w-5 h-5" /></button>
                    </header>
                    
                    <div className="w-full flex justify-center drop-shadow-[0_32px_64px_rgba(37,99,235,0.2)]">
                        <MembershipCard customer={currentCustomer} />
                    </div>

                    <div className="bg-white rounded-[3rem] p-12 mt-12 border border-slate-50 shadow-xl text-center w-full flex flex-col items-center">
                        <h3 className="font-cinzel text-xs font-black text-slate-950 mb-10 flex justify-center items-center gap-3 tracking-widest uppercase"><Sparkles className="w-5 h-5 text-blue-700" /> Collection</h3>
                        <div className="flex justify-between items-center px-2 mb-4 w-full max-w-xs">
                            {[...Array(5)].map((_, i) => (
                                <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                            ))}
                        </div>
                        <div className="mt-10 px-6 py-2.5 bg-blue-50 rounded-full inline-block border border-blue-100">
                             <p className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em]">{currentCustomer.stamps} / 5 Collected</p>
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
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
                    <div className="max-w-[480px] w-full flex flex-col items-center animate-in zoom-in-95 duration-500 relative">
                        <button 
                            onClick={() => setPreviewCustomer(null)} 
                            className="absolute -top-12 right-0 text-white hover:bg-white/10 p-3 rounded-full transition-all z-50"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        
                        <div className="w-full flex justify-center mb-10">
                            {/* Standard Credit Card size visualization */}
                            <div className="w-full shadow-2xl rounded-3xl overflow-hidden ring-4 ring-white/10">
                                <MembershipCard customer={previewCustomer} />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button 
                                onClick={handleDownloadCard} 
                                disabled={isSyncing} 
                                className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5" />} Save JPG
                            </button>
                            <button 
                                onClick={handleShareCard} 
                                disabled={isSyncing} 
                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Share2 className="w-5 h-5" />} Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
