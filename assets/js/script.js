// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AUTH LOGIC ---

// 1. Listen for Password Recovery Event (Users clicking email link)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        // Show the New Password Form
        toggleAuth('newpass');
    }
});

function toggleAuth(view) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('regForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    document.getElementById('newPassForm').classList.add('hidden');

    if(view === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if(view === 'reg') document.getElementById('regForm').classList.remove('hidden');
    if(view === 'reset') document.getElementById('resetForm').classList.remove('hidden');
    if(view === 'newpass') document.getElementById('newPassForm').classList.remove('hidden');
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    // 1. Check DB Connection
    const { data, error } = await supabase.from('admin_profiles').select('email').eq('username', user).single();
    
    if(error) {
        if(error.message.includes("fetch")) {
            return alert("⚠️ Database Connection Failed! It might be paused.");
        }
        return alert("User not found or Error: " + error.message);
    }

    if(!data) return alert("Username incorrect.");

    // 2. Verify Password
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password: pass });
    if(signInError) return alert("Wrong Password");

    // Success
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadCustomers();
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    
    if(!email || !user || !pass) return alert("Fill all fields");

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
    if(authError) return alert(authError.message);

    const { error: profError } = await supabase.from('admin_profiles').insert([{ id: authData.user.id, username: user, email: email }]);
    if(profError) return alert("Profile Error: " + profError.message);

    alert("Registered! Please Log In.");
    toggleAuth('login');
}

// --- NEW PASSWORD RESET LOGIC ---

// 1. Send the Link (Points to dashboard_msc.html)
async function sendResetLink() {
    const email = document.getElementById('resetEmail').value;
    // Determine current URL path to ensure we redirect back to dashboard
    const redirectUrl = window.location.origin + '/dashboard_msc.html';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    if (error) alert("Error: " + error.message);
    else alert("Reset link sent! Check your email.");
}

// 2. Update the Password (After user clicks email link)
async function updatePassword() {
    const newPass = document.getElementById('newPasswordInput').value;
    if(!newPass) return alert("Enter a new password");

    const { error } = await supabase.auth.updateUser({ password: newPass });

    if (error) {
        alert("Error updating password: " + error.message);
    } else {
        alert("Password Updated Successfully! Please Log In.");
        // Clear URL hash to remove tokens
        history.replaceState(null, null, 'dashboard_msc.html');
        toggleAuth('login');
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// --- TABS & DASHBOARD ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if(tab === 'list') {
        document.getElementById('viewList').classList.remove('hidden');
        document.getElementById('viewAdd').classList.add('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        loadCustomers();
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
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    
    if(error) {
        container.innerHTML = `<p class="text-center" style="color:red">Error loading data.</p>`;
        return;
    }

    if(data) {
        allCustomers = data;
        renderList(data);
    }
}

function renderList(data) {
    const container = document.getElementById('customerListContainer');
    container.innerHTML = '';

    data.forEach(cust => {
        let circlesHtml = '';
        for(let i=1; i<=5; i++) {
            let active = i <= cust.stamps ? 'filled' : '';
            circlesHtml += `<div class="msc-circle ${active}">MSC</div>`;
        }

        let controls = '';
        if(cust.stamps >= 5) {
            controls = `<button class="btn-redeem" onclick="redeemGift(${cust.id})">Redeem Gift 🎁</button>`;
        } else {
            controls = `<button class="ctrl-btn btn-plus" onclick="updateStamp(${cust.id}, ${cust.stamps}, 1)">+</button>`;
        }

        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <div class="customer-top">
                <div>
                    <div class="cust-name">${cust.name}</div>
                    <div class="cust-meta">${cust.mobile} | ${cust.customer_id_code}</div>
                </div>
                <div>
                    <button class="btn-secondary" style="font-size:0.7rem; padding:4px 8px;" 
                    onclick="openModal('${cust.name}', '${cust.mobile}', '${cust.customer_id_code}')">View ID</button>
                    <button class="btn-danger" style="margin-left:5px;" onclick="deleteCust(${cust.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>

            <div class="stamp-row">
                <button class="ctrl-btn btn-minus" onclick="updateStamp(${cust.id}, ${cust.stamps}, -1)">-</button>
                <div class="circles-wrapper">
                    ${circlesHtml}
                </div>
                ${controls}
            </div>
        `;
        container.appendChild(div);
    });
}

// --- DATA ACTIONS ---
async function updateStamp(id, current, change) {
    let newS = current + change;
    if(newS < 0) newS = 0;
    if(newS > 5) newS = 5;

    await supabase.from('customers').update({ stamps: newS }).eq('id', id);
    loadCustomers();
}

async function redeemGift(id) {
    if(confirm("🎁 Confirm customer received free snack? (Resets stamps to 0)")) {
        await supabase.from('customers').update({ stamps: 0 }).eq('id', id);
        alert("Redeemed successfully!");
        loadCustomers();
    }
}

async function deleteCust(id) {
    if(confirm("Are you sure? This cannot be undone.")) {
        await supabase.from('customers').delete().eq('id', id);
        loadCustomers();
    }
}

async function saveCustomer() {
    const name = document.getElementById('newName').value;
    const mobile = document.getElementById('newMobile').value;
    if(!name || !mobile) return alert("Fill Name and Mobile");

    const idCode = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await supabase.from('customers').insert([{ name, mobile, customer_id_code: idCode }]);

    if(error) alert(error.message);
    else {
        alert("Customer Registered!");
        openModal(name, mobile, idCode);
        document.getElementById('newName').value = '';
        document.getElementById('newMobile').value = '';
    }
}

// --- MODAL & ID CARD LOGIC ---
function openModal(name, mobile, id) {
    document.getElementById('modalName').innerText = name.toUpperCase();
    document.getElementById('modalMobile').innerText = mobile;
    document.getElementById('modalID').innerText = id;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

function downloadModalCard() {
    html2canvas(document.querySelector("#modalIdCard")).then(canvas => {
        const link = document.createElement('a');
        link.download = `MSC_ID_${document.getElementById('modalName').innerText}.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

// --- CUSTOMER PAGE CHECK (for index.html) ---
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
        
        if(data.stamps >= 5) {
            document.getElementById('resMsg').innerHTML = "<span style='color:green'>🎉 Reward Available!</span>";
        } else {
            document.getElementById('resMsg').innerText = `Buy ${5 - data.stamps} more to get free snack!`;
        }

        document.getElementById('pubCardName').innerText = data.name.toUpperCase();
        document.getElementById('pubCardMobile').innerText = data.mobile;
        document.getElementById('pubCardID').innerText = data.customer_id_code;
    }
}

// --- CSV LOGIC ---
function filterList() {
    const term = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allCustomers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.mobile.includes(term) || 
        c.customer_id_code.toLowerCase().includes(term)
    );
    renderList(filtered);
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
                    name: r.name, mobile: r.mobile, customer_id_code: r.customer_id_code, stamps: r.stamps || 0
                })), { onConflict: 'customer_id_code'});
                
                if(!error) { alert("Import Successful!"); loadCustomers(); }
            }
        }
    });
}
