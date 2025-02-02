import json
import re

def parse_openai_response(response_text):
    # Define regex patterns to extract the relevant sections
    problem_statement_pattern = r"# Problem Statement:\s*(.*?)# Confirmation of Correctness:"
    confirmation_pattern = r"# Confirmation of Correctness:\s*(.*?)# Explanation:"
    explanation_pattern = r"# Explanation:\s*(.*?)# Current Code State:"
    next_question_pattern = r"# Next Question:\s*(.*?)\n"
    
    # Adjust the choices regex to capture the entire option with code included
    choices_pattern = r"([A-D])\)\s*(.*?)(?=\n[A-D]\)|$)"  # Capture the entire option including description and code

    # Extract sections using regex
    problem_statement = re.search(problem_statement_pattern, response_text, re.DOTALL)
    confirmation = re.search(confirmation_pattern, response_text, re.DOTALL)
    explanation = re.search(explanation_pattern, response_text, re.DOTALL)
    next_question = re.search(next_question_pattern, response_text)
    choices = re.findall(choices_pattern, response_text, re.DOTALL)

    # Initialize the result dictionary
    result = {}

    if problem_statement:
        result["problem_statement"] = problem_statement.group(1).strip()

    if confirmation:
        confirmation_text = confirmation.group(1).strip()
        result["correct"] = True if confirmation_text.startswith("Correct!") else False

    if explanation:
        result["explanation"] = explanation.group(1).strip()

    if next_question:
        result["question"] = next_question.group(1).strip()

    # Parse choices and store the entire option (text and code) as a single string
    if choices:
        choices_dict = {}
        for choice_letter, description in choices:
            choices_dict[choice_letter] = description.strip()
        result["choices"] = choices_dict
    return result

# Example OpenAI response (formatted as plain text)
# openai_response = """
# # Problem Statement: 
# Solve for x in the equation: x^2 - 5x + 6 = 0.

# # Confirmation of Correctness:
# Correct! The equation can be factored as (x - 2)(x - 3) = 0, so x = 2 or x = 3.

# # Explanation:
# To solve this quadratic equation, we can factor it into two binomials and set each factor equal to zero. This gives us the solutions x = 2 and x = 3.

# # Current Code State: 
# def solve_quadratic(a, b, c):
#     return (-b + (b**2 - 4*a*c)**0.5) / (2*a), (-b - (b**2 - 4*a*c)**0.5) / (2*a)

# # Next Question:
# What is the solution to the quadratic equation: x^2 - 7x + 10 = 0?

# A) x = 5, 2.
# ```python
# if p.val != q.val:
#     return False
# return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)
# B) x = 5, 2.
# ```python
# if p.val != q.val:
#     return Fals
# return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)
# """
# Parsing the response
# parsed_response = parse_openai_response(openai_response)
# print(parsed_response)
