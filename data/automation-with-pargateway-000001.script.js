{
    a: async (states) => states.a = 1,
    b: async (states) => states.b = 2,
    c1: async (states) => states.c1 = states.a + states.b,
    c2: async (states) => states.c2 = states.a - states.b,
    d: async (states) => states.result = states.c1 + states.c2,
}