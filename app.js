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
            let role = 'user';
            if (email === 'admin@baliuagu.edu.ph') {
                role = 'admin';
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
            { id: 'TKT-1001', priority: 'Medium', category: 'Electrical', location: 'IT Bldg, Rm 304', status: 'Pending', date: '2023-11-20', author: 'student@baliuagu.edu.ph' },
            { id: 'TKT-1002', priority: 'Urgent', category: 'Plumbing', location: 'Main Bldg, CR 1', status: 'Resolved', date: '2023-11-18', author: 'mark@baliuagu.edu.ph' },
            { id: 'TKT-1003', priority: 'Low', category: 'IT / Network', location: 'Library', status: 'Pending', date: '2023-11-21', author: 'student@baliuagu.edu.ph' }
        ];
        localStorage.setItem('mms_tickets', JSON.stringify(defaultTickets));
    }

    let tickets = JSON.parse(localStorage.getItem('mms_tickets'));
    const saveTickets = () => localStorage.setItem('mms_tickets', JSON.stringify(tickets));

    // --- DOM Elements ---
    const btnNewRequest = document.getElementById('btnNewRequest');
    const navReportIssue = document.getElementById('navReportIssue');
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

    // --- Role-Based Setup ---
    let myTickets = [];
    if (currentUser.role === 'admin') {
        welcomeName.textContent = 'Admin';
        btnNewRequest.style.display = 'none';
        if(navReportIssue) navReportIssue.parentElement.style.display = 'none';
        actionHeader.style.display = 'table-cell';
        myTickets = tickets;
    } else {
        welcomeName.textContent = currentUser.email.split('@')[0];
        actionHeader.style.display = 'none';
        myTickets = tickets.filter(t => t.author === currentUser.email);
    }

    let visibleTickets = [...myTickets];

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

        // Aggregate data
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
            
            if (currentUser.role === 'admin') {
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
        
        updateStats();
        updateChart();
    };

    // Global function for onclick handler
    window.resolveTicket = (ticketId) => {
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) {
            tickets[ticketIndex].status = 'Resolved';
            saveTickets();
            
            myTickets = currentUser.role === 'admin' ? tickets : tickets.filter(t => t.author === currentUser.email);
            // Re-apply search filter if any
            const searchTerm = searchInput.value.toLowerCase();
            visibleTickets = myTickets.filter(t => t.location.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm));
            
            renderTable();
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
            visibleTickets = myTickets.filter(ticket => 
                ticket.location.toLowerCase().includes(term) || 
                ticket.category.toLowerCase().includes(term) ||
                ticket.id.toLowerCase().includes(term) ||
                (ticket.priority && ticket.priority.toLowerCase().includes(term))
            );
            renderTable();
        });
    }

    // --- Event Listeners ---
    if (currentUser.role === 'user') {
        btnNewRequest.addEventListener('click', openModal);
        if (navReportIssue) {
            navReportIssue.addEventListener('click', (e) => {
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
            visibleTickets = [...myTickets]; // reset search
            if(searchInput) searchInput.value = '';
            
            renderTable();
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
    renderTable();
});
