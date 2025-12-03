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

    // 1. Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
    if(authError) return alert(authError.message);

    // 2. Profile Link
    const { error: profError } = await supabase.from('admin_profiles').insert([{ id: authData.user.id, username: user, email: email }]);
    if(profError) return alert(profError.message);

    alert("Registered! Please Log In.");
    toggleAuth('login');
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    // Get Email from Username
    const { data } = await supabase.from('admin_profiles').select('email').eq('username', user).single();
    if(!data) return alert("User not found");

    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if(error) return alert("Wrong Password");

    // Show Dashboard
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

// === DASHBOARD TABS LOGIC ===
function switchTab(tabName) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));

    // Show selected
    if(tabName === 'list') {
        document.getElementById('viewList').classList.add('active');
        document.querySelectorAll('.tab')[0].classList.add('active');
        loadCustomers();
    } else {
        document.getElementById('viewAdd').classList.add('active');
        document.querySelectorAll('.tab')[1].classList.add('active');
    }
}

// === CUSTOMER MANAGEMENT ===
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
        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <div>
                <strong>${cust.name}</strong> <small>(${cust.customer_id_code})</small><br>
                <span style="font-size:0.8rem; color:#666">${cust.mobile}</span>
            </div>
            <div class="stamp-row">
                <button class="btn-sec" style="width:30px; margin:0;" onclick="updateStamp(${cust.id}, ${cust.stamps}, -1)">-</button>
                <div class="stamp-count">${cust.stamps} <span style="font-size:0.8rem; font-weight:normal;">/ 5</span></div>
                <button style="width:50px; margin:0;" onclick="updateStamp(${cust.id}, ${cust.stamps}, 1)">Stamp</button>
            </div>
            <button class="btn-danger" onclick="deleteCust(${cust.id})">Delete</button>
        `;
        container.appendChild(div);
    });
}

async function updateStamp(id, current, change) {
    let newS = current + change;
    if(newS < 0) newS = 0;
    
    // Check for free snack
    if(change > 0 && newS === 5) alert("🎉 CUSTOMER EARNED A FREE SNACK!");
    if(newS > 5) return; // Cap at 5

    await supabase.from('customers').update({ stamps: newS }).eq('id', id);
    loadCustomers(); // Refresh list
}

async function deleteCust(id) {
    if(confirm("Are you sure? This cannot be undone.")) {
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
    if(!name || !mobile) return alert("Please enter Name and Mobile");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);

    // Save First
    const { error } = await supabase.from('customers').insert([{ name, mobile, customer_id_code: idCode }]);
    
    if(error) {
        alert("Error saving: " + error.message);
    } else {
        // Show Download Area
        document.getElementById('cardName').innerText = name.toUpperCase();
        document.getElementById('cardMobile').innerText = mobile;
        document.getElementById('cardID').innerText = idCode;
        
        document.getElementById('downloadArea').classList.remove('hidden');
        window.scrollTo(0, document.body.scrollHeight);
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

// === CUSTOMER PAGE CHECK ===
async function checkStatus() {
    const id = document.getElementById('checkID').value;
    if(!id) return;

    const { data } = await supabase.from('customers').select('*').eq('customer_id_code', id).single();
    const box = document.getElementById('resultBox');
    
    if(data) {
        box.classList.remove('hidden');
        document.getElementById('resName').innerText = "Hi, " + data.name;
        document.getElementById('resStamps').innerText = data.stamps;
        
        if(data.stamps >= 5) {
            document.getElementById('resMsg').innerHTML = "<b style='color:green'>You have a FREE snack waiting!</b>";
        } else {
            document.getElementById('resMsg').innerText = `Buy ${5 - data.stamps} more to get a reward.`;
        }
    } else {
        alert("ID Not Found");
        box.classList.add('hidden');
    }
}

// === CSV IMPORT/EXPORT ===
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
            const rows = res.data.filter(r => r.name && r.customer_id_code); // Validate
            if(rows.length > 0) {
                const { error } = await supabase.from('customers').upsert(rows.map(r => ({
                    name: r.name,
                    mobile: r.mobile,
                    customer_id_code: r.customer_id_code,
                    stamps: r.stamps || 0
                })), { onConflict: 'customer_id_code'});
                
                if(!error) { alert("Import Successful!"); loadCustomers(); }
            }
        }
    });
}
