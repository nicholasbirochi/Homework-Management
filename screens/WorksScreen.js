import React, { useCallback, useState } from 'react';
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
  deleteWork,
  getStudents,
  getWorks,
  getWorkStudentIds,
  insertWork,
  replaceWorkStudents,
  updateWork,
} from '../services/db';

const workStatuses = ['pendente', 'concluído', 'cancelado'];

export default function WorksScreen() {
  const [works, setWorks] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [status, setStatus] = useState('pendente');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const loadData = async () => {
    // Busca trabalhos e alunos juntos para abastecer a listagem e o formulario.
    const [worksResult, studentsResult] = await Promise.all([getWorks(), getStudents()]);
    setWorks(worksResult);
    setStudents(studentsResult);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDueDate('');
    setEstimatedHours('');
    setStatus('pendente');
    setSelectedStudentIds([]);
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = async (work) => {
    // Recarrega os alunos vinculados para preencher corretamente a edicao do trabalho.
    const studentIds = await getWorkStudentIds(work.id);
    setEditingId(work.id);
    setName(work.name);
    setDueDate(work.due_date);
    setEstimatedHours(String(work.estimated_hours));
    setStatus(work.status);
    setSelectedStudentIds(studentIds);
    setModalVisible(true);
  };

  const toggleStudent = (studentId) => {
    // Adiciona ou remove o aluno da selecao atual do trabalho.
    setSelectedStudentIds((current) => (
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    ));
  };

  const validate = () => {
    if (!name.trim() || !dueDate.trim() || !estimatedHours.trim()) {
      Alert.alert('Validação', 'Informe nome, data de entrega e horas estimadas.');
      return false;
    }

    if (Number.isNaN(Number(estimatedHours)) || Number(estimatedHours) <= 0) {
      Alert.alert('Validação', 'As horas estimadas devem ser maiores que zero.');
      return false;
    }

    if (selectedStudentIds.length === 0) {
      Alert.alert('Validação', 'Selecione pelo menos um aluno para o trabalho.');
      return false;
    }

    return true;
  };

  const saveWork = async () => {
    // Salva o trabalho e, em seguida, sincroniza os alunos participantes escolhidos.
    if (!validate()) {
      return;
    }

    const work = {
      id: editingId || createId('work'),
      name: name.trim(),
      due_date: dueDate.trim(),
      estimated_hours: Number(estimatedHours),
      status,
    };

    try {
      const ok = editingId ? await updateWork(work) : await insertWork(work);
      if (ok) {
        await replaceWorkStudents(work.id, selectedStudentIds);
        setModalVisible(false);
        resetForm();
        await loadData();
      }
    } catch (error) {
      Alert.alert('Erro', `Não foi possível salvar o trabalho. ${error.message}`);
    }
  };

  const confirmDelete = (work) => {
    Alert.alert(
      'Excluir trabalho',
      `Deseja remover "${work.name}"? As atividades ligadas a ele também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWork(work.id);
              await loadData();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o trabalho.');
            }
          },
        },
      ]
    );
  };

  const statusColor = (value) => {
    if (value === 'concluído') return colors.success;
    if (value === 'cancelado') return colors.error;
    return colors.warning;
  };

  const renderWork = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.strongText}>{item.name}</Text>
          <Text style={styles.mutedText}>Entrega: {item.due_date}</Text>
          <Text style={styles.mutedText}>Horas estimadas: {item.estimated_hours}h</Text>
          <Text style={styles.mutedText}>Alunos: {item.students_count} | Atividades: {item.activities_count}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}> 
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      {/* Controles de manutencao do trabalho selecionado na lista. */}
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <Text style={styles.title}>CRUD de Trabalhos</Text>
        <Text style={styles.helper}>Cadastre o trabalho, vincule os alunos participantes e acompanhe sua situação.</Text>

        <TouchableOpacity style={[styles.button, { marginBottom: 16 }]} onPress={openCreate}>
          <Text style={styles.buttonText}>+ Novo trabalho</Text>
        </TouchableOpacity>

        {works.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.mutedText}>Nenhum trabalho cadastrado.</Text>
          </View>
        ) : (
          <FlatList
            data={works}
            keyExtractor={(item) => item.id}
            renderItem={renderWork}
            contentContainerStyle={styles.listGap}
          />
        )}

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <View style={styles.modalCard}>
                <Text style={styles.subtitle}>{editingId ? 'Editar trabalho' : 'Novo trabalho'}</Text>

                <Text style={styles.label}>Nome do trabalho</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex.: Trabalho de Cálculo"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.label}>Data de entrega</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="Ex.: 24/03/2026"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.label}>Estimativa total de horas</Text>
                <TextInput
                  style={styles.input}
                  value={estimatedHours}
                  onChangeText={setEstimatedHours}
                  placeholder="Ex.: 12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Situação do trabalho</Text>
                <View style={[styles.wrapRow, { marginBottom: 12 }]}> 
                  {workStatuses.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pill, status === item && styles.pillActive]}
                      onPress={() => setStatus(item)}
                    >
                      <Text style={styles.pillText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Alunos do trabalho</Text>
                {/* Permite montar a equipe do trabalho diretamente no cadastro. */}
                {students.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.mutedText}>Cadastre alunos antes de criar um trabalho.</Text>
                  </View>
                ) : (
                  <View style={[styles.wrapRow, { marginBottom: 12 }]}> 
                    {students.map((student) => {
                      const active = selectedStudentIds.includes(student.id);
                      return (
                        <TouchableOpacity
                          key={student.id}
                          style={[styles.pill, active && styles.pillActive]}
                          onPress={() => toggleStudent(student.id)}
                        >
                          <Text style={styles.pillText}>{student.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

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
                    onPress={saveWork}
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
