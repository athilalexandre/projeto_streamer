const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'jogos.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// Helper para ler e salvar
function lerJogos() {
  if (!fs.existsSync(DB_PATH)) return [];
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return data ? JSON.parse(data) : [];
}
function salvarJogos(jogos) {
  fs.writeFileSync(DB_PATH, JSON.stringify(jogos, null, 2));
}

// Listar todos os jogos
app.get('/api/jogos', (req, res) => {
  const jogos = lerJogos();
  res.json(jogos);
});

// Adicionar novo jogo
app.post('/api/jogos', (req, res) => {
  const novoJogo = req.body;
  if (!novoJogo || !novoJogo.nome || !novoJogo.capa) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }
  const jogos = lerJogos();
  novoJogo.id = Date.now();
  jogos.push(novoJogo);
  salvarJogos(jogos);
  res.status(201).json(novoJogo);
});

// Detalhe de um jogo
app.get('/api/jogos/:id', (req, res) => {
  const jogos = lerJogos();
  const jogo = jogos.find(j => j.id == req.params.id);
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado.' });
  res.json(jogo);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 