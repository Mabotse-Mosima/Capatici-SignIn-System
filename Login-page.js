// ✅ 1. Supabase Client Setup
const SUPABASE_URL = 'https://kpngseysyicyhsezucsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmdzZXlzeWljeWhzZXp1Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzAwNzYsImV4cCI6MjA2NDAwNjA3Nn0.WxIXf3I67IYtihZOoXSo_flmxCC5HKnLImIFayfjHf0';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ 2. Toast Notification
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

// ✅ 3. Enhanced Login Handler with Debugging
async function handleLogin(email, password, button, spinner, buttonText) {
    // Debug: Log the inputs (remove in production)
    console.log('Login attempt:', { 
        email: email, 
        emailLength: email?.length,
        passwordLength: password?.length,
        emailTrimmed: email?.trim(),
        hasPassword: !!password 
    });

    // Validate inputs
    if (!email || !password) {
        createToast({
            title: "Error",
            description: "Please enter both email and password",
            variant: "destructive"
        });
        return;
    }

    // Trim whitespace and validate email format
    email = email.trim().toLowerCase();
    password = password.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        createToast({
            title: "Error",
            description: "Please enter a valid email address",
            variant: "destructive"
        });
        return;
    }

    if (password.length < 6) {
        createToast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive"
        });
        return;
    }

    button.disabled = true;
    spinner.style.display = 'inline-block';
    buttonText.textContent = 'Logging in...';

    try {
        console.log('Attempting login with:', { email }); // Debug log

        const { data: authData, error: authError } = await client.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });

        console.log('Auth response:', { authData, authError }); // Debug log

        if (authError) {
            console.error('Authentication error details:', {
                message: authError.message,
                status: authError.status,
                code: authError.code
            });
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No user data returned from authentication');
        }

        const user = authData.user;
        console.log('Authenticated user:', { id: user.id, email: user.email }); // Debug log

        // ✅ Match user_id from Supabase Auth with users table
        const { data: profile, error: profileError } = await client
            .from('users')
            .select('role')
            .eq('user_id', user.id)
            .single();

        console.log('Profile lookup:', { profile, profileError }); // Debug log

        if (profileError) {
            console.error('Profile error:', profileError);
            // Check if it's a "no rows returned" error
            if (profileError.code === 'PGRST116') {
                throw new Error('User profile not found. Please contact support.');
            }
            throw new Error(`Profile lookup failed: ${profileError.message}`);
        }

        if (!profile?.role) {
            throw new Error('User role not found in profile');
        }

        const role = profile.role.toLowerCase();
        console.log('User role:', role);

        createToast({
            title: "Login Successful",
            description: `Redirecting as ${role}`
        });

        setTimeout(() => {
            if (role === 'admin') {
                window.location.href = 'AdminDashboard.html';
            } else {
                window.location.href = 'facial-capture.html';
            }
        }, 1500);

    } catch (err) {
        console.error('Login error details:', {
            message: err.message,
            status: err.status,
            code: err.code,
            fullError: err
        });

        let errorMessage = err.message;
        
        // Provide more specific error messages
        if (err.message === 'Invalid login credentials') {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (err.status === 400) {
            errorMessage = 'Authentication failed. Please verify your email and password.';
        } else if (err.message.includes('Email rate limit exceeded')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        }

        createToast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive"
        });
    } finally {
        button.disabled = false;
        spinner.style.display = 'none';
        buttonText.textContent = 'Login';
    }
}

// ✅ 4. Test Connection Function (add this for debugging)
async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await client.auth.getSession();
        console.log('Connection test result:', { data, error });
        
        if (error) {
            console.error('Connection test failed:', error);
            return false;
        }
        
        console.log('Supabase connection successful');
        return true;
    } catch (err) {
        console.error('Connection test error:', err);
        return false;
    }
}

// Test connection when page loads
document.addEventListener('DOMContentLoaded', () => {
    testSupabaseConnection();
});

// ✅ 5. Desktop Login Form
document.getElementById('desktop-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Desktop form submission:', { 
        hasEmail: !!email, 
        hasPassword: !!password,
        emailValue: email // Remove this in production
    });
    
    handleLogin(
        email,
        password,
        document.getElementById('desktop-login-button'),
        document.getElementById('desktop-spinner'),
        document.getElementById('desktop-button-text')
    );
});

// ✅ 6. Mobile Login Form
document.getElementById('mobile-login-form-element')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('mobileEmail').value;
    const password = document.getElementById('mobilePassword').value;
    
    console.log('Mobile form submission:', { 
        hasEmail: !!email, 
        hasPassword: !!password,
        emailValue: email // Remove this in production
    });
    
    handleLogin(
        email,
        password,
        document.getElementById('mobile-submit-button'),
        document.getElementById('mobile-spinner'),
        document.getElementById('mobile-button-text')
    );
});