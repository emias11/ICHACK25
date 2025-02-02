import requests
import time

def send_question(theme):
    url = 'http://localhost:3001/prompts/choices'
    data = {
        'question': f'What is the result of 1 + 1? (Theme: {theme})',
        'choices': {'A': '2', 'B': '3', 'C': '4', 'D': '6'},
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json().get('questionId')  # Return the question ID
    else:
        print("Failed to send question")
        return None

def send_result(questionId, correct, explanation):
    url = 'http://localhost:3001/result'
    data = {
        'questionId': questionId,
        'correct': correct,
        'explanation': explanation,
    }
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return True
    else:
        print("Failed to send result")
        return False

def main():
    # Select a theme (for now, hardcoded)
    theme = 'Question 1'
    print(f"Selected theme: {theme}")

    # Send the question
    print("Sending question to Express server...")
    questionId = send_question(theme)
    if not questionId:
        return

    # Wait for the user to answer (simulate waiting for React to send the answer)
    print("Waiting for user to answer...")
    time.sleep(5)  # Replace with actual waiting logic

    # Send the result (correctness and explanation)
    print("Sending result to Express server...")
    if not send_result(questionId, True, 'Correct! 2 is the right answer.'):  # Replace with actual result
        return

    print("Process completed successfully.")

if __name__ == "__main__":
    main()
