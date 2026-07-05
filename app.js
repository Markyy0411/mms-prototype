document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // LOGIN PAGE LOGIC
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const role = document.getElementById('role').value;
            
            // Save current user session
            const currentUser = { email: email, role: role };
            localStorage.setItem('mms_currentUser', JSON.stringify(currentUser));
            
            // Redirect
            if (role === 'fms') {
                window.location.href = 'fms.html';
            } else {
                window.location.href = 'requester.html';
            }
        });
        return; // Stop execution on login page
    }

    // ==========================================
    // CHECK AUTHENTICATION FOR PORTALS
    // ==========================================
    const userJson = localStorage.getItem('mms_currentUser');
    if (!userJson) {
        window.location.href = 'index.html'; // Not logged in
        return;
    }
    const currentUser = JSON.parse(userJson);

    // Set Welcome Name / Email
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        if (currentUser.role === 'fms') {
            welcomeName.textContent = 'FMS Team';
        } else {
            welcomeName.textContent = currentUser.email.split('@')[0];
        }
    }
    
    const setProfileEmail = document.getElementById('setProfileEmail');
    if (setProfileEmail) {
        setProfileEmail.value = currentUser.email;
    }

    // ==========================================
    // DATA MANAGEMENT (Mock Database)
    // ==========================================
    if (!localStorage.getItem('mms_tickets')) {
        const defaultTickets = [
            { id: 'TKT-1001', priority: 'Medium', category: 'Electrical', location: 'IT Bldg, Rm 304', status: 'Pending', date: '2023-11-20', author: 'requester@baliuagu.edu.ph' },
            { id: 'TKT-1002', priority: 'Urgent', category: 'Plumbing', location: 'Main Bldg, CR 1', status: 'Resolved', date: '2023-11-18', author: 'faculty@baliuagu.edu.ph' },
            { id: 'TKT-1003', priority: 'Low', category: 'IT / Network', location: 'Library', status: 'Pending', date: '2023-11-21', author: 'requester@baliuagu.edu.ph' }
        ];
        localStorage.setItem('mms_tickets', JSON.stringify(defaultTickets));
    }

    let tickets = JSON.parse(localStorage.getItem('mms_tickets'));
    const saveTickets = () => localStorage.setItem('mms_tickets', JSON.stringify(tickets));
    
    // Toast Notification
    const toast = document.getElementById('toast');
    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // ==========================================
    // THEME TOGGLE LOGIC
    // ==========================================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const isDarkMode = localStorage.getItem('mms_theme') === 'dark';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('mms_theme', 'dark');
                themeToggleBtn.textContent = '☀️';
            } else {
                localStorage.setItem('mms_theme', 'light');
                themeToggleBtn.textContent = '🌙';
            }
            if (window.fullCalendarInstance) window.fullCalendarInstance.render();
        });
    }

    // ==========================================
    // FULLCALENDAR INIT LOGIC
    // ==========================================
    const initCalendar = () => {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl && window.FullCalendar && !window.fullCalendarInstance) {
            const calendarEvents = tickets.map(t => ({
                title: `${t.id} - ${t.category}`,
                start: t.date,
                color: t.status === 'Resolved' ? '#16a34a' : (t.status === 'Pending' ? '#f59e0b' : '#3b82f6')
            }));

            window.fullCalendarInstance = new window.FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: calendarEvents,
                height: 500,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }
            });
            window.fullCalendarInstance.render();
        } else if (window.fullCalendarInstance) {
            window.fullCalendarInstance.render(); // Ensure sizing is correct when tab opens
        }
    };

    // ==========================================
    // SPA ROUTING LOGIC
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links li a');
    const spaViews = document.querySelectorAll('.spa-view');

    navLinks.forEach(link => {
        if (link.id === 'navLogout' || !link.id) return;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all nav items
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            // Hide all views
            spaViews.forEach(view => {
                view.classList.remove('active-view');
                view.style.display = 'none';
            });
            
            // Determine target view ID (e.g. navDashboard -> viewDashboard)
            const targetViewId = link.id.replace('nav', 'view');
            const targetView = document.getElementById(targetViewId);
            
            if (targetView) {
                targetView.classList.add('active-view');
                targetView.style.display = 'block';
            }
            
            // Re-render tables if necessary when switching views
            renderTables();

            // Initialize/Render Calendar if calendar tab is selected
            if (link.id === 'navCalendar') {
                setTimeout(initCalendar, 100); // slight delay to ensure div is visible
            }
        });
    });

    // ==========================================
    // LOGOUT MODAL LOGIC
    // ==========================================
    const logoutBtn = document.getElementById('navLogout');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const logoutConfirmInput = document.getElementById('logoutConfirmInput');

    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('active');
            logoutConfirmInput.value = '';
            confirmLogoutBtn.disabled = true;
        });

        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('active');
        });

        logoutConfirmInput.addEventListener('input', (e) => {
            if (e.target.value.trim().toLowerCase() === 'logout') {
                confirmLogoutBtn.disabled = false;
            } else {
                confirmLogoutBtn.disabled = true;
            }
        });

        confirmLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mms_currentUser');
            window.location.href = 'index.html';
        });
    }

    // ==========================================
    // TABLE RENDERING LOGIC
    // ==========================================
    const renderTables = () => {
        const sortedTickets = [...tickets].reverse(); // Newest first
        
        // 1. DASHBOARD TABLE (Requester - their tickets, FMS - all tickets)
        const dashTable = document.getElementById('dashboardTableBody');
        if (dashTable) {
            dashTable.innerHTML = '';
            let dashData = currentUser.role === 'fms' ? sortedTickets : sortedTickets.filter(t => t.author === currentUser.email);
            // Just show top 5 recent
            dashData.slice(0, 5).forEach(ticket => {
                const tr = document.createElement('tr');
                const pClass = ticket.priority.toLowerCase();
                const priorityBadge = `<span class="badge ${pClass}">${ticket.priority}</span>`;
                tr.innerHTML = `
                    <td>${ticket.id}</td>
                    <td>${priorityBadge}</td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                    <td>${ticket.date}</td>
                `;
                dashTable.appendChild(tr);
            });
        }

        // 2. REQUESTER: UNPROCESSED TICKETS
        const unprocTable = document.getElementById('unprocessedTableBody');
        if (unprocTable) {
            unprocTable.innerHTML = '';
            const unprocData = sortedTickets.filter(t => t.author === currentUser.email && t.status === 'Pending');
            unprocData.forEach(ticket => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ticket.id}</td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td><button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #f59e0b; border: none; color: white; cursor:pointer;" onclick="alert('Edit feature coming soon!')">Edit</button></td>
                `;
                unprocTable.appendChild(tr);
            });
        }

        // 3. REQUESTER: MY REQUESTS
        const myReqTable = document.getElementById('myRequestsTableBody');
        if (myReqTable) {
            myReqTable.innerHTML = '';
            const myReqData = sortedTickets.filter(t => t.author === currentUser.email);
            myReqData.forEach(ticket => {
                const tr = document.createElement('tr');
                const pClass = ticket.priority.toLowerCase();
                tr.innerHTML = `
                    <td>${ticket.id}</td>
                    <td><span class="badge ${pClass}">${ticket.priority}</span></td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                    <td>${ticket.date}</td>
                `;
                myReqTable.appendChild(tr);
            });
        }

        // 4. FMS: PENDING REQUESTS
        const pendingTable = document.getElementById('pendingRequestsTableBody');
        if (pendingTable) {
            pendingTable.innerHTML = '';
            const pendingData = sortedTickets.filter(t => t.status === 'Pending');
            pendingData.forEach(ticket => {
                const tr = document.createElement('tr');
                const pClass = ticket.priority.toLowerCase();
                tr.innerHTML = `
                    <td>${ticket.id}</td>
                    <td><span class="badge ${pClass}">${ticket.priority}</span></td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td>${ticket.author.split('@')[0]}</td>
                    <td><button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #16a34a; border: none; color: white; cursor:pointer;" onclick="window.resolveTicket('${ticket.id}')">Mark Resolved</button></td>
                `;
                pendingTable.appendChild(tr);
            });
        }

        // 5. FMS: REQUEST LOGS
        const logsTable = document.getElementById('requestsLogsTableBody');
        if (logsTable) {
            logsTable.innerHTML = '';
            sortedTickets.forEach(ticket => {
                const tr = document.createElement('tr');
                const pClass = ticket.priority.toLowerCase();
                tr.innerHTML = `
                    <td>${ticket.id}</td>
                    <td><span class="badge ${pClass}">${ticket.priority}</span></td>
                    <td>${ticket.category}</td>
                    <td>${ticket.location}</td>
                    <td><span class="badge ${ticket.status.toLowerCase()}">${ticket.status}</span></td>
                    <td>${ticket.date}</td>
                    <td><button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #64748b; border: none; color: white; cursor:pointer;" onclick="alert('View details coming soon!')">View</button></td>
                `;
                logsTable.appendChild(tr);
            });
        }

        // UPDATE STATS
        const myData = currentUser.role === 'fms' ? tickets : tickets.filter(t => t.author === currentUser.email);
        const statTotal = document.getElementById('statTotal');
        const statPending = document.getElementById('statPending');
        const statResolved = document.getElementById('statResolved');
        
        if (statTotal) statTotal.textContent = myData.length;
        if (statPending) statPending.textContent = myData.filter(t => t.status === 'Pending').length;
        if (statResolved) statResolved.textContent = myData.filter(t => t.status === 'Resolved').length;
    };

    // Global Resolve Function for FMS
    window.resolveTicket = (ticketId) => {
        const idx = tickets.findIndex(t => t.id === ticketId);
        if (idx > -1) {
            tickets[idx].status = 'Resolved';
            saveTickets();
            renderTables();
            showToast('✅ Ticket marked as Resolved!');
        }
    };

    // ==========================================
    // NEW REQUEST FORM (REQUESTER)
    // ==========================================
    const newRequestForm = document.getElementById('newRequestForm');
    if (newRequestForm) {
        newRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const category = document.getElementById('reqCategory').value;
            const location = document.getElementById('reqLocation').value;
            const priority = document.getElementById('reqPriority').value;
            
            const newIdNum = tickets.length > 0 ? parseInt(tickets[tickets.length - 1].id.split('-')[1]) + 1 : 1001;
            const newId = `TKT-${newIdNum}`;
            const today = new Date().toISOString().split('T')[0];
            
            tickets.push({
                id: newId,
                priority: priority,
                category: category,
                location: location,
                status: 'Pending',
                date: today,
                author: currentUser.email
            });
            
            saveTickets();
            renderTables();
            showToast('🚀 Request successfully submitted!');
            newRequestForm.reset();
            
            // Switch to My Requests Tab
            document.getElementById('navMyRequests').click();
        });
    }

    // Initial render
    renderTables();
});
