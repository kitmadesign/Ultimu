// server/database-setup.js

// =============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =============================================

// Estas são ferramentas que precisamos:
const Database = require('better-sqlite3');  // Para trabalhar com banco de dados
const path = require('path');                // Para encontrar caminhos de arquivos
const fs = require('fs');                    // Para trabalhar com arquivos

// Onde vamos guardar nosso banco de dados:
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');

function setupDatabase() {
    console.log('🔧 Iniciando configuração do banco de dados...');
    
    // Primeiro, garantir que a pasta "data" existe
    if (!fs.existsSync(DATA_DIR)) {
        console.log('📁 Criando pasta "data"...');
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Conectar ao banco de dados (como abrir um armário)
    const db = new Database(DB_FILE);
    
    try {
        console.log('🗄️ Verificando tabelas...');
        
        // =============================================
        // GRUPO 1: TABELAS DO SISTEMA DE USUÁRIOS
        // =============================================
        
        // Tabela de USUÁRIOS - guarda quem pode entrar no sistema
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,                    -- Código único do usuário
                username TEXT UNIQUE NOT NULL,          -- Nome para login (único)
                password_hash TEXT NOT NULL,            -- Senha protegida
                display_name TEXT,                      -- Nome para mostrar
                created_at TEXT NOT NULL                -- Data de cadastro
            )
        `);
        console.log('   ✅ Tabela "users" verificada');
        
        // Tabela de CAMPANHAS - guarda as aventuras de RPG
        db.exec(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id TEXT PRIMARY KEY,                    -- Código único da campanha
                name TEXT NOT NULL,                     -- Nome da campanha
                description TEXT,                       -- Descrição
                owner_id TEXT NOT NULL,                 -- Quem criou a campanha
                created_at TEXT NOT NULL,               -- Data de criação
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `);
        console.log('   ✅ Tabela "campaigns" verificada');
        
        // Tabela de MEMBROS - diz quem está em qual campanha
        db.exec(`
            CREATE TABLE IF NOT EXISTS campaign_members (
                campaign_id TEXT NOT NULL,              -- Código da campanha
                user_id TEXT NOT NULL,                  -- Código do usuário
                role TEXT DEFAULT 'player',             -- Papel: player, gm, owner
                joined_at TEXT,                         -- Data que entrou
                PRIMARY KEY (campaign_id, user_id),     -- Chave única
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('   ✅ Tabela "campaign_members" verificada');
        
        // =============================================
        // GRUPO 2: TABELAS DO SISTEMA DE CAMPANHAS
        // =============================================
        
        // Tabela de CONVITES - para convidar pessoas para campanhas
        db.exec(`
            CREATE TABLE IF NOT EXISTS invites (
                id TEXT PRIMARY KEY,                    -- Código único do convite
                campaign_id TEXT NOT NULL,              -- Para qual campanha
                invited_username TEXT,                  -- Quem foi convidado
                token TEXT,                             -- Código secreto do convite
                role TEXT DEFAULT 'player',             -- Papel no convite
                created_by TEXT NOT NULL,               -- Quem criou o convite
                created_at TEXT NOT NULL,               -- Data do convite
                expires_at TEXT,                        -- Data que expira
                status TEXT DEFAULT 'open',             -- Estado: open, accepted, rejected
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('   ✅ Tabela "invites" verificada');
        
        // Tabela de MENSAGENS - mensagens nas campanhas
        db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,                    -- Código único da mensagem
                campaign_id TEXT NOT NULL,              -- De qual campanha
                sender_id TEXT NOT NULL,                -- Quem enviou
                content TEXT NOT NULL,                  -- Texto da mensagem
                type TEXT DEFAULT 'note',               -- Tipo: note, alert, etc
                created_at TEXT NOT NULL,               -- Data do envio
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id)
            )
        `);
        console.log('   ✅ Tabela "messages" verificada');
        
        // =============================================
        // GRUPO 3: TABELAS DO SISTEMA PRINCIPAL
        // =============================================
        
        // Tabela de FICHAS - fichas de personagem
        db.exec(`
            CREATE TABLE IF NOT EXISTS fichas (
                playerId TEXT PRIMARY KEY,              -- Código do jogador
                ficha_json TEXT,                        -- Dados da ficha
                updated_at TEXT                         -- Data da última alteração
            )
        `);
        console.log('   ✅ Tabela "fichas" verificada');
        
        // Tabela de PREFERÊNCIAS - configurações do usuário
        db.exec(`
            CREATE TABLE IF NOT EXISTS preferences (
                key TEXT PRIMARY KEY,                   -- Nome da configuração
                value_json TEXT,                        -- Valor da configuração
                updated_at TEXT                         -- Data da alteração
            )
        `);
        console.log('   ✅ Tabela "preferences" verificada');
        
        console.log('🎉 Todas as tabelas estão prontas!');
        
    } catch (error) {
        console.error('❌ Erro ao configurar o banco:', error);
        throw error; // Para o servidor saber que deu erro
    } finally {
        db.close(); // Sempre fechar a conexão
        console.log('🔒 Conexão com o banco fechada');
    }
}

// Tornar esta função disponível para outros arquivos
module.exports = { setupDatabase };