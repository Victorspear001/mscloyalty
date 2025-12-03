// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === AUTHENTICATION LOGIC ===
function toggleAuth(view) {
    ['loginForm', 'regForm', 'resetForm'].forEach(id => document.getElementById(id).classList.add('hidden'));
    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    
    if(!email || !user || !pass) return alert("Fill all fields");

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
    if(authError) return alert(authError.message);

    const { error: profError } = await supabase.from('admin_profiles').insert([{ id: authData.user.id, username: user, email: email }]);
    if(profError) return alert(profError.message);

    alert("Registered! Please Log In.");
    toggleAuth('login');
}

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

async function resetPass() {
    const email = document.getElementById('resetEmail').value;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    alert(error ? error.message : "Reset link sent!");
}

// === DASHBOARD TABS ===
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));

    if(tabName === 'list') {
        document.getElementById('viewList').classList.add('active');
        document.querySelectorAll('.tab')[0].classList.add('active');
        loadCustomers();
    } else {
        document.getElementById('viewAdd').classList.add('active');
        document.querySelectorAll('.tab')[1].classList.add('active');
    }
}

// === CUSTOMER LIST LOGIC (MAJOR UPDATE) ===
let allCustomers = [];

async function loadCustomers() {
    document.getElementById('customerListContainer').innerHTML = '<p style="text-align:center">Loading...</p>';
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
        // 1. Generate the 5 Circles
        let circlesHtml = '';
        for(let i=1; i<=5; i++) {
            let filledClass = i <= cust.stamps ? 'filled' : '';
            circlesHtml += `<div class="stamp-circle ${filledClass}">MSC</div>`;
        }

        // 2. Decide Button (Stamp vs Redeem)
        let actionButton = '';
        if (cust.stamps >= 5) {
            // Full! Show Redeem Gift
            actionButton = `
                <button class="btn-redeem" style="width:auto; padding:5px 15px;" onclick="redeemGift(${cust.id})">
                    Redeem 🎁
                </button>
            `;
        } else {
            // Not Full! Show + Button
            actionButton = `
                <button class="btn-small-control" style="background:var(--primary); color:white" onclick="updateStamp(${cust.id}, ${cust.stamps}, 1)">
                    +
                </button>
            `;
        }

        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <div class="customer-header">
                <div>
                    <strong>${cust.name}</strong> <span style="font-size:0.8rem; color:#666">(${cust.customer_id_code})</span><br>
                    <span style="font-size:0.8rem; color:#888">${cust.mobile}</span>
                </div>
                <button class="btn-danger" onclick="deleteCust(${cust.id})"><i class="fas fa-trash"></i></button>
            </div>
            
            <div class="visual-stamp-row">
                <button class="btn-small-control" onclick="updateStamp(${cust.id}, ${cust.stamps}, -1)">-</button>
                <div class="stamp-circles-container">
                    ${circlesHtml}
                </div>
                ${actionButton}
            </div>
        `;
        container.appendChild(div);
    });
}

// Logic for Adding/Removing Stamps
async function updateStamp(id, current, change) {
    let newS = current + change;
    if(newS < 0) newS = 0;
    if(newS > 5) newS = 5; // Cap at 5

    await supabase.from('customers').update({ stamps: newS }).eq('id', id);
    loadCustomers(); 
}

// Logic for Redeeming (Resets to 0)
async function redeemGift(id) {
    if(confirm("🎁 Confirm Redeem? This will give the free snack and reset stamps to 0.")) {
        await supabase.from('customers').update({ stamps: 0 }).eq('id', id);
        alert("Success! Gift Redeemed. Card Reset.");
        loadCustomers();
    }
}

async function deleteCust(id) {
    if(confirm("⚠ Delete this customer?")) {
        await supabase.from('customers').delete().eq('id', id);
        loadCustomers();
    }
}

function filterList() {
    const q = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allCustomers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.mobile.includes(q) ||
        c.customer_id_code.toLowerCase().includes(q)
    );
    renderList(filtered);
}

// === ADD CUSTOMER & ID CARD ===
async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Enter Name and Mobile");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase.from('customers').insert([{ name, mobile, customer_id_code: idCode }]);
    
    if(error) {
        alert("Error: " + error.message);
    } else {
        document.getElementById('cardName').innerText = name.toUpperCase();
        document.getElementById('cardMobile').innerText = mobile;
        document.getElementById('cardID').innerText = idCode;
        document.getElementById('downloadArea').classList.remove('hidden');
    }
}

function downloadImage() {
    html2canvas(document.querySelector("#idCardContainer")).then(canvas => {
        const link = document.createElement('a');
        link.download = document.getElementById('cardName').innerText + "_ID.jpg";
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

function resetAddForm() {
    document.getElementById('newName').value = '';
    document.getElementById('newMobile').value = '';
    document.getElementById('downloadArea').classList.add('hidden');
}

// === CSV EXPORT/IMPORT ===
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
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, stamps: r.stamps || 0
                })), { onConflict: 'customer_id_code'});
                if(!error) { alert("Import Successful!"); loadCustomers(); }
            }
        }
    });
}
