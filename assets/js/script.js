// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GLOBAL ---
let allCustomers = [];
let html5QrcodeScanner;

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    // Auth Listener
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') toggleAuth('newpass');
    });

    // Check page
    if(document.getElementById('customerListContainer')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            loadCustomers();
        }
    }
    
    if(document.getElementById('fullCustomerTableBody')) {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) window.location.href = 'dashboard_msc.html';
        else loadAllCustomersTable();
    }
});

// --- AUTH ---
function toggleAuth(view) {
    document.querySelectorAll('#loginForm, #regForm, #resetForm, #newPassForm').forEach(el => el.classList.add('hidden'));
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
    if(view === 'newpass') document.getElementById('newPassForm').classList.remove('hidden');
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const { data, error } = await supabase.from('admin_profiles').select('email').eq('username', user).single();
    
    if(error || !data) return alert("User not found.");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if(signInError) return alert("Wrong Password");

    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadCustomers();
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    if(!email || !user || !pass) return alert("Fill all fields");

    const { data: authData, error } = await supabase.auth.signUp({ email, password: pass });
    if(error) return alert(error.message);

    await supabase.from('admin_profiles').insert([{ id: authData.user.id, username: user, email: email }]);
    alert("Registered!"); toggleAuth('login');
}

async function logout() { await supabase.auth.signOut(); window.location.reload(); }

