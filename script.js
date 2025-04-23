



//  new

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("login");
    const dashboard = document.getElementById("dashboard");
    
    // Login form submission
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById("loginForm").style.display = "none";
                dashboard.style.display = "block";
                
                // Store the user_id in localStorage to prevent losing it on page reloads
                localStorage.setItem('userId', data.user_id);
                
                // Start fetching data
                fetchData(data.user_id);
            } else {
                alert(data.message || "Invalid username or password");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Login failed. Please try again.");
        }
    });
  
    // Signup form submission
    const signupFormElement = document.querySelector("#signupForm form");
    signupFormElement.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const fullname = document.getElementById("fullname").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        
        // Basic client-side validation
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
  
        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullname,
                    email,
                    password,
                    "confirm-password": confirmPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert("Account created successfully! Please login.");
                toggleForms(); // Switch back to login form
            } else {
                alert(result.message || "Signup failed. Please try again.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Signup failed. Please try again.");
        }
    });
    
    // Check if user was logged in before page reload - FIXED: Only check when not already on a specific form
    checkLoginStatus();
});

// Function to check login status - FIXED: Separated this to prevent loops
function checkLoginStatus() {
    const userId = localStorage.getItem('userId');

    // Only continue if dashboard exists AND is visible
    const dashboard = document.getElementById("dashboard");

    if (!dashboard) {
        console.warn("Dashboard not found. Skipping auto-login.");
        return;
    }

    // Optional: you can also check if it's visible if needed
    // if (dashboard.style.display === 'none') return;

    if (userId) {
        // Hide login form and show dashboard
        document.getElementById("loginForm").style.display = "none";
        dashboard.style.display = "block";
        fetchData(userId);
    }
}


// Function to fetch and update health data
function fetchData(userId) {
    // Ensure we have a valid userId
    if (!userId) {
        console.error("No user ID provided to fetchData");
        return;
    }
    
    // Immediate first fetch
    fetchHealthData(userId);
    
    // FIXED: Clear any existing intervals before setting a new one
    if (window.dataInterval) {
        clearInterval(window.dataInterval);
    }
    
    // Set interval for subsequent fetches
    const dataInterval = setInterval(() => {
        fetchHealthData(userId);
    }, 5000)  // Update every 5 seconds - FIXED: Increased to reduce server load
    
    // Store the interval ID in case we need to clear it later
    window.dataInterval = dataInterval;
}

// Separate function to fetch health data
async function fetchHealthData(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/health-data?user_id=${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Health Data:", data);
        
        // Update health data display
        const heartRateElement = document.getElementById("heartRate");
        const tempElement = document.getElementById("temperature");
        const oxygenElement = document.getElementById("oxygenLevel");
        
        if (heartRateElement) {
            heartRateElement.innerText = `Heart Rate: ${data.heart_rate} bpm`;
        }
        
        if (tempElement) {
            tempElement.innerText = `Temperature: ${data.temperature} °C`;
        }
        
        // Create oxygen element if not exists
        if (!oxygenElement) {
            const newOxygen = document.createElement("p");
            newOxygen.id = "oxygenLevel";
            newOxygen.innerText = `Oxygen Level: ${data.oxygen_level}%`;
            document.querySelector(".health-data")?.appendChild(newOxygen);
        } else {
            oxygenElement.innerText = `Oxygen Level: ${data.oxygen_level}%`;
        }
        
        
        // FIXED: Now we call these sequentially with proper error handling for each
        try {
            await updateChart(userId);
        } catch (chartError) {
            console.error('Chart update failed:', chartError);
        }
        
        try {
            await fetchPrescription(userId);
        } catch (prescriptionError) {
            console.error('Prescription fetch failed:', prescriptionError);
        }
    } catch (error) {
        console.error('Error fetching health data:', error);
        // Don't show alerts for fetch errors as they'll be recurring
        // Just update the display to show there's an issue
        document.getElementById("heartRate").innerText = "Heart Rate: Connection error";
        document.getElementById("temperature").innerText = "Temperature: Connection error";
        
        if (document.getElementById("oxygenLevel")) {
            document.getElementById("oxygenLevel").innerText = "Oxygen Level: Connection error";
        }
    }
}

// Updated chart function
async function updateChart(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/historical-data?user_id=${userId}&limit=10`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Make sure we have a canvas element
        const canvas = document.getElementById("healthChart");
        if (!canvas) {
            console.error("Canvas element 'healthChart' not found");
            return;
        }
        
        const ctx = canvas.getContext("2d");
        
        // FIXED: Destroy previous chart if it exists and has a destroy method
        if (window.healthChart && typeof window.healthChart.destroy === 'function') {
            window.healthChart.destroy();
        }
        
        // FIXED: Ensure we have actual data to display
        if (!data.labels || data.labels.length === 0) {
            console.log("No historical data available yet");
            return;
        }
        
        window.healthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Heart Rate (bpm)',
                        data: data.heart_rates,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Temperature (°C)',
                        data: data.temperatures,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Oxygen (%)',
                        data: data.oxygen_levels,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating chart:', error);
        throw error; // Re-throw to let caller handle it
    }
}

// Updated prescription function
async function fetchPrescription(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/prescription?user_id=${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        document.getElementById("prescriptionText").innerText = data.prescription;
    } catch (error) {
        console.error('Error fetching prescription:', error);
        document.getElementById("prescriptionText").innerText = "Prescription unavailable. Server connection error.";
        throw error; // Re-throw to let caller handle it
    }
}

// Toggle between login and signup forms - FIXED: more robust implementation
function toggleForms() {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');
    var dashboard = document.getElementById('dashboard');

    // Hide dashboard if it's showing
    dashboard.style.display = 'none';

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    }
}

// Add logout functionality
function logout() {
    localStorage.removeItem('userId');

    if (window.dataInterval) {
        clearInterval(window.dataInterval);
        window.dataInterval = null;
    }

    if (window.healthChart && typeof window.healthChart.destroy === 'function') {
        window.healthChart.destroy();
        window.healthChart = null;
    }

    // Redirect to login page
    window.location.href = "/";
}

