// --- CONFIGURATION ---
const SUPABASE_URL = 'https://ddajnivluoxcslnlvtyc.supabase.co'; // REPLACE THIS
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWpuaXZsdW94Y3Nsbmx2dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI4NzUsImV4cCI6MjA4MDMxODg3NX0.x1jGYuVzR6Csow89-spV6I_IxCS0CKUEnqjlDlzjpCs'; // REPLACE THIS
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GLOBAL VARIABLES ---
let currentCustomers = [];
let clickCount = 0;
let clickTimer;

// --- VIEW NAVIGATION ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active', 'hidden'));
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById(viewId).classList.add('active');
}

function goHome() {
    showView('customerView');
}

// --- SECRET DOOR LOGIC ---
function triggerSecretDoor() {
    clickCount++;
    clearTimeout(clickTimer);
    
    // Reset count if user stops clicking for 1 second
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 1000);

    if (clickCount === 5) {
        clickCount = 0;
        showView('authView');
        toggleAuth('login');
    }
}

// --- AUTH LOGIC (Admin) ---
function toggleAuth(mode) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    
    if (mode === 'login') document.getElementById('loginForm').classList.remove('hidden');
    if (mode === 'register') document.getElementById('registerForm').classList.remove('hidden');
    if (mode === 'reset') document.getElementById('resetForm').classList.remove('hidden');
}

async function handleRegister() {
    const email = document.getElementById('regEmail').value;
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;

    if (!email || !user || !pass) return alert("Fill all fields");

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: pass,
    });

    if (authError) return alert(authError.message);

    // 2. Create Profile Link (User -> Username)
    const { error: profileError } = await supabase.from('admin_profiles').insert([
        { id: authData.user.id, username: user, email: email }
    ]);

    if (profileError) return alert("Profile Error: " + profileError.message);
    
    alert("Registration Successful! Please Log In.");
    toggleAuth('login');
}

async function handleLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    // 1. Lookup Email from Username
    const { data, error } = await supabase
        .from('admin_profiles')
        .select('email')
        .eq('username', user)
        .single();

    if (error || !data) return alert("Username not found");

    // 2. Sign in with Email/Pass
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: pass
    });

    if (signInError) return alert("Invalid Password");

    // Success
    showView('dashboardView');
    loadCustomers();
}

async function handlePasswordReset() {
    const email = document.getElementById('resetEmail').value;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href, // Redirects back here
    });
    if (error) alert(error.message);
    else alert("Reset link sent to your email!");
}

async function handleLogout() {
    await supabase.auth.signOut();
    goHome();
}

// --- DASHBOARD LOGIC ---
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    if (tab === 'list') {
        document.getElementById('tabList').classList.add('active');
        document.querySelector('button[onclick="switchTab(\'list\')"]').classList.add('active');
        loadCustomers();
    } else {
        document.getElementById('tabAdd').classList.add('active');
        document.querySelector('button[onclick="switchTab(\'add\')"]').classList.add('active');
    }
}

// --- CUSTOMER MANAGEMENT ---
async function loadCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) {
        currentCustomers = data;
        renderList(data);
    }
}

