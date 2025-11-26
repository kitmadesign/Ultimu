// public/ficha-dados.js - ARQUIVO NOVO
console.log('🎲 Sistema de dados carregado!');

// Funções auxiliares para cálculos de ficha
function calcularModificador(atributo) {
    return Math.floor((atributo - 10) / 2);
}

function calcularBonusProficiencia(nivel) {
    return Math.floor((nivel - 1) / 4) + 2;
}

function calcularPV(vigor, nivel, nex) {
    return 12 + (vigor * 2) + Math.floor(nex / 5) + (nivel * 2);
}

function calcularSanidade(presenca, nivel, nex) {
    return 12 + (presenca * 2) + Math.floor(nex / 5) + nivel;
}

function calcularPE(presenca, nivel, nex) {
    return 3 + presenca + Math.floor(nex / 10) + nivel;
}

// Sistema de perícias do Ordem Paranormal
const periciasOrdem = {
    'Acrobacia': { atributo: 'agi', treinada: false },
    'Adestramento': { atributo: 'pre', treinada: false },
    'Artes': { atributo: 'pre', treinada: false },
    'Atletismo': { atributo: 'for', treinada: false },
    'Atualidades': { atributo: 'int', treinada: false },
    'Ciências': { atributo: 'int', treinada: false },
    'Crime': { atributo: 'agi', treinada: false },
    'Diplomacia': { atributo: 'pre', treinada: false },
    'Enganação': { atributo: 'pre', treinada: false },
    'Fortitude': { atributo: 'vig', treinada: false },
    'Furtividade': { atributo: 'agi', treinada: false },
    'Iniciativa': { atributo: 'agi', treinada: false },
    'Intimidação': { atributo: 'pre', treinada: false },
    'Intuição': { atributo: 'pre', treinada: false },
    'Investigação': { atributo: 'int', treinada: false },
    'Luta': { atributo: 'for', treinada: false },
    'Medicina': { atributo: 'int', treinada: false },
    'Ocultismo': { atributo: 'int', treinada: false },
    'Percepção': { atributo: 'pre', treinada: false },
    'Pilotagem': { atributo: 'agi', treinada: false },
    'Pontaria': { atributo: 'agi', treinada: false },
    'Profissão': { atributo: 'int', treinada: false },
    'Reflexos': { atributo: 'agi', treinada: false },
    'Religião': { atributo: 'pre', treinada: false },
    'Sobrevivência': { atributo: 'int', treinada: false },
    'Tática': { atributo: 'int', treinada: false },
    'Tecnologia': { atributo: 'int', treinada: false },
    'Vontade': { atributo: 'pre', treinada: false }
};

// Exportar para uso global
window.calcularModificador = calcularModificador;
window.calcularBonusProficiencia = calcularBonusProficiencia;
window.calcularPV = calcularPV;
window.calcularSanidade = calcularSanidade;
window.calcularPE = calcularPE;
window.periciasOrdem = periciasOrdem;

console.log('✅ Funções de cálculo carregadas com sucesso!');