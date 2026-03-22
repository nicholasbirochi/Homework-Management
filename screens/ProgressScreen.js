import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, Modal, FlatList, TextInput
} from 'react-native';
import * as DbService from '../services/dbservice';
import styles, { colors } from '../styles';

export default function ProgressScreen() {
  const [works, setWorks] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  
  const [taskId, setTaskId] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [horasRealizadas, setHorasRealizadas] = useState('');
  const [taskStatus, setTaskStatus] = useState('pendente');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [workStudents, setWorkStudents] = useState([]);

  useEffect(() => {
    loadWorks();
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedWorkId) {
      loadTasks(selectedWorkId);
      loadWorkStudents(selectedWorkId);
    }
  }, [selectedWorkId]);

  async function loadWorks() {
    const data = await DbService.obtemTodosTrabalhos();
    setWorks(data);
  }

  async function loadStudents() {
    const data = await DbService.obtemTodosAlunos();
    setStudents(data);
  }

  async function loadTasks(workId) {
    const data = await DbService.obtemAtividadesDoTrabalho(workId);
    setTasks(data);
  }

  async function loadWorkStudents(workId) {
    const data = await DbService.obtemAlunosDoTrabalho(workId);
    setWorkStudents(data);
  }

  function createUniqueId() {
    return Date.now().toString();
  }

  function resetTaskForm() {
    setTaskId(null);
    setDescricao('');
    setHorasEstimadas('');
    setHorasRealizadas('');
    setTaskStatus('pendente');
    setSelectedAluno(null);
  }

  async function saveTask() {
    if (!descricao.trim() || !horasEstimadas.trim() || !selectedAluno) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione um aluno');
      return;
    }

    const task = {
      id: taskId || createUniqueId(),
      idTrabalho: selectedWorkId,
      idAluno: selectedAluno,
      descricao: descricao.trim(),
      horasEstimadas: parseFloat(horasEstimadas),
      horasRealizadas: parseFloat(horasRealizadas || '0'),
      status: taskStatus,
    };

    try {
      let success = false;
      if (taskId) {
        success = await DbService.alteraAtividade(task);
      } else {
        success = await DbService.adicionaAtividade(task);
      }

      if (success) {
        Alert.alert('Sucesso', taskId ? 'Atividade atualizada!' : 'Atividade adicionada!');
        resetTaskForm();
        setTaskModalVisible(false);
        loadTasks(selectedWorkId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar atividade: ' + error.message);
    }
  }

  function editTask(task) {
    setTaskId(task.id);
    setDescricao(task.descricao);
    setHorasEstimadas(task.horasEstimadas.toString());
    setHorasRealizadas(task.horasRealizadas.toString());
    setTaskStatus(task.status);
    setSelectedAluno(task.idAluno);
    setTaskModalVisible(true);
  }

  async function deleteTask(taskId) {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir esta atividade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const success = await DbService.excluiAtividade(taskId);
              if (success) {
                Alert.alert('Sucesso', 'Atividade excluída!');
                loadTasks(selectedWorkId);
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir atividade');
            }
          },
        },
      ]
    );
  }

  function openAddTaskModal() {
    resetTaskForm();
    setTaskModalVisible(true);
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

  const renderTask = ({ item }) => {
    const percentage = item.horasEstimadas > 0 
      ? Math.min((item.horasRealizadas / item.horasEstimadas) * 100, 100)
      : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>{item.descricao}</Text>
            <Text style={styles.textSecondary}>
              Aluno: {workStudents.find(s => s.id === item.idAluno)?.nome || 'Desconhecido'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.cardRow}>
            <Text style={styles.textSecondary}>
              {item.horasRealizadas}h / {item.horasEstimadas}h
            </Text>
            <Text style={styles.textSecondary}>{percentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => editTask(item)}
          >
            <Text style={styles.smallButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: colors.error, flex: 1 }]}
            onPress={() => deleteTask(item.id)}
          >
            <Text style={styles.smallButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Andamento de Atividades</Text>

      {/* Seleção de Trabalho */}
      {works.length > 0 ? (
        <View>
          <Text style={styles.label}>Selecione um Trabalho:</Text>
          <FlatList
            data={works}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.listItem,
                  {
                    backgroundColor:
                      selectedWorkId === item.id ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setSelectedWorkId(item.id)}
              >
                <Text style={styles.text}>{item.nome}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 0.3 }}>
          <Text style={styles.textSecondary}>Nenhum trabalho disponível</Text>
        </View>
      )}

      {/* Atividades do Trabalho Selecionado */}
      {selectedWorkId && (
        <View style={{ flex: 1, marginTop: 16 }}>
          <View style={styles.cardRow}>
            <Text style={styles.subtitle}>Atividades</Text>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: colors.success }]}
              onPress={openAddTaskModal}
            >
              <Text style={styles.smallButtonText}>+ Nova</Text>
            </TouchableOpacity>
          </View>

          {tasks.length > 0 ? (
            <FlatList
              data={tasks}
              renderItem={renderTask}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 0.5 }}>
              <Text style={styles.textSecondary}>Nenhuma atividade cadastrada</Text>
            </View>
          )}
        </View>
      )}

      {/* Modal para adicionar/editar atividade */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={taskModalVisible}
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalView, { width: '90%' }]}>
              <Text style={styles.subtitle}>
                {taskId ? 'Editar Atividade' : 'Nova Atividade'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a descrição da atividade"
                  placeholderTextColor={colors.textSecondary}
                  value={descricao}
                  onChangeText={setDescricao}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aluno</Text>
                <ScrollView
                  style={{ maxHeight: 150, marginBottom: 12 }}
                  nestedScrollEnabled
                >
                  {workStudents.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.listItem,
                        {
                          backgroundColor:
                            selectedAluno === student.id ? colors.primary : colors.surface,
                        },
                      ]}
                      onPress={() => setSelectedAluno(student.id)}
                    >
                      <Text style={styles.text}>{student.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
                <Text style={styles.label}>Horas Realizadas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite as horas realizadas"
                  placeholderTextColor={colors.textSecondary}
                  value={horasRealizadas}
                  onChangeText={setHorasRealizadas}
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
                            taskStatus === s ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setTaskStatus(s)}
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
                    resetTaskForm();
                    setTaskModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSuccess]}
                  onPress={saveTask}
                >
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
