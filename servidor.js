// servidor.js - VERSÃO CORRIGIDA E ORGANIZADA

const express = require('express');
const compression = require('compression');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');

require('dotenv').config();

// =============================================
// CONFIGURAÇÃO INICIAL
// =============================================

// Verificar variáveis de ambiente críticas
console.log('🔧 Verificando ambiente...');
if (!process.env.JWT_SECRET) {
    console.error('❌ AVISO: JWT_SECRET não definido no .env');
    process.env.JWT_SECRET = 'temp_secret_' + Date.now();
    console.log('⚠️  Usando secret temporário');
}

if (!process.env.MESTRE_USER) {
    process.env.MESTRE_USER = 'mestre';
    process.env.MESTRE_PASSWORD = '075107';
    console.log('⚠️  Usando credenciais padrão do mestre');
}

console.log('   MESTRE_USER:', process.env.MESTRE_USER);
console.log('   PORT:', process.env.PORT || 3000);

// =============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =============================================
console.log('🛠️ Preparando o banco de dados...');

// Função simplificada para setup do banco
function setupDatabase() {
    const DATA_DIR = path.join(__dirname, 'data');
    const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
    
    // Criar diretório data se não existir
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Conectar ao banco
    const db = new Database(DB_FILE);
    
    // Criar tabelas básicas
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'jogador',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS fichas (
            playerId TEXT PRIMARY KEY,
            ficha_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('✅ Tabelas criadas/verificadas');
    db.close();
}

try {
    setupDatabase();
    console.log('✅ Banco de dados pronto!');
} catch (error) {
    console.error('❌ Erro no banco de dados:', error);
    process.exit(1);
}

// =============================================
// CONEXÃO COM O BANCO
// =============================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
const db = new Database(DB_FILE);

// =============================================
// CONFIGURAÇÃO DE UPLOADS
// =============================================
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 12 * 1024 * 1024 }
});

// =============================================
// MIDDLEWARE EXPRESS
// =============================================
app.use(compression());
app.use(express.static('public'));
app.use(express.json());

// =============================================
// MIDDLEWARE DE DEBUG (APÓS APP SER INICIALIZADO)
// =============================================
app.use('/api', (req, res, next) => {
  console.log('🔍 API Request:', req.method, req.url, req.body);
  next();
});

// =============================================
// ROTAS BÁSICAS DE AUTENTICAÇÃO (SIMPLIFICADAS)
// =============================================

// Login para jogadores
app.post('/api/login', async (req, res) => {
    console.log('🔐 Login jogador - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas' 
            });
        }

        const bcrypt = require('bcryptjs');
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordValid) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas' 
            });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login bem-sucedido:', username);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                displayName: user.username,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('💥 ERRO NO LOGIN:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
});

// Registro para jogadores
app.post('/api/register', async (req, res) => {
    console.log('📝 Register - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        // Verificar se usuário já existe
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                error: 'Usuário já existe' 
            });
        }

        // Criar hash da senha
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Inserir usuário
        const result = db.prepare(`
            INSERT INTO users (username, password_hash, role) 
            VALUES (?, ?, 'jogador')
        `).run(username, passwordHash);

        console.log('✅ Usuário criado:', username);
        
        res.status(201).json({ 
            success: true,
            message: 'Usuário criado com sucesso',
            userId: result.lastInsertRowid 
        });
        
    } catch (error) {
        console.error('💥 ERRO NO REGISTRO:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
});

// Login para mestre
app.post('/api/login-mestre', async (req, res) => {
    console.log('👑 Login mestre - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        const mestreUser = process.env.MESTRE_USER;
        const mestrePassword = process.env.MESTRE_PASSWORD;
        
        if (username !== mestreUser || password !== mestrePassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais de mestre inválidas' 
            });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { 
                userId: 'mestre',
                username: mestreUser,
                role: 'mestre'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login mestre bem-sucedido');
        
        res.json({
            success: true,
            token,
            user: {
                id: 'mestre',
                username: mestreUser,
                displayName: 'Mestre',
                role: 'mestre'
            }
        });
        
    } catch (error) {
        console.error('💥 ERRO NO LOGIN MESTRE:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor' 
        });
    }
});

// Rota simples para /api/me
app.get('/api/me', (req, res) => {
    console.log('🔍 Rota /api/me chamada (simulada)');
    res.json({
        success: true,
        user: {
            id: 'temp',
            username: 'usuario_temporario',
            displayName: 'Usuário Temp',
            role: 'jogador'
        }
    });
});

// =============================================
// ROTAS ESTÁTICAS
// =============================================

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas de redirecionamento
app.get('/jogador', (req, res) => {
  res.redirect('/jogador/sessao.html');
});

app.get('/mestre', (req, res) => {
  res.redirect('/mestre/sessao.html');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/jogador/dashboard.html');
});

app.get('/mestre-dashboard', (req, res) => {
  res.redirect('/mestre/dashboard.html');
});

// =============================================
// ENDPOINT DE UPLOAD (SIMPLIFICADO)
// =============================================
app.post('/upload-audio', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const url = `/uploads/${req.file.filename}`;
    return res.json({ url });
  } catch (err) {
    console.error('Erro no upload:', err);
    return res.status(500).json({ error: 'Erro ao processar upload' });
  }
});

app.use('/uploads', express.static(UPLOAD_DIR));

// =============================================
// INICIAR SERVIDOR
// =============================================
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log('');
  console.log('🎮 ========================================');
  console.log('🎮 SISTEMA DE RPG INICIADO!');
  console.log('🎮 ========================================');
  console.log('');
  console.log(`🌐 Servidor rodando: http://localhost:${PORT}`);
  console.log('');
  console.log('✅ Rotas disponíveis:');
  console.log('   📄 / - Login');
  console.log('   🔐 /api/login - Login jogador');
  console.log('   📝 /api/register - Registrar jogador');
  console.log('   👑 /api/login-mestre - Login mestre');
  console.log('   🎲 /jogador/dashboard.html - Dashboard Jogador');
  console.log('   👑 /mestre/dashboard.html - Dashboard Mestre');
  console.log('');
});