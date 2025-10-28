const express = require('express');
const cors = require('cors'); // Vamos manter o CORS
const app = express();

// Configuração básica do CORS (permite tudo por enquanto)
app.use(cors());
app.options('*', cors());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor de TESTE "Olá Mundo" está funcionando!');
});

// --- INÍCIO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de TESTE "Olá Mundo" rodando na porta ${PORT}`);
});