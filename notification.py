import serial
import time
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient
import certifi

# Twilio credentials
account_sid = "AC05c6b1e7d5181a45b1fb90ee1cf7444a"
auth_token = "2fe69f86a6331adb1b62bb6eb26c64b1"
twilio_number = "+19786435240"     
target_number = "+916280863750"  

# Twilio session
http_client = TwilioHttpClient()
http_client.session.verify = certifi.where()
client = Client(account_sid, auth_token, http_client=http_client)

# Serial setup
ser = serial.Serial('COM6', 9600, timeout=1)
time.sleep(2)

def classify_stress_state(level):
    try:
        level = float(level)
        if level < 500:
            return "Relaxed"
        elif level < 800:
            return "Mid-Stress"
        else:
            return "High-Stress"
    except ValueError:
        return "Unknown"

def send_sms(stress_level, stress_state, body_temp):
    msg = f"🩺 Health Alert:\nGSR: {stress_level} ({stress_state})\nTemp: {body_temp}°C"
    try:
        message = client.messages.create(
            body=msg,
            from_=twilio_number,
            to=target_number
        )
        print("✅ SMS Sent:", message.sid)
    except Exception as sms_error:
        print("❌ SMS failed:", sms_error)

print("📡 Listening to Serial...")

while True:
    try:
        line = ser.readline().decode('utf-8').strip()
        if line:
            print("📨 Serial Input:", line)

            if "GSR" in line and "Temp" in line:
                try:
                    gsr_value = line.split("GSR:")[1].split("Temp:")[0].strip()
                    temp_value = line.split("Temp:")[1].strip()
                    stress_state = classify_stress_state(gsr_value)

                    send_sms(gsr_value, stress_state, temp_value)
                    time.sleep(10)  # Avoid spamming SMS
                except Exception as parse_error:
                    print("⚠️ Parsing Error:", parse_error)
            else:
                print("⚠️ Unexpected format")
    except Exception as e:
        print("❌ Error:", e)
        time.sleep(5)

