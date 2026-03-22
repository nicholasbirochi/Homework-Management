import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles, { colors } from '../styles';
import {
  createId,
  deleteActivity,
  getActivitiesByWork,
  getWorks,
  getWorkStudents,
  insertActivity,
  updateActivity,
} from '../services/db';

const activityStatuses = ['pendente', 'concluída', 'cancelada'];

export default function ProgressScreen() {
  const [works, setWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workStudents, setWorkStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [completedHours, setCompletedHours] = useState('0');
  const [status, setStatus] = useState('pendente');

  const loadWorks = async () => {
    // Carrega os trabalhos disponiveis e ajusta a selecao atual quando necessario.
    const result = await getWorks();
    setWorks(result);

    const hasSelected = result.some((item) => item.id === selectedWorkId);
    if (!hasSelected && result.length > 0) {
      setSelectedWorkId(result[0].id);
    }

    if (result.length === 0) {
      setSelectedWorkId(null);
    }
  };

  const loadCurrentWorkData = async (workId) => {
    // Busca em paralelo as atividades e os alunos vinculados ao trabalho escolhido.
    if (!workId) {
      setTasks([]);
      setWorkStudents([]);
      return;
    }

    const [activities, students] = await Promise.all([
      getActivitiesByWork(workId),
      getWorkStudents(workId),
    ]);

    setTasks(activities);
    setWorkStudents(students);
  };

  useFocusEffect(
    useCallback(() => {
      loadWorks();
    }, [selectedWorkId])
  );

  useFocusEffect(
    useCallback(() => {
      loadCurrentWorkData(selectedWorkId);
    }, [selectedWorkId])
  );

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) || null,
    [works, selectedWorkId]
  );

  const summary = useMemo(() => {
    // Resume o avanco total para alimentar o cartao de progresso do trabalho.
    const estimated = tasks.reduce((sum, item) => sum + Number(item.estimated_hours || 0), 0);
    const completed = tasks.reduce((sum, item) => sum + Number(item.completed_hours || 0), 0);
    const percent = estimated > 0 ? Math.min((completed / estimated) * 100, 100) : 0;
    return { estimated, completed, percent };
  }, [tasks]);

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setStudentId('');
    setEstimatedHours('');
    setCompletedHours('0');
    setStatus('pendente');
  };

  const openCreate = () => {
    // So permite cadastrar atividade quando existir um trabalho e alunos associados.
    if (!selectedWorkId) {
      Alert.alert('Atenção', 'Selecione um trabalho primeiro.');
      return;
    }

    if (workStudents.length === 0) {
      Alert.alert('Atenção', 'Vincule alunos ao trabalho antes de cadastrar atividades.');
      return;
    }

    resetForm();
    setStudentId(workStudents[0]?.id || '');
    setModalVisible(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setDescription(task.description);
    setStudentId(task.student_id);
    setEstimatedHours(String(task.estimated_hours));
    setCompletedHours(String(task.completed_hours));
    setStatus(task.status);
    setModalVisible(true);
  };

  const saveTask = async () => {
    // Normaliza os valores do formulario antes de persistir a atividade.
    if (!description.trim() || !estimatedHours.trim() || !studentId) {
      Alert.alert('Validação', 'Informe descrição, aluno e horas estimadas.');
      return;
    }

    const estimated = Number(estimatedHours);
    const completed = Number(completedHours || 0);

    if (Number.isNaN(estimated) || estimated <= 0) {
      Alert.alert('Validação', 'As horas estimadas devem ser maiores que zero.');
      return;
    }

    if (Number.isNaN(completed) || completed < 0) {
      Alert.alert('Validação', 'As horas concluídas não podem ser negativas.');
      return;
    }

    const activity = {
      id: editingId || createId('activity'),
      work_id: selectedWorkId,
      student_id: studentId,
      description: description.trim(),
      estimated_hours: estimated,
      completed_hours: completed,
      status,
    };

    try {
      const ok = editingId ? await updateActivity(activity) : await insertActivity(activity);
      if (ok) {
        setModalVisible(false);
        resetForm();
        await loadCurrentWorkData(selectedWorkId);
        await loadWorks();
      }
    } catch (error) {
      Alert.alert('Erro', `Não foi possível salvar a atividade. ${error.message}`);
    }
  };

  const confirmDelete = (task) => {
    Alert.alert(
      'Excluir atividade',
      `Deseja remover a atividade "${task.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(task.id);
              await loadCurrentWorkData(selectedWorkId);
              await loadWorks();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a atividade.');
            }
          },
        },
      ]
    );
  };

  const statusColor = (value) => {
    if (value === 'concluída') return colors.success;
    if (value === 'cancelada') return colors.error;
    return colors.warning;
  };

  const renderWorkSelector = ({ item }) => {
    const active = item.id === selectedWorkId;
    return (
      <TouchableOpacity
        style={[styles.pill, active && styles.pillActive, { marginRight: 8 }]}
        onPress={() => setSelectedWorkId(item.id)}
      >
        <Text style={styles.pillText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderTask = ({ item }) => {
    // Calcula o percentual individual para exibir a barra de cada atividade.
    const percent = item.estimated_hours > 0
      ? Math.min((Number(item.completed_hours) / Number(item.estimated_hours)) * 100, 100)
      : 0;

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.strongText}>{item.description}</Text>
            <Text style={styles.mutedText}>Aluno responsável: {item.student_name || 'Não identificado'}</Text>
            <Text style={styles.mutedText}>
              {item.completed_hours}h concluídas de {item.estimated_hours}h
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}> 
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={[styles.mutedText, { marginTop: 8 }]}>{percent.toFixed(0)}% concluído</Text>

        <View style={[styles.row, { marginTop: 12 }]}> 
          <TouchableOpacity
            style={[styles.smallButton, styles.button, { flex: 1 }]}
            onPress={() => openEdit(item)}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.buttonDanger, { flex: 1 }]}
            onPress={() => confirmDelete(item)}
          >
            <Text style={styles.buttonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <Text style={styles.title}>Andamento das Atividades</Text>
        <Text style={styles.helper}>Escolha um trabalho e informe horas realizadas e situação das atividades.</Text>

        {works.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.mutedText}>Cadastre um trabalho antes de gerenciar o andamento.</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Trabalho selecionado</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={works}
                keyExtractor={(item) => item.id}
                renderItem={renderWorkSelector}
              />
            </View>

            {selectedWork && (
              <View style={styles.card}>
                <Text style={styles.strongText}>{selectedWork.name}</Text>
                <Text style={styles.mutedText}>Entrega: {selectedWork.due_date}</Text>
                <Text style={styles.mutedText}>Progresso total das atividades: {summary.completed}h / {summary.estimated}h</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${summary.percent}%` }]} />
                </View>
                <Text style={[styles.mutedText, { marginTop: 8 }]}>{summary.percent.toFixed(0)}% concluído</Text>
              </View>
            )}

            <View style={[styles.row, { marginBottom: 12 }]}> 
              <Text style={styles.subtitle}>CRUD de Atividades</Text>
              <TouchableOpacity style={[styles.smallButton, styles.buttonSuccess]} onPress={openCreate}>
                <Text style={styles.buttonText}>+ Atividade</Text>
              </TouchableOpacity>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.mutedText}>Nenhuma atividade cadastrada para este trabalho.</Text>
              </View>
            ) : (
              <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                contentContainerStyle={styles.listGap}
              />
            )}
          </>
        )}

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <View style={styles.modalCard}>
                <Text style={styles.subtitle}>{editingId ? 'Editar atividade' : 'Nova atividade'}</Text>

                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex.: Criar capa do trabalho"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                <Text style={styles.label}>Aluno responsável</Text>
                <View style={[styles.wrapRow, { marginBottom: 12 }]}> 
                  {workStudents.map((student) => {
                    const active = student.id === studentId;
                    return (
                      <TouchableOpacity
                        key={student.id}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => setStudentId(student.id)}
                      >
                        <Text style={styles.pillText}>{student.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Horas estimadas</Text>
                <TextInput
                  style={styles.input}
                  value={estimatedHours}
                  onChangeText={setEstimatedHours}
                  placeholder="Ex.: 4"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Horas já desenvolvidas</Text>
                <TextInput
                  style={styles.input}
                  value={completedHours}
                  onChangeText={setCompletedHours}
                  placeholder="Ex.: 2"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Situação da atividade</Text>
                <View style={[styles.wrapRow, { marginBottom: 12 }]}> 
                  {activityStatuses.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pill, status === item && styles.pillActive]}
                      onPress={() => setStatus(item)}
                    >
                      <Text style={styles.pillText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonOutline, { flex: 1 }]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSuccess, { flex: 1 }]}
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
    </SafeAreaView>
  );
}
