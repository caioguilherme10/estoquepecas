/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html", // O HTML na raiz
      "./src/**/*.{js,ts,jsx,tsx}", // ARQUIVOS DENTRO DA PASTA 'src'
    ],
    theme: {
      extend: {},
    },
    plugins: [],
    // Se você adicionou type: module no package.json,
    // pode precisar que este arquivo também use export default
};