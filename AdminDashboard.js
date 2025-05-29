document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();

    // State management
    let currentUser = 'Admin';
    let currentPage = 'dashboard';
    let attendanceData = [
        { id: 1, name: 'John Doe', cohort: 'AI Academy', date: '2024-01-15', time: '09:00', status: 'present', notes: '' },
        { id: 2, name: 'Jane Smith', cohort: 'Cloud Academy', date: '2024-01-15', time: '09:15', status: 'late', notes: 'Traffic delay' },
        { id: 3, name: 'Mike Johnson', cohort: 'AI Academy', date: '2024-01-15', time: '-', status: 'absent', notes: 'Sick leave' },
        { id: 4, name: 'Sarah Wilson', cohort: 'Cloud Academy', date: '2024-01-15', time: '08:45', status: 'present', notes: '' },
        { id: 5, name: 'Tom Brown', cohort: 'AI Academy', date: '2024-01-15', time: '09:30', status: 'late', notes: 'Overslept' }
    ];
    
    let notifications = [
        { type: 'reminder', title: 'Attendance Reminder', message: 'Please remember to mark attendance for today\'s session.' },
        { type: 'absence', title: 'Absence Alert', message: 'Mike Johnson has been absent for 2 consecutive days.' },
        { type: 'late', title: 'Late Arrival', message: 'Jane Smith arrived 15 minutes late today.' },
        { type: 'reminder', title: 'Weekly Report', message: 'Generate weekly attendance report for management review.' },
        { type: 'late', title: 'Frequent Lateness', message: 'Tom Brown has been late 3 times this week.' }
    ];

    let attendanceChart = null;
    let trendsChart = null;

    // Chart data
    const chartData = {
        daily: [
            { name: 'Mon', present: 85, absent: 10, late: 5 },
            { name: 'Tue', present: 90, absent: 5, late: 5 },
            { name: 'Wed', present: 88, absent: 7, late: 5 },
            { name: 'Thu', present: 92, absent: 3, late: 5 },
            { name: 'Fri', present: 87, absent: 8, late: 5 }
        ],
        weekly: [
            { name: 'Week 1', present: 420, absent: 50, late: 30 },
            { name: 'Week 2', present: 450, absent: 30, late: 20 },
            { name: 'Week 3', present: 440, absent: 40, late: 20 },
            { name: 'Week 4', present: 460, absent: 25, late: 15 }
        ],
        monthly: [
            { name: 'Jan', present: 1800, absent: 150, late: 100 },
            { name: 'Feb', present: 1850, absent: 120, late: 80 },
            { name: 'Mar', present: 1900, absent: 100, late: 70 }
        ]
    };

    // Supabase initialization
    const SUPABASE_URL = 'https://kpngseysyicyhsezucsz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmdzZXlzeWljeWhzZXp1Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzAwNzYsImV4cCI6MjA2NDAwNjA3Nn0.WxIXf3I67IYtihZOoXSo_flmxCC5HKnLImIFayfjHf0';
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Initialize the application
    initializeEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    document.getElementById('dashboardDate').textContent = today;
    
    // Initialize dashboard content
    showPage('dashboard');
    populateAttendanceTable();
    populateNotifications();
    initializeCharts();
    
    // Show welcome toast
    showToast('Welcome to the Capaciti Attendance Hub', 'info');

    // Candidate form submission
    document.getElementById('addCandidateForm')?.addEventListener('submit', handleAddCandidateSubmit);
});

// ======================
// EVENT HANDLERS
// ======================
function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-menu-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', function() {
        window.location.href = 'Login-page.html';
    });

    // Dashboard buttons
    document.getElementById('addCandidateBtn').addEventListener('click', () => showModal('addCandidateModal'));
    document.getElementById('showQRBtn').addEventListener('click', showQRCode);
    document.getElementById('refreshDataBtn').addEventListener('click', refreshData);
    
    // Filters and search
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    
    // Modals
    document.getElementById('closeQRModal').addEventListener('click', () => hideModal('qrModal'));
    document.getElementById('closeAddCandidateModal').addEventListener('click', () => hideModal('addCandidateModal'));
    document.getElementById('cancelAddCandidate').addEventListener('click', () => hideModal('addCandidateModal'));
    
    // QR Download
    document.getElementById('downloadQRBtn').addEventListener('click', downloadQRCode);
    
    // Chart tabs
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', handleChartTabChange);
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

