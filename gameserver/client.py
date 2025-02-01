import requests
import time

def send_question():
    url = 'http://localhost:3001/prompt/choices'
    data = {
        'question': 'What is the result of 1 + 1?',
        'choices': ['2', '3', '4', '6'],  # Up to 4 choices
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()  # Returns the user's answer and explanation
    else:
        print("Failed to send question")
        return None

def main():
    print("Sending question to Express server...")
    result = send_question()

    if result:
        print(f"User selected: {result['answer']}")
        print(f"Explanation: {result['explanation']}")
    else:
        print("No answer received")

if __name__ == "__main__":
    main()
