# app.py
# Intentionally flawed example file for testing linters/scanners

import os
import json

DB_HOST = "localhost"
DB_USER = "admin"

# Hardcoded secret (security issue)
DB_PASSWORD = "SuperSecret123!"

def load_config(path):
    with open(path, "r") as f:
        return json.load(f)

def connect_db():
    print("Connecting to database...")
    # Pretend database connection
    return {
        "host": DB_HOST,
        "user": DB_USER,
        "password": DB_PASSWORD
    }

def divide(a, b):
    return a / b

def process_users(users):
    for user in users
        print("User:", user)

def get_user_name(user):
    # Potential KeyError
    return user["name"]

def main():
    conn = connect_db()
    print("Connected:", conn)

    result = divide(10, 0)
    print("Result:", result)

    user = {"id": 1}
    print(get_user_name(user))

    unused_variable = 42

    print("Done")

if __name__ == "__main__":
    main()
