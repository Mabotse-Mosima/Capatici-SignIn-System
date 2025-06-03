// Supabase Setup
const SUPABASE_URL = 'https://kpngseysyicyhsezucsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmdzZXlzeWljeWhzZXp1Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzAwNzYsImV4cCI6MjA2NDAwNjA3Nn0.WxIXf3I67IYtihZOoXSo_flmxCC5HKnLImIFayfjHf0';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
const state = {
    userProfile: null
};

// Toast
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-${type}`;
    toast.innerHTML = `<div class="toast-title">${title}</div>
        <div class="toast-description">${message}</div>`;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Load user profile from sessionStorage and update nav/profile
function loadUserProfile() {
    const saved = sessionStorage.getItem('userProfile');
    if (saved) {
        state.userProfile = JSON.parse(saved);
    } else {
        window.location.href = '/Login-page.html';
    }
}

// Navbar update
function updateNavbar() {
    const p = state.userProfile;
    if (!p) return;
    document.getElementById('navbar-user-name').textContent = p.fullName;
    document.getElementById('navbar-user-email').textContent = p.email;
    const avatarDiv = document.getElementById('navbar-avatar');
    if (p.profileImage) {
        avatarDiv.style.background = 'none';
        avatarDiv.innerHTML = `<img src="${p.profileImage}" alt="Avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`;
    } else {
        avatarDiv.style.background = '#fff';
        avatarDiv.innerHTML = `<span id="navbar-avatar-initial">${(p.fullName?.[0] || 'U').toUpperCase()}</span>`;
    }
}

// Profile section update
function updateProfileDisplay() {
    const p = state.userProfile;
    if (!p) return;
    document.getElementById('profile-fullname').textContent = p.fullName;
    document.getElementById('profile-email').textContent = p.email;
    document.getElementById('profile-program').textContent = p.program;
    document.getElementById('profile-role').textContent = p.role;
    // Avatar
    if (p.profileImage) {
        document.getElementById('profile-avatar-image').src = p.profileImage;
        document.getElementById('profile-avatar-image').style.display = '';
        document.getElementById('profile-avatar-icon').style.display = 'none';
    } else {
        document.getElementById('profile-avatar-image').style.display = 'none';
        document.getElementById('profile-avatar-icon').textContent = (p.fullName?.[0] || 'U').toUpperCase();
        document.getElementById('profile-avatar-icon').style.display = '';
    }
}

// Nav switching
function switchView(view) {
    if (view === 'profile') {
        document.getElementById('dashboard-content').classList.add('hidden');
        document.getElementById('profile-content').classList.remove('hidden');
        updateProfileDisplay();
        document.getElementById('dashboard-menu').classList.remove('active');
        document.getElementById('profile-menu').classList.add('active');
    } else {
        document.getElementById('dashboard-content').classList.remove('hidden');
        document.getElementById('profile-content').classList.add('hidden');
        document.getElementById('dashboard-menu').classList.add('active');
        document.getElementById('profile-menu').classList.remove('active');
    }
}

// Password update handler
async function handlePasswordChange(event) {
    event.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!newPassword || !confirmPassword) {
        showToast("Error", "Please fill in both password fields.", "error");
        return;
    }
    if (newPassword.length < 8) {
        showToast("Error", "Password must be at least 8 characters.", "error");
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast("Error", "Passwords do not match.", "error");
        return;
    }

    try {
        // Use Supabase auth to update password
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
            showToast("Error", error.message || "Failed to update password.", "error");
        } else {
            showToast("Success", "Password updated successfully.", "success");
            document.getElementById('password-form').reset();
        }
    } catch (err) {
        showToast("Error", err.message || "Failed to update password.", "error");
    }
}

// Sign out
function handleSignOut() {
    sessionStorage.removeItem('userProfile');
    client.auth.signOut();
    window.location.href = '/Login-page.html';
}

// Sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    updateNavbar();
    switchView('dashboard'); // Default

    document.getElementById('profile-menu').addEventListener('click', function(e) {
        e.preventDefault();
        switchView('profile');
    });

    document.getElementById('dashboard-menu').addEventListener('click', function(e) {
        e.preventDefault();
        switchView('dashboard');
    });

    document.getElementById('signout-menu').addEventListener('click', function() {
        handleSignOut();
    });

    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
});