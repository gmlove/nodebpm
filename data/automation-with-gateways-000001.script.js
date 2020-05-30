{
    a: async (states) => states.a = 1,
    b: async (states) => states.b = 2,
    c1: async (states) => states.c1 = states.a + states.b,
    c2: async (states) => states.c2 = states.a - states.b,
    c3: async (states) => states.c3 = states.a * states.b,
    c4: async (states) => states.c4 = states.a / states.b,
    c41: async (states) => states.c40 = states.c4 + states.b,
    c42: async (states) => states.c40 = states.c4 - states.b,
    d: async (states) => states.d = states.c1 + states.c2,
    e: async (states) => states.result = states.c3 + states.d,
}