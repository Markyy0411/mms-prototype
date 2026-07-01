document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the dashboard page
    if (!document.getElementById('ticketTableBody')) return;

    // --- DOM Elements ---
    const btnNewRequest = document.getElementById('btnNewRequest');
    const navReportIssue = document.getElementById('navReportIssue');
    const modal = document.getElementById('reportModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    const reportForm = document.getElementById('reportForm');
    const ticketTableBody = document.getElementById('ticketTableBody');
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('attachment');

    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statResolved = document.getElementById('statResolved');

    // --- Data Management (Local Storage) ---
    // Initialize default data if empty
    if (!localStorage.getItem('mms_tickets')) {
        const defaultTickets = [
            { id: 'TKT-1001', category: 'Electrical', location: 'IT Bldg, Rm 304', status: 'Pending', date: '2023-11-20' },
            { id: 'TKT-1002', category: 'Plumbing', location: 'Main Bldg, CR 1', status: 'Resolved', date: '2023-11-18' }
        ];
        localStorage.setItem('mms_tickets', JSON.stringify(defaultTickets));
    }

    let tickets = JSON.parse(localStorage.getItem('mms_tickets'));

    // --- Functions ---
    const updateStats = () => {
        statTotal.textContent = tickets.length;
        statPending.textContent = tickets.filter(t => t.status === 'Pending').length;
        statResolved.textContent = tickets.filter(t => t.status === 'Resolved').length;
    };

    const renderTable = () => {
        ticketTableBody.innerHTML = '';
        // Sort descending by ID (newest first)
        const sortedTickets = [...tickets].reverse();
        
        sortedTickets.forEach(ticket => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ticket-id">${ticket.id}</td>
                <td>${ticket.category}</td>
                <td>${ticket.location}</td>
                <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                <td>${ticket.date}</td>
            `;
            ticketTableBody.appendChild(tr);
        });
        updateStats();
    };

    const openModal = () => modal.classList.add('active');
    const hideModal = () => {
        modal.classList.remove('active');
        reportForm.reset();
    };

    // --- Event Listeners ---
    btnNewRequest.addEventListener('click', openModal);
    navReportIssue.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    closeModal.addEventListener('click', hideModal);
    cancelModal.addEventListener('click', hideModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // File upload trigger
    fileUpload.addEventListener('click', () => fileInput.click());

    // Form Submission
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const category = document.getElementById('category').value;
        const location = document.getElementById('location').value;
        
        // Generate new ID (TKT-XXXX)
        const newIdNum = tickets.length > 0 ? parseInt(tickets[tickets.length - 1].id.split('-')[1]) + 1 : 1001;
        const newId = `TKT-${newIdNum}`;
        
        const today = new Date().toISOString().split('T')[0];
        
        const newTicket = {
            id: newId,
            category: category,
            location: location,
            status: 'Pending',
            date: today
        };
        
        tickets.push(newTicket);
        localStorage.setItem('mms_tickets', JSON.stringify(tickets));
        
        renderTable();
        hideModal();
    });

    // --- Initial Render ---
    renderTable();
});