async function handleAddCandidateSubmit(e) {
    e.preventDefault();
    
    const surname = document.getElementById('candidateSurname').value.trim();
    const name = document.getElementById('candidateName').value.trim();
    const cohort = document.getElementById('candidateCohort').value.trim();
    const mobile = document.getElementById('candidateMobile').value.trim();
    const email = document.getElementById('candidateEmail').value.trim();
    const password = document.getElementById('candidatePassword').value.trim();

    // Basic validation
    if (!email || !password || !name || !surname || !cohort || !mobile) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        // Create user in Supabase Auth
        const { data: userData, error: createError } = await client.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) throw createError;

        const authUID = userData.user.id;

        // Insert into 'users' table
        const { error: insertError } = await client.from('users').insert({
            surname,
            name,
            cohort,
            cell_no: mobile,
            email,
            role: 'candidate',
            user_id: authUID
        });

        if (insertError) throw insertError;

        // Update local state
        const newCandidate = {
            id: Math.max(...attendanceData.map(r => r.id)) + 1,
            name: `${surname} ${name}`,
            cohort,
            date: new Date().toISOString().split('T')[0],
            time: '-',
            status: 'absent',
            notes: ''
        };
        
        attendanceData.push(newCandidate);
        populateAttendanceTable();
        
        // UI feedback
        showToast(`Candidate ${name} added successfully`, 'success');
        document.getElementById('addCandidateForm').reset();
        hideModal('addCandidateModal');
    } catch (err) {
        console.error('Error adding candidate:', err);
        showToast(`Failed to add candidate: ${err.message}`, 'error');
    }
}

// ======================
// CORE FUNCTIONS
// ======================
function handleNavigation(e) {
    const page = e.currentTarget.dataset.page;
    showPage(page);
    
    // Update active sidebar item
    document.querySelectorAll('.sidebar-menu-item').forEach(item => {
        item.classList.remove('bg-[#2a3a52]', 'font-medium');
        item.classList.add('text-gray-300', 'hover:bg-[#2a3a52]', 'hover:text-white');
    });
    
    e.currentTarget.classList.add('bg-[#2a3a52]', 'font-medium');
    e.currentTarget.classList.remove('text-gray-300', 'hover:bg-[#2a3a52]', 'hover:text-white');
}

function showPage(pageId) {
    currentPage = pageId;
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected page
    document.getElementById(pageId + 'Page').classList.remove('hidden');
    
    // Initialize page-specific content
    if (pageId === 'trends') {
        initializeTrendsChart();
    } else if (pageId === 'notifications') {
        populateAllNotifications();
    }
}

function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// ======================
// DATA OPERATIONS
// ======================
function populateAttendanceTable(data = attendanceData) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';
    
    data.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'border-t border-gray-100';
        
        // Get status badge with icon
        const statusBadge = getStatusBadge(record.status);
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${record.name}</td>
            <td class="px-4 py-3 text-sm">${record.cohort}</td>
            <td class="px-4 py-3 text-sm">${record.date}</td>
            <td class="px-4 py-3 text-sm">${record.time}</td>
            <td class="px-4 py-3 text-sm">
                ${statusBadge}
            </td>
            <td class="px-4 py-3 text-sm">${record.notes}</td>
            <td class="px-4 py-3 text-sm">
                <button onclick="viewDetails(${record.id})" class="p-1 text-gray-500 hover:text-gray-700">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        
        // Initialize icons in the newly added row
        lucide.createIcons({
            attrs: {
                class: "w-4 h-4"
            },
            elements: row.querySelectorAll('[data-lucide]')
        });
    });
}

function getStatusBadge(status) {
    let icon, className;
    
    switch (status) {
        case 'present':
            icon = 'check';
            className = 'status-present';
            break;
        case 'absent':
            icon = 'x';
            className = 'status-absent';
            break;
        case 'late':
            icon = 'clock';
            className = 'status-late';
            break;
        default:
            icon = 'help-circle';
            className = '';
    }
    
    return `<span class="status-badge ${className}">
        <i data-lucide="${icon}" class="w-3 h-3"></i>
        <span class="capitalize">${status}</span>
    </span>`;
}

function applyFilters() {
    const cohortFilter = document.getElementById('cohortFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = attendanceData.filter(record => {
        const matchesCohort = cohortFilter === 'all' || record.cohort === cohortFilter;
        const matchesDate = !dateFilter || record.date === dateFilter;
        const matchesSearch = !searchQuery || 
            record.name.toLowerCase().includes(searchQuery) ||
            record.cohort.toLowerCase().includes(searchQuery) ||
            record.notes.toLowerCase().includes(searchQuery);
        
        return matchesCohort && matchesDate && matchesSearch;
    });
    
    populateAttendanceTable(filtered);
    showToast(`Found ${filtered.length} matching records`, 'info');
}

