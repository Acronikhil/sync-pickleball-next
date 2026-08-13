document.addEventListener("DOMContentLoaded", () => {
    const bookedSlotsTableBody = document.querySelector("#booked-slots-table tbody");
    const timeSlotContainer = document.querySelector(".time-slot-container");
    const modal = document.getElementById("confirmation-modal");
    const cancelModal = document.getElementById("cancel-modal");
    const selectedSlotDisplay = document.getElementById("selected-slot");
    const cancelSlotMessage = document.getElementById("cancel-slot-message");
    const confirmBtn = document.getElementById("confirm-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
    const closeCancelBtn = document.getElementById("close-cancel-btn");
    const datePicker = document.getElementById("booking-date");
    const courtSelect = document.getElementById("court");

    // ⚠️ IMPORTANT: Update this URL to your deployed backend URL
    // const API_BASE_URL = 'https://your-backend-app.railway.app/api';
    const API_BASE_URL = 'http://localhost:8080/api/v1';
    // For local development, use: const API_BASE_URL = 'http://localhost:8080/api';

    const timeSlots = [
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
    ];

    let selectedSlot = null;
    let selectedDate = null;
    let selectedCourt = "Court 1";
    let userEmail = localStorage.getItem('userEmail') || '';
    let userName = localStorage.getItem('userName') || '';
    let userPhone = localStorage.getItem('userPhone') || '';

    // Load courts on page load
    loadCourts();

    async function loadCourts() {
        try {
            const response = await fetch(`${API_BASE_URL}/courts`);
            const data = await response.json();

            const courtSelect = document.getElementById('court');
            courtSelect.innerHTML = '';

            data.courts.forEach(court => {
                const option = document.createElement('option');
                option.value = court;
                option.textContent = court;
                courtSelect.appendChild(option);
            });

            selectedCourt = data.courts[0];
        } catch (error) {
            console.error('Error loading courts:', error);
            showNotification('Failed to load courts. Please refresh the page.', 'error');
        }
    }

    async function renderTimeSlots(date, court) {
        if (!date || !court) return;

        timeSlotContainer.innerHTML = "<p>Loading slots...</p>";

        try {
            const response = await fetch(`${API_BASE_URL}/slots?date=${date}`);
            const data = await response.json();

            timeSlotContainer.innerHTML = "";

            if (!data.courts || !data.courts[court]) {
                timeSlotContainer.innerHTML = "<p>No data available for this date and court.</p>";
                return;
            }

            const courtData = data.courts[court][0]; // Get first object from array
            const bookedSlots = courtData.booked || [];
            const availableSlots = courtData.available || [];

            timeSlots.forEach((slot) => {
                const slotDiv = document.createElement("div");
                slotDiv.classList.add("time-slot");

                const isBooked = bookedSlots.includes(slot);
                slotDiv.setAttribute("data-tooltip", isBooked ? "Booked" : "Available");

                if (isBooked) {
                    slotDiv.classList.add("booked");
                    slotDiv.textContent = `${slot} (Booked)`;
                    slotDiv.addEventListener("click", () => showBookedSlotInfo(slot));
                } else {
                    slotDiv.textContent = slot;
                    slotDiv.addEventListener("click", () => selectSlot(slot, slotDiv));
                }

                timeSlotContainer.appendChild(slotDiv);
            });

            await renderUserBookings();
        } catch (error) {
            console.error('Error loading slots:', error);
            timeSlotContainer.innerHTML = "<p>Error loading slots. Please try again.</p>";
            showNotification('Failed to load slots. Check your API connection.', 'error');
        }
    }

    // async function renderUserBookings() {
    //     if (!userEmail) {
    //         bookedSlotsTableBody.innerHTML = `
    //             <tr>
    //                 <td colspan="4">
    //                     <div style="text-align: center; padding: 20px;">
    //                         <p>Enter your email to view your bookings:</p>
    //                         <input type="email" id="user-email-input" placeholder="Enter your email" style="margin: 10px; padding: 8px;">
    //                         <button onclick="saveUserEmail()" style="padding: 8px 16px;">Save Email</button>
    //                     </div>
    //                 </td>
    //             </tr>
    //         `;
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/bookings/user?email=${userEmail}`);
    //         const data = await response.json();

    //         bookedSlotsTableBody.innerHTML = "";

    //         if (data.bookings && data.bookings.length === 0) {
    //             const noBookingsRow = document.createElement("tr");
    //             const noBookingsCell = document.createElement("td");
    //             noBookingsCell.colSpan = 4;
    //             noBookingsCell.textContent = "No bookings found.";
    //             noBookingsRow.appendChild(noBookingsCell);
    //             bookedSlotsTableBody.appendChild(noBookingsRow);
    //             return;
    //         }

    //         data.bookings.forEach((booking) => {
    //             const row = document.createElement("tr");

    //             const dateCell = document.createElement("td");
    //             dateCell.textContent = booking.date;
    //             row.appendChild(dateCell);

    //             const courtCell = document.createElement("td");
    //             courtCell.textContent = booking.court;
    //             row.appendChild(courtCell);

    //             const slotCell = document.createElement("td");
    //             slotCell.textContent = formatTime(booking.startTime);
    //             row.appendChild(slotCell);

    //             const actionCell = document.createElement("td");
    //             const cancelButton = document.createElement("button");
    //             cancelButton.textContent = "Cancel";
    //             cancelButton.className = "btn cancel small";
    //             cancelButton.onclick = () => cancelBookingById(booking.id, row);
    //             actionCell.appendChild(cancelButton);

    //             const extendButton = document.createElement("button");
    //             extendButton.textContent = "Extend";
    //             extendButton.className = "btn small";
    //             extendButton.onclick = () => extendBookingById(booking.id);
    //             actionCell.appendChild(extendButton);

    //             row.appendChild(actionCell);
    //             bookedSlotsTableBody.appendChild(row);
    //         });
    //     } catch (error) {
    //         console.error('Error loading user bookings:', error);
    //         showNotification('Failed to load your bookings.', 'error');
    //     }
    // }

    function calculateEndTime(startTime, durationMinutes) {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + durationMinutes;
        const eh = String(Math.floor(total / 60)).padStart(2, '0');
        const em = String(total % 60).padStart(2, '0');
        return `${eh}:${em}`;
    }

    async function renderUserBookings() {
        if (!userEmail) {
            bookedSlotsTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div style="text-align: center; padding: 20px;">
            <p>Enter your email to view your bookings:</p>
            <input type="email" id="user-email-input" placeholder="Enter your email" style="margin: 10px; padding: 8px;">
            <button onclick="saveUserEmail()" style="padding: 8px 16px;">Save Email</button>
          </div>
        </td>
      </tr>
    `;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/user?email=${userEmail}`);
            const data = await response.json();

            bookedSlotsTableBody.innerHTML = "";

            if (!data.bookings || data.bookings.length === 0) {
                const noBookingsRow = document.createElement("tr");
                const noBookingsCell = document.createElement("td");
                noBookingsCell.colSpan = 5;
                noBookingsCell.textContent = "No bookings found.";
                noBookingsRow.appendChild(noBookingsCell);
                bookedSlotsTableBody.appendChild(noBookingsRow);
                return;
            }

            data.bookings.forEach((booking) => {
                const row = document.createElement("tr");

                const dateCell = document.createElement("td");
                dateCell.textContent = booking.date;
                row.appendChild(dateCell);

                const courtCell = document.createElement("td");
                courtCell.textContent = booking.court;
                row.appendChild(courtCell);

                const startCell = document.createElement("td");
                startCell.textContent = formatTime(booking.startTime);
                row.appendChild(startCell);

                const endCell = document.createElement("td");
                const endTime = booking.endTime
                    ? formatTime(booking.endTime)
                    : formatTime(calculateEndTime(booking.startTime, booking.durationMinutes));
                endCell.textContent = endTime;
                row.appendChild(endCell);

                const actionCell = document.createElement("td");

                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel";
                cancelButton.className = "btn cancel small";
                cancelButton.onclick = () => cancelBookingById(booking.id, row);
                actionCell.appendChild(cancelButton);

                const extendButton = document.createElement("button");
                extendButton.textContent = "Extend";
                extendButton.className = "btn small";
                extendButton.onclick = () => extendBookingById(booking.id, booking.date, booking.court);
                actionCell.appendChild(extendButton);

                row.appendChild(actionCell);
                bookedSlotsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading user bookings:', error);
            showNotification('Failed to load your bookings.', 'error');
        }
    }


    function selectSlot(slot, element) {
        if (!selectedDate) {
            showNotification("Please select a date first.", "error");
            return;
        }

        document.querySelectorAll(".time-slot").forEach((slotEl) => {
            slotEl.classList.remove("selected");
        });
        element.classList.add("selected");
        selectedSlot = slot;
        showModal(slot);
    }

    function showModal(slot) {
        if (!userName || !userEmail) {
            showUserDetailsModal();
            return;
        }

        selectedSlotDisplay.textContent = `You selected: ${slot} on ${selectedDate} for ${selectedCourt}`;
        modal.classList.remove("hidden");
    }

    function showUserDetailsModal() {
        const userModal = document.createElement("div");
        userModal.className = "modal";
        userModal.innerHTML = `
            <div class="modal-content">
                <h3>Enter Your Details</h3>
                <input type="text" id="modal-username" placeholder="Your Name" value="${userName}">
                <input type="email" id="modal-email" placeholder="Your Email" value="${userEmail}">
                <input type="tel" id="modal-phone" placeholder="Your Phone (optional)" value="${userPhone}">
                <div class="modal-buttons">
                    <button class="btn" onclick="saveUserDetailsAndBook()">Save & Book</button>
                    <button class="btn cancel" onclick="closeUserModal()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(userModal);

        window.saveUserDetailsAndBook = () => {
            userName = document.getElementById('modal-username').value;
            userEmail = document.getElementById('modal-email').value;
            userPhone = document.getElementById('modal-phone').value;

            if (!userName || !userEmail) {
                showNotification("Name and email are required", "error");
                return;
            }

            localStorage.setItem('userName', userName);
            localStorage.setItem('userEmail', userEmail);
            localStorage.setItem('userPhone', userPhone);

            closeUserModal();
            showModal(selectedSlot);
        };

        window.closeUserModal = () => {
            document.body.removeChild(userModal);
        };
    }

    function showBookedSlotInfo(slot) {
        showNotification(`This slot (${slot}) is already booked.`, "info");
    }

    async function confirmBooking() {
        if (!selectedSlot || !selectedDate || !selectedCourt || !userName || !userEmail) {
            showNotification("Missing booking information", "error");
            return;
        }

        const bookingData = {
            userName: userName,
            email: userEmail,
            phone: userPhone,
            court: selectedCourt,
            date: selectedDate,
            timeSlot: selectedSlot,
            durationMinutes: 60
        };

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });

            const data = await response.json();

            if (data.success) {
                showNotification(`Booking confirmed for ${selectedSlot} on ${selectedDate}!`, "success");
                modal.classList.add("hidden");
                renderTimeSlots(selectedDate, selectedCourt);
            } else {
                showNotification(data.error || "Booking failed", "error");
            }
        } catch (error) {
            console.error('Booking error:', error);
            showNotification("Booking failed. Please check your connection and try again.", "error");
        }
    }

    async function cancelBookingById(bookingId, rowElement) {
        if (!confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showNotification("Booking cancelled successfully!", "success");
                renderTimeSlots(selectedDate, selectedCourt);
                if (rowElement) {
                    rowElement.remove();
                }
            } else {
                showNotification(data.error || "Cancellation failed", "error");
            }
        } catch (error) {
            console.error('Cancellation error:', error);
            showNotification("Cancellation failed. Please try again.", "error");
        }
    }

    // async function extendBookingById(bookingId) {
    //     const minutes = prompt("How many additional minutes? (30, 60, 90)");
    //     if (!minutes || ![30, 60, 90].includes(parseInt(minutes))) {
    //         showNotification("Please enter 30, 60, or 90 minutes", "error");
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/extend?additionalMinutes=${minutes}`, {
    //             method: 'PUT'
    //         });

    //         const data = await response.json();

    //         if (data.success) {
    //             showNotification(`Booking extended by ${minutes} minutes!`, "success");
    //             renderTimeSlots(selectedDate, selectedCourt);
    //         } else {
    //             showNotification(data.error || "Extension failed", "error");
    //         }
    //     } catch (error) {
    //         console.error('Extension error:', error);
    //         showNotification("Extension failed. Please try again.", "error");
    //     }
    // }

    async function extendBookingById(bookingId, bookingDate, bookingCourt) {
        try {
            const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/extend?minutes=30`, {
                method: 'PUT'
            });

            if (res.ok) {
                const updated = await res.json();

                // Re-render user table from backend
                await renderUserBookings();

                // Re-render pills for the updated booking's date & court
                const date = updated.date || bookingDate;
                const court = updated.court || bookingCourt;
                if (date && court) {
                    await renderTimeSlots(date, court);
                }

                showNotification('Booking extended successfully', 'success');
            } else if (res.status === 409) {
                const body = await res.json();
                showNotification(body.message || 'Extension not available', 'error');
            } else {
                showNotification('Error extending booking', 'error');
            }
        } catch (e) {
            console.error('Error extending booking:', e);
            showNotification('Network error while extending booking', 'error');
        }
    }


    function formatTime(timeString) {
        try {
            const time = new Date(`1970-01-01T${timeString}`);
            return time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return timeString;
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Admin Functions
    window.showAdminLogin = () => {
        document.getElementById('admin-modal').classList.remove('hidden');
    };

    window.closeAdminModal = () => {
        document.getElementById('admin-modal').classList.add('hidden');
    };

    window.adminLogin = async () => {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                headers: {
                    'Authorization': 'Basic ' + btoa(username + ':' + password)
                }
            });

            if (response.ok) {
                localStorage.setItem('adminAuth', btoa(username + ':' + password));
                document.getElementById('admin-modal').classList.add('hidden');
                document.getElementById('admin-dashboard').classList.remove('hidden');
                loadAdminDashboard();
                showNotification('Admin login successful!', 'success');
            } else {
                showNotification('Invalid admin credentials', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showNotification('Login failed. Please try again.', 'error');
        }
    };

    window.loadAdminDashboard = async () => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                headers: {
                    'Authorization': 'Basic ' + adminAuth
                }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('total-bookings').textContent = data.totalBookings || 0;
                document.getElementById('today-bookings').textContent = data.todayBookings || 0;
                document.getElementById('week-bookings').textContent = data.weekBookings || 0;
            }
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
        }
    };

    window.viewAllBookings = async () => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
                headers: {
                    'Authorization': 'Basic ' + adminAuth
                }
            });

            if (response.ok) {
                const data = await response.json();
                const tableBody = document.querySelector('#admin-bookings-table tbody');
                tableBody.innerHTML = '';

                data.bookings.forEach(booking => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${booking.id.substring(0, 8)}...</td>
                        <td>${booking.userName}</td>
                        <td>${booking.email}</td>
                        <td>${booking.court}</td>
                        <td>${booking.date}</td>
                        <td>${formatTime(booking.startTime)}</td>
                        <td>${booking.active ? 'Active' : 'Cancelled'}</td>
                        <td>
                            <button onclick="adminCancelBooking('${booking.id}')" class="btn cancel small">Cancel</button>
                            <button onclick="adminExtendBooking('${booking.id}')" class="btn small">Extend</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                document.getElementById('admin-bookings-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading all bookings:', error);
        }
    };

    window.adminCancelBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        const adminAuth = localStorage.getItem('adminAuth');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Basic ' + adminAuth
                }
            });

            if (response.ok) {
                showNotification('Booking cancelled successfully', 'success');
                viewAllBookings();
                loadAdminDashboard();
            } else {
                showNotification('Failed to cancel booking', 'error');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            showNotification('Error cancelling booking', 'error');
        }
    };

    window.adminExtendBooking = async (bookingId) => {
        const minutes = prompt("How many additional minutes? (30, 60, 90)");
        if (!minutes || ![30, 60, 90].includes(parseInt(minutes))) {
            showNotification("Please enter 30, 60, or 90 minutes", "error");
            return;
        }

        const adminAuth = localStorage.getItem('adminAuth');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/extend?additionalMinutes=${minutes}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Basic ' + adminAuth
                }
            });

            if (response.ok) {
                showNotification(`Booking extended by ${minutes} minutes!`, 'success');
                viewAllBookings();
                loadAdminDashboard();
            } else {
                showNotification('Failed to extend booking', 'error');
            }
        } catch (error) {
            console.error('Error extending booking:', error);
            showNotification('Error extending booking', 'error');
        }
    };

    window.exportBookings = () => {
        showNotification('Export functionality would be implemented here', 'info');
    };

    window.saveUserEmail = () => {
        const email = document.getElementById('user-email-input').value;
        if (email && email.includes('@')) {
            userEmail = email;
            localStorage.setItem('userEmail', userEmail);
            renderUserBookings();
            showNotification('Email saved successfully!', 'success');
        } else {
            showNotification("Please enter a valid email", "error");
        }
    };

    // Event listeners
    confirmBtn.addEventListener("click", confirmBooking);

    cancelBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    datePicker.addEventListener("change", (e) => {
        selectedDate = e.target.value;
        if (!selectedDate) {
            showNotification("Please select a valid date.", "error");
            return;
        }
        renderTimeSlots(selectedDate, selectedCourt);
    });

    if (courtSelect) {
        courtSelect.addEventListener("change", (e) => {
            selectedCourt = e.target.value;
            if (selectedDate) {
                renderTimeSlots(selectedDate, selectedCourt);
            }
        });
    }

    // Check if user is already logged in as admin
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        loadAdminDashboard();
    }

    // Initialize with today's date
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    selectedDate = today;

    if (selectedDate && selectedCourt) {
        renderTimeSlots(selectedDate, selectedCourt);
    }
});

function isSlotBooked(slot, bookings) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = eh * 60 + em;

    return bookings.some(b => {
        const [bh, bm] = b.startTime.split(':').map(Number);
        const [beh, bem] = (b.endTime || calculateEndTime(b.startTime, b.durationMinutes))
            .split(':')
            .map(Number);
        const bookingStart = bh * 60 + bm;
        const bookingEnd = beh * 60 + bem;

        // overlap condition
        return bookingStart < slotEnd && bookingEnd > slotStart;
    });
}