function renderList(data) {
    const list = document.getElementById('customerTable');
    list.innerHTML = '';
    
    data.forEach(cust => {
        let stampsHtml = '';
        for(let i=1; i<=5; i++) {
            let activeClass = i <= cust.stamps ? 'active' : '';
            stampsHtml += `<div class="stamp ${activeClass}">MSC</div>`;
        }

        const div = document.createElement('div');
        div.className = 'customer-item';
        div.innerHTML = `
            <div>
                <strong>${cust.name}</strong> (${cust.customer_id_code})<br>
                <small>${cust.mobile}</small>
            </div>
            <div class="stamps-area">
                <button class="stamp-btn sub-btn" onclick="updateStamp(${cust.id}, ${cust.stamps}, -1)">-</button>
                ${stampsHtml}
                <button class="stamp-btn add-btn" onclick="updateStamp(${cust.id}, ${cust.stamps}, 1)">+</button>
                <button class="stamp-btn del-btn" onclick="deleteCustomer(${cust.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    });
}

async function updateStamp(id, current, change) {
    let newCount = current + change;
    if (newCount < 0) newCount = 0;
    
    if (newCount === 5 && change > 0) {
        alert("🎉 5 Stamps Reached! Give Free Snack!");
    }
    if (newCount > 5) return; // Cap at 5

    await supabase.from('customers').update({ stamps: newCount }).eq('id', id);
    loadCustomers();
}

async function deleteCustomer(id) {
    if(confirm("⚠ WARNING: Are you sure you want to delete this customer? This cannot be undone.")) {
        await supabase.from('customers').delete().eq('id', id);
        loadCustomers();
    }
}

function filterCustomers() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = currentCustomers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.mobile.includes(term) || 
        c.customer_id_code.toLowerCase().includes(term)
    );
    renderList(filtered);
}

// --- ADD CUSTOMER & ID CARD ---
let generatedID = '';

function previewCard() {
    const name = document.getElementById('newCustName').value.toUpperCase();
    const mobile = document.getElementById('newCustMobile').value;
    
    if (!name || !mobile) return alert("Enter details");

    generatedID = 'MSC' + Math.floor(1000 + Math.random() * 9000);
    
    document.getElementById('cardName').innerText = name;
    document.getElementById('cardMobile').innerText = mobile;
    document.getElementById('cardID').innerText = generatedID;
    
    document.getElementById('cardPreviewBox').classList.remove('hidden');
}

async function saveAndDownload() {
    const name = document.getElementById('newCustName').value;
    const mobile = document.getElementById('newCustMobile').value;

    // Save to DB
    const { error } = await supabase.from('customers').insert([{
        name: name, mobile: mobile, customer_id_code: generatedID
    }]);

    if (error) return alert("Error: " + error.message);

    // Download
    html2canvas(document.querySelector("#idCardContainer")).then(canvas => {
        const link = document.createElement('a');
        link.download = `${name}_Card.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
        
        alert("Customer Saved & Card Downloaded!");
        document.getElementById('newCustName').value = '';
        document.getElementById('newCustMobile').value = '';
        document.getElementById('cardPreviewBox').classList.add('hidden');
    });
}

// --- CUSTOMER CHECK (Public View) ---
async function checkMyStatus() {
    const idCode = document.getElementById('checkCustID').value.trim();
    const resultBox = document.getElementById('customerResult');
    
    const { data, error } = await supabase.from('customers').select('*').eq('customer_id_code', idCode).single();
    
    if (!data) {
        alert("ID Not Found!");
        resultBox.classList.add('hidden');
        return;
    }

    resultBox.classList.remove('hidden');
    
    // Generate Visual ID Card for them to see
    document.getElementById('publicIdCard').innerHTML = `
        <div style="background:linear-gradient(135deg, #0056b3, #002a5c); color:white; padding:15px; border-radius:10px; text-align:left; border:2px solid gold;">
             <h3 style="margin:0; color:gold">MITHRAN SNACKS</h3>
             <p>Name: ${data.name}</p>
             <p>Stamps: ${data.stamps} / 5</p>
        </div>
    `;

    if (data.stamps >= 5) {
        document.getElementById('statusMessage').innerText = "🎉 CONGRATS! You have a FREE Snack waiting!";
        document.getElementById('statusMessage').style.color = "green";
    } else {
        const left = 5 - data.stamps;
        document.getElementById('statusMessage').innerText = `Buy ${left} more snacks to get a free one!`;
        document.getElementById('statusMessage').style.color = "#333";
    }
}

// --- CSV EXPORT / IMPORT ---
function exportCSV() {
    if(currentCustomers.length === 0) return alert("No data to export");
    
    // Use PapaParse to unparse JSON to CSV
    const csv = Papa.unparse(currentCustomers.map(c => ({
        Name: c.name,
        Mobile: c.mobile,
        ID_Code: c.customer_id_code,
        Stamps: c.stamps
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "mithran_customers.csv");
    link.click();
}

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        complete: async function(results) {
            const rows = results.data;
            let successCount = 0;

            for (let row of rows) {
                if(row.Name && row.ID_Code) {
                    const { error } = await supabase.from('customers').upsert({
                        name: row.Name,
                        mobile: row.Mobile,
                        customer_id_code: row.ID_Code,
                        stamps: parseInt(row.Stamps || 0)
                    }, { onConflict: 'customer_id_code' });
                    
                    if(!error) successCount++;
                }
            }
            alert(`Restored ${successCount} customers!`);
            loadCustomers();
        }
    });
}
