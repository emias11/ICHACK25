export const all_topics = [ "topic0", "topic1", "topic2", "topic3" ]

export const problems = [
    {
    problem_title: "1",
    problem_description: "This is problem 1",
    topics: [all_topics[0], all_topics[1]],
    problem_questions: []
    },
    {
    problem_title: "2",
    problem_description: "This is problem 2",
    topics: [all_topics[1], all_topics[2]],
    problem_questions: []
    },
    {
    problem_title: "3",
    problem_description: "This is problem 3",
    topics: [all_topics[2], all_topics[3]],
    problem_questions: []
    },
    {
    problem_title: "4",
    problem_description: "This is problem 4",
    topics: ["not_in_all_topics"],
    problem_questions: []
    }
]
