import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList
} from 'react-native';
import * as DbService from '../services/dbservice';
import styles, { colors } from '../styles';

export default function WorksScreen() {
  const [works, setWorks] = useState([]);
  const [students, setStudents] = useState([]);
  const [id, setId] = useState(null);
  const [nome, setNome] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [status, setStatus] = useState('pendente');
  const [modalVisible, setModalVisible] = useState(false);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [workStudents, setWorkStudents] = useState([]);
  const [currentWorkId, setCurrentWorkId] = useState(null);

  useEffect(() => {
    loadWorks();
    loadStudents();
  }, []);

  async function loadWorks() {
    const data = await DbService.obtemTodosTrabalhos();
    setWorks(data);
  }

  async function loadStudents() {
    const data = await DbService.obtemTodosAlunos();
    setStudents(data);
  }

  async function loadWorkStudents(workId) {
    const data = await DbService.obtemAlunosDoTrabalho(workId);
    setWorkStudents(data);
  }

  function createUniqueId() {
    return Date.now().toString();
  }

  function resetForm() {
    setId(null);
    setNome('');
    setDataEntrega('');
    setHorasEstimadas('');
    setStatus('pendente');
  }

  async function saveWork() {
    if (!nome.trim() || !dataEntrega.trim() || !horasEstimadas.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const work = {
      id: id || createUniqueId(),
      nome: nome.trim(),
      dataEntrega: dataEntrega.trim(),
      horasEstimadas: parseFloat(horasEstimadas),
      status,
    };

    try {
      let success = false;
      if (id) {
        success = await DbService.alteraTrabalho(work);
      } else {
        success = await DbService.adicionaTrabalho(work);
      }

      if (success) {
        Alert.alert('Sucesso', id ? 'Trabalho atualizado!' : 'Trabalho adicionado!');
        resetForm();
        setModalVisible(false);
        loadWorks();
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar trabalho: ' + error.message);
    }
  }

  function editWork(work) {
    setId(work.id);
    setNome(work.nome);
    setDataEntrega(work.dataEntrega);
    setHorasEstimadas(work.horasEstimadas.toString());
    setStatus(work.status);
    setModalVisible(true);
  }

  async function deleteWork(workId) {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir este trabalho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const success = await DbService.excluiTrabalho(workId);
              if (success) {
                Alert.alert('Sucesso', 'Trabalho excluído!');
                loadWorks();
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir trabalho');
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

  function openStudentModal(workId) {
    setCurrentWorkId(workId);
    loadWorkStudents(workId);
    setStudentModalVisible(true);
  }

  async function addStudentToWork(studentId) {
    try {
      const success = await DbService.adicionaAlunoAoTrabalho(currentWorkId, studentId);
      if (success) {
        Alert.alert('Sucesso', 'Aluno adicionado ao trabalho!');
        loadWorkStudents(currentWorkId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Este aluno já está no trabalho');
    }
  }

  async function removeStudentFromWork(workId, studentId) {
    try {
      const success = await DbService.removeAlunoDoTrabalho(workId, studentId);
      if (success) {
        loadWorkStudents(workId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao remover aluno');
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'concluído':
        return colors.success;
      case 'cancelado':
        return colors.error;
      default:
        return colors.warn;
    }
  }

  const renderWork = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.text}>{item.nome}</Text>
          <Text style={styles.textSecondary}>Entrega: {item.dataEntrega}</Text>
          <Text style={styles.textSecondary}>
            Horas: {item.horasEstimadas}h
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={[styles.buttonContainer, { marginTop: 8 }]}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.secondary, flex: 1 }]}
          onPress={() => openStudentModal(item.id)}
        >
          <Text style={styles.smallButtonText}>Alunos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.primary, flex: 1 }]}
          onPress={() => editWork(item)}
        >
          <Text style={styles.smallButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.error, flex: 1 }]}
          onPress={() => deleteWork(item.id)}
        >
          <Text style={styles.smallButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStudent = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemText}>
        <Text style={styles.text}>{item.nome}</Text>
      </View>
      <TouchableOpacity
        style={[styles.smallButton, { backgroundColor: colors.error }]}
        onPress={() => removeStudentFromWork(currentWorkId, item.id)}
      >
        <Text style={styles.smallButtonText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.title}>Gerenciar Trabalhos</Text>
        <TouchableOpacity style={styles.button} onPress={openAddModal}>
          <Text style={styles.buttonText}>+ Novo Trabalho</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de trabalhos */}
      {works.length > 0 ? (
        <FlatList
          data={works}
          renderItem={renderWork}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={styles.textSecondary}>Nenhum trabalho cadastrado</Text>
        </View>
      )}

      {/* Modal para adicionar/editar trabalho */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <View style={[styles.modalView, { width: '90%' }]}>
              <Text style={styles.subtitle}>
                {id ? 'Editar Trabalho' : 'Novo Trabalho'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome do Trabalho</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome do trabalho"
                  placeholderTextColor={colors.textSecondary}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Data de Entrega</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.textSecondary}
                  value={dataEntrega}
                  onChangeText={setDataEntrega}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Horas Estimadas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite as horas"
                  placeholderTextColor={colors.textSecondary}
                  value={horasEstimadas}
                  onChangeText={setHorasEstimadas}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Status</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['pendente', 'concluído', 'cancelado'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor:
                            status === s ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={styles.buttonText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                  onPress={saveWork}
                >
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para gerenciar alunos do trabalho */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={studentModalVisible}
        onRequestClose={() => setStudentModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { width: '95%', height: '80%' }]}>
            <Text style={styles.subtitle}>Alunos do Trabalho</Text>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Alunos Registrados:
            </Text>
            {workStudents.length > 0 ? (
              <FlatList
                data={workStudents}
                renderItem={renderStudent}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={{ maxHeight: 150 }}
              />
            ) : (
              <Text style={styles.textSecondary}>
                Nenhum aluno adicionado
              </Text>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>
              Adicionar Aluno:
            </Text>
            <FlatList
              data={students.filter(
                (s) => !workStudents.find((ws) => ws.id === s.id)
              )}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.text}>{item.nome}</Text>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: colors.success }]}
                    onPress={() => addStudentToWork(item.id)}
                  >
                    <Text style={styles.smallButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />

            <TouchableOpacity
              style={[styles.button, { marginTop: 16 }]}
              onPress={() => setStudentModalVisible(false)}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
