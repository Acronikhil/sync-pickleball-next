document.addEventListener("DOMContentLoaded", () => {
    const bookedSlotsTableBody = document.querySelector("#booked-slots-table tbody");
    const timeSlotContainer = document.querySelector(".time-slot-container");
    const modal = document.getElementById("confirmation-modal");
    const selectedSlotDisplay = document.getElementById("selected-slot");
    const datePicker = document.getElementById("booking-date");
    const courtSelect = document.getElementById("court");

    // const API_BASE_URL = "http://localhost:8080/api/v1";

    // // Time slots as intervals (for overlap)
    // const timeSlots = [
    //     { label: "9:00 AM", start: "09:00", end: "09:30" },
    //     { label: "9:30 AM", start: "09:30", end: "10:00" },
    //     { label: "10:00 AM", start: "10:00", end: "10:30" },
    //     { label: "10:30 AM", start: "10:30", end: "11:00" },
    //     { label: "11:00 AM", start: "11:00", end: "11:30" },
    //     { label: "11:30 AM", start: "11:30", end: "12:00" },
    //     { label: "12:00 PM", start: "12:00", end: "12:30" },
    //     { label: "12:30 PM", start: "12:30", end: "13:00" },
    //     { label: "1:00 PM", start: "13:00", end: "13:30" },
    //     { label: "1:30 PM", start: "13:30", end: "14:00" },
    //     { label: "2:00 PM", start: "14:00", end: "14:30" },
    //     { label: "2:30 PM", start: "14:30", end: "15:00" },
    //     { label: "3:00 PM", start: "15:00", end: "15:30" },
    //     { label: "3:30 PM", start: "15:30", end: "16:00" },
    //     { label: "4:00 PM", start: "16:00", end: "16:30" },
    //     { label: "4:30 PM", start: "16:30", end: "17:00" }
    // ];

    // let selectedSlot = null;
    // let selectedDate = null;
    // let selectedCourt = "Court 1";
    // let userEmail = localStorage.getItem("userEmail") || "";
    // let userName = localStorage.getItem("userName") || "";
    // let userPhone = localStorage.getItem("userPhone") || "";

    // // Load courts on page load
    // loadCourts();

    // async function loadCourts() {
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/courts`);
    //         const data = await response.json();

    //         const courtSelectEl = document.getElementById("court");
    //         courtSelectEl.innerHTML = "";

    //         (data.courts || []).forEach((court) => {
    //             const option = document.createElement("option");
    //             option.value = court;
    //             option.textContent = court;
    //             courtSelectEl.appendChild(option);
    //         });

    //         if (data.courts && data.courts.length > 0) {
    //             selectedCourt = data.courts[0];
    //         }
    //     } catch (error) {
    //         console.error("Error loading courts:", error);
    //         showNotification("Failed to load courts. Please refresh the page.", "error");
    //     }
    // }

    // // Calculate end time given start + duration
    // function calculateEndTime(startTime, durationMinutes) {
    //     const [h, m] = startTime.split(":").map(Number);
    //     const total = h * 60 + m + durationMinutes;
    //     const eh = String(Math.floor(total / 60)).padStart(2, "0");
    //     const em = String(total % 60).padStart(2, "0");
    //     return `${eh}:${em}`;
    // }

    // async function renderTimeSlots(date, court) {
    //     if (!date || !court) return;

    //     timeSlotContainer.innerHTML = "<p>Loading slots...</p>";

    //     try {
    //         // use original /slots?date=... shape with courts[court][0].booked
    //         const response = await fetch(`${API_BASE_URL}/slots?date=${date}`);
    //         const data = await response.json();

    //         timeSlotContainer.innerHTML = "";

    //         const courtData =
    //             data.courts && data.courts[court] && data.courts[court][0]
    //                 ? data.courts[court][0]
    //                 : null;

    //         const bookedLabels = courtData && courtData.booked ? courtData.booked : [];

    //         // Convert booked labels into pseudo bookings with 30 min duration
    //         const bookings = bookedLabels
    //             .map((label) => {
    //                 const slotObj = timeSlots.find((s) => s.label === label);
    //                 if (!slotObj) return null;
    //                 return {
    //                     startTime: slotObj.start, // "HH:mm"
    //                     endTime: slotObj.end,
    //                     durationMinutes: 30
    //                 };
    //             })
    //             .filter(Boolean);

    //         timeSlots.forEach((slotObj) => {
    //             const slotDiv = document.createElement("div");
    //             slotDiv.classList.add("time-slot");

    //             const booked = isSlotBooked(slotObj, bookings);
    //             slotDiv.setAttribute("data-tooltip", booked ? "Booked" : "Available");

    //             if (booked) {
    //                 slotDiv.classList.add("booked");
    //                 slotDiv.textContent = `${slotObj.label} (Booked)`;
    //                 slotDiv.addEventListener("click", () => showBookedSlotInfo(slotObj.label));
    //             } else {
    //                 slotDiv.textContent = slotObj.label;
    //                 slotDiv.addEventListener("click", () => selectSlot(slotObj.label, slotDiv));
    //             }

    //             timeSlotContainer.appendChild(slotDiv);
    //         });

    //         await renderUserBookings();
    //     } catch (error) {
    //         console.error("Error loading slots:", error);
    //         timeSlotContainer.innerHTML = "<p>Error loading slots. Please try again.</p>";
    //         showNotification("Failed to load slots. Check your API connection.", "error");
    //     }
    // }

    // async function renderUserBookings() {
    //     if (!userEmail) {
    //         bookedSlotsTableBody.innerHTML = `
    //     <tr>
    //       <td colspan="6">
    //         <div style="text-align: center; padding: 20px;">
    //           <p>Enter your email to view your bookings:</p>
    //           <input type="email" id="user-email-input" placeholder="Enter your email" style="margin: 10px; padding: 8px;">
    //           <button onclick="saveUserEmail()" style="padding: 8px 16px;">Save Email</button>
    //         </div>
    //       </td>
    //     </tr>
    //   `;
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/bookings/user?email=${userEmail}`);
    //         const data = await response.json();

    //         bookedSlotsTableBody.innerHTML = "";

    //         if (!data.bookings || data.bookings.length === 0) {
    //             const noBookingsRow = document.createElement("tr");
    //             const noBookingsCell = document.createElement("td");
    //             noBookingsCell.colSpan = 6;
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

    //             const startCell = document.createElement("td");
    //             startCell.textContent = formatTime(booking.startTime);
    //             row.appendChild(startCell);

    //             const endCell = document.createElement("td");
    //             const endTimeRaw =
    //                 booking.endTime ||
    //                 calculateEndTime(booking.startTime, booking.durationMinutes || 60);
    //             endCell.textContent = formatTime(endTimeRaw);
    //             row.appendChild(endCell);

    //             const durationCell = document.createElement("td");
    //             durationCell.textContent = (booking.durationMinutes || 60) + " min";
    //             row.appendChild(durationCell);

    //             const actionCell = document.createElement("td");

    //             const cancelButton = document.createElement("button");
    //             cancelButton.textContent = "Cancel";
    //             cancelButton.className = "btn cancel small";
    //             cancelButton.onclick = () => cancelBookingById(booking.id, row);
    //             actionCell.appendChild(cancelButton);

    //             const extendButton = document.createElement("button");
    //             extendButton.textContent = "Extend";
    //             extendButton.className = "btn small";
    //             console.log(`-------- Endtime: ${endTimeRaw}, booking: ${JSON.stringify(booking)}`);
                
    //             extendButton.onclick = () =>
    //                 extendBookingById(booking.id, booking.date, booking.court);
    //             actionCell.appendChild(extendButton);

    //             row.appendChild(actionCell);
    //             bookedSlotsTableBody.appendChild(row);
    //         });
    //     } catch (error) {
    //         console.error("Error loading user bookings:", error);
    //         showNotification("Failed to load your bookings.", "error");
    //     }
    // }

    // function selectSlot(slotLabel, element) {
    //     if (!selectedDate) {
    //         showNotification("Please select a date first.", "error");
    //         return;
    //     }

    //     document.querySelectorAll(".time-slot").forEach((slotEl) => {
    //         slotEl.classList.remove("selected");
    //     });
    //     element.classList.add("selected");
    //     selectedSlot = slotLabel;
    //     showModal(slotLabel);
    // }

    // function showModal(slotLabel) {
    //     if (!userName || !userEmail) {
    //         showUserDetailsModal();
    //         return;
    //     }

    //     selectedSlotDisplay.textContent = `You selected: ${slotLabel} on ${selectedDate} for ${selectedCourt}`;
    //     modal.classList.remove("hidden");
    // }

    // function showUserDetailsModal() {
    //     const userModal = document.createElement("div");
    //     userModal.className = "modal";
    //     userModal.innerHTML = `
    //   <div class="modal-content">
    //     <h3>Enter Your Details</h3>
    //     <input type="text" id="modal-username" placeholder="Your Name" value="${userName}">
    //     <input type="email" id="modal-email" placeholder="Your Email" value="${userEmail}">
    //     <input type="tel" id="modal-phone" placeholder="Your Phone (optional)" value="${userPhone}">
    //     <div class="modal-buttons">
    //       <button class="btn" onclick="saveUserDetailsAndBook()">Save & Book</button>
    //       <button class="btn cancel" onclick="closeUserModal()">Cancel</button>
    //     </div>
    //   </div>
    // `;
    //     document.body.appendChild(userModal);

    //     window.saveUserDetailsAndBook = () => {
    //         userName = document.getElementById("modal-username").value;
    //         userEmail = document.getElementById("modal-email").value;
    //         userPhone = document.getElementById("modal-phone").value;

    //         if (!userName || !userEmail) {
    //             showNotification("Name and email are required", "error");
    //             return;
    //         }

    //         localStorage.setItem("userName", userName);
    //         localStorage.setItem("userEmail", userEmail);
    //         localStorage.setItem("userPhone", userPhone);

    //         closeUserModal();
    //         showModal(selectedSlot);
    //     };

    //     window.closeUserModal = () => {
    //         document.body.removeChild(userModal);
    //     };
    // }

    // function showBookedSlotInfo(slot) {
    //     showNotification(`This slot (${slot}) is already booked.`, "info");
    // }

    // async function confirmBooking() {
    //     if (!selectedSlot || !selectedDate || !selectedCourt || !userName || !userEmail) {
    //         showNotification("Missing booking information", "error");
    //         return;
    //     }

    //     const bookingData = {
    //         userName: userName,
    //         email: userEmail,
    //         phone: userPhone,
    //         court: selectedCourt,
    //         date: selectedDate,
    //         timeSlot: selectedSlot,
    //         durationMinutes: 60
    //     };

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/bookings`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(bookingData)
    //         });

    //         const data = await response.json();

    //         if (data.success) {
    //             showNotification(
    //                 `Booking confirmed for ${selectedSlot} on ${selectedDate}!`,
    //                 "success"
    //             );
    //             modal.classList.add("hidden");
    //             renderTimeSlots(selectedDate, selectedCourt);
    //         } else {
    //             showNotification(data.error || "Booking failed", "error");
    //         }
    //     } catch (error) {
    //         console.error("Booking error:", error);
    //         showNotification(
    //             "Booking failed. Please check your connection and try again.",
    //             "error"
    //         );
    //     }
    // }

    // async function cancelBookingById(bookingId, rowElement) {
    //     if (!confirm("Are you sure you want to cancel this booking?")) {
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    //             method: "DELETE"
    //         });

    //         const data = await response.json();

    //         if (data.success) {
    //             showNotification("Booking cancelled successfully!", "success");
    //             renderTimeSlots(selectedDate, selectedCourt);
    //             if (rowElement) {
    //                 rowElement.remove();
    //             }
    //         } else {
    //             showNotification(data.error || "Cancellation failed", "error");
    //         }
    //     } catch (error) {
    //         console.error("Cancellation error:", error);
    //         showNotification("Cancellation failed. Please try again.", "error");
    //     }
    // }

    // async function extendBookingById(bookingId, bookingDate, bookingCourt) {
    //     try {
    //         const res = await fetch(
    //             `${API_BASE_URL}/bookings/${bookingId}/extend?additionalMinutes=30`,
    //             {
    //                 method: "PUT"
    //             }
    //         );

    //         if (res.ok) {
    //             const updated = await res.json();

    //             await renderUserBookings();

    //             const date = updated.date || bookingDate;
    //             const court = updated.court || bookingCourt;
    //             if (date && court) {
    //                 await renderTimeSlots(date, court);
    //             }

    //             showNotification("Booking extended successfully", "success");
    //         } else if (res.status === 400) {
    //             const body = await res.json();
                
    //             showNotification(body.error || "Extension not available", "error"); 
    //         }
    //         else if (res.status === 409) {
    //             const body = await res.json();
    //             showNotification(body.error || "Extension not available", "error");
    //         } else {
    //             showNotification("Error extending booking", "error");
    //         }
    //     } catch (e) {
    //         console.error("Error extending booking:", e);
    //         showNotification("Network error while extending booking", "error");
    //     }
    // }

    // function formatTime(timeString) {
    //     try {
    //         // handle "HH:mm" or "HH:mm:ss"
    //         const clean = timeString.length > 5 ? timeString.slice(0, 5) : timeString;
    //         const time = new Date(`1970-01-01T${clean}`);
    //         return time.toLocaleTimeString("en-US", {
    //             hour: "numeric",
    //             minute: "2-digit",
    //             hour12: true
    //         });
    //     } catch (error) {
    //         return timeString;
    //     }
    // }

    // function showNotification(message, type = "info") {
    //     const notification = document.createElement("div");
    //     notification.className = `notification ${type}`;
    //     notification.textContent = message;

    //     document.body.appendChild(notification);
    //     setTimeout(() => {
    //         if (notification.parentNode) {
    //             notification.parentNode.removeChild(notification);
    //         }
    //     }, 5000);
    // }

    // window.saveUserEmail = () => {
    //     const email = document.getElementById("user-email-input").value;
    //     if (email && email.includes("@")) {
    //         userEmail = email;
    //         localStorage.setItem("userEmail", userEmail);
    //         renderUserBookings();
    //         showNotification("Email saved successfully!", "success");
    //     } else {
    //         showNotification("Please enter a valid email", "error");
    //     }
    // };

    // // Admin functions keep as you already had (login, dashboard, viewAllBookings, etc.)
    // window.showAdminLogin = () => {
    //     document.getElementById('admin-modal').classList.remove('hidden');
    // };

    // window.closeAdminModal = () => {
    //     document.getElementById('admin-modal').classList.add('hidden');
    // };

    // window.adminLogin = async () => {
    //     const username = document.getElementById('admin-username').value;
    //     const password = document.getElementById('admin-password').value;

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    //             headers: {
    //                 'Authorization': 'Basic ' + btoa(username + ':' + password)
    //             }
    //         });

    //         if (response.ok) {
    //             localStorage.setItem('adminAuth', btoa(username + ':' + password));
    //             document.getElementById('admin-modal').classList.add('hidden');
    //             document.getElementById('admin-dashboard').classList.remove('hidden');
    //             loadAdminDashboard();
    //             showNotification('Admin login successful!', 'success');
    //         } else {
    //             showNotification('Invalid admin credentials', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Admin login error:', error);
    //         showNotification('Login failed. Please try again.', 'error');
    //     }
    // };

    // window.loadAdminDashboard = async () => {
    //     const adminAuth = localStorage.getItem('adminAuth');
    //     if (!adminAuth) return;

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    //             headers: {
    //                 'Authorization': 'Basic ' + adminAuth
    //             }
    //         });

    //         if (response.ok) {
    //             const data = await response.json();
    //             document.getElementById('total-bookings').textContent = data.totalBookings || 0;
    //             document.getElementById('today-bookings').textContent = data.todayBookings || 0;
    //             document.getElementById('week-bookings').textContent = data.weekBookings || 0;
    //         }
    //     } catch (error) {
    //         console.error('Error loading admin dashboard:', error);
    //     }
    // };

    // window.viewAllBookings = async () => {
    //     const adminAuth = localStorage.getItem('adminAuth');
    //     if (!adminAuth) return;

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    //             headers: {
    //                 'Authorization': 'Basic ' + adminAuth
    //             }
    //         });

    //         if (response.ok) {
    //             const data = await response.json();
    //             const tableBody = document.querySelector('#admin-bookings-table tbody');
    //             tableBody.innerHTML = '';

    //             data.bookings.forEach(booking => {
    //                 const row = document.createElement('tr');
    //                 row.innerHTML = `
    //                     <td>${booking.id.substring(0, 8)}...</td>
    //                     <td>${booking.userName}</td>
    //                     <td>${booking.email}</td>
    //                     <td>${booking.court}</td>
    //                     <td>${booking.date}</td>
    //                     <td>${formatTime(booking.startTime)}</td>
    //                     <td>${booking.active ? 'Active' : 'Cancelled'}</td>
    //                     <td>
    //                         <button onclick="adminCancelBooking('${booking.id}')" class="btn cancel small">Cancel</button>
    //                         <button onclick="adminExtendBooking('${booking.id}')" class="btn small">Extend</button>
    //                     </td>
    //                 `;
    //                 tableBody.appendChild(row);
    //             });

    //             document.getElementById('admin-bookings-section').classList.remove('hidden');
    //         }
    //     } catch (error) {
    //         console.error('Error loading all bookings:', error);
    //     }
    // };

    // window.adminCancelBooking = async (bookingId) => {
    //     if (!confirm('Are you sure you want to cancel this booking?')) return;

    //     const adminAuth = localStorage.getItem('adminAuth');
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
    //             method: 'DELETE',
    //             headers: {
    //                 'Authorization': 'Basic ' + adminAuth
    //             }
    //         });

    //         if (response.ok) {
    //             showNotification('Booking cancelled successfully', 'success');
    //             viewAllBookings();
    //             loadAdminDashboard();
    //         } else {
    //             showNotification('Failed to cancel booking', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Error cancelling booking:', error);
    //         showNotification('Error cancelling booking', 'error');
    //     }
    // };

    // window.adminExtendBooking = async (bookingId) => {
    //     const minutes = prompt("How many additional minutes? (30, 60, 90)");
    //     if (!minutes || ![30, 60, 90].includes(parseInt(minutes))) {
    //         showNotification("Please enter 30, 60, or 90 minutes", "error");
    //         return;
    //     }

    //     const adminAuth = localStorage.getItem('adminAuth');
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/extend?additionalMinutes=${minutes}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Authorization': 'Basic ' + adminAuth
    //             }
    //         });

    //         if (response.ok) {
    //             showNotification(`Booking extended by ${minutes} minutes!`, 'success');
    //             viewAllBookings();
    //             loadAdminDashboard();
    //         } else {
    //             const body = await response.json();
    //             // showNotification(`Failed to extend booking.`, 'error');
    //             showNotification(`Error: ${body.error}.`, 'error');
    //         }
    //     } catch (error) {
    //         console.error('Error extending booking:', error);
    //         showNotification('Error extending booking', 'error');
    //     }
    // };

    // window.exportBookings = () => {
    //     showNotification('Export functionality would be implemented here', 'info');
    // };

    // window.saveUserEmail = () => {
    //     const email = document.getElementById('user-email-input').value;
    //     if (email && email.includes('@')) {
    //         userEmail = email;
    //         localStorage.setItem('userEmail', userEmail);
    //         renderUserBookings();
    //         showNotification('Email saved successfully!', 'success');
    //     } else {
    //         showNotification("Please enter a valid email", "error");
    //     }
    // };
    // // Event listeners
    // const confirmBtn = document.getElementById("confirm-btn");
    // const cancelBtn = document.getElementById("cancel-btn");

    // confirmBtn.addEventListener("click", confirmBooking);
    // cancelBtn.addEventListener("click", () => {
    //     modal.classList.add("hidden");
    // });

    // datePicker.addEventListener("change", (e) => {
    //     selectedDate = e.target.value;
    //     if (!selectedDate) {
    //         showNotification("Please select a valid date.", "error");
    //         return;
    //     }
    //     renderTimeSlots(selectedDate, selectedCourt);
    // });

    // if (courtSelect) {
    //     courtSelect.addEventListener("change", (e) => {
    //         selectedCourt = e.target.value;
    //         if (selectedDate) {
    //             renderTimeSlots(selectedDate, selectedCourt);
    //         }
    //     });
    // }

    // const adminAuth = localStorage.getItem("adminAuth");
    // if (adminAuth) {
    //     document.getElementById("admin-dashboard").classList.remove("hidden");
    //     loadAdminDashboard();
    // }

    // const today = new Date().toISOString().split("T")[0];
    // datePicker.value = today;
    // selectedDate = today;

    // if (selectedDate && selectedCourt) {
    //     renderTimeSlots(selectedDate, selectedCourt);
    // }

    // // overlap check using bookings built from labels
    // function isSlotBooked(slot, bookings) {
    //     const [sh, sm] = slot.start.split(":").map(Number);
    //     const [eh, em] = slot.end.split(":").map(Number);
    //     const slotStart = sh * 60 + sm;
    //     const slotEnd = eh * 60 + em;

    //     return (bookings || []).some((b) => {
    //         const cleanStart = b.startTime.length > 5 ? b.startTime.slice(0, 5) : b.startTime;
    //         const cleanEnd =
    //             b.endTime && b.endTime.length > 5 ? b.endTime.slice(0, 5) : b.endTime;

    //         const [bh, bm] = cleanStart.split(":").map(Number);
    //         const [beh, bem] = cleanEnd.split(":").map(Number);
    //         const bookingStart = bh * 60 + bm;
    //         const bookingEnd = beh * 60 + bem;
    //         return bookingStart < slotEnd && bookingEnd > slotStart;
    //     });
    // }

    


});


