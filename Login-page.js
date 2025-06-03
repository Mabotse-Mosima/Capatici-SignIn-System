// 1. Supabase Client Setup
const SUPABASE_URL = 'https://kpngseysyicyhsezucsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmdzZXlzeWljeWhzZXp1Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzAwNzYsImV4cCI6MjA2NDAwNjA3Nn0.WxIXf3I67IYtihZOoXSo_flmxCC5HKnLImIFayfjHf0'; // use your real key here
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Toast Notification
function createToast({ title, description, variant = 'success' }) {
    const toast = document.createElement('div');
    toast.className = `toast-container ${variant === 'destructive' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 3. Login Handler
async function handleLogin(email, password, button, spinner, buttonText) {
    if (!email || !password) {
        createToast({ title: "Error", description: "Please enter both email and password", variant: "destructive" });
        return;
    }
    email = email.trim().toLowerCase();
    password = password.trim();

    button.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (buttonText) buttonText.textContent = 'Logging in...';

    try {
        const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (!authData.user) throw new Error('No user data returned from authentication');
        const user = authData.user;

        // Fetch user profile from Supabase users table (adjust 'user_id' to match your schema)
        const { data: profile, error: profileError } = await client
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) throw new Error('User profile not found. Please contact support.');

        // Build userProfile for sessionStorage
        const userProfile = {
            id: user.id,
            email: user.email,
            fullName: [profile.name, profile.surname].filter(Boolean).join(' '),
            role: profile.role,
            program: profile.cohort || '',
            profileImage: profile.profile_image || null
        };
        sessionStorage.setItem('userProfile', JSON.stringify(userProfile));

        createToast({ title: "Login Successful", description: `Redirecting as ${profile.role || 'candidate'}` });

        setTimeout(() => {
            if (profile.role?.toLowerCase() === 'admin') {
                window.location.href = 'AdminDashboard.html';
            } else {
                window.location.href = 'candidate.html';
            }
        }, 1200);

    } catch (err) {
        let errorMessage = err.message || "Login failed";
        if (err.message === 'Invalid login credentials') {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        }
        createToast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
        button.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (buttonText) buttonText.textContent = 'Login';
    }
}

// 4. Attach Event Listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Desktop
    const form = document.getElementById('desktop-login-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(
                document.getElementById('email')?.value,
                document.getElementById('password')?.value,
                document.getElementById('desktop-login-button'),
                document.getElementById('desktop-spinner'),
                document.getElementById('desktop-button-text')
            );
        });
    }
    // Mobile
    const mobileForm = document.getElementById('mobile-login-form-element');
    if (mobileForm) {
        mobileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(
                document.getElementById('mobileEmail')?.value,
                document.getElementById('mobilePassword')?.value,
                document.getElementById('mobile-submit-button'),
                document.getElementById('mobile-spinner'),
                document.getElementById('mobile-button-text')
            );
        });
    }
});