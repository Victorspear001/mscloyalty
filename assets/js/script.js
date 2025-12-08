// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH ---
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') toggleAuth('newpass');
});

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

async function logout() { await supabase.auth.signOut(); location.reload(); }

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

// --- CUSTOMER LIST LOGIC ---
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

    // Format Last Visit Date
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
                <div class="cust-name">${cust.name}</div>
                <div class="cust-meta">${cust.mobile} | ${cust.customer_id_code}</div>
                <div class="last-visit"><i class="far fa-clock"></i> Last: <span id="visit-${cust.id}">${lastVisitStr}</span></div>
                <div class="redeem-badge">Redeems: <span id="redeem-count-${cust.id}">${cust.redeems || 0}</span></div>
            </div>
            <div>
                <button class="btn-secondary" onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">ID</button>
                <button class="btn-danger" style="margin-left:5px;" onclick="deleteCust(${cust.id})"><i class="fas fa-trash"></i></button>
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

// --- OPTIMISTIC UPDATES + TRACK VISIT ---
async function updateStampOptimistic(id, change) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    let newStamps = customer.stamps + change;
    if (newStamps < 0) newStamps = 0;
    if (newStamps > 4) newStamps = 4;

    customer.stamps = newStamps;
    
    // Update Visit Time Logic (Only if adding stamp)
    let visitTime = customer.last_visited;
    if(change > 0) {
        visitTime = new Date().toISOString();
        customer.last_visited = visitTime;
        // Update UI Text
        const d = new Date(visitTime);
        const niceDate = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const visitEl = document.getElementById(`visit-${id}`);
        if(visitEl) visitEl.innerText = niceDate;
    }

    // Update UI Circles
    for(let i=1; i<=4; i++) {
        const circle = document.getElementById(`circle-${id}-${i}`);
        if(circle) i <= newStamps ? circle.classList.add('filled') : circle.classList.remove('filled');
    }

    const actionWrapper = document.getElementById(`action-wrapper-${id}`);
    if (newStamps >= 4) {
        actionWrapper.innerHTML = `<button class="btn-redeem" onclick="redeemGift(${id})">Redeem 🎁</button>`;
    } else {
        actionWrapper.innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    }

    // Update DB
    await supabase.from('customers').update({ 
        stamps: newStamps,
        last_visited: visitTime 
    }).eq('id', id);
}

async function redeemGift(id) {
    if(!confirm("Redeem Free Snack?")) return;
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    customer.stamps = 0;
    customer.redeems = (customer.redeems || 0) + 1;
    customer.last_visited = new Date().toISOString(); // Update visit on redeem too

    // UI Reset
    for(let i=1; i<=4; i++) document.getElementById(`circle-${id}-${i}`).classList.remove('filled');
    document.getElementById(`redeem-count-${id}`).innerText = customer.redeems;
    document.getElementById(`action-wrapper-${id}`).innerHTML = `<button class="ctrl-btn btn-plus" onclick="updateStampOptimistic(${id}, 1)">+</button>`;
    
    // Update Visit Text
    const d = new Date();
    document.getElementById(`visit-${id}`).innerText = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    await supabase.from('customers').update({ 
        stamps: 0, 
        redeems: customer.redeems,
        last_visited: customer.last_visited
    }).eq('id', id);
}

// --- ADD CUSTOMER ---
async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Fill all fields");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const { data, error } = await supabase.from('customers')
        .insert([{ name, mobile, customer_id_code: idCode, redeems: 0, stamps: 0, last_visited: now }])
        .select()
        .single();

    if(error) {
        alert("Error: " + error.message);
    } else {
        allCustomers.unshift(data);
        const container = document.getElementById('customerListContainer');
        const newRow = createCustomerRow(data);
        if (container.firstChild && container.firstChild.tagName === 'P') container.innerHTML = '';
        container.insertBefore(newRow, container.firstChild);

        alert("Customer Added!");
        openModal(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

async function deleteCust(id) {
    if(confirm("Delete customer?")) {
        await supabase.from('customers').delete().eq('id', id);
        document.getElementById(`cust-row-${id}`).remove();
        allCustomers = allCustomers.filter(c => c.id !== id);
    }
}

// --- ADMIN MODALS ---
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

// --- CUSTOMER PAGE LOGIC (Index.html) ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Enter ID");
    const { data } = await supabase.from('customers').select('*').eq('customer_id_code', input).single();
    
    if(!data) {
        alert("ID Not Found");
    } else {
        document.getElementById('resultBox').classList.remove('hidden');
        document.getElementById('resName').innerText = data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        document.getElementById('pubRedeems').innerText = data.redeems || 0;
        
        if(data.stamps >= 4) {
            document.getElementById('resMsg').innerHTML = "<span style='color:green'>🎉 FREE SNACK READY!</span>";
            document.getElementById('flyerOverlay').classList.remove('hidden');
            setTimeout(() => document.getElementById('flyerOverlay').classList.add('hidden'), 5000);
        } else {
            document.getElementById('resMsg').innerText = `Buy ${4 - data.stamps} more to get free snack!`;
        }
        document.getElementById('pubCardName').innerText = data.name.toUpperCase();
        document.getElementById('pubCardMobile').innerText = data.mobile;
        document.getElementById('pubCardID').innerText = data.customer_id_code;
    }
}

// --- NEW: CUSTOMER ID DOWNLOAD (Index.html) ---
function openCustomerModal() {
    const name = document.getElementById('pubCardName').innerText;
    const mobile = document.getElementById('pubCardMobile').innerText;
    const id = document.getElementById('pubCardID').innerText;
    
    // Populate the hidden modal in index.html
    document.getElementById('custModalName').innerText = name;
    document.getElementById('custModalMobile').innerText = mobile;
    document.getElementById('custModalID').innerText = id;
    
    document.getElementById('customerModalOverlay').classList.remove('hidden');
}

function closeCustomerModal() {
    document.getElementById('customerModalOverlay').classList.add('hidden');
}

function downloadCustomerCard() {
    html2canvas(document.querySelector("#custModalIdCard")).then(canvas => {
        const link = document.createElement('a');
        link.download = `MY_ID_${document.getElementById('custModalName').innerText}.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

// --- SEARCH & EXPORT ---
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
                const { error } = await supabase.from('customers').upsert(rows.map(r => ({
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, stamps: r.stamps || 0, redeems: r.redeems || 0
                })), { onConflict: 'customer_id_code'});
                if(!error) { alert("Imported!"); loadCustomers(); }
            }
        }
    });
}
