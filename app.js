document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // LOGIN PAGE LOGIC
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            
            // Determine Role
            let role = 'requester';
            if (email === 'fms@baliuagu.edu.ph') {
                role = 'fms';
            }
            
            // Save current user session
            const currentUser = { email: email, role: role };
            localStorage.setItem('mms_currentUser', JSON.stringify(currentUser));
            
            // Redirect
            window.location.href = 'dashboard.html';
        });
        return; // Stop execution on login page
    }

    // ==========================================
    // DASHBOARD PAGE LOGIC
    // ==========================================
    const ticketTableBody = document.getElementById('ticketTableBody');
    if (!ticketTableBody) return; // Failsafe

    // Check Authentication
    const userJson = localStorage.getItem('mms_currentUser');
    if (!userJson) {
        window.location.href = 'index.html'; // Not logged in
        return;
    }
    const currentUser = JSON.parse(userJson);

    // --- Data Management (Local Storage) ---
    if (!localStorage.getItem('mms_tickets')) {
        const defaultTickets = [
            { id: 'TKT-1001', priority: 'Medium', category: 'Electrical', location: 'IT Bldg, Rm 304', status: 'Pending', date: '2023-11-20', author: 'requester@baliuagu.edu.ph' },
            { id: 'TKT-1002', priority: 'Urgent', category: 'Plumbing', location: 'Main Bldg, CR 1', status: 'Resolved', date: '2023-11-18', author: 'mark@baliuagu.edu.ph' },
            { id: 'TKT-1003', priority: 'Low', category: 'IT / Network', location: 'Library', status: 'Pending', date: '2023-11-21', author: 'requester@baliuagu.edu.ph' }
        ];
        localStorage.setItem('mms_tickets', JSON.stringify(defaultTickets));
    }

    let tickets = JSON.parse(localStorage.getItem('mms_tickets'));
    const saveTickets = () => localStorage.setItem('mms_tickets', JSON.stringify(tickets));

    // --- DOM Elements ---
    const btnNewRequest = document.getElementById('btnNewRequest');
    const modal = document.getElementById('reportModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const reportForm = document.getElementById('reportForm');
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('attachment');
    
    const searchInput = document.getElementById('searchInput');
    const toast = document.getElementById('toast');

    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statResolved = document.getElementById('statResolved');
    
    const welcomeName = document.getElementById('welcomeName');
    const actionHeader = document.getElementById('actionHeader');

    // Section Elements for SPA Routing
    const dashboardTopSection = document.getElementById('dashboardTopSection');
    const ticketSection = document.getElementById('ticketSection');
    const settingsSection = document.getElementById('settingsSection');
    const ticketSectionTitle = document.getElementById('ticketSectionTitle');

    // Nav Links
    const navDashboard = document.getElementById('navDashboard');
    const navNewRequest = document.getElementById('navNewRequest');
    const navMyRequests = document.getElementById('navMyRequests');
    const navPendingRequests = document.getElementById('navPendingRequests');
    const navRequestsLogs = document.getElementById('navRequestsLogs');
    const navSettings = document.getElementById('navSettings');

    // --- Role-Based Setup ---
    let myTickets = [];
    if (currentUser.role === 'fms') {
        welcomeName.textContent = 'FMS';
        btnNewRequest.style.display = 'none';
        actionHeader.style.display = 'table-cell';
        myTickets = tickets;

        // Show FMS Sidebar Links
        document.getElementById('liPendingRequests').style.display = 'block';
        document.getElementById('liRequestsLogs').style.display = 'block';
    } else {
        welcomeName.textContent = currentUser.email.split('@')[0];
        actionHeader.style.display = 'none';
        myTickets = tickets.filter(t => t.author === currentUser.email);

        // Show Requester Sidebar Links
        document.getElementById('liNewRequest').style.display = 'block';
        document.getElementById('liMyRequests').style.display = 'block';
    }

    // Default visible tickets
    let visibleTickets = [...myTickets];
    let currentView = 'Dashboard';

    // --- Advanced Features ---
    let issueChartInstance = null;

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const updateChart = () => {
        const ctx = document.getElementById('issueChart');
        if (!ctx) return;

        // Aggregate data based on myTickets (all relevant tickets for the role)
        const categoryCounts = {};
        myTickets.forEach(t => {
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        });

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);

        if (issueChartInstance) {
            issueChartInstance.destroy();
        }

        issueChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#005a30', '#f4c430', '#f39c12', '#3498db', '#95a5a6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    };

    // --- Functions ---
    const updateStats = () => {
        statTotal.textContent = myTickets.length;
        statPending.textContent = myTickets.filter(t => t.status === 'Pending').length;
        statResolved.textContent = myTickets.filter(t => t.status === 'Resolved').length;
    };

    const renderTable = () => {
        ticketTableBody.innerHTML = '';
        const sortedTickets = [...visibleTickets].reverse(); // Newest first
        
        if (sortedTickets.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${currentUser.role === 'fms' ? 7 : 6}" style="text-align: center; color: #64746b; padding: 20px;">No tickets found.</td>`;
            ticketTableBody.appendChild(tr);
        } else {
            sortedTickets.forEach(ticket => {
                const tr = document.createElement('tr');
                
                // Priority badge logic
                const pClass = ticket.priority ? ticket.priority.toLowerCase() : 'medium';
                const priorityBadge = `<span class="badge ${pClass}">${ticket.priority || 'Medium'}</span>`;

                let html = `
                    <td class="ticket-id">${ticket.id}</td>
                    <td>${priorityBadge}</td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                    <td>${ticket.date}</td>
                `;
                
                if (currentUser.role === 'fms') {
                    const isPending = ticket.status === 'Pending';
                    html += `
                        <td>
                            <button class="btn-resolve" onclick="resolveTicket('${ticket.id}')" ${!isPending ? 'disabled' : ''}>
                                ${isPending ? 'Resolve' : 'Done'}
                            </button>
                        </td>
                    `;
                }
                
                tr.innerHTML = html;
                ticketTableBody.appendChild(tr);
            });
        }
        
        updateStats();
        updateChart();
    };

    // --- SPA View Routing Logic ---
    const navLinksList = document.querySelectorAll('.nav-links li');
    const setActiveNav = (liId) => {
        navLinksList.forEach(li => li.classList.remove('active'));
        const li = document.getElementById(liId);
        if (li) li.classList.add('active');
    };

    const switchView = (viewName) => {
        currentView = viewName;
        if (searchInput) searchInput.value = ''; // Reset Search

        if (viewName === 'Dashboard') {
            dashboardTopSection.style.display = 'flex';
            ticketSection.style.display = 'block';
            settingsSection.style.display = 'none';
            setActiveNav('liDashboard');
            
            if (currentUser.role === 'fms') {
                ticketSectionTitle.textContent = 'High Priority Requests (Urgent)';
                visibleTickets = myTickets.filter(t => t.priority === 'Urgent');
            } else {
                ticketSectionTitle.textContent = 'Recent Maintenance Requests';
                visibleTickets = [...myTickets];
            }
        } 
        else if (viewName === 'MyRequests') {
            dashboardTopSection.style.display = 'none';
            ticketSection.style.display = 'block';
            settingsSection.style.display = 'none';
            setActiveNav('liMyRequests');
            ticketSectionTitle.textContent = 'My Sent Requests';
            visibleTickets = [...myTickets];
        } 
        else if (viewName === 'PendingRequests') {
            dashboardTopSection.style.display = 'none';
            ticketSection.style.display = 'block';
            settingsSection.style.display = 'none';
            setActiveNav('liPendingRequests');
            ticketSectionTitle.textContent = 'Pending Requests (Action Required)';
            visibleTickets = myTickets.filter(t => t.status === 'Pending');
        } 
        else if (viewName === 'RequestsLogs') {
            dashboardTopSection.style.display = 'none';
            ticketSection.style.display = 'block';
            settingsSection.style.display = 'none';
            setActiveNav('liRequestsLogs');
            ticketSectionTitle.textContent = 'All Requests Logs';
            visibleTickets = [...myTickets];
        } 
        else if (viewName === 'Settings') {
            dashboardTopSection.style.display = 'none';
            ticketSection.style.display = 'none';
            settingsSection.style.display = 'block';
            setActiveNav('liSettings');
            
            document.getElementById('profileEmail').textContent = currentUser.email;
            document.getElementById('profileRole').textContent = currentUser.role === 'fms' ? 'Facility Maintenance Service (FMS)' : 'Requester';
        }
        
        if (viewName !== 'Settings') {
            renderTable();
        }
    };

    // Global function for onclick handler
    window.resolveTicket = (ticketId) => {
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) {
            tickets[ticketIndex].status = 'Resolved';
            saveTickets();
            
            myTickets = currentUser.role === 'fms' ? tickets : tickets.filter(t => t.author === currentUser.email);
            
            // Re-apply current view filter
            switchView(currentView);
            
            // Apply search term if any
            const searchTerm = searchInput.value.toLowerCase();
            if(searchTerm) {
                 visibleTickets = visibleTickets.filter(t => t.location.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm));
                 renderTable();
            }
            
            showToast('✅ Ticket marked as Resolved!');
        }
    };

    const openModal = () => modal.classList.add('active');
    const hideModal = () => {
        modal.classList.remove('active');
        reportForm.reset();
    };

    // --- Search Logic ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            // First apply the base filter of the current view
            let baseTickets = [];
            if (currentView === 'PendingRequests') baseTickets = myTickets.filter(t => t.status === 'Pending');
            else if (currentView === 'Dashboard' && currentUser.role === 'fms') baseTickets = myTickets.filter(t => t.priority === 'Urgent');
            else baseTickets = [...myTickets];

            visibleTickets = baseTickets.filter(ticket => 
                ticket.location.toLowerCase().includes(term) || 
                ticket.category.toLowerCase().includes(term) ||
                ticket.id.toLowerCase().includes(term) ||
                (ticket.priority && ticket.priority.toLowerCase().includes(term))
            );
            renderTable();
        });
    }

    // --- Sidebar Navigation Event Listeners ---
    if (navDashboard) navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('Dashboard'); });
    if (navMyRequests) navMyRequests.addEventListener('click', (e) => { e.preventDefault(); switchView('MyRequests'); });
    if (navPendingRequests) navPendingRequests.addEventListener('click', (e) => { e.preventDefault(); switchView('PendingRequests'); });
    if (navRequestsLogs) navRequestsLogs.addEventListener('click', (e) => { e.preventDefault(); switchView('RequestsLogs'); });
    if (navSettings) navSettings.addEventListener('click', (e) => { e.preventDefault(); switchView('Settings'); });

    // --- Other Event Listeners ---
    if (currentUser.role === 'requester') {
        btnNewRequest.addEventListener('click', openModal);
        if (navNewRequest) {
            navNewRequest.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }
    }

    closeModal.addEventListener('click', hideModal);
    cancelModal.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    if (fileUpload && fileInput) {
        fileUpload.addEventListener('click', () => fileInput.click());
    }

    // Form Submission
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const category = document.getElementById('category').value;
            const location = document.getElementById('location').value;
            const priority = document.getElementById('priority') ? document.getElementById('priority').value : 'Medium';
            
            const newIdNum = tickets.length > 0 ? parseInt(tickets[tickets.length - 1].id.split('-')[1]) + 1 : 1001;
            const newId = `TKT-${newIdNum}`;
            const today = new Date().toISOString().split('T')[0];
            
            const newTicket = {
                id: newId,
                priority: priority,
                category: category,
                location: location,
                status: 'Pending',
                date: today,
                author: currentUser.email
            };
            
            tickets.push(newTicket);
            saveTickets();
            
            myTickets = tickets.filter(t => t.author === currentUser.email);
            
            // Switch back to "My Requests" to show the new ticket
            switchView('MyRequests');
            
            hideModal();
            showToast('🚀 Ticket successfully reported!');
        });
    }

    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mms_currentUser');
        });
    }

    // --- Initial Render ---
    switchView('Dashboard');
});
