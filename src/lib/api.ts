export const fetchTodos = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, text: "Mock Task", completed: false },
            ]);
        }, 500);
    });
};