// Application State
const state = {
  currentView: 'dashboard',
  hasSignedIn: false,
  isLate: false,
  showHistory: false,
  showReasonForm: false,
  showSignInReminder: false,
  lateReason: '',
  attendanceHistory: [
    { date: "2025-05-13", time: "-", status: "Absent", reason: "-" },
    { date: "2025-05-12", time: "09:20 AM", status: "Late", reason: "Taxi Strike" },
    { date: "2025-05-09", time: "08:20 AM", status: "Present", reason: "-" }
  ],
  userProfile: {
    fullName: "Mmabotse",
    email: "mmabotse@example.com",
    program: "AI Academy 2025",
    profileImage: null
  }
};

// DOM Elements
const elements = {
  // Header elements
  currentTime: document.getElementById('current-time'),
  headerUsername: document.getElementById('header-username'),
  headerAvatar: document.getElementById('header-avatar'),
  headerProfileImage: document.getElementById('header-profile-image'),
  
  // Sidebar elements
  sidebarUsername: document.getElementById('sidebar-username'),
  dashboardMenu: document.getElementById('dashboard-menu'),
  profileMenu: document.getElementById('profile-menu'),
  signoutMenu: document.getElementById('signout-menu'),
  menuToggle: document.getElementById('menu-toggle'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebar: document.getElementById('sidebar'),
  
  // Dashboard elements
  dashboardContent: document.getElementById('dashboard-content'),
  signInReminder: document.getElementById('sign-in-reminder'),
  statusIcon: document.getElementById('status-icon'),
  statusTitle: document.getElementById('status-title'),
  statusDescription: document.getElementById('status-description'),
  statusTimeContainer: document.getElementById('status-time-container'),
  lateReasonForm: document.getElementById('late-reason-form'),
  lateReasonInput: document.getElementById('late-reason'),
  submitReasonBtn: document.getElementById('submit-reason-btn'),
  signInBtn: document.getElementById('sign-in-btn'),
  viewHistoryBtn: document.getElementById('view-history-btn'),
  attendanceHistory: document.getElementById('attendance-history'),
  historyTableBody: document.getElementById('history-table-body'),
  downloadBtn: document.getElementById('download-btn'),
  
  // Profile elements
  profileContent: document.getElementById('profile-content'),
  profileFullname: document.getElementById('profile-fullname'),
  profileEmail: document.getElementById('profile-email'),
  profileProgram: document.getElementById('profile-program'),
  profileAvatarContainer: document.getElementById('profile-avatar-container'),
  profileAvatarIcon: document.getElementById('profile-avatar-icon'),
  profileAvatarImage: document.getElementById('profile-avatar-image'),
  profileUpload: document.getElementById('profile-upload'),
  passwordForm: document.getElementById('password-form'),
  
  // Toast container
  toastContainer: document.getElementById('toast-container')
};



function loadUserProfileFromSession() {
  try {
    const savedUserProfile = sessionStorage.getItem('userProfile');
    if (savedUserProfile) {
      const userProfile = JSON.parse(savedUserProfile);
     
      // Update state with actual user data from Supabase
      // Using the column names from the candidates table
      state.userProfile = {
        fullName: userProfile.full_name,
        email: userProfile.email,
        program: userProfile.cohort,
        profileImage: state.userProfile.profileImage // Keep existing profile image if any
      };
     
      console.log("Loaded user profile:", state.userProfile);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error loading user profile from session:", error);
    return false;
  }
}
// Time Management
function updateCurrentTime() {
  const now = new Date();
  elements.currentTime.textContent = now.toLocaleString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
  
  // Check if sign-in reminder should be shown
  if (!state.hasSignedIn && (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 15))) {
    state.showSignInReminder = true;
    elements.signInReminder.classList.remove('hidden');
  } else {
    state.showSignInReminder = false;
    elements.signInReminder.classList.add('hidden');
  }
  
  updateAttendanceStatus();
}

// Toast Notifications
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <h4>${title}</h4>
    <p>${message}</p>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (elements.toastContainer.contains(toast)) {
        elements.toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Navigation
function switchView(view) {
  state.currentView = view;
  
  // Update menu active states
  document.querySelectorAll('.sidebar-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (view === 'dashboard') {
    elements.dashboardContent.classList.remove('hidden');
    elements.profileContent.classList.add('hidden');
    elements.dashboardMenu.classList.add('active');
  } else if (view === 'profile') {
    elements.dashboardContent.classList.add('hidden');
    elements.profileContent.classList.remove('hidden');
    elements.profileMenu.classList.add('active');
    updateProfileDisplay();
  }
  
  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 768) {
    toggleSidebar(false);
  }
}

// Sidebar toggle
function toggleSidebar(show) {
  if (show) {
    elements.sidebar.classList.add('open');
    elements.sidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Attendance Management
function updateAttendanceStatus() {
  if (state.hasSignedIn) {
    if (state.isLate) {
      elements.statusIcon.textContent = "⚠️";
      elements.statusIcon.className = "status-icon late";
      elements.statusTitle.textContent = "Late";
    } else {
      elements.statusIcon.textContent = "✓";
      elements.statusIcon.className = "status-icon present";
      elements.statusTitle.textContent = "Present";
    }
    elements.statusDescription.textContent = "You have successfully signed in for today";
    elements.signInBtn.classList.add('hidden');
  } else {
    elements.statusIcon.textContent = "✕";
    elements.statusIcon.className = "status-icon not-signed-in";
    elements.statusTitle.textContent = "Not Signed In";
    elements.statusDescription.textContent = "You have not signed in for today yet";
    elements.signInBtn.classList.remove('hidden');
  }
  
  // Update time badge
  if (state.showSignInReminder && !state.hasSignedIn) {
    elements.statusTimeContainer.innerHTML = '<span class="time-badge">Sign-in closes at 9:15 AM</span>';
  } else {
    elements.statusTimeContainer.innerHTML = '';
  }
}

function handleSignIn() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = now.toISOString().split('T')[0];
  
  let status = "Present";
  if (hour > 9 || (hour === 9 && minute >= 15)) {
    status = "Late";
    state.isLate = true;
    state.showReasonForm = true;
    elements.lateReasonForm.classList.remove('hidden');
  }
  
  const newAttendance = {
    date: formattedDate,
    time: formattedTime,
    status: status,
    reason: status === "Late" ? "No reason submitted" : "-"
  };
  
  state.attendanceHistory.unshift(newAttendance);
  state.hasSignedIn = true;
  
  updateAttendanceStatus();
  updateHistoryTable();
  
  showToast(
    `Signed in as ${status}`,
    status === "Present" 
      ? "You have successfully signed in for today" 
      : "Please provide a reason for being late",
    status === "Present" ? "success" : "warning"
  );
}

function submitReason() {
  const reason = elements.lateReasonInput.value.trim();
  
  if (!reason) {
    showToast("Error", "Please enter a reason before submitting.", "error");
    return;
  }
  
  state.lateReason = reason;
  state.attendanceHistory[0].reason = reason;
  
  updateHistoryTable();
  elements.lateReasonForm.classList.add('hidden');
  state.showReasonForm = false;
  elements.lateReasonInput.value = '';
  
  showToast("Success", "Reason submitted successfully", "success");
}

function toggleHistory() {
  state.showHistory = !state.showHistory;
  
  if (state.showHistory) {
    elements.attendanceHistory.classList.remove('hidden');
    elements.viewHistoryBtn.textContent = "Hide History";
    elements.viewHistoryBtn.classList.remove('secondary-button');
    elements.viewHistoryBtn.classList.add('primary-button');
    updateHistoryTable();
  } else {
    elements.attendanceHistory.classList.add('hidden');
    elements.viewHistoryBtn.textContent = "View History";
    elements.viewHistoryBtn.classList.add('secondary-button');
    elements.viewHistoryBtn.classList.remove('primary-button');
  }
}

function updateHistoryTable() {
  elements.historyTableBody.innerHTML = '';
  
  state.attendanceHistory.forEach(entry => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.time}</td>
      <td><span class="status-badge status-${entry.status.toLowerCase()}">${entry.status}</span></td>
      <td>${entry.reason}</td>
    `;
    
    elements.historyTableBody.appendChild(row);
  });
}

function downloadHistory() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Time,Status,Reason\n";
  
  state.attendanceHistory.forEach(item => {
    let row = `${item.date},${item.time},${item.status},"${item.reason}"`;
    csvContent += row + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "attendance_history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Download Started", "Your attendance history is being downloaded", "success");
}

// Profile Management
function updateProfileDisplay() {
  elements.profileFullname.textContent = state.userProfile.fullName;
  elements.profileEmail.textContent = state.userProfile.email;
  elements.profileProgram.textContent = state.userProfile.program;
  elements.headerUsername.textContent = state.userProfile.fullName;
  elements.sidebarUsername.textContent = state.userProfile.fullName;
  
  // Update profile images
  if (state.userProfile.profileImage) {
    elements.profileAvatarImage.src = state.userProfile.profileImage;
    elements.profileAvatarImage.classList.remove('hidden');
    elements.profileAvatarIcon.classList.add('hidden');
    
    elements.headerProfileImage.src = state.userProfile.profileImage;
    elements.headerProfileImage.classList.remove('hidden');
    elements.headerAvatar.querySelector('.user-icon').style.display = 'none';
  } else {
    elements.profileAvatarImage.classList.add('hidden');
    elements.profileAvatarIcon.classList.remove('hidden');
    
    elements.headerProfileImage.classList.add('hidden');
    elements.headerAvatar.querySelector('.user-icon').style.display = 'block';
  }
}

function handleProfileImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.match('image.*')) {
    showToast("Invalid file type", "Please upload an image file", "error");
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast("File too large", "Please upload an image smaller than 5MB", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.userProfile.profileImage = e.target.result;
    
    // Save to localStorage
    localStorage.setItem('profileImage', e.target.result);
    
    updateProfileDisplay();
    showToast("Profile picture updated", "Your profile picture has been successfully updated", "success");
  };
  reader.readAsDataURL(file);
}

function handlePasswordChange(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast("Missing fields", "Please fill in all password fields", "error");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast("Passwords don't match", "New password and confirmation password must match", "error");
    return;
  }
  
  if (newPassword.length < 8) {
    showToast("Password too short", "New password must be at least 8 characters", "error");
    return;
  }
  
  // Simulate password change success
  showToast("Password updated", "Your password has been successfully changed", "success");
  
  // Reset form
  elements.passwordForm.reset();
}

function handleSignOut() {
  // Clear any stored data if needed
  localStorage.removeItem('profileImage');
  
  // Redirect to login page
  window.location.href = '/Login-page.html';
  
  // Optional: Show a toast message before redirecting
  showToast("Signed Out", "You have been signed out successfully", "info");
  
  // Delay the redirect slightly to allow the toast to show
  setTimeout(() => {
    window.location.href = '/Login-page.html';
  }, 1500);
  
  // Reset state
  state.hasSignedIn = false;
  state.isLate = false;
  state.showHistory = false;
  state.showReasonForm = false;
  
  // Reset UI
  updateAttendanceStatus();
  elements.attendanceHistory.classList.add('hidden');
  elements.lateReasonForm.classList.add('hidden');
  elements.viewHistoryBtn.textContent = "View History";
  elements.viewHistoryBtn.classList.add('secondary-button');
  elements.viewHistoryBtn.classList.remove('primary-button');
  
  // Switch to dashboard
  setTimeout(() => {
    switchView('dashboard');
  }, 1500);
}

// Initialize Application
function initializeApp() {
  // Load saved profile image
  const savedProfileImage = localStorage.getItem('profileImage');
  if (savedProfileImage) {
    state.userProfile.profileImage = savedProfileImage;
  }
  
  // Set up event listeners
  elements.signInBtn.addEventListener('click', handleSignIn);
  elements.submitReasonBtn.addEventListener('click', submitReason);
  elements.viewHistoryBtn.addEventListener('click', toggleHistory);
  elements.downloadBtn.addEventListener('click', downloadHistory);
  elements.profileUpload.addEventListener('change', handleProfileImageUpload);
  elements.passwordForm.addEventListener('submit', handlePasswordChange);
  
  // Navigation event listeners
  elements.dashboardMenu.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('dashboard');
  });
  
  elements.profileMenu.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('profile');
  });
  
  elements.signoutMenu.addEventListener('click', (e) => {
    e.preventDefault();
    handleSignOut();
  });
  
  // Mobile menu toggle
  elements.menuToggle.addEventListener('click', () => {
    toggleSidebar(true);
  });
  
  elements.sidebarOverlay.addEventListener('click', () => {
    toggleSidebar(false);
  });
  
  // Initialize UI
  updateCurrentTime();
  updateAttendanceStatus();
  updateHistoryTable();
  updateProfileDisplay();
  
  // Update time every second
  setInterval(updateCurrentTime, 1000);
  
  // Show attendance reminder after 10 seconds
  setTimeout(() => {
    const now = new Date();
    if (!state.hasSignedIn && (now.getHours() >= 9 && now.getMinutes() >= 10)) {
      showToast("Attendance Reminder", "⏰ You haven't signed in yet. Please sign in.", "warning");
    }
  }, 10000);
  
  // Handle responsive behavior
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // Reset sidebar on desktop
      elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  
  // Accessibility improvements
  document.addEventListener('keydown', (e) => {
    // Close sidebar with Escape key
    if (e.key === 'Escape' && elements.sidebar.classList.contains('open')) {
      toggleSidebar(false);
    }
  });
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
