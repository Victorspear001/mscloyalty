// ⚠️ IMPORTANT: REPLACE THESE WITH YOUR ACTUAL KEYS ⚠️
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GLOBAL VARIABLES ---
let allCustomers = [];
let html5QrcodeScanner;

// --- INITIALIZATION (Runs when page loads) ---
document.addEventListener('DOMContentLoaded', async function() {
    
    // 1. Logic for ADMIN DASHBOARD (dashboard_msc.html)
    if(document.getElementById('customerListContainer')) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // User is logged in -> Show Dashboard
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            loadCustomers();
        } else {
            // User is NOT logged in -> Show Login
            document.getElementById('authSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
        }
    }
    
    // 2. Logic for ARCHIVE PAGE (all_customers.html)
    if(document.getElementById('fullCustomerTableBody')) {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) {
            window.location.href = 'dashboard_msc.html'; // Redirect to login if not authenticated
        } else {
            loadAllCustomersTable();
        }
    }

    // 3. Listen for Password Reset Events (Global)
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            // If we are on the dashboard page, show the new password form
            if(document.getElementById('newPassForm')) {
                toggleAuth('newpass');
            }
        }
    });
});

// --- AUTHENTICATION LOGIC ---

function toggleAuth(view) {
    // Hide all forms first
    ['loginForm', 'regForm', 'resetForm', 'newPassForm'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });

    // Show the requested form
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
    if(view === 'newpass') document.getElementById('newPassForm').classList.remove('hidden');
}

async function login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if(!user || !pass) return alert("Please enter Username and Password.");

    // 1. Get Email associated with Username
    const { data, error } = await supabase
        .from('admin_profiles')
        .select('email')
        .eq('username', user)
        .single();
    
    if(error || !data) {
        console.error("DB Error:", error);
        return alert("Username not found. Please Register first.");
    }

    // 2. Sign In with the retrieved Email
    const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email: data.email, 
        password: pass 
    });

    if(signInError) {
        return alert("Incorrect Password. Please try again.");
    }

    // 3. Success
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadCustomers();
}

async function register() {
    const email = document.getElementById('regEmail').value.trim();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    
    if(!email || !user || !pass) return alert("Fill all fields");

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
    if(authError) return alert("Signup Error: " + authError.message);

    // 2. Create Profile Link
    const { error: profError } = await supabase
        .from('admin_profiles')
        .insert([{ id: authData.user.id, username: user, email: email }]);

    if(profError) {
        return alert("Profile Error: " + profError.message);
    }

    alert("Registration Successful! Please Log In.");
    toggleAuth('login');
}

async function sendResetLink() {
    const email = document.getElementById('resetEmail').value.trim();
    if(!email) return alert("Enter your email.");

    const redirectUrl = window.location.origin + '/dashboard_msc.html';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    
    if (error) alert("Error: " + error.message); 
    else alert("Reset link sent! Check your email inbox.");
}

