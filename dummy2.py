import os
import math


def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num

    average = total / len(numbers)
    unused_variable = "I am never used"
    return average


def greet(name):
    print("Hello " + name)


def divide(a, b):
    return a / b


if __name__ == "__main__":
    greet(123)                   # Type issue (expects string)
    print(calculate_average([])) # ZeroDivisionError
    print(divide(10, 0))         # ZeroDivisionError