// --- DASHBOARD ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(tab === 'list') {
        document.getElementById('viewList').classList.remove('hidden');
        document.getElementById('viewAdd').classList.add('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('searchBar').value = '';
        renderList(allCustomers);
    } else {
        document.getElementById('viewList').classList.add('hidden');
        document.getElementById('viewAdd').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// --- DATA ---
async function loadCustomers() {
    const container = document.getElementById('customerListContainer');
    if(!container) return;
    
    container.innerHTML = '<p class="text-center">Loading...</p>';
    const { data } = await supabase.from('customers').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
    
    if(data) {
        allCustomers = data;
        renderList(data);
    }
}

function renderList(data) {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';
    if(data.length === 0) { container.innerHTML = '<p class="text-center" style="color:#777; margin-top:20px;">No customers found.</p>'; return; }
    data.forEach(cust => container.appendChild(createCustomerRow(cust)));
}

function createCustomerRow(cust) {
    let circlesHtml = '';
    for(let i=1; i<=4; i++) {
        let active = i <= cust.stamps ? 'filled' : '';
        circlesHtml += `<div id="circle-${cust.id}-${i}" class="msc-circle ${active}">MSC</div>`;
    }

    let controls = cust.stamps >= 4 
        ? `<button id="btn-${cust.id}" class="btn-redeem" onclick="redeemGift(${cust.id})">Redeem 🎁</button>`
        : `<button id="btn-${cust.id}" class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${cust.id}, 1)">+</button>`;

    let lastVisit = cust.last_visited ? new Date(cust.last_visited).toLocaleDateString() : 'Never';

    const div = document.createElement('div');
    div.className = 'customer-item';
    div.id = `cust-row-${cust.id}`;
    div.innerHTML = `
        <div class="customer-top">
            <div>
                <div class="cust-name">
                    <span id="name-txt-${cust.id}">${cust.name}</span>
                    <i class="fas fa-pencil-alt" style="font-size:0.8rem; margin-left:5px; color:#aaa; cursor:pointer;" onclick="editNamePrompt(${cust.id}, '${cust.name}')"></i>
                </div>
                <div class="cust-meta">${cust.mobile} | ${cust.customer_id_code}</div>
                <div class="last-visit">Last: ${lastVisit}</div>
            </div>
            <div>
                <button class="btn-secondary" onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">ID</button>
                <button class="btn-danger" style="margin-left:5px;" onclick="softDeleteCust(${cust.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="stamp-row">
            <button class="ctrl-btn btn-minus" onclick="updateStampOptimistic(${cust.id}, -1)">-</button>
            <div class="circles-wrapper">${circlesHtml}</div>
            <div id="action-wrapper-${cust.id}">${controls}</div>
        </div>
    `;
    return div;
}

// --- ACTIONS ---
async function editNamePrompt(id, oldName) {
    const newName = prompt("Edit Customer Name:", oldName);
    if(newName && newName !== oldName) {
        document.getElementById(`name-txt-${id}`).innerText = newName;
        await supabase.from('customers').update({ name: newName }).eq('id', id);
    }
}

async function softDeleteCust(id) {
    if(confirm("Move to Archive?")) {
        document.getElementById(`cust-row-${id}`).remove();
        await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
    }
}

async function updateStampOptimistic(id, change) {
    const cust = allCustomers.find(c => c.id === id);
    if(!cust) return;
    
    let newS = cust.stamps + change;
    if(newS < 0) newS = 0; if(newS > 4) newS = 4;
    cust.stamps = newS;

    let visit = cust.last_visited;
    if(change > 0) visit = new Date().toISOString();

    // UI Update
    for(let i=1; i<=4; i++) {
        const circle = document.getElementById(`circle-${id}-${i}`);
        if(circle) i <= newS ? circle.classList.add('filled') : circle.classList.remove('filled');
    }
    const wrapper = document.getElementById(`action-wrapper-${id}`);
    if(newS >= 4) wrapper.innerHTML = `<button class="btn-redeem" onclick="redeemGift(${id})">Redeem 🎁</button>`;
    else wrapper.innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;

    await supabase.from('customers').update({ stamps: newS, last_visited: visit }).eq('id', id);
}

async function redeemGift(id) {
    if(!confirm("Redeem Gift?")) return;
    const cust = allCustomers.find(c => c.id === id);
    
    // UI Reset
    for(let i=1; i<=4; i++) document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    
    await supabase.from('customers').update({ stamps: 0, redeems: (cust.redeems || 0) + 1, last_visited: new Date().toISOString() }).eq('id', id);
}

// --- CSV IMPORT / EXPORT (RESTORED) ---
function exportData() {
    if(allCustomers.length === 0) return alert("No data to export");
    const csv = Papa.unparse(allCustomers);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    link.download = 'customers_backup.csv';
    link.click();
}

function importData(input) {
    if(!input.files[0]) return;
    Papa.parse(input.files[0], {
        header: true,
        complete: async (res) => {
            const rows = res.data.filter(r => r.name && r.customer_id_code);
            if(rows.length > 0) {
                const now = new Date().toISOString();
                const { error } = await supabase.from('customers').upsert(rows.map(r => ({
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, 
                    stamps: r.stamps || 0, redeems: r.redeems || 0, last_visited: r.last_visited || now, is_deleted: false
                })), { onConflict: 'customer_id_code'});
                if(!error) { alert("Imported Successfully!"); loadCustomers(); }
                else alert("Error importing: " + error.message);
            }
        }
    });
}

// --- ARCHIVE PAGE (PDF DOWNLOAD) ---
async function loadAllCustomersTable() {
    const tbody = document.getElementById('fullCustomerTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    
    if(data) {
        tbody.innerHTML = '';
        data.forEach(cust => {
            const badge = cust.is_deleted ? '<span class="status-badge badge-deleted">Deleted</span>' : '<span class="status-badge badge-active">Active</span>';
            const tr = document.createElement('tr');
            if(cust.is_deleted) tr.className = 'deleted-row';
            tr.innerHTML = `
                <td>${cust.name}</td>
                <td>${cust.mobile}</td>
                <td>${cust.customer_id_code}</td>
                <td>${badge}</td>
                <td><button class="btn-secondary" style="padding:4px 8px; font-size:0.7rem;" onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">View</button></td>
                <td>
                    ${cust.is_deleted ? 
                        `<button class="btn-restore" onclick="restore(${cust.id})">Restore</button> <button class="btn-danger" onclick="permDelete(${cust.id})">X</button>` : 
                        `<button class="btn-danger" onclick="softDeleteFromTable(${cust.id})">Del</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function restore(id) { await supabase.from('customers').update({ is_deleted: false }).eq('id', id); loadAllCustomersTable(); }
async function permDelete(id) { if(confirm("Permanent Delete?")) { await supabase.from('customers').delete().eq('id', id); loadAllCustomersTable(); }}
async function softDeleteFromTable(id) { await supabase.from('customers').update({ is_deleted: true }).eq('id', id); loadAllCustomersTable(); }

function downloadArchivePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Mithran Snacks - Customer Archive", 14, 15);
    
    doc.autoTable({
        html: '.data-table',
        startY: 20,
        theme: 'striped',
        headStyles: { fillColor: [0, 86, 179] }
    });
    
    doc.save('mithran_customers_archive.pdf');
}

// --- MODALS & SHARE ---
function openModal(name, mobile, id) {
    document.getElementById('modalName').innerText = name.toUpperCase();
    document.getElementById('modalMobile').innerText = mobile;
    document.getElementById('modalID').innerText = id;
    generateQR(id, 'modalQR');
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

function generateQR(text, elId) {
    const el = document.getElementById(elId);
    if(el) { el.innerHTML = ''; new QRCode(el, { text: text, width: 64, height: 64 }); }
}

function downloadModalCard() {
    html2canvas(document.querySelector("#modalIdCard"), { scale: 5 }).then(c => {
        const a = document.createElement('a'); a.download = 'ID_Card.jpg'; a.href = c.toDataURL('image/jpeg', 1.0); a.click();
    });
}

async function shareIdCard() {
    const btn = document.getElementById('shareBtn');
    btn.innerHTML = 'Generating...';
    try {
        const canvas = await html2canvas(document.querySelector("#modalIdCard"), { scale: 3 });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "id_card.jpg", { type: "image/jpeg" });
            if(navigator.share) {
                await navigator.share({ files: [file], title: 'ID Card' });
            } else {
                downloadModalCard();
            }
            btn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
        }, 'image/jpeg');
    } catch(e) { btn.innerHTML = 'Error'; }
}

// --- CUSTOMER PAGE SEARCH ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID or Mobile");
    
    const { data } = await supabase.from('customers').select('*').or(`customer_id_code.eq.${input},mobile.eq.${input}`).single();
    
    if(!data) alert("Not found");
    else {
        document.getElementById('resultBox').classList.remove('hidden');
        document.getElementById('resName').innerText = data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        document.getElementById('pubCardName').innerText = data.name;
        document.getElementById('pubCardMobile').innerText = data.mobile;
        document.getElementById('pubCardID').innerText = data.customer_id_code;
        generateQR(data.customer_id_code, 'pubCardQR');
    }
}
