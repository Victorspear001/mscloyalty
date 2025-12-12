// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GLOBAL ---
let allCustomers = [];
let html5QrcodeScanner = null; // Scanner instance

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') toggleAuth('newpass');
    });

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

// --- FIXED SCANNER LOGIC ---
function initScanner() {
    // 1. Open Modal FIRST
    document.getElementById('scannerModal').classList.remove('hidden');
    document.getElementById('scanErrorMsg').innerText = "Starting Camera...";

    // 2. Wait for Modal Animation (Crucial fix for mobile browsers)
    setTimeout(() => {
        // If scanner exists, clear it
        if(html5QrcodeScanner) {
            html5QrcodeScanner.clear().catch(err => console.log(err));
        }

        // 3. Initialize Scanner
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        // 4. Render
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        document.getElementById('scanErrorMsg').innerText = "";
    }, 400); 
}

function onScanSuccess(decodedText) {
    // Stop scanning
    closeScanner();
    
    // Fill Search
    const searchBar = document.getElementById('searchBar');
    if(searchBar) {
        searchBar.value = decodedText;
        filterList(); // Trigger List Filter
    }
    // Vibration feedback
    if (navigator.vibrate) navigator.vibrate(200);
}

function onScanFailure(error) {
    // Keep this empty to avoid spamming console
}

function closeScanner() {
    document.getElementById('scannerModal').classList.add('hidden');
    if(html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
        }).catch(err => console.error("Failed to clear scanner", err));
    }
}

// --- AUTH LOGIC ---
function toggleAuth(view) {
    document.querySelectorAll('#loginForm, #regForm, #resetForm, #newPassForm').forEach(el => el.classList.add('hidden'));
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
    if(view === 'newpass') document.getElementById('newPassForm').classList.remove('hidden');
}

async function login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
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

async function sendResetLink() {
    const email = document.getElementById('resetEmail').value;
    const redirectUrl = window.location.origin + '/dashboard_msc.html';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) alert(error.message); else alert("Link sent!");
}

async function updatePassword() {
    const newPass = document.getElementById('newPasswordInput').value;
    if(!newPass) return alert("Enter new password");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) alert(error.message);
    else { alert("Password updated!"); history.replaceState(null, null, 'dashboard_msc.html'); toggleAuth('login'); }
}

async function logout() { await supabase.auth.signOut(); window.location.reload(); }

// --- DASHBOARD NAVIGATION ---
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
    const { data, error } = await supabase.from('customers').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
    
    if(error) { container.innerHTML = 'Error loading'; return; }
    allCustomers = data || [];
    renderList(allCustomers);
}

function renderList(dataArray) {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';
    if (dataArray.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:#777; margin-top:20px;">No customers found.</p>';
        return;
    }
    dataArray.forEach(cust => container.appendChild(createCustomerRow(cust)));
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

    let lastVisitStr = cust.last_visited ? new Date(cust.last_visited).toLocaleDateString() : "Never";

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
                <div class="last-visit"><i class="far fa-clock"></i> Last: <span id="visit-${cust.id}">${lastVisitStr}</span></div>
                <div class="redeem-badge">Redeems: <span id="redeem-count-${cust.id}">${cust.redeems || 0}</span></div>
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
    if(confirm("Archive this customer?")) {
        document.getElementById(`cust-row-${id}`).remove();
        await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
        allCustomers = allCustomers.filter(c => c.id !== id);
    }
}

async function updateStampOptimistic(id, change) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    let newStamps = customer.stamps + change;
    if (newStamps < 0) newStamps = 0; if (newStamps > 4) newStamps = 4;
    customer.stamps = newStamps;
    
    let visitTime = customer.last_visited;
    if(change > 0) {
        visitTime = new Date().toISOString();
        customer.last_visited = visitTime;
        document.getElementById(`visit-${id}`).innerText = new Date(visitTime).toLocaleDateString();
    }

    for(let i=1; i<=4; i++) {
        const circle = document.getElementById(`circle-${id}-${i}`);
        if(circle) i <= newStamps ? circle.classList.add('filled') : circle.classList.remove('filled');
    }

    const actionWrapper = document.getElementById(`action-wrapper-${id}`);
    if (newStamps >= 4) actionWrapper.innerHTML = `<button class="btn-redeem" onclick="redeemGift(${id})">Redeem 🎁</button>`;
    else actionWrapper.innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;

    await supabase.from('customers').update({ stamps: newStamps, last_visited: visitTime }).eq('id', id);
}

async function redeemGift(id) {
    if(!confirm("Redeem Free Snack?")) return;
    const customer = allCustomers.find(c => c.id === id);
    customer.stamps = 0;
    customer.redeems = (customer.redeems || 0) + 1;
    customer.last_visited = new Date().toISOString();

    for(let i=1; i<=4; i++) document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    document.getElementById(`redeem-count-${id}`).innerText = customer.redeems;
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    
    await supabase.from('customers').update({ stamps: 0, redeems: customer.redeems, last_visited: customer.last_visited }).eq('id', id);
}

