// --- CONFIGURATION ---
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH LOGIC ---
async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    const { data } = await supabase.from('admin_profiles').select('email').eq('username', user).single();
    if(!data) return alert("User not found");

    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if(error) return alert("Wrong Password");

    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadCustomers();
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// --- TABS ---
function switchTab(tab) {
    if(tab === 'list') {
        document.getElementById('viewList').classList.remove('hidden');
        document.getElementById('viewAdd').classList.add('hidden');
        loadCustomers();
    } else {
        document.getElementById('viewList').classList.add('hidden');
        document.getElementById('viewAdd').classList.remove('hidden');
    }
}

// --- CUSTOMER LIST LOGIC ---
let allCustomers = [];

async function loadCustomers() {
    const container = document.getElementById('customerListContainer');
    if(!container) return; // Exit if we are on the customer page
    
    container.innerHTML = 'Loading...';
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
        // Stamps Circles
        let circlesHtml = '';
        for(let i=1; i<=5; i++) {
            let filledClass = i <= cust.stamps ? 'filled' : '';
            circlesHtml += `<div class="stamp-circle ${filledClass}">MSC</div>`;
        }

        // Action Button (Redeem vs +)
        let actionBtn = cust.stamps >= 5 
            ? `<button class="btn-redeem" onclick="redeemGift(${cust.id})">Redeem 🎁</button>`
            : `<button class="btn-small-control" style="background:var(--primary)" onclick="updateStamp(${cust.id}, ${cust.stamps}, 1)">+</button>`;

        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <div class="customer-header">
                <div>
                    <strong>${cust.name}</strong> <small>(${cust.customer_id_code})</small><br>
                    <span style="color:#666; font-size:0.8rem">${cust.mobile}</span>
                </div>
                <button onclick="viewCard('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')" 
                    style="width:auto; padding:5px 10px; font-size:0.8rem; background:#607d8b; margin-right:5px;">
                    <i class="fas fa-id-card"></i> View ID
                </button>
            </div>
            
            <div class="visual-stamp-row">
                <button class="btn-small-control" onclick="updateStamp(${cust.id}, ${cust.stamps}, -1)">-</button>
                <div style="display:flex; gap:3px;">${circlesHtml}</div>
                ${actionBtn}
            </div>
            <div style="text-align:right; margin-top:5px;">
                <span onclick="deleteCust(${cust.id})" style="color:red; cursor:pointer; font-size:0.8rem;">Delete User</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- STAMP UPDATES ---
async function updateStamp(id, current, change) {
    let newS = current + change;
    if(newS < 0) newS = 0;
    if(newS > 5) newS = 5;
    await supabase.from('customers').update({ stamps: newS }).eq('id', id);
    loadCustomers();
}

async function redeemGift(id) {
    if(confirm("🎁 Redeem Free Snack and Reset?")) {
        await supabase.from('customers').update({ stamps: 0 }).eq('id', id);
        loadCustomers();
    }
}

async function deleteCust(id) {
    if(confirm("Delete this customer?")) {
        await supabase.from('customers').delete().eq('id', id);
        loadCustomers();
    }
}

function filterList() {
    const q = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.customer_id_code.toLowerCase().includes(q));
    renderList(filtered);
}

// --- VIEW ID CARD MODAL (ADMIN) ---
function viewCard(name, mobile, id) {
    document.getElementById('modalCardName').innerText = name.toUpperCase();
    document.getElementById('modalCardMobile').innerText = mobile;
    document.getElementById('modalCardID').innerText = id;
    document.getElementById('idCardModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('idCardModal').classList.add('hidden');
}

function downloadModalCard() {
    html2canvas(document.querySelector("#modalIdCard")).then(canvas => {
        const link = document.createElement('a');
        link.download = "ID_Card.jpg";
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

// --- ADD CUSTOMER (ADMIN) ---
async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Fill all fields");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await supabase.from('customers').insert([{ name, mobile, customer_id_code: idCode }]);

    if(error) alert("Error: " + error.message);
    else {
        alert("Customer Added!");
        // Immediately show the card in modal so they can download if they want
        viewCard(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

// --- CUSTOMER PAGE LOGIC (index.html) ---
async function checkStatus() {
    const input = document.getElementById('checkID').value.trim();
    if(!input) return alert("Please enter ID");

    const { data, error } = await supabase.from('customers').select('*').eq('customer_id_code', input).single();

    if(error || !data) {
        alert("ID not found! Please try again.");
        document.getElementById('resultBox').classList.add('hidden');
    } else {
        const box = document.getElementById('resultBox');
        box.classList.remove('hidden');

        // 1. Update Text Stats
        document.getElementById('resName').innerText = "Hi, " + data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        
        if(data.stamps >= 5) {
            document.getElementById('resMsg').innerHTML = "<span style='color:green; font-weight:bold'>🎉 You have a FREE snack!</span>";
        } else {
            document.getElementById('resMsg').innerText = `Buy ${5 - data.stamps} more to get a reward.`;
        }

        // 2. Update Visual ID Card
        document.getElementById('publicCardName').innerText = data.name.toUpperCase();
        document.getElementById('publicCardMobile').innerText = data.mobile;
        document.getElementById('publicCardID').innerText = data.customer_id_code;
    }
}
