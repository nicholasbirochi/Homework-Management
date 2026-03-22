import * as SQLite from 'expo-sqlite';

export async function getDbConnection() {
    return await SQLite.openDatabaseAsync('trabalhosEscolares.db');
}

export async function createTable() {
    var cx = await getDbConnection();
    try {
        // Tabela de Alunos
        const queryStudents = `CREATE TABLE IF NOT EXISTS tbAlunos (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            matricula TEXT NOT NULL,
            dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        // Tabela de Trabalhos
        const queryWorks = `CREATE TABLE IF NOT EXISTS tbTrabalhos (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            dataEntrega TEXT NOT NULL,
            horasEstimadas REAL NOT NULL,
            status TEXT NOT NULL,
            dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        // Tabela de Relação Alunos-Trabalhos
        const queryWorkStudents = `CREATE TABLE IF NOT EXISTS tbTrabalhoAlunos (
            id TEXT PRIMARY KEY,
            idTrabalho TEXT NOT NULL,
            idAluno TEXT NOT NULL,
            FOREIGN KEY(idTrabalho) REFERENCES tbTrabalhos(id),
            FOREIGN KEY(idAluno) REFERENCES tbAlunos(id)
        )`;

        // Tabela de Atividades
        const queryTasks = `CREATE TABLE IF NOT EXISTS tbAtividades (
            id TEXT PRIMARY KEY,
            idTrabalho TEXT NOT NULL,
            idAluno TEXT NOT NULL,
            descricao TEXT NOT NULL,
            horasEstimadas REAL NOT NULL,
            horasRealizadas REAL DEFAULT 0,
            status TEXT NOT NULL,
            dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(idTrabalho) REFERENCES tbTrabalhos(id),
            FOREIGN KEY(idAluno) REFERENCES tbAlunos(id)
        )`;

        await cx.execAsync(queryStudents);
        await cx.execAsync(queryWorks);
        await cx.execAsync(queryWorkStudents);
        await cx.execAsync(queryTasks);
    } finally {
        await cx.closeAsync();
    }
}

// ===== OPERAÇÕES PARA ALUNOS =====
export async function obtemTodosAlunos() {
    var retorno = [];
    var dbCx = await getDbConnection();
    try {
        const registros = await dbCx.getAllAsync('SELECT * FROM tbAlunos ORDER BY nome');
        for (const registro of registros) {
            retorno.push({
                id: registro.id,
                nome: registro.nome,
                matricula: registro.matricula
            });
        }
    } finally {
        await dbCx.closeAsync();
    }
    return retorno;
}

export async function obtemAluno(id) {
    var dbCx = await getDbConnection();
    try {
        const registro = await dbCx.getFirstAsync('SELECT * FROM tbAlunos WHERE id = ?', [id]);
        if (registro) {
            return {
                id: registro.id,
                nome: registro.nome,
                matricula: registro.matricula
            };
        }
        return null;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function adicionaAluno(aluno) {
    let dbCx = await getDbConnection();
    try {
        let query = 'INSERT INTO tbAlunos (id, nome, matricula) VALUES (?,?,?)';
        const result = await dbCx.runAsync(query, [aluno.id, aluno.nome, aluno.matricula]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function alteraAluno(aluno) {
    let dbCx = await getDbConnection();
    try {
        let query = 'UPDATE tbAlunos SET nome=?, matricula=? WHERE id=?';
        const result = await dbCx.runAsync(query, [aluno.nome, aluno.matricula, aluno.id]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function excluiAluno(id) {
    let dbCx = await getDbConnection();
    try {
        // Primeiro remove associações
        await dbCx.runAsync('DELETE FROM tbTrabalhoAlunos WHERE idAluno=?', [id]);
        // Remove atividades do aluno
        await dbCx.runAsync('DELETE FROM tbAtividades WHERE idAluno=?', [id]);
        // Depois remove o aluno
        const result = await dbCx.runAsync('DELETE FROM tbAlunos WHERE id=?', [id]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

// ===== OPERAÇÕES PARA TRABALHOS =====
export async function obtemTodosTrabalhos() {
    var retorno = [];
    var dbCx = await getDbConnection();
    try {
        const registros = await dbCx.getAllAsync('SELECT * FROM tbTrabalhos ORDER BY dataEntrega');
        for (const registro of registros) {
            retorno.push({
                id: registro.id,
                nome: registro.nome,
                dataEntrega: registro.dataEntrega,
                horasEstimadas: registro.horasEstimadas,
                status: registro.status
            });
        }
    } finally {
        await dbCx.closeAsync();
    }
    return retorno;
}

export async function obtemTrabalho(id) {
    var dbCx = await getDbConnection();
    try {
        const registro = await dbCx.getFirstAsync('SELECT * FROM tbTrabalhos WHERE id = ?', [id]);
        if (registro) {
            return {
                id: registro.id,
                nome: registro.nome,
                dataEntrega: registro.dataEntrega,
                horasEstimadas: registro.horasEstimadas,
                status: registro.status
            };
        }
        return null;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function adicionaTrabalho(trabalho) {
    let dbCx = await getDbConnection();
    try {
        let query = 'INSERT INTO tbTrabalhos (id, nome, dataEntrega, horasEstimadas, status) VALUES (?,?,?,?,?)';
        const result = await dbCx.runAsync(query, [
            trabalho.id,
            trabalho.nome,
            trabalho.dataEntrega,
            trabalho.horasEstimadas,
            trabalho.status
        ]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function alteraTrabalho(trabalho) {
    let dbCx = await getDbConnection();
    try {
        let query = 'UPDATE tbTrabalhos SET nome=?, dataEntrega=?, horasEstimadas=?, status=? WHERE id=?';
        const result = await dbCx.runAsync(query, [
            trabalho.nome,
            trabalho.dataEntrega,
            trabalho.horasEstimadas,
            trabalho.status,
            trabalho.id
        ]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function excluiTrabalho(id) {
    let dbCx = await getDbConnection();
    try {
        // Remove atividades do trabalho
        await dbCx.runAsync('DELETE FROM tbAtividades WHERE idTrabalho=?', [id]);
        // Remove associações alunos-trabalho
        await dbCx.runAsync('DELETE FROM tbTrabalhoAlunos WHERE idTrabalho=?', [id]);
        // Remove o trabalho
        const result = await dbCx.runAsync('DELETE FROM tbTrabalhos WHERE id=?', [id]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

// ===== OPERAÇÕES PARA RELAÇÃO TRABALHO-ALUNO =====
export async function adicionaAlunoAoTrabalho(idTrabalho, idAluno) {
    let dbCx = await getDbConnection();
    try {
        const id = Date.now().toString();
        const result = await dbCx.runAsync(
            'INSERT INTO tbTrabalhoAlunos (id, idTrabalho, idAluno) VALUES (?,?,?)',
            [id, idTrabalho, idAluno]
        );
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function obtemAlunosDoTrabalho(idTrabalho) {
    var retorno = [];
    var dbCx = await getDbConnection();
    try {
        const registros = await dbCx.getAllAsync(
            'SELECT a.* FROM tbAlunos a INNER JOIN tbTrabalhoAlunos ta ON a.id = ta.idAluno WHERE ta.idTrabalho = ?',
            [idTrabalho]
        );
        for (const registro of registros) {
            retorno.push({
                id: registro.id,
                nome: registro.nome,
                matricula: registro.matricula
            });
        }
    } finally {
        await dbCx.closeAsync();
    }
    return retorno;
}

export async function removeAlunoDoTrabalho(idTrabalho, idAluno) {
    let dbCx = await getDbConnection();
    try {
        const result = await dbCx.runAsync(
            'DELETE FROM tbTrabalhoAlunos WHERE idTrabalho=? AND idAluno=?',
            [idTrabalho, idAluno]
        );
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

// ===== OPERAÇÕES PARA ATIVIDADES =====
export async function obtemAtividadesDoTrabalho(idTrabalho) {
    var retorno = [];
    var dbCx = await getDbConnection();
    try {
        const registros = await dbCx.getAllAsync(
            'SELECT * FROM tbAtividades WHERE idTrabalho = ? ORDER BY descricao',
            [idTrabalho]
        );
        for (const registro of registros) {
            retorno.push({
                id: registro.id,
                idTrabalho: registro.idTrabalho,
                idAluno: registro.idAluno,
                descricao: registro.descricao,
                horasEstimadas: registro.horasEstimadas,
                horasRealizadas: registro.horasRealizadas,
                status: registro.status
            });
        }
    } finally {
        await dbCx.closeAsync();
    }
    return retorno;
}

export async function adicionaAtividade(atividade) {
    let dbCx = await getDbConnection();
    try {
        let query = `INSERT INTO tbAtividades 
            (id, idTrabalho, idAluno, descricao, horasEstimadas, horasRealizadas, status) 
            VALUES (?,?,?,?,?,?,?)`;
        const result = await dbCx.runAsync(query, [
            atividade.id,
            atividade.idTrabalho,
            atividade.idAluno,
            atividade.descricao,
            atividade.horasEstimadas,
            atividade.horasRealizadas || 0,
            atividade.status
        ]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function alteraAtividade(atividade) {
    let dbCx = await getDbConnection();
    try {
        let query = `UPDATE tbAtividades 
            SET descricao=?, horasEstimadas=?, horasRealizadas=?, status=?, idAluno=? 
            WHERE id=?`;
        const result = await dbCx.runAsync(query, [
            atividade.descricao,
            atividade.horasEstimadas,
            atividade.horasRealizadas,
            atividade.status,
            atividade.idAluno,
            atividade.id
        ]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

export async function excluiAtividade(id) {
    let dbCx = await getDbConnection();
    try {
        const result = await dbCx.runAsync('DELETE FROM tbAtividades WHERE id=?', [id]);
        return result.changes == 1;
    } finally {
        await dbCx.closeAsync();
    }
}

// ===== FUNÇÕES AUXILIARES =====
export async function obtemNomeAluno(idAluno) {
    var dbCx = await getDbConnection();
    try {
        const registro = await dbCx.getFirstAsync(
            'SELECT nome FROM tbAlunos WHERE id = ?',
            [idAluno]
        );
        return registro ? registro.nome : 'Aluno desconhecido';
    } finally {
        await dbCx.closeAsync();
    }
}

export function createUniqueId() {
    return Date.now().toString();
}
