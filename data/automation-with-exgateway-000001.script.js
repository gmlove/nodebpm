{
    a: async (states) => states.a = 1,
    b: async (states) => states.b = 2,
    c1: async (states) => states.result = states.a + states.b,
    c2: async (states) => states.result = states.a - states.b
}