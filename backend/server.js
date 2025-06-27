const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_JOGOS = path.join(__dirname, 'jogos.json');
const DB_USUARIOS = path.join(__dirname, 'usuarios.json');
const JWT_SECRET = 'streamer_secret_key'; // Troque por uma env var em produção

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

function lerUsuarios() {
  if (!fs.existsSync(DB_USUARIOS)) return [];
  const data = fs.readFileSync(DB_USUARIOS, 'utf8');
  return data ? JSON.parse(data) : [];
}
function salvarUsuarios(usuarios) {
  fs.writeFileSync(DB_USUARIOS, JSON.stringify(usuarios, null, 2));
}

// Middleware para rotas protegidas
function autenticarJWT(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ erro: 'Token inválido.' });
    req.user = user;
    next();
  });
}

// Cadastro do admin no primeiro acesso
app.post('/api/admin/cadastro', (req, res) => {
  const usuarios = lerUsuarios();
  if (usuarios.find(u => u.role === 'admin')) {
    return res.status(400).json({ erro: 'Admin já cadastrado.' });
  }
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Dados incompletos.' });
  const hash = bcrypt.hashSync(senha, 10);
  const admin = { id: Date.now(), nome, email, senha: hash, role: 'admin' };
  usuarios.push(admin);
  salvarUsuarios(usuarios);
  res.status(201).json({ msg: 'Admin cadastrado com sucesso.' });
});

// Login local (admin ou streamer)
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const usuarios = lerUsuarios();
  const user = usuarios.find(u => u.email === email);
  if (!user) return res.status(401).json({ erro: 'Usuário não encontrado.' });
  if (!bcrypt.compareSync(senha, user.senha)) return res.status(401).json({ erro: 'Senha inválida.' });
  const token = jwt.sign({ id: user.id, nome: user.nome, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: user.id, nome: user.nome, role: user.role } });
});

// Exemplo de rota protegida (apenas admin)
app.get('/api/admin/usuarios', autenticarJWT, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ erro: 'Acesso negado.' });
  const usuarios = lerUsuarios().map(u => ({ id: u.id, nome: u.nome, email: u.email, role: u.role }));
  res.json(usuarios);
});

// Helper para ler e salvar
function lerJogos() {
  if (!fs.existsSync(DB_JOGOS)) return [];
  const data = fs.readFileSync(DB_JOGOS, 'utf8');
  return data ? JSON.parse(data) : [];
}
function salvarJogos(jogos) {
  fs.writeFileSync(DB_JOGOS, JSON.stringify(jogos, null, 2));
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