from openai import OpenAI
import uuid
from datetime import datetime
from api_calls import *
from response_to_json import *

client = OpenAI(api_key="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")

def load_system_message(file_path):
    try:
        with open(file_path, 'r') as file:
            return file.read().strip()  # Remove any extra whitespace
    except Exception as e:
        return f"Error loading system message: {str(e)}"
    
# Make sure you have set your OpenAI API key in your environment
message_history = [{"role": "system", "content": 
                (load_system_message("context.txt"))
                }]
def get_openai_response(prompt):
    try:
        
        message_history.append({"role": "user", "content": prompt})
        # Use the new `openai.ChatCompletion.create()` method for GPT models
        response = client.chat.completions.create(model="gpt-4o",  # You can change this to the latest model if needed
        messages=message_history
        )
        
        assistant_reply = response.choices[0].message.content
        message_history.append({"role": "assistant", "content": assistant_reply})

        return assistant_reply
    except Exception as e:
        return str(e)

def generate_filename():
    # Get current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    # Generate a random UUID
    random_uuid = uuid.uuid4().hex[:6]  # Using the first 6 characters for brevity

    # Combine timestamp and random UUID to generate the filename
    return f"history/conversation_{timestamp}_{random_uuid}.txt"

def save_conversation_to_file(filename):
    try:
        with open(filename, 'w') as file:
            for message in message_history:
                role = message["role"]
                content = message["content"]
                file.write(f"{role.capitalize()}: {content}\n")
    except Exception as e:
        print(f"Error saving conversation: {e}")

def get_user_input():
    input("User input for OpenAI: ")
    # while True: 
        

if __name__ == "__main__":
    
    api_url = "http://localhost:3001/"
    while True: 
        # 1. Get the question from /leetcode. E.g. Same Tree
        question = get_leetcode_question(api_url)
        
        print("User input")
        response = get_openai_response(question)
        parsed_response = parse_openai_response(response)
        
        # 2. Define a problem statement and choices (this would typically come from OpenAI or other logic)
        while True:
            try:
                problem_statement = parsed_response["problem_statement"] 
                choices = parsed_response["choices"]
                question_for_user = parsed_response["question"]
                break
            except KeyError:
                response = get_openai_response("retry")
                parsed_response = parse_openai_response(response)
        
        # 3. Send the question, problem statement, and choices to /prompts/choices and wait for an answer
        answer = post_initial_data(api_url, question_for_user, problem_statement, choices)
        
        explanation = ""
        is_correct = ""
        while True: 
            # 4. Input the answer received from the user to this bs. 
            response = get_openai_response(answer)
            parsed_response = parse_openai_response(response)
            
            # 5. Post the result to /result with correct or incorrect status and explanation
            while True:
                try: 
                    explanation = parsed_response["explanation"] 
                    is_correct = parsed_response["correct"]
                    question = parsed_response["question"]
                    choices = parsed_response["choices"]
                    break
                except KeyError:
                    response = get_openai_response(answer)
                    parsed_response = parse_openai_response(response)
                
            post_result(api_url, is_correct, explanation)
            
            # 6. Send the question and choices to /next_question (new function)
            answer = post_next_question(api_url, question, choices)
            if answer == "exit": 
                break 

        # 7. Continue looping (the next iteration will fetch another question)
        time.sleep(2)  # Adjust the sleep time if needed

    
    # print("Type 'exit' to quit the conversation.")

    # try:
    #     while True:
    #         prompt = get_user_input()
    #         if prompt.lower() == "exit":
    #             print("Exiting the conversation...")
    #             break  # Exit the loop if the user types "exit"

    #         response = get_openai_response(prompt)
    #         print("Response:", response)

    # except KeyboardInterrupt:
    #     print("\nSession interrupted. Saving conversation...")

    # # Save the conversation after exit or interruption (Ctrl+C)
    # save_conversation_to_file(generate_filename())
    # print("Conversation saved to history.")
