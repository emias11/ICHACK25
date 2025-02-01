import requests
import time

def get_leetcode_question(api_url, timeout_seconds=600):
    while True:
        try:
            # Sending GET request to /leetcode
            print("Sending GET request to /leetcode...")
            response = requests.get(f"{api_url}/leetcode", timeout=timeout_seconds)  # 10-minute timeout

            if response.status_code == 200:
                data = response.json()
                # Check if 'question' is in the response
                question = data.get('question')

                if question:
                    print(f"Received question: {question}")
                    return question  # Return question if received

            else:
                print(f"Error: Failed to retrieve data from /leetcode (status code {response.status_code})")
            
        except requests.exceptions.Timeout:
            print("Request timed out. Retrying...")
        except requests.exceptions.RequestException as e:
            print(f"Error during GET request: {e}")

        # Pause before retrying
        time.sleep(2)  # Adjust sleep time if necessary


def post_initial_data(api_url, question, problem_statement, choices, timeout_seconds=600):
    while True:
        try:
            # Send POST request to /prompts/choices with question, problem_statement, and choices
            print("Sending POST request to /prompts/choices...")
            payload = {
                "question": question,
                "problem_statement": problem_statement,
                "choices": choices
            }

            response = requests.post(f"{api_url}/prompts/choices", json=payload, timeout=timeout_seconds)

            if response.status_code == 200:
                data = response.json()
                # Extract 'answer' from the response
                answer = data.get("answer")

                if answer:
                    print(f"Received answer: {answer}")
                    return answer  # Return the answer

            else:
                print(f"Error: Failed to retrieve data from /prompts/choices (status code {response.status_code})")

        except requests.exceptions.Timeout:
            print("Request timed out. Retrying...")
        except requests.exceptions.RequestException as e:
            print(f"Error during POST request: {e}")

        # Pause before retrying
        time.sleep(2)  # Adjust sleep time if necessary


def post_next_question(api_url, question, choices, timeout_seconds=600):
    while True:
        try:
            # Send POST request to /next_question with question and choices
            print("Sending POST request to /next_question...")
            payload = {
                "question": question,
                "choices": choices
            }

            response = requests.post(f"{api_url}/next_question", json=payload, timeout=timeout_seconds)

            if response.status_code == 200:
                data = response.json()
                # Extract 'answer' from the response
                answer = data.get("answer")

                if answer:
                    print(f"Received answer: {answer}")
                    return answer  # Return the answer

            else:
                print(f"Error: Failed to retrieve data from /next_question (status code {response.status_code})")

        except requests.exceptions.Timeout:
            print("Request timed out. Retrying...")
        except requests.exceptions.RequestException as e:
            print(f"Error during POST request: {e}")

        # Pause before retrying
        time.sleep(2)  # Adjust sleep time if necessary


def post_result(api_url, is_correct, explanation, timeout_seconds=600):
    try:
        # Send POST request to /result
        print("Sending POST request to /result...")
        response = requests.post(f"{api_url}/result", json={
            "correct": is_correct,
            "explanation": explanation
        }, timeout=timeout_seconds)

        if response.status_code == 200:
            print("Result posted successfully!")
        else:
            print(f"Error: Failed to post result (status code {response.status_code})")
    except requests.exceptions.Timeout:
        print("Request timed out during result posting.")
    except requests.exceptions.RequestException as e:
        print(f"Error during POST request to /result: {e}")
