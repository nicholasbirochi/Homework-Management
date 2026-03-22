import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList
} from 'react-native';
import * as DbService from '../services/dbservice';
import styles, { colors } from '../styles';

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [id, setId] = useState(null);
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const data = await DbService.obtemTodosAlunos();
    setStudents(data);
  }

  function createUniqueId() {
    return Date.now().toString();
  }

  function resetForm() {
    setId(null);
    setNome('');
    setMatricula('');
  }

  async function saveStudent() {
    if (!nome.trim() || !matricula.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const student = {
      id: id || createUniqueId(),
      nome: nome.trim(),
      matricula: matricula.trim(),
    };

    try {
      let success = false;
      if (id) {
        success = await DbService.alteraAluno(student);
      } else {
        success = await DbService.adicionaAluno(student);
      }

      if (success) {
        Alert.alert('Sucesso', id ? 'Aluno atualizado!' : 'Aluno adicionado!');
        resetForm();
        setModalVisible(false);
        loadStudents();
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar aluno: ' + error.message);
    }
  }

  function editStudent(student) {
    setId(student.id);
    setNome(student.nome);
    setMatricula(student.matricula);
    setModalVisible(true);
  }

  async function deleteStudent(studentId) {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir este aluno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const success = await DbService.excluiAluno(studentId);
              if (success) {
                Alert.alert('Sucesso', 'Aluno excluído!');
                loadStudents();
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir aluno');
            }
          },
        },
      ]
    );
  }

  function openAddModal() {
    resetForm();
    setModalVisible(true);
  }

  const renderStudent = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemText}>
        <Text style={styles.text}>{item.nome}</Text>
        <Text style={styles.textSecondary}>Matrícula: {item.matricula}</Text>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.primary }]}
          onPress={() => editStudent(item)}
        >
          <Text style={styles.smallButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.error }]}
          onPress={() => deleteStudent(item.id)}
        >
          <Text style={styles.smallButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.title}>Gerenciar Alunos</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={openAddModal}
        >
          <Text style={styles.buttonText}>+ Novo Aluno</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de alunos */}
      {students.length > 0 ? (
        <FlatList
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={styles.textSecondary}>Nenhum aluno cadastrado</Text>
        </View>
      )}

      {/* Modal para adicionar/editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { width: '90%' }]}>
            <Text style={styles.subtitle}>
              {id ? 'Editar Aluno' : 'Novo Aluno'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do aluno"
                placeholderTextColor={colors.textSecondary}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Matrícula</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite a matrícula"
                placeholderTextColor={colors.textSecondary}
                value={matricula}
                onChangeText={setMatricula}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSuccess]}
                onPress={saveStudent}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
