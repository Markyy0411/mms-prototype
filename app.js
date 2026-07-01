document.addEventListener('DOMContentLoaded', () => {
    // --- Data Management (Local Storage) ---
    // Initialize default data if empty
    if (!localStorage.getItem('mms_tickets')) {
        const defaultTickets = [
            { id: 'TKT-1001', category: 'Electrical', location: 'IT Bldg, Rm 304', status: 'Pending', date: '2023-11-20', author: 'student@baliuagu.edu.ph' },
            { id: 'TKT-1002', category: 'Plumbing', location: 'Main Bldg, CR 1', status: 'Resolved', date: '2023-11-18', author: 'mark@baliuagu.edu.ph' },
            { id: 'TKT-1003', category: 'IT / Network', location: 'Library', status: 'Pending', date: '2023-11-21', author: 'student@baliuagu.edu.ph' }
        ];
        localStorage.setItem('mms_tickets', JSON.stringify(defaultTickets));
    }

    let tickets = JSON.parse(localStorage.getItem('mms_tickets'));
    
    // Helper to save tickets
    const saveTickets = () => {
        localStorage.setItem('mms_tickets', JSON.stringify(tickets));
    };

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

    // --- DOM Elements ---
    const btnNewRequest = document.getElementById('btnNewRequest');
    const navReportIssue = document.getElementById('navReportIssue');
    const modal = document.getElementById('reportModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const reportForm = document.getElementById('reportForm');
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('attachment');

    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statResolved = document.getElementById('statResolved');
    
    const welcomeName = document.getElementById('welcomeName');
    const actionHeader = document.getElementById('actionHeader');

    // --- Role-Based Setup ---
    let visibleTickets = [];

    if (currentUser.role === 'admin') {
        welcomeName.textContent = 'Admin';
        btnNewRequest.style.display = 'none'; // Admins don't report
        if(navReportIssue) navReportIssue.parentElement.style.display = 'none';
        actionHeader.style.display = 'table-cell'; // Show action column
        visibleTickets = tickets; // Admins see all
    } else {
        // User Role
        welcomeName.textContent = currentUser.email.split('@')[0]; // Simple name extract
        actionHeader.style.display = 'none';
        visibleTickets = tickets.filter(t => t.author === currentUser.email); // Users see their own
    }

    // --- Functions ---
    const updateStats = () => {
        statTotal.textContent = visibleTickets.length;
        statPending.textContent = visibleTickets.filter(t => t.status === 'Pending').length;
        statResolved.textContent = visibleTickets.filter(t => t.status === 'Resolved').length;
    };

    const renderTable = () => {
        ticketTableBody.innerHTML = '';
        const sortedTickets = [...visibleTickets].reverse(); // Newest first
        
        sortedTickets.forEach(ticket => {
            const tr = document.createElement('tr');
            
            // Basic columns
            let html = `
                <td class="ticket-id">${ticket.id}</td>
                <td>${ticket.category}</td>
                <td>${ticket.location}</td>
                <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                <td>${ticket.date}</td>
            `;
            
            // Admin Action column
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
    };

    // Global function for the inline onclick handler
    window.resolveTicket = (ticketId) => {
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) {
            tickets[ticketIndex].status = 'Resolved';
            saveTickets();
            // Re-filter for admin
            visibleTickets = tickets;
            renderTable();
        }
    };

    const openModal = () => modal.classList.add('active');
    const hideModal = () => {
        modal.classList.remove('active');
        reportForm.reset();
    };

    // --- Event Listeners (Only for Users) ---
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
            
            const newIdNum = tickets.length > 0 ? parseInt(tickets[tickets.length - 1].id.split('-')[1]) + 1 : 1001;
            const newId = `TKT-${newIdNum}`;
            const today = new Date().toISOString().split('T')[0];
            
            const newTicket = {
                id: newId,
                category: category,
                location: location,
                status: 'Pending',
                date: today,
                author: currentUser.email // Link to user
            };
            
            tickets.push(newTicket);
            saveTickets();
            
            // Update visible tickets for the user
            visibleTickets = tickets.filter(t => t.author === currentUser.email);
            
            renderTable();
            hideModal();
        });
    }

    // Logout handling
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            localStorage.removeItem('mms_currentUser');
            // Allow default navigation to index.html
        });
    }

    // --- Initial Render ---
    renderTable();
});
