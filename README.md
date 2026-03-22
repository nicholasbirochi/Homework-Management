# Homework Management Mobile

**GitHub description:** N2 - Homework Management mobile app built with React Native, Expo and SQLite for managing students, school works, activities, progress and charts.

Aplicação mobile desenvolvida em React Native + Expo com persistência em SQLite para controlar trabalhos escolares.

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
├── README.md
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
