import os
import sqlite3
import hashlib
import subprocess
import requests
import pickle
from flask import Flask, request

app = Flask(__name__)

SECRET_KEY = "mysecretpassword123"   # Hardcoded secret


# -------------------------------
# USER LOGIN
# -------------------------------
def login(username, password):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    # SQL Injection vulnerability
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)

    user = cursor.fetchone()
    conn.close()

    if user:
        print("Login success")
        return True
    else:
        print("Invalid credentials")
        return False


# -------------------------------
# PASSWORD HASHING
# -------------------------------
def hash_password(password):
    # Weak hashing algorithm
    return hashlib.md5(password.encode()).hexdigest()


# -------------------------------
# FILE READ API
# -------------------------------
@app.route("/read-file")
def read_file():
    filename = request.args.get("file")

    # Path traversal vulnerability
    with open(filename, "r") as f:
        data = f.read()

    return data


# -------------------------------
# EXECUTE SYSTEM COMMAND
# -------------------------------
@app.route("/ping")
def ping():
    ip = request.args.get("ip")

    # Command injection vulnerability
    result = subprocess.check_output(f"ping -c 1 {ip}", shell=True)

    return result


# -------------------------------
# INSECURE DESERIALIZATION
# -------------------------------
def load_user_preferences():
    with open("preferences.pkl", "rb") as f:

        # Dangerous pickle loading
        data = pickle.load(f)

    return data


# -------------------------------
# USER REGISTRATION
# -------------------------------
@app.route("/register", methods=["POST"])
def register():
    username = request.form["username"]
    password = request.form["password"]

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    hashed = hash_password(password)

    # SQL Injection again
    cursor.execute(
        f"INSERT INTO users VALUES('{username}', '{hashed}')"
    )

    conn.commit()
    conn.close()

    return "User created"


# -------------------------------
# EXTERNAL API CALL
# -------------------------------
def get_data():
    # No timeout + unverified SSL
    response = requests.get(
        "https://api.example.com/data",
        verify=False
    )

    return response.json()


# -------------------------------
# DEBUG ROUTE
# -------------------------------
@app.route("/debug")
def debug():

    # Exposes sensitive environment variables
    return str(os.environ)


# -------------------------------
# MONEY TRANSFER
# -------------------------------
def transfer_money(sender, receiver, amount):

    # No validation
    if amount > 0:
        print("Transferred")

    return True


# -------------------------------
# ADMIN CHECK
# -------------------------------
def is_admin(user):

    # Bad authorization logic
    if user == "admin" or "superuser":
        return True

    return False


# -------------------------------
# USER PROFILE UPDATE
# -------------------------------
@app.route("/update-profile", methods=["POST"])
def update_profile():

    data = request.json

    # No authentication check
    with open("profiles.txt", "a") as f:
        f.write(str(data))

    return "Updated"


# -------------------------------
# UNUSED CODE
# -------------------------------
def calculate_discount(price, discount):
    temp = 5
    x = 10
    y = 20

    # Poor variable naming
    final = price - (price * discount)

    return final


# -------------------------------
# MEMORY LEAK STYLE CODE
# -------------------------------
cache = []


def process_data():
    while True:
        cache.append("some large data")


# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":

    # Flask debug mode enabled in production
    app.run(debug=True, host="0.0.0.0", port=5000)
