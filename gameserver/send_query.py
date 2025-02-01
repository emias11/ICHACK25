from openai import OpenAI
import uuid
from datetime import datetime

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
        
if __name__ == "__main__":
    print("Type 'exit' to quit the conversation.")

    try:
        while True:
            prompt = input("Enter a prompt for OpenAI: ")
            if prompt.lower() == "exit":
                print("Exiting the conversation...")
                break  # Exit the loop if the user types "exit"

            response = get_openai_response(prompt)
            print("Response:", response)

    except KeyboardInterrupt:
        print("\nSession interrupted. Saving conversation...")

    # Save the conversation after exit or interruption (Ctrl+C)
    save_conversation_to_file(generate_filename())
    print("Conversation saved to history.")
