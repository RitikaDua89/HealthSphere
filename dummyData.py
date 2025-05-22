import time
import random
import certifi
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient

# Hardcoded Twilio Credentials 
account_sid = "AC05c6b1e7d5181a45b1fb90ee1cf7444a"
auth_token = "2fe69f86a6331adb1b62bb6eb26c64b1"

#  Twilio Phone Numbers 
twilio_number = "+19786435240"     # Your Twilio number (SMS-enabled)
target_number = "+916280863750"    # Recipient phone number (must be verified if trial account)

#  Setup Twilio Client with HTTPS verification 
http_client = TwilioHttpClient()
http_client.session.verify = certifi.where()
client = Client(account_sid, auth_token, http_client=http_client)

#  Interpret Stress Level 
def get_stress_state(level):
    if level < 300:
        return "Relaxed"
    elif level < 600:
        return "Mild Stress"
    elif level < 850:
        return "Stressed"
    else:
        return "High Stress"

#  Send SMS via Twilio 
def send_sms(stress_level, stress_state, body_temp):
    message_body = f"Stress Level: {stress_level}, State: {stress_state}, Body Temp: {body_temp}°C"
    try:
        message = client.messages.create(
            body=message_body,
            from_=twilio_number,
            to=target_number
        )
        print(f"✅ Message sent! SID: {message.sid}")
    except Exception as e:
        print(f"❌ Failed to send message: {e}")

# === Main Loop: Generate and send simulated data ===
print("📡 Starting simulated health data transmission...\n")
while True:
    try:
        stress_level = random.randint(10, 100)
        body_temp = round(random.uniform(35.5, 40.0), 1)
        stress_state = get_stress_state(stress_level)

        print(f"📊 Data → Level: {stress_level}, State: {stress_state}, Temp: {body_temp}°C")

        send_sms(stress_level, stress_state, body_temp)

        time.sleep(10)  # Wait 10 seconds before next message

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user.")
        break
    except Exception as e:
        print(f"❌ Error in main loop: {e}")
        break
