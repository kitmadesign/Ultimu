// server/routes/auth.js - VERSÃO SIMPLIFICADA
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');

// Login para jogadores
router.post('/login', async (req, res) => {
    console.log('🔐 Login jogador - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        const db = new Database(DB_FILE);
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        db.close();

        if (!user) {
            console.log('❌ Usuário não encontrado:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas' 
            });
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            console.log('❌ Senha inválida para:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas' 
            });
        }

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
router.post('/register', async (req, res) => {
    console.log('📝 Register - Body:', req.body);
    
    try {
        const { username, displayName, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        const db = new Database(DB_FILE);
        
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            db.close();
            return res.status(409).json({ 
                success: false,
                error: 'Usuário já existe' 
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = db.prepare(`
            INSERT INTO users (username, password_hash, role) 
            VALUES (?, ?, 'jogador')
        `).run(username, passwordHash);

        db.close();

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
router.post('/login-mestre', async (req, res) => {
    console.log('👑 Login mestre - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username e password são obrigatórios' 
            });
        }

        const mestreUser = process.env.MESTRE_USER || 'admin';
        const mestrePassword = process.env.MESTRE_PASSWORD || '123456';
        
        if (username !== mestreUser || password !== mestrePassword) {
            console.log('❌ Credenciais mestre inválidas');
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais de mestre inválidas' 
            });
        }

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

module.exports = router;