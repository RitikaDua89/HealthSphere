
// Updated login function
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
            loginForm.style.display = "none";
            dashboard.style.display = "block";
            fetchData(data.user_id);  // Pass user_id to fetchData
        } else {
            alert(data.message || "Invalid username or password");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Login failed. Please try again.");
    }
});

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const dashboard = document.getElementById("dashboard");
    const loginBtn = document.getElementById("login");
  
    // Login form submission
    loginBtn.addEventListener("submit", async function(event) {
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
                loginForm.style.display = "none";
                dashboard.style.display = "block";
                fetchData(data.user_id);
            } else {
                alert(data.message || "Invalid username or password");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Login failed. Please try again.");
         }
    });
  
    // ====== ADD SIGNUP FORM SUBMISSION HERE ======
    const signupForm = document.querySelector("#signupForm");
    signupForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            fullname: formData.get("fullname"),
            email: formData.get("email"),
            password: formData.get("password"),
            "confirm-password": formData.get("confirm-password")
        };
        
        // Basic client-side validation
        if (data.password !== data["confirm-password"]) {
            alert("Passwords don't match!");
            return;
        }
  
        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert("Account created successfully! Please login.");
                toggleForms(); // Switch back to login form
            } else {
                alert(result.message || "Signup failed. Please try again.");
            }
        } catch (error) {
            console.log('Error:', error);
            alert("Signup failed. Please try again.");
        }
    });

    // ====== END OF SIGNUP FORM SUBMISSION ======
  
    // Rest of your existing code...
    function fetchData(userId) {
      // ... existing fetchData implementation ...
    }
  
    async function updateChart(userId) {
      // ... existing updateChart implementation ...
    }
  
    async function fetchPrescription(userId) {
      // ... existing fetchPrescription implementation ...
    }
  });
  
  // Existing toggleForms function (keep this at the bottom)
  function toggleForms() {
      var login = document.getElementById('loginForm');
      var signupForm = document.getElementById('signupForm');
  
      if (login.style.display === 'none') {
          login.style.display = 'flex';
          signupForm.style.display = 'none';
      } else {
          login.style.display = 'none';
          signupForm.style.display = 'flex';
      }
  }


// Updated fetchData function with real API calls
// >>>>>>>>>>>Not working<<<<<<<<<<<<<<<<<<
// async function fetchData(userId) {
//     // Fetch real-time data every 3 seconds
//     setInterval(async () => {
//         try {
//             // Get current health data
//             const healthResponse = await fetch(`http://localhost:5000/api/health-data?user_id=${userId}`);
//             const healthData = await healthResponse.json();
            
//             console.log("Health Data:", data);
//             // Update display
//             document.getElementById("heartRate").innerText = `Heart Rate: ${healthData.heart_rate} bpm`;
//             document.getElementById("temperature").innerText = `Temperature: ${healthData.temperature} °C`;
            
//             // Get historical data for chart
//             await updateChart(userId);
            
//             // Get prescription
//             await fetchPrescription(userId);
//         } catch (error) {
//             console.error('Error fetching data:', error);
//         }
//     }, 3000);
// }
 function fetchData(userId) {
   
    
    setInterval(async() => {
        await fetch(`/api/health-data?user_id=${userId}`)
        // await fetch(`http://127.0.0.1:5000/api/health-data?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                const heartRate = data.heart_rate;
                const oxygenLevel = data.oxygen_level;
                console.log(">>>>>>>>data<<<<<<<<<<<<", data);

                // Update health data display
                document.getElementById("heartRate").innerText = `Heart Rate: ${heartRate} bpm`;
                document.getElementById("oxygenLevel").innerText = `Oxygen Level: ${oxygenLevel}%`;

                // Call function to fetch historical data and chart updates
                updateChart(userId);
                fetchPrescription(heartRate, oxygenLevel);  // Pass sensor data to get prescription
            })
            .catch(error => console.log('Error fetching health data:', error));
    }, 3000);  // Update every 3 seconds
}



// Updated chart function

async function updateChart(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/historical-data?user_id=${userId}&limit=10`);
        const data = await response.json();
        
        const ctx = document.getElementById("healthChart").getContext("2d");
        
        // Destroy previous chart if it exists
        if (window.healthChart) {
            window.healthChart.destroy();
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
    }
}

// Updated prescription function
async function fetchPrescription(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/prescription?user_id=${userId}`);
        const data = await response.json();
        document.getElementById("prescriptionText").innerText = data.prescription;
    } catch (error) {
        console.error('Error fetching prescription:', error);
    }
}