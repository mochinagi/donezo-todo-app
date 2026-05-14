updateTodoText: (id, text) =>
    set(state => {
        const value = text.trim();

        if (!value) {
            return state;
        }

        const normalized =
            normalizeText(value);

        const duplicated =
            state.todos.some(
                todo =>
                    todo.id !== id &&
                    todo.normalized ===
                    normalized
            );

        if (duplicated) {
            return state;
        }

        let previousTodo: Todo | null =
            null;

        let updatedTodo: Todo | null =
            null;

        const todos = state.todos.map(
            todo => {
                if (todo.id !== id) {
                    return todo;
                }

                previousTodo = todo;

                updatedTodo =
                    withUpdatedAt(todo, {
                        text: value,
                        normalized,
                    });

                return updatedTodo;
            }
        );

        if (
            !previousTodo ||
            !updatedTodo
        ) {
            return state;
        }

        return {
            ...state,

            todos,

            undoStack: trimHistory([
                ...state.undoStack,
                {
                    type: "update",

                    id,

                    before: {
                        text: previousTodo.text,
                        normalized:
                            previousTodo.normalized,
                    },

                    after: {
                        text: updatedTodo.text,
                        normalized:
                            updatedTodo.normalized,
                    },
                },
            ]),

            redoStack: [],
        };
    }),