
import React, { useState, useEffect } from 'react';
import { 
    User, 
    Shield, 
    QrCode, 
    Download, 
    Share2, 
    Plus, 
    Minus, 
    History, 
    LogOut, 
    Search, 
    Trash2, 
    Database, 
    Camera,
    Gift,
    Trophy
} from 'lucide-react';
import { AppView, Customer } from './types';
import { storageService } from './services/storageService';
import { getRankInfo } from './constants';
import DragonBall from './components/DragonBall';
import Scanner from './components/Scanner';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [adminUser, setAdminUser] = useState<boolean>(false);
    const [loginInput, setLoginInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');

    useEffect(() => {
        setCustomers(storageService.getCustomers());
    }, [view]);

    const handleLogin = () => {
        const customer = storageService.findCustomer(loginInput);
        if (customer) {
            setCurrentCustomer(customer);
            setView('CUSTOMER_DASHBOARD');
        } else {
            alert('Customer not found or account deactivated.');
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setAdminUser(true);
        setView('ADMIN_DASHBOARD');
    };

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) return;
        storageService.addCustomer(newName, newMobile);
        setNewName('');
        setNewMobile('');
        setCustomers(storageService.getCustomers());
        alert('Customer added successfully!');
    };

    const updateStamps = (id: number, delta: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        
        let newStamps = customer.stamps + delta;
        if (newStamps < 0) newStamps = 0;
        if (newStamps > 6) newStamps = 6;

        storageService.updateCustomer(id, { 
            stamps: newStamps,
            lifetime_stamps: delta > 0 ? customer.lifetime_stamps + 1 : customer.lifetime_stamps
        });
        setCustomers(storageService.getCustomers());
    };

    const handleClaimTier1 = (id: number) => {
        storageService.updateCustomer(id, { tier_1_claimed: true });
        setCustomers(storageService.getCustomers());
        alert('Mini Reward Claimed!');
    };

    const handleRedeem = (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        
        storageService.updateCustomer(id, {
            stamps: 0,
            redeems: customer.redeems + 1,
            tier_1_claimed: false // Reset for new card
        });
        setCustomers(storageService.getCustomers());
        alert('Grand Reward Redeemed! Card reset.');
    };

    const handleSoftDelete = (id: number) => {
        if (confirm('Are you sure you want to deactivate this customer?')) {
            storageService.deleteCustomerSoft(id);
            setCustomers(storageService.getCustomers());
        }
    };

    const handleHardDelete = (id: number) => {
        const pw = prompt('Enter admin password to permanently delete:');
        if (pw === 'admin') {
            storageService.deleteCustomerHard(id);
            setCustomers(storageService.getCustomers());
        } else {
            alert('Invalid password.');
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Customer ID', 'Name', 'Mobile', 'Stamps', 'Redeems', 'Lifetime', 'Deleted'];
        const rows = customers.map(c => [
            c.id, c.customer_id, c.name, c.mobile, c.stamps, c.redeems, c.lifetime_stamps, c.is_deleted
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `msc_loyalty_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl text-center fairy-border">
                <h1 className="font-cinzel text-3xl font-bold text-blue-900 mb-2">MITHRAN</h1>
                <p className="font-cinzel text-sm tracking-[0.3em] text-blue-400 mb-8 uppercase">Snacks Corner</p>
                <div className="space-y-4 mb-8">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Customer ID or Mobile"
                            className="w-full bg-white/50 border border-blue-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-blue-300"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                        />
                        <button onClick={() => setShowScanner(true)} className="absolute right-3 top-3 p-2 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/30">
                            <QrCode className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={handleLogin} className="w-full bg-blue-600 text-white font-cinzel tracking-widest py-4 rounded-xl shadow-xl shadow-blue-600/20">
                        ENTER STATUS WORLD
                    </button>
                </div>
                <button onClick={() => setView('ADMIN_LOGIN')} className="text-blue-400 text-xs hover:underline uppercase tracking-tighter">Admin Portal</button>
            </div>
            {showScanner && <Scanner onScan={(data) => { setLoginInput(data); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
        </div>
    );

    const renderAdminLogin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="font-cinzel text-2xl font-bold text-blue-900 mb-8">ADMIN ACCESS</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <input type="password" placeholder="Master Key" className="w-full bg-white/50 border border-blue-200 rounded-xl px-5 py-4 outline-none" required />
                    <button type="submit" className="w-full bg-blue-900 text-white font-cinzel tracking-widest py-4 rounded-xl shadow-xl shadow-blue-900/20">AUTHORIZE</button>
                    <button type="button" onClick={() => setView('LOGIN')} className="w-full text-blue-400 text-sm mt-4">Back to Customer Login</button>
                </form>
            </div>
        </div>
    );

    const renderCustomerDashboard = () => {
        if (!currentCustomer) return null;
        const rankInfo = getRankInfo(currentCustomer.redeems);

        return (
            <div className="min-h-screen p-4 pb-20 max-w-lg mx-auto">
                <div className="mt-8 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Player Status</p>
                        <h1 className="font-cinzel text-2xl font-bold text-blue-900">{currentCustomer.name}</h1>
                    </div>
                    <button onClick={() => { setView('LOGIN'); setCurrentCustomer(null); }} className="p-2 text-blue-400">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="glass-panel rounded-3xl p-6 mb-6 flex items-center gap-4 border-2 border-white relative overflow-hidden">
                    <div className={`w-16 h-16 ${rankInfo.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                        <Shield className={`w-10 h-10 ${rankInfo.color}`} />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase ${rankInfo.color} opacity-70`}>Current Rank</p>
                        <h2 className={`font-cinzel text-3xl font-bold ${rankInfo.color}`}>{rankInfo.rank}</h2>
                        <p className="text-xs text-blue-400">Redeems: {currentCustomer.redeems} | Total: {currentCustomer.lifetime_stamps}</p>
                    </div>
                </div>

                {/* Reward Alert */}
                <div className="mb-6 space-y-2">
                    {currentCustomer.stamps >= 3 && !currentCustomer.tier_1_claimed && (
                        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
                            <Gift className="w-6 h-6" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase">Mini Treat Unlocked!</p>
                                <p className="text-sm font-cinzel">CLAIM 10% OFF AT COUNTER</p>
                            </div>
                        </div>
                    )}
                    {currentCustomer.stamps === 6 && (
                        <div className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-pulse">
                            <Trophy className="w-6 h-6" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase">Grand Prize Unlocked!</p>
                                <p className="text-sm font-cinzel">CLAIM FREE SNACK AT COUNTER</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-panel rounded-3xl p-8 mb-6 border-2 border-white shadow-xl">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="font-cinzel text-lg text-blue-900">COLLECTION</h3>
                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{currentCustomer.stamps}/6 BALLS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-y-12 gap-x-4 justify-items-center">
                        {[...Array(6)].map((_, i) => (
                            <DragonBall key={i} index={i} filled={i < currentCustomer.stamps} />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 border border-white">
                        <Download className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-bold text-blue-900">SAVE ID</span>
                    </button>
                    <button className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 border border-white">
                        <Share2 className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-bold text-blue-900">SHARE</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderAdminDashboard = () => {
        const filtered = customers.filter(c => 
            (view === 'ADMIN_HISTORY' || !c.is_deleted) && 
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery) || c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return (
            <div className="min-h-screen bg-slate-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="font-cinzel text-2xl font-bold text-blue-900">ADMIN CONTROL</h1>
                            <p className="text-xs text-blue-400 uppercase tracking-widest">Mithran Loyalty Engine</p>
                        </div>
                        <button onClick={() => { setView('LOGIN'); setAdminUser(false); }} className="flex items-center gap-2 text-red-500 font-bold text-xs border bg-white px-4 py-2 rounded-xl">
                            <LogOut className="w-4 h-4" /> Exit
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        <button onClick={() => setView('ADMIN_DASHBOARD')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 ${view === 'ADMIN_DASHBOARD' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900 border-blue-100'}`}>
                            <User className="w-6 h-6" /> <span className="text-xs font-bold uppercase">Active</span>
                        </button>
                        <button onClick={() => setView('ADMIN_HISTORY')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 ${view === 'ADMIN_HISTORY' ? 'bg-blue-600 text-white' : 'bg-white text-blue-900 border-blue-100'}`}>
                            <History className="w-6 h-6" /> <span className="text-xs font-bold uppercase">Archive</span>
                        </button>
                        <button onClick={exportCSV} className="p-4 rounded-2xl border bg-white text-blue-900 border-blue-100 flex flex-col items-center gap-2">
                            <Database className="w-6 h-6" /> <span className="text-xs font-bold uppercase">Export</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-blue-100 mb-8">
                        <h3 className="font-cinzel text-lg mb-4 text-blue-900">NEW ENTRY</h3>
                        <form onSubmit={handleAddCustomer} className="flex flex-col md:flex-row gap-4">
                            <input type="text" placeholder="Name" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            <input type="tel" placeholder="Mobile" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} required />
                            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest uppercase">REGISTER</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-3xl border border-blue-100 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-blue-50 flex items-center gap-4 bg-slate-50">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="Search..." className="bg-transparent flex-1 outline-none text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-blue-50/50 text-blue-900 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Stamps</th>
                                        <th className="px-6 py-4">Rewards</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-50">
                                    {filtered.map(c => (
                                        <tr key={c.id} className={`${c.is_deleted ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-blue-900">{c.name}</div>
                                                <div className="text-[10px] text-blue-400">{c.customer_id} • {c.mobile}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateStamps(c.id, -1)} className="p-1 text-slate-400"><Minus className="w-4 h-4"/></button>
                                                    <span className="font-cinzel text-lg font-bold">{c.stamps}</span>
                                                    <button onClick={() => updateStamps(c.id, 1)} className="p-1 text-slate-400"><Plus className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {c.stamps >= 3 && (
                                                        <button 
                                                            disabled={c.tier_1_claimed}
                                                            onClick={() => handleClaimTier1(c.id)}
                                                            className={`text-[10px] px-2 py-1 rounded font-bold ${c.tier_1_claimed ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}
                                                        >
                                                            {c.tier_1_claimed ? 'MINI CLAIMED' : 'CLAIM MINI'}
                                                        </button>
                                                    )}
                                                    {c.stamps === 6 && (
                                                        <button 
                                                            onClick={() => handleRedeem(c.id)}
                                                            className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded font-bold"
                                                        >
                                                            GRAND REDEEM
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {view === 'ADMIN_HISTORY' ? (
                                                        <button onClick={() => handleHardDelete(c.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                    ) : (
                                                        <button onClick={() => handleSoftDelete(c.id)} className="p-2 text-slate-400"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen">
            {view === 'LOGIN' && renderLogin()}
            {view === 'ADMIN_LOGIN' && renderAdminLogin()}
            {view === 'CUSTOMER_DASHBOARD' && renderCustomerDashboard()}
            {(view === 'ADMIN_DASHBOARD' || view === 'ADMIN_HISTORY') && adminUser && renderAdminDashboard()}
        </div>
    );
};

export default App;
