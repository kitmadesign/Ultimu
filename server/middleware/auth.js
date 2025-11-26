// server/middleware/auth.js
const jwt = require('jsonwebtoken');

// Verificar se JWT_SECRET existe
if (!process.env.JWT_SECRET) {
    console.error('❌ ERRO CRÍTICO: JWT_SECRET não definido no .env');
    process.env.JWT_SECRET = 'fallback_secret_temp_' + Date.now();
    console.warn('⚠️  Usando secret temporário. DEFINA O JWT_SECRET NO .env!');
}

const verifyTokenMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('🔐 Nenhum token fornecido');
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token || token === 'null' || token === 'undefined') {
            console.log('🔐 Token vazio ou inválido');
            return res.status(401).json({ error: 'Token inválido' });
        }

        console.log('🔐 Verificando token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('🔐 Token válido para:', decoded.username);
        next();
        
    } catch (error) {
        console.error('❌ Erro ao verificar token:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token JWT inválido' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        
        return res.status(401).json({ error: 'Falha na autenticação' });
    }
};

// CORREÇÃO: Exportar como objeto
module.exports = { verifyTokenMiddleware };