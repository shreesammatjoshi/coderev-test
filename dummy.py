password = "admin123"
api_key = "sk_live_abcdef123"

def login(user_input):
    eval(user_input)   # arbitrary code execution


def get_user(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    return query       # SQL injection


def run_command(cmd):
    import os
    os.system(cmd)     # command injection
