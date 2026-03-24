# Homework Management Mobile

Aplicativo de estudo para organizar alunos, trabalhos escolares e atividades. Usa React Native com Expo e guarda os registros localmente em SQLite; as telas de andamento e gráficos ajudam a acompanhar o que falta concluir.

## Requisitos atendidos

- CRUD de alunos
- CRUD de trabalhos
- Relação de alunos por trabalho
- CRUD de atividades por trabalho
- Tela para informar andamento das atividades
- Tela de gráfico com total de horas e percentual concluído
- Dados persistidos localmente em SQLite
- Interface estilizada

## Estrutura mínima do projeto

```text
homework-management-mobile/
├── App.js
├── app.json
├── babel.config.js
├── package.json
├── styles.js
├── readme.md
├── services/
│   └── db.js
└── screens/
    ├── StudentsScreen.js
    ├── WorksScreen.js
    ├── ProgressScreen.js
    └── ChartsScreen.js
```

## Instalação

```bash
npm install
npx expo start
```

## Observações

- Não enviar `node_modules` para o Moodle.
- O banco é criado automaticamente no primeiro uso.
- O projeto foi enxugado para conter apenas os arquivos realmente necessários para execução e apresentação.

## Licença

Código e documentação autorais sob [MIT](license).
