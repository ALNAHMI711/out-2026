module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {
    colors: { "out-black":"#0a0a0a","out-dark":"#121212","out-card":"#1a1a1a","out-gold":"#d4af37","out-gold-light":"#f4d47c","out-silver":"#c0c0c0","out-border":"#2a2a2a" },
    fontFamily: { arabic:["Cairo","Tajawal","sans-serif"], latin:["Inter","system-ui","sans-serif"] },
    boxShadow: { gold:"0 0 20px rgba(212,175,55,.3)", "gold-lg":"0 0 40px rgba(212,175,55,.5)" }
  }},
  plugins: []
};
