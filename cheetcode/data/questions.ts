export const problems = [
  [{
    id: 1,
    question: "Which code implementation is more efficient for finding a number in a sorted array?",
    codeA: `def find_number(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
    codeB: `def find_number(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code B",
    explanation: "Code B implements binary search with O(log n) complexity, while Code A uses linear search with O(n) complexity."
  },
  {
    id: 2,
    question: "Which implementation of checking for a palindrome string is correct?",
    codeA: `def is_palindrome(s):
    s = s.lower()
    return s == s[::-1]`,
    codeB: `def is_palindrome(s):
    s = s.lower()
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return True
        left += 1
        right -= 1
    return False`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code A",
    explanation: "Code A correctly checks for palindromes by comparing the string with its reverse. Code B has a logic error in the return statements."
  },
  {
    id: 3,
    question: "Which implementation correctly counts the frequency of elements?",
    codeA: `def count_frequency(arr):
    freq = {}
    for num in arr:
        if num in freq:
            freq[num] += 1
    return freq`,
    codeB: `def count_frequency(arr):
    freq = {}
    for num in arr:
        freq[num] = freq.get(num, 0) + 1
    return freq`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code B",
    explanation: "Code B correctly handles all cases using dict.get(), while Code A misses initializing counts for new elements."
  }],
  [{
    id: 1,
    question: "Which 2 code implementation is more efficient for finding a number in a sorted array?",
    codeA: `def find_number(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
    codeB: `def find_number(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code B",
    explanation: "Code B implements binary search with O(log n) complexity, while Code A uses linear search with O(n) complexity."
  },
  {
    id: 2,
    question: "Which implementation of checking for a palindrome string is correct?",
    codeA: `def is_palindrome(s):
    s = s.lower()
    return s == s[::-1]`,
    codeB: `def is_palindrome(s):
    s = s.lower()
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return True
        left += 1
        right -= 1
    return False`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code A",
    explanation: "Code A correctly checks for palindromes by comparing the string with its reverse. Code B has a logic error in the return statements."
  },
  {
    id: 3,
    question: "Which implementation correctly counts the frequency of elements?",
    codeA: `def count_frequency(arr):
    freq = {}
    for num in arr:
        if num in freq:
            freq[num] += 1
    return freq`,
    codeB: `def count_frequency(arr):
    freq = {}
    for num in arr:
        freq[num] = freq.get(num, 0) + 1
    return freq`,
    codeC: `print('This is dummy code C')`,
    codeD: `print('This is dummy code D')`,
    options: ["Code A", "Code B"],
    correctAnswer: "Code B",
    explanation: "Code B correctly handles all cases using dict.get(), while Code A misses initializing counts for new elements."
  }]
]