async function updatePassword() {
    const newPass = document.getElementById('newPasswordInput').value.trim();
    if(!newPass) return alert("Enter a new password");

    const { error } = await supabase.auth.updateUser({ password: newPass });
    
    if (error) alert("Error: " + error.message);
    else { 
        alert("Password updated successfully! Please Log In."); 
        // Remove hash from URL to clean up
        history.replaceState(null, null, 'dashboard_msc.html'); 
        toggleAuth('login'); 
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// --- ADMIN DASHBOARD TABS ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if(tab === 'list') {
        document.getElementById('viewList').classList.remove('hidden');
        document.getElementById('viewAdd').classList.add('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        // Clear search and reload
        document.getElementById('searchBar').value = '';
        loadCustomers(); 
    } else {
        document.getElementById('viewList').classList.add('hidden');
        document.getElementById('viewAdd').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// --- CUSTOMER DATA HANDLING ---
async function loadCustomers() {
    const container = document.getElementById('customerListContainer');
    if(!container) return;
    
    container.innerHTML = '<p class="text-center" style="margin-top:20px;">Loading Data...</p>';
    
    // Fetch ONLY active customers
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
    
    if(error) {
        console.error(error);
        container.innerHTML = '<p class="text-center" style="color:red;">Error loading data.</p>';
        return;
    }

    allCustomers = data || [];
    renderList(allCustomers);
}

function renderList(dataArray) {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';

    if (dataArray.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:#777; margin-top:20px;">No active customers found.</p>';
        return;
    }

    dataArray.forEach(cust => container.appendChild(createCustomerRow(cust)));
}

function createCustomerRow(cust) {
    // Generate Stamps UI
    let circlesHtml = '';
    for(let i=1; i<=4; i++) {
        let active = i <= cust.stamps ? 'filled' : '';
        circlesHtml += `<div id="circle-${cust.id}-${i}" class="msc-circle ${active}">MSC</div>`;
    }

    let controls = cust.stamps >= 4 
        ? `<button id="btn-${cust.id}" class="btn-redeem" onclick="redeemGift(${cust.id})">Redeem 🎁</button>`
        : `<button id="btn-${cust.id}" class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${cust.id}, 1)">+</button>`;

    // Date Format
    let lastVisitStr = "Never";
    if(cust.last_visited) {
        const d = new Date(cust.last_visited);
        lastVisitStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    const div = document.createElement('div');
    div.className = 'customer-item';
    div.id = `cust-row-${cust.id}`;
    div.innerHTML = `
        <div class="customer-top">
            <div>
                <div class="cust-name">
                    <span id="name-txt-${cust.id}">${cust.name}</span>
                    <input type="text" id="name-input-${cust.id}" class="edit-name-input hidden" value="${cust.name}" onblur="saveNameEdit(${cust.id})" onkeypress="handleEnter(event, ${cust.id})">
                    <i class="fas fa-pencil-alt edit-icon" onclick="enableNameEdit(${cust.id})" title="Edit Name"></i>
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

// --- NAME EDITING ---
function enableNameEdit(id) {
    document.getElementById(`name-txt-${id}`).classList.add('hidden');
    const input = document.getElementById(`name-input-${id}`);
    input.classList.remove('hidden');
    input.focus();
}

async function saveNameEdit(id) {
    const input = document.getElementById(`name-input-${id}`);
    const newName = input.value.trim();
    
    if(newName) {
        document.getElementById(`name-txt-${id}`).innerText = newName;
        // Update DB
        await supabase.from('customers').update({ name: newName }).eq('id', id);
    }
    input.classList.add('hidden');
    document.getElementById(`name-txt-${id}`).classList.remove('hidden');
}

function handleEnter(e, id) {
    if(e.key === 'Enter') saveNameEdit(id);
}

// --- SOFT DELETE ---
async function softDeleteCust(id) {
    if(confirm("Move this customer to Archive?")) {
        // Optimistic UI Removal
        document.getElementById(`cust-row-${id}`).remove();
        allCustomers = allCustomers.filter(c => c.id !== id);
        
        // DB Update
        await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
    }
}

// --- STAMPS & REDEEM ---
async function updateStampOptimistic(id, change) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    let newStamps = customer.stamps + change;
    if (newStamps < 0) newStamps = 0;
    if (newStamps > 4) newStamps = 4;

    // Optimistic Update
    customer.stamps = newStamps;
    
    let visitTime = customer.last_visited;
    if(change > 0) {
        visitTime = new Date().toISOString();
        customer.last_visited = visitTime;
        const d = new Date(visitTime);
        document.getElementById(`visit-${id}`).innerText = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // UI Update
    for(let i=1; i<=4; i++) {
        const circle = document.getElementById(`circle-${id}-${i}`);
        if(circle) i <= newStamps ? circle.classList.add('filled') : circle.classList.remove('filled');
    }

    const actionWrapper = document.getElementById(`action-wrapper-${id}`);
    if (newStamps >= 4) actionWrapper.innerHTML = `<button class="btn-redeem" onclick="redeemGift(${id})">Redeem 🎁</button>`;
    else actionWrapper.innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;

    // DB Update
    await supabase.from('customers').update({ stamps: newStamps, last_visited: visitTime }).eq('id', id);
}

async function redeemGift(id) {
    if(!confirm("Redeem Free Snack?")) return;
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    customer.stamps = 0;
    customer.redeems = (customer.redeems || 0) + 1;
    customer.last_visited = new Date().toISOString();

    // UI Reset
    for(let i=1; i<=4; i++) document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    document.getElementById(`redeem-count-${id}`).innerText = customer.redeems;
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    
    // DB Update
    await supabase.from('customers').update({ 
        stamps: 0, 
        redeems: customer.redeems, 
        last_visited: customer.last_visited 
    }).eq('id', id);
}

// --- ADD NEW CUSTOMER ---
async function saveCustomer() {
    const name = document.getElementById('newName').value.trim();
    const mobile = document.getElementById('newMobile').value.trim();
    if(!name || !mobile) return alert("Fill all fields");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const { data, error } = await supabase.from('customers')
        .insert([{ 
            name: name, 
            mobile: mobile, 
            customer_id_code: idCode, 
            redeems: 0, 
            stamps: 0, 
            last_visited: now, 
            is_deleted: false 
        }])
        .select()
        .single();

    if(error) {
        alert("Error: " + error.message);
    } else {
        allCustomers.unshift(data);
        const container = document.getElementById('customerListContainer');
        const newRow = createCustomerRow(data);
        
        // Remove "No customers" text if it exists
        if(container.querySelector('p')) container.innerHTML = '';
        
        container.insertBefore(newRow, container.firstChild);
        
        alert("Customer Added!");
        openModal(name, mobile, idCode); // Show ID for download
        
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

// --- MODALS & SHARING ---
function openModal(name, mobile, id) {
    document.getElementById('modalName').innerText = name.toUpperCase();
    document.getElementById('modalMobile').innerText = mobile;
    document.getElementById('modalID').innerText = id;
    generateQRCode(id, 'modalQR');
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

function downloadModalCard() {
    html2canvas(document.querySelector("#modalIdCard"), { scale: 5, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `ID_${document.getElementById('modalName').innerText}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 1.0);
        link.click();
    });
}

async function shareIdCard() {
    const btn = document.getElementById('shareBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...';
    
    try {
        const canvas = await html2canvas(document.querySelector("#modalIdCard"), { scale: 3, useCORS: true });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "Mithran_ID.jpg", { type: "image/jpeg" });
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Mithran Snacks ID',
                        text: 'Here is your Digital ID Card for Mithran Snacks Corner!',
                    });
                } catch (err) { console.log(err); }
            } else {
                alert("Sharing not supported on this device. Downloading instead.");
                downloadModalCard();
            }
            btn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
        }, 'image/jpeg');
    } catch(e) {
        console.error(e);
        btn.innerHTML = '<i class="fas fa-exclamation"></i> Error';
    }
}

