const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH ---
function toggleAuth(view) {
    document.querySelectorAll('#loginForm, #regForm, #resetForm, #newPassForm').forEach(el => el.classList.add('hidden'));
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const { data, error } = await supabase.from('admin_profiles').select('email').eq('username', user).single();
    
    if(error || !data) return alert("User not found or connection failed.");
    
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

async function logout() { await supabase.auth.signOut(); location.reload(); }

// --- DASHBOARD ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(tab === 'list') {
        document.getElementById('viewList').classList.remove('hidden');
        document.getElementById('viewAdd').classList.add('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('viewList').classList.add('hidden');
        document.getElementById('viewAdd').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// --- CUSTOMER LIST (Optimized - No Loading Screen on Updates) ---
let allCustomers = [];

async function loadCustomers() {
    const container = document.getElementById('customerListContainer');
    if(!container) return;
    
    container.innerHTML = '<p class="text-center">Loading Data...</p>';
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    
    if(data) {
        allCustomers = data;
        renderList(data);
    }
}

function renderList(data) {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';

    data.forEach(cust => {
        container.appendChild(createCustomerRow(cust));
    });
}

function createCustomerRow(cust) {
    // Logic: Buy 4, Get 5th Free. Max stamps = 4.
    let circlesHtml = '';
    for(let i=1; i<=4; i++) {
        let active = i <= cust.stamps ? 'filled' : '';
        circlesHtml += `<div id="circle-${cust.id}-${i}" class="msc-circle ${active}">MSC</div>`;
    }

    let controls = '';
    if(cust.stamps >= 4) {
        controls = `<button id="btn-${cust.id}" class="btn-redeem" onclick="redeemGift(${cust.id})">Redeem 🎁</button>`;
    } else {
        controls = `<button id="btn-${cust.id}" class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${cust.id}, 1)">+</button>`;
    }

    const div = document.createElement('div');
    div.className = 'customer-item';
    div.id = `cust-row-${cust.id}`;
    div.innerHTML = `
        <div class="customer-top">
            <div>
                <div class="cust-name">${cust.name}</div>
                <div class="cust-meta">${cust.mobile} | ${cust.customer_id_code}</div>
                <div class="redeem-badge">Redeems: <span id="redeem-count-${cust.id}">${cust.redeems || 0}</span></div>
            </div>
            <div>
                <button class="btn-secondary" style="font-size:0.7rem; padding:4px 8px;" 
                onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">ID</button>
                <button class="btn-danger" style="margin-left:5px;" onclick="deleteCust(${cust.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>

        <div class="stamp-row">
            <button class="ctrl-btn btn-minus" onclick="updateStampOptimistic(${cust.id}, -1)">-</button>
            <div class="circles-wrapper">
                ${circlesHtml}
            </div>
            <div id="action-wrapper-${cust.id}">
                ${controls}
            </div>
        </div>
    `;
    return div;
}

// --- OPTIMISTIC UI UPDATES (No Loading Screen) ---
async function updateStampOptimistic(id, change) {
    // 1. Find customer in local memory
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    let newStamps = customer.stamps + change;
    if (newStamps < 0) newStamps = 0;
    if (newStamps > 4) newStamps = 4; // Max is now 4

    // 2. Update Local Memory
    customer.stamps = newStamps;

    // 3. Update UI Immediately
    // Update Circles
    for(let i=1; i<=4; i++) {
        const circle = document.getElementById(`circle-${id}-${i}`);
        if(i <= newStamps) circle.classList.add('filled');
        else circle.classList.remove('filled');
    }

    // Update Button (Plus vs Redeem)
    const actionWrapper = document.getElementById(`action-wrapper-${id}`);
    if (newStamps >= 4) {
        actionWrapper.innerHTML = `<button class="btn-redeem" onclick="redeemGift(${id})">Redeem 🎁</button>`;
    } else {
        actionWrapper.innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    }

    // 4. Send to DB silently
    await supabase.from('customers').update({ stamps: newStamps }).eq('id', id);
}

async function redeemGift(id) {
    if(!confirm("🎁 Redeem Free Snack? (Stamps -> 0, Redeems + 1)")) return;

    // 1. Find and Update Local Memory
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    customer.stamps = 0;
    customer.redeems = (customer.redeems || 0) + 1;

    // 2. Update UI Immediately
    // Reset Circles
    for(let i=1; i<=4; i++) {
        document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    }
    // Update Badge
    document.getElementById(`redeem-count-${id}`).innerText = customer.redeems;
    // Reset Button
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;

    // 3. Send to DB
    await supabase.from('customers').update({ stamps: 0, redeems: customer.redeems }).eq('id', id);
}

// --- OTHER ACTIONS ---
async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Fill Name and Mobile");
    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    
    // Add redeems: 0
    const { error } = await supabase.from('customers').insert([{ name, mobile, customer_id_code: idCode, redeems: 0 }]);
    if(error) alert(error.message);
    else {
        alert("Registered!");
        openModal(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

async function deleteCust(id) {
    if(confirm("Delete customer?")) {
        await supabase.from('customers').delete().eq('id', id);
        // Remove row from DOM
        document.getElementById(`cust-row-${id}`).remove();
        allCustomers = allCustomers.filter(c => c.id !== id);
    }
}

// --- ID CARD MODAL ---
function openModal(name, mobile, id) {
    document.getElementById('modalName').innerText = name.toUpperCase();
    document.getElementById('modalMobile').innerText = mobile;
    document.getElementById('modalID').innerText = id;
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

function downloadModalCard() {
    html2canvas(document.querySelector("#modalIdCard")).then(canvas => {
        const link = document.createElement('a');
        link.download = `ID_${document.getElementById('modalName').innerText}.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

// --- CUSTOMER PAGE LOGIC (index.html) ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID");

    const { data } = await supabase.from('customers').select('*').eq('customer_id_code', input).single();
    
    if(!data) {
        alert("ID Not Found");
        document.getElementById('resultBox').classList.add('hidden');
    } else {
        const box = document.getElementById('resultBox');
        box.classList.remove('hidden');
        
        document.getElementById('resName').innerText = data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        document.getElementById('pubRedeems').innerText = data.redeems || 0;

        // If eligible (4 stamps), Show Flyer
        if(data.stamps >= 4) {
            document.getElementById('resMsg').innerHTML = "<span style='color:green'>🎉 FREE SNACK READY!</span>";
            showFlyer(); // TRIGGER POPUP
        } else {
            document.getElementById('resMsg').innerText = `Buy ${4 - data.stamps} more to get free snack!`;
        }

        document.getElementById('pubCardName').innerText = data.name.toUpperCase();
        document.getElementById('pubCardMobile').innerText = data.mobile;
        document.getElementById('pubCardID').innerText = data.customer_id_code;
    }
}

function showFlyer() {
    document.getElementById('flyerOverlay').classList.remove('hidden');
    // Auto hide after 5 seconds or click
    setTimeout(() => closeFlyer(), 5000);
}

function closeFlyer() {
    document.getElementById('flyerOverlay').classList.add('hidden');
}

// --- CSV ---
function filterList() {
    const term = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allCustomers.filter(c => 
        c.name.toLowerCase().includes(term) || c.mobile.includes(term) || c.customer_id_code.toLowerCase().includes(term)
    );
    // Re-render manually for search
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';
    filtered.forEach(c => container.appendChild(createCustomerRow(c)));
}

function exportData() {
    const csv = Papa.unparse(allCustomers);
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customers.csv';
    a.click();
}

function importData(input) {
    Papa.parse(input.files[0], {
        header: true,
        complete: async (res) => {
            const rows = res.data.filter(r => r.name && r.customer_id_code);
            if(rows.length > 0) {
                const { error } = await supabase.from('customers').upsert(rows.map(r => ({
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, stamps: r.stamps || 0, redeems: r.redeems || 0
                })), { onConflict: 'customer_id_code'});
                if(!error) { alert("Import Successful!"); loadCustomers(); }
            }
        }
    });
}
