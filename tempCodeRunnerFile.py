


# from flask import Flask, request, jsonify, render_template
# from flask_cors import CORS
# import random
# import time
# from threading import Thread
# import sqlite3
# import datetime

# app = Flask(__name__)
# # FIXED: Set CORS parameters more explicitly to avoid issues
# CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

# # Database setup
# def init_db():
#     conn = sqlite3.connect('health_data.db')
#     c = conn.cursor()
    
#     # Create tables if they don't exist
#     c.execute('''CREATE TABLE IF NOT EXISTS users
#                  (id INTEGER PRIMARY KEY AUTOINCREMENT,
#                  email TEXT UNIQUE,
#                  password TEXT,
#                  fullname TEXT)''')
    
#     c.execute('''CREATE TABLE IF NOT EXISTS health_data
#                  (id INTEGER PRIMARY KEY AUTOINCREMENT,
#                  user_id INTEGER,
#                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
#                  heart_rate INTEGER,
#                  oxygen_level REAL,
#                  temperature REAL,
#                  FOREIGN KEY(user_id) REFERENCES users(id))''')
    
#     conn.commit()
#     conn.close()

# init_db()

# # Simulated sensor data (replace with actual sensor reading code)
# class SensorSimulator:
#     def __init__(self):
#         self.heart_rate = 72
#         self.oxygen_level = 98.0
#         self.temperature = 36.6
#         self.running = False
    
#     def start_simulation(self):
#         self.running = True
#         def simulate():
#             while self.running:
#                 # Random fluctuations to simulate real data
#                 self.heart_rate += random.randint(-2, 2)
#                 self.heart_rate = max(60, min(120, self.heart_rate))
                
#                 self.oxygen_level += random.uniform(-0.5, 0.5)
#                 self.oxygen_level = max(94.0, min(100.0, self.oxygen_level))
                
#                 self.temperature += random.uniform(-0.1, 0.1)
#                 self.temperature = max(36.0, min(38.5, self.temperature))
                
#                 time.sleep(2)
        
#         Thread(target=simulate, daemon=True).start()
    
#     def stop_simulation(self):
#         self.running = False
    
#     def get_data(self):
#         return {
#             'heart_rate': self.heart_rate,
#             'oxygen_level': self.oxygen_level,
#             'temperature': self.temperature
#         }

# sensor_simulator = SensorSimulator()
# sensor_simulator.start_simulation()

# # User authentication
# @app.route('/login', methods=['POST'])
# def login():
#     data = request.json
#     if not data:
#         return jsonify({'success': False, 'message': 'Missing JSON data'}), 400

#     email = data.get('email')
#     password = data.get('password')

#     if not email or not password:
#         return jsonify({'success': False, 'message': 'Email and password required'}), 400

#     conn = sqlite3.connect('health_data.db')
#     c = conn.cursor()
#     c.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
#     user = c.fetchone()
#     conn.close()

#     if user:
#         print("Login successful for:", email)
#         return jsonify({'success': True, 'user_id': user[0], 'fullname': user[3]})
#     else:
#         print("Login failed for:", email)
#         return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


# @app.route('/signup', methods=['POST'])
# def signup():
#     data = request.json
#     fullname = data.get('fullname')
#     email = data.get('email')
#     password = data.get('password')
    
#     try:
#         conn = sqlite3.connect('health_data.db')
#         c = conn.cursor()
#         c.execute("INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)", 
#                  (fullname, email, password))
#         conn.commit()
#         user_id = c.lastrowid
#         conn.close()
#         return jsonify({'success': True, 'user_id': user_id})
#     except sqlite3.IntegrityError:
#         return jsonify({'success': False, 'message': 'Email already exists'}), 400

# # Health data endpoints
# @app.route('/api/health-data', methods=['GET'])
# def get_health_data():
#     user_id = request.args.get('user_id')
#     if not user_id:
#         return jsonify({'error': 'user_id parameter is required'}), 400
    