// --- ARCHIVE PAGE LOGIC (all_customers.html) ---
async function loadAllCustomersTable() {
    const tableBody = document.getElementById('fullCustomerTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });

    if(data) {
        tableBody.innerHTML = '';
        data.forEach(cust => {
            const statusClass = cust.is_deleted ? 'status-deleted' : 'status-active';
            const statusText = cust.is_deleted ? 'Deleted' : 'Active';
            
            const tr = document.createElement('tr');
            if(cust.is_deleted) tr.className = 'deleted-row';
            
            tr.innerHTML = `
                <td>${cust.name}</td>
                <td>${cust.mobile}</td>
                <td>${cust.customer_id_code}</td>
                <td><span class="status-tag ${statusClass}">${statusText}</span></td>
                <td><button class="btn-secondary" style="font-size:0.7rem;" onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">View</button></td>
                <td>
                    ${cust.is_deleted ? 
                        `<button class="btn-restore" onclick="restoreCustomer(${cust.id})">Restore</button> 
                         <button class="btn-danger" onclick="permDelete(${cust.id})">X</button>` 
                        : `<button class="btn-danger" onclick="softDeleteFromTable(${cust.id})">Del</button>`
                    }
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

async function restoreCustomer(id) {
    if(confirm("Restore this customer?")) {
        await supabase.from('customers').update({ is_deleted: false }).eq('id', id);
        loadAllCustomersTable();
    }
}

async function permDelete(id) {
    if(confirm("PERMANENTLY DELETE? This cannot be undone.")) {
        await supabase.from('customers').delete().eq('id', id);
        loadAllCustomersTable();
    }
}

async function softDeleteFromTable(id) {
    await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
    loadAllCustomersTable();
}

// --- CUSTOMER PAGE SEARCH (index.html) ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID or Mobile");

    const { data } = await supabase.from('customers')
        .select('*')
        .or(`customer_id_code.eq.${input},mobile.eq.${input}`) // Search by ID OR Mobile
        .single();
    
    if(!data) {
        alert("ID/Mobile Not Found");
    } else {
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
        generateQRCode(data.customer_id_code, 'pubCardQR');
    }
}

// --- COMMON TOOLS ---
function generateQRCode(text, elementId) {
    const container = document.getElementById(elementId);
    if(container) {
        container.innerHTML = '';
        new QRCode(container, { text: text, width: 64, height: 64, correctLevel : QRCode.CorrectLevel.H });
    }
}

function filterList() {
    const input = document.getElementById('searchBar');
    if (!input) return;
    const term = input.value.toLowerCase().trim();
    
    const filtered = allCustomers.filter(c => {
        const name = (c.name || '').toLowerCase();
        const mobile = (c.mobile || '').toString();
        const id = (c.customer_id_code || '').toLowerCase();
        return name.includes(term) || mobile.includes(term) || id.includes(term);
    });
    renderList(filtered);
}

function exportData() {
    const csv = Papa.unparse(allCustomers);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    link.download = 'customers.csv'; link.click();
}

function importData(input) {
    Papa.parse(input.files[0], {
        header: true,
        complete: async (res) => {
            const rows = res.data.filter(r => r.name && r.customer_id_code);
            if(rows.length > 0) {
                const now = new Date().toISOString();
                const { error } = await supabase.from('customers').upsert(rows.map(r => ({
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, 
                    stamps: r.stamps || 0, redeems: r.redeems || 0, last_visited: now, is_deleted: false
                })), { onConflict: 'customer_id_code'});
                if(!error) { alert("Imported!"); loadCustomers(); }
            }
        }
    });
}

// --- SCANNER ---
function initScanner() {
    document.getElementById('scannerModal').classList.remove('hidden');
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
}
function onScanSuccess(decodedText) {
    document.getElementById('searchBar').value = decodedText;
    filterList();
    closeScanner();
}
function closeScanner() {
    if(html5QrcodeScanner) html5QrcodeScanner.clear();
    document.getElementById('scannerModal').classList.add('hidden');
}

// --- CUSTOMER SIDE DOWNLOAD ---
function openCustomerModal() {
    const name = document.getElementById('pubCardName').innerText;
    const mobile = document.getElementById('pubCardMobile').innerText;
    const id = document.getElementById('pubCardID').innerText;
    
    document.getElementById('custModalName').innerText = name;
    document.getElementById('custModalMobile').innerText = mobile;
    document.getElementById('custModalID').innerText = id;
    generateQRCode(id, 'custModalQR');
    document.getElementById('customerModalOverlay').classList.remove('hidden');
}
function closeCustomerModal() { document.getElementById('customerModalOverlay').classList.add('hidden'); }
function downloadCustomerCard() {
    html2canvas(document.querySelector("#custModalIdCard"), { scale: 5, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `MY_ID.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 1.0);
        link.click();
    });
}