// --- ADD CUSTOMER ---
async function saveCustomer() {
    const name = document.getElementById('newName').value.trim();
    const mobile = document.getElementById('newMobile').value.trim();
    if(!name || !mobile) return alert("Fill all fields");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const { data, error } = await supabase.from('customers')
        .insert([{ name, mobile, customer_id_code: idCode, redeems: 0, stamps: 0, last_visited: now, is_deleted: false }])
        .select().single();

    if(error) alert(error.message);
    else {
        allCustomers.unshift(data);
        const container = document.getElementById('customerListContainer');
        const newRow = createCustomerRow(data);
        if (container.querySelector('p')) container.innerHTML = '';
        container.insertBefore(newRow, container.firstChild);
        alert("Customer Added!");
        openModal(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

// --- EXPORT/IMPORT ---
function exportData() {
    if(allCustomers.length === 0) return alert("No data");
    const csv = Papa.unparse(allCustomers);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    link.download = 'customers.csv';
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
                if(!error) { alert("Imported!"); loadCustomers(); }
            }
        }
    });
}

// --- ARCHIVE PAGE ---
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
                <td><button class="btn-secondary" style="padding:4px;" onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">ID</button></td>
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
    doc.text("Mithran Snacks - Archive", 14, 15);
    doc.autoTable({ html: '.data-table', startY: 20, theme: 'striped', headStyles: { fillColor: [0, 86, 179] } });
    doc.save('archive.pdf');
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
        const a = document.createElement('a'); a.download = 'ID.jpg'; a.href = c.toDataURL('image/jpeg', 1.0); a.click();
    });
}

async function shareIdCard() {
    const btn = document.getElementById('shareBtn');
    btn.innerHTML = 'Generating...';
    try {
        const canvas = await html2canvas(document.querySelector("#modalIdCard"), { scale: 3 });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "id.jpg", { type: "image/jpeg" });
            if(navigator.share) await navigator.share({ files: [file], title: 'ID' });
            else downloadModalCard();
            btn.innerHTML = 'Share';
        }, 'image/jpeg');
    } catch(e) { btn.innerHTML = 'Error'; }
}

// --- CUSTOMER PAGE SEARCH ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID or Mobile");
    const { data } = await supabase.from('customers').select('*').or(`customer_id_code.eq.${input},mobile.eq.${input}`).single();
    
    if(!data) alert("Not Found");
    else {
        document.getElementById('resultBox').classList.remove('hidden');
        document.getElementById('resName').innerText = data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        document.getElementById('pubRedeems').innerText = data.redeems || 0;
        
        if(data.stamps >= 4) {
            document.getElementById('resMsg').innerHTML = "<span style='color:green'>🎉 FREE SNACK READY!</span>";
            document.getElementById('flyerOverlay').classList.remove('hidden');
        } else {
            document.getElementById('resMsg').innerText = `Buy ${4 - data.stamps} more to get free snack!`;
        }
        document.getElementById('pubCardName').innerText = data.name.toUpperCase();
        document.getElementById('pubCardMobile').innerText = data.mobile;
        document.getElementById('pubCardID').innerText = data.customer_id_code;
        generateQR(data.customer_id_code, 'pubCardQR');
    }
}

// --- CUSTOMER DOWNLOAD ---
function openCustomerModal() {
    const name = document.getElementById('pubCardName').innerText;
    const mobile = document.getElementById('pubCardMobile').innerText;
    const id = document.getElementById('pubCardID').innerText;
    document.getElementById('custModalName').innerText = name;
    document.getElementById('custModalMobile').innerText = mobile;
    document.getElementById('custModalID').innerText = id;
    generateQR(id, 'custModalQR');
    document.getElementById('customerModalOverlay').classList.remove('hidden');
}
function closeCustomerModal() { document.getElementById('customerModalOverlay').classList.add('hidden'); }
function downloadCustomerCard() {
    html2canvas(document.querySelector("#custModalIdCard"), { scale: 5 }).then(c => {
        const a = document.createElement('a'); a.download = 'MY_ID.jpg'; a.href = c.toDataURL('image/jpeg', 1.0); a.click();
    });
}

function filterList() {
    const input = document.getElementById('searchBar');
    if (!input) return;
    const term = input.value.toLowerCase().trim();
    const filtered = allCustomers.filter(c => {
        return (c.name || '').toLowerCase().includes(term) || (c.mobile || '').toString().includes(term) || (c.customer_id_code || '').toLowerCase().includes(term);
    });
    renderList(filtered);
}