#     sensor_data = sensor_simulator.get_data()
    
#     # Store the data in database
#     conn = sqlite3.connect('health_data.db')
#     c = conn.cursor()
#     c.execute("INSERT INTO health_data (user_id, heart_rate, oxygen_level, temperature) VALUES (?, ?, ?, ?)",
#              (user_id, sensor_data['heart_rate'], sensor_data['oxygen_level'], sensor_data['temperature']))
#     conn.commit()
#     conn.close()
#     return jsonify(sensor_data)

# @app.route('/api/historical-data', methods=['GET'])
# def get_historical_data():
#     user_id = request.args.get('user_id')
#     limit = request.args.get('limit', 10)
    
#     conn = sqlite3.connect('health_data.db')
#     # FIXED: Format timestamp for better display
#     conn.row_factory = sqlite3.Row
#     c = conn.cursor()
#     c.execute("SELECT timestamp, heart_rate, oxygen_level, temperature FROM health_data WHERE user_id=? ORDER BY timestamp DESC LIMIT ?", 
#              (user_id, limit))
#     data = c.fetchall()
#     conn.close()
    
#     # Format data for chart
#     if not data:
#         # FIXED: Return empty data structure instead of empty arrays
#         return jsonify({
#             'labels': [],
#             'heart_rates': [],
#             'oxygen_levels': [],
#             'temperatures': []
#         })
    
#     # FIXED: Format timestamps to be more readable
#     labels = []
#     for row in reversed(data):
#         try:
#             # Try to parse the timestamp and format it
#             dt = datetime.datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
#             labels.append(dt.strftime('%H:%M:%S'))
#         except:
#             # If parsing fails, just use the raw timestamp
#             labels.append(str(row[0]))
    
#     heart_rates = [row[1] for row in reversed(data)]
#     oxygen_levels = [row[2] for row in reversed(data)]
#     temperatures = [row[3] for row in reversed(data)]
    
#     return jsonify({
#         'labels': labels,
#         'heart_rates': heart_rates,
#         'oxygen_levels': oxygen_levels,
#         'temperatures': temperatures
#     })

# @app.route('/api/prescription', methods=['GET'])
# def get_prescription():
#     user_id = request.args.get('user_id')
#     if not user_id:
#         return jsonify({'error': 'user_id parameter is required'}), 400
    
#     # Get latest health data
#     conn = sqlite3.connect('health_data.db')
#     c = conn.cursor()
#     c.execute("SELECT heart_rate, oxygen_level, temperature FROM health_data WHERE user_id=? ORDER BY timestamp DESC LIMIT 1", 
#              (user_id,))
#     data = c.fetchone()
#     conn.close()
    
#     if not data:
#         return jsonify({'prescription': 'No health data available yet. Please wait for sensor readings.'}), 200
    
#     heart_rate, oxygen_level, temperature = data
    
#     # Generate prescription based on thresholds
#     prescription = []
    
#     if heart_rate > 100:
#         prescription.append("Your heart rate is elevated. Consider resting and consulting a doctor if it persists.")
#     elif heart_rate < 60:
#         prescription.append("Your heart rate is lower than normal. If you feel dizzy, consult a doctor.")
#     else:
#         prescription.append("Your heart rate is within normal range.")
    
#     if oxygen_level < 95:
#         prescription.append(f"Your oxygen level is {oxygen_level}%, which is slightly low. Try deep breathing exercises.")
#     else:
#         prescription.append(f"Your oxygen level is {oxygen_level}%, which is excellent.")
    
#     if temperature > 37.5:
#         prescription.append(f"Your temperature is {temperature}°C, indicating a fever. Stay hydrated and consider fever-reducing medication.")
#     elif temperature < 36.0:
#         prescription.append(f"Your temperature is {temperature}°C, which is lower than normal. Keep warm.")
#     else:
#         prescription.append(f"Your temperature is {temperature}°C, which is normal.")
    
#     return jsonify({'prescription': "\n".join(prescription)})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True)