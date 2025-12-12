// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GLOBAL VARIABLES ---
let allCustomers = [];
let html5QrcodeScanner;

// --- INITIALIZATION ---
window.onload = function() {
    // Check which page we are on
    if(document.getElementById('customerListContainer')) {
        // We are on dashboard_msc.html
        // Check Auth
        const session = supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session && !document.getElementById('authSection').classList.contains('hidden')) {
               // Show Login
            } else if (session) {
                document.getElementById('authSection').classList.add('hidden');
                document.getElementById('dashboardSection').classList.remove('hidden');
                loadCustomers();
            }
        });
    }
    
    if(document.getElementById('fullCustomerTable')) {
        // We are on all_customers.html (New Admin Page)
        loadAllCustomersTable();
    }
};

// --- AUTH LOGIC ---
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

function toggleAuth(view) {
    document.querySelectorAll('#loginForm, #regForm').forEach(el => el.classList.add('hidden'));
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
}

async function logout() { await supabase.auth.signOut(); window.location.href = "index.html"; }

// --- DASHBOARD (Active Customers Only) ---
async function loadCustomers() {
    const container = document.getElementById('customerListContainer');
    if(!container) return;
    
    container.innerHTML = '<p class="text-center">Loading Data...</p>';
    // FILTER: Only show customers NOT deleted
    const { data } = await supabase.from('customers')
        .select('*')
        .eq('is_deleted', false) 
        .order('created_at', { ascending: false });
    
    if(data) {
        allCustomers = data;
        renderList(data);
    }
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
                    <i class="fas fa-pencil-alt edit-icon" onclick="enableNameEdit(${cust.id})"></i>
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

// --- EDIT NAME FUNCTIONS ---
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

// --- SOFT DELETE (Hides from main list) ---
async function softDeleteCust(id) {
    if(confirm("Move this customer to Archive? (They will not be permanently deleted)")) {
        await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
        // Remove from UI
        document.getElementById(`cust-row-${id}`).remove();
        allCustomers = allCustomers.filter(c => c.id !== id);
    }
}

// --- STAMPING LOGIC ---
async function updateStampOptimistic(id, change) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    let newStamps = customer.stamps + change;
    if (newStamps < 0) newStamps = 0;
    if (newStamps > 4) newStamps = 4;

    customer.stamps = newStamps;
    let visitTime = customer.last_visited;
    
    if(change > 0) {
        visitTime = new Date().toISOString();
        customer.last_visited = visitTime;
        // Update UI
        const d = new Date(visitTime);
        document.getElementById(`visit-${id}`).innerText = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Update Circles UI
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
    if (!customer) return;

    customer.stamps = 0;
    customer.redeems = (customer.redeems || 0) + 1;
    
    // Reset UI
    for(let i=1; i<=4; i++) document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    document.getElementById(`redeem-count-${id}`).innerText = customer.redeems;
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;

    await supabase.from('customers').update({ stamps: 0, redeems: customer.redeems }).eq('id', id);
}

// --- ADD CUSTOMER ---
async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Fill all fields");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const { data, error } = await supabase.from('customers')
        .insert([{ name, mobile, customer_id_code: idCode, redeems: 0, stamps: 0, last_visited: now, is_deleted: false }])
        .select()
        .single();

    if(error) {
        alert("Error: " + error.message);
    } else {
        allCustomers.unshift(data);
        const container = document.getElementById('customerListContainer');
        const newRow = createCustomerRow(data);
        container.insertBefore(newRow, container.firstChild);
        alert("Customer Added!");
        openModal(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

// --- ADMIN MODAL & SHARE ---
function openModal(name, mobile, id) {
    document.getElementById('modalName').innerText = name.toUpperCase();
    document.getElementById('modalMobile').innerText = mobile;
    document.getElementById('modalID').innerText = id;
    generateQRCode(id, 'modalQR');
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

// SHARE ID IMAGE FUNCTION
async function shareIdCard() {
    const btn = document.getElementById('shareBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    try {
        const canvas = await html2canvas(document.querySelector("#modalIdCard"), { scale: 3, useCORS: true });
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "Mithran_ID.jpg", { type: "image/jpeg" });
            
            // Check if Web Share API is supported (Mobile)
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Mithran Snacks ID',
                        text: 'Here is your Digital ID Card for Mithran Snacks Corner!',
                    });
                    btn.innerHTML = '<i class="fas fa-share-alt"></i> Share via WhatsApp';
                } catch (err) {
                    console.log("Share failed/cancelled", err);
                    downloadBlob(blob); // Fallback
                }
            } else {
                // Desktop Fallback -> Download
                downloadBlob(blob);
                alert("Sharing not supported on this browser. Image downloaded instead.");
                btn.innerHTML = '<i class="fas fa-share-alt"></i> Share via WhatsApp';
            }
        }, 'image/jpeg');
    } catch(e) {
        console.error(e);
        alert("Error generating image");
        btn.innerHTML = '<i class="fas fa-share-alt"></i> Share via WhatsApp';
    }
}

function downloadBlob(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Mithran_ID.jpg";
    link.click();
}

// --- ALL CUSTOMERS PAGE LOGIC (New Page) ---
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
                <td>
                    <button class="btn-secondary" style="font-size:0.7rem;" onclick="viewTableId('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">View ID</button>
                </td>
                <td>
                    ${cust.is_deleted ? 
                        `<button class="btn-restore" onclick="restoreCustomer(${cust.id})">Restore</button> 
                         <button class="btn-danger" onclick="permDelete(${cust.id})">X</button>` 
                        : `<button class="btn-danger" onclick="softDeleteFromTable(${cust.id})">Delete</button>`
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
    if(confirm("WARNING: Permanently delete this data? This cannot be undone.")) {
        await supabase.from('customers').delete().eq('id', id);
        loadAllCustomersTable();
    }
}

async function softDeleteFromTable(id) {
    await supabase.from('customers').update({ is_deleted: true }).eq('id', id);
    loadAllCustomersTable();
}

function viewTableId(name, mobile, id) {
    // Re-use existing modal logic
    openModal(name, mobile, id);
}

// --- SEARCH & QR ---
function generateQRCode(text, elementId) {
    const container = document.getElementById(elementId);
    if(container) {
        container.innerHTML = '';
        new QRCode(container, { text: text, width: 64, height: 64, correctLevel : QRCode.CorrectLevel.H });
    }
}

function filterList() {
    const term = document.getElementById('searchBar').value.toLowerCase().trim();
    const filtered = allCustomers.filter(c => {
        return (c.name || '').toLowerCase().includes(term) || 
               (c.mobile || '').toString().includes(term) || 
               (c.customer_id_code || '').toLowerCase().includes(term);
    });
    renderList(filtered);
}

// --- CUSTOMER PAGE SEARCH (Updated for Mobile & ID) ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID or Mobile");

    // Search by ID OR Mobile
    const { data, error } = await supabase.from('customers')
        .select('*')
        .or(`customer_id_code.eq.${input},mobile.eq.${input}`)
        .single();
    
    if(!data) {
        alert("Not Found");
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

// --- SCANNER INIT ---
let html5QrcodeScanner;
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