function exportToCSV() {
    const headers = ['ID', 'Name', 'Cohort', 'Date', 'Time', 'Status', 'Notes'];
    const csvContent = [
        headers.join(','),
        ...attendanceData.map(record => [
            record.id,
            record.name,
            record.cohort,
            record.date,
            record.time,
            record.status,
            record.notes.replace(/,/g, ';')
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV exported successfully', 'success');
}

// ======================
// NOTIFICATIONS
// ======================
function populateNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    notifications.slice(0, 3).forEach(notification => {
        const div = document.createElement('div');
        div.className = `notification-item notification-${notification.type}`;
        div.innerHTML = `
            <div class="font-medium text-sm mb-1">${notification.title}</div>
            <div class="text-sm text-gray-700">${notification.message}</div>
        `;
        notificationsList.appendChild(div);
    });
}

function populateAllNotifications() {
    const allNotificationsList = document.getElementById('allNotificationsList');
    const notificationCount = document.getElementById('notificationCount');
    
    notificationCount.textContent = `${notifications.length} ${notifications.length === 1 ? 'notification' : 'notifications'}`;
    allNotificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        allNotificationsList.innerHTML = '<div class="text-center py-8 text-gray-500">No notifications to display</div>';
        return;
    }
    
    notifications.forEach((notification, index) => {
        const div = document.createElement('div');
        div.className = `notification-item notification-${notification.type}`;
        div.innerHTML = `
            <div class="flex justify-between">
                <div class="font-medium text-sm mb-1">${notification.title}</div>
                <div class="text-xs text-gray-500">10 minutes ago</div>
            </div>
            <div class="text-sm text-gray-700">${notification.message}</div>
        `;
        allNotificationsList.appendChild(div);
    });
}

// ======================
// CHARTS
// ======================
function initializeCharts() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    attendanceChart = createChart(ctx, chartData.daily);
}

function initializeTrendsChart() {
    if (trendsChart) return;
    
    const ctx = document.getElementById('trendsChart').getContext('2d');
    trendsChart = createChart(ctx, chartData.daily);
}

function createChart(context, data) {
    return new Chart(context, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [
                {
                    label: 'Present',
                    data: data.map(d => d.present),
                    backgroundColor: '#43A047',
                    borderRadius: 4
                },
                {
                    label: 'Absent',
                    data: data.map(d => d.absent),
                    backgroundColor: '#E53935',
                    borderRadius: 4
                },
                {
                    label: 'Late',
                    data: data.map(d => d.late),
                    backgroundColor: '#FFB300',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: '#f3f4f6'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function handleChartTabChange(e) {
    const period = e.target.dataset.period;
    const isMainChart = e.target.closest('#dashboardPage') !== null;
    
    // Update active tab
    e.target.parentNode.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Update chart data
    const chart = isMainChart ? attendanceChart : trendsChart;
    if (chart) {
        chart.data.labels = chartData[period].map(d => d.name);
        chart.data.datasets[0].data = chartData[period].map(d => d.present);
        chart.data.datasets[1].data = chartData[period].map(d => d.absent);
        chart.data.datasets[2].data = chartData[period].map(d => d.late);
        chart.update();
    }
}

// ======================
// MODAL OPERATIONS
// ======================
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showQRCode() {
    const today = new Date().toISOString().split('T')[0];
    const qrCodeData = `capaciti-attendance-${today}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
    
    document.getElementById('qrCodeImage').src = qrCodeUrl;
    document.getElementById('qrValidDate').textContent = `Valid for today: ${today}`;
    showModal('qrModal');
}

function downloadQRCode() {
    const qrCodeUrl = document.getElementById('qrCodeImage').src;
    const today = new Date().toISOString().split('T')[0];
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `capaciti-attendance-qr-${today}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('QR code downloaded successfully', 'success');
}

// ======================
// UTILITIES
// ======================
function refreshData() {
    // In a real app, this would fetch fresh data from an API
    showToast('Attendance data has been updated', 'success');
}

function viewDetails(id) {
    // In a real app, this would show detailed information for the specific record
    const record = attendanceData.find(r => r.id === id);
    if (record) {
        showToast(`Viewing details for: ${record.name}`, 'info');
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="font-medium">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}