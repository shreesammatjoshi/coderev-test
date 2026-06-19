# vulnerable_app.py
# WARNING: Intentionally insecure code for testing purposes

import os
import sqlite3
import subprocess
import hashlib
import random
import pickle
from flask import Flask, request

app = Flask(__name__)

# Hardcoded secrets (SECURITY ISSUE)
DB_PASSWORD = "admin123"
API_KEY = "sk_live_abc123secret"
JWT_SECRET = "my_super_secret_key"

# Weak password hashing (SECURITY ISSUE)
def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()


# SQL Injection vulnerability
def get_user(username):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    # Unsafe query
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)

    result = cursor.fetchone()
    conn.close()
    return result


# Command Injection vulnerability
def ping_host(host):
    command = "ping -c 2 " + host
    return subprocess.check_output(command, shell=True)


# Predictable random token generation
def generate_reset_token():
    return str(random.randint(1000, 9999))


# Unsafe deserialization
def load_user_data(data):
    return pickle.loads(data)


# No input validation
@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    user = get_user(username)

    if user:
        stored_hash = user[2]

        if hash_password(password) == stored_hash:
            return {
                "status": "success",
                "message": "Logged in"
            }

    return {
        "status": "failed"
    }


# Sensitive data logging
def log_payment(card_number, cvv):
    print("Payment received")
    print("Card:", card_number)
    print("CVV:", cvv)


# Broken authentication logic
def is_admin(user):
    if user == "admin":
        return True
    return False


# Insecure file access (Path Traversal)
def read_file(filename):
    with open("/var/data/" + filename, "r") as f:
        return f.read()


# Hardcoded AWS credentials
AWS_ACCESS_KEY = "AKIA123456789SECRET"
AWS_SECRET = "awsSuperSecretKey"


# Broad exception catching
def divide(a, b):
    try:
        return a / b
    except:
        return None


# Debug mode enabled in production
if __name__ == "__main__":
    app.run(debug=True)


# Dead code / unused variable
def old_function():
    temp = 12345
    password = "unused_password"
    return "deprecated"


# Duplicate code smell
def calculate_discount(price):
    if price > 1000:
        return price * 0.10
    return 0


def calculate_discount_v2(price):
    if price > 1000:
        return price * 0.10
    return 0


# Magic numbers
def calculate_bonus(sales):
    if sales > 9999:
        return sales * 0.2738
    return 0


# Poor naming convention
def x(a, b):
    c = a + b
    return c


# Memory leak simulation
cache = []

def store_data_forever(data):
    while True:
        cache.append(data)


# Race condition possibility
counter = 0

def increment():
    global counter
    counter += 1


# Improper access control
@app.route("/delete_user")
def delete_user():
    user_id = request.args.get("id")

    # No authentication check
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM users WHERE id={user_id}")
    conn.commit()

    return "deleted"


# Exposing internal error details
@app.route("/error")
def error():
    raise Exception("Database connection failed: password=root123")


# Insecure CORS setup
@app.after_request
def add_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
