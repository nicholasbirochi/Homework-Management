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
  deleteStudent,
  getStudents,
  insertStudent,
  updateStudent,
} from '../services/db';

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');

  const loadStudents = async () => {
    // Atualiza a lista sempre a partir do banco para refletir o estado mais recente.
    const result = await getStudents();
    setStudents(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRegistration('');
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setName(student.name);
    setRegistration(student.registration);
    setModalVisible(true);
  };

  const saveStudent = async () => {
    // Valida os campos antes de decidir entre criacao ou edicao do aluno.
    if (!name.trim() || !registration.trim()) {
      Alert.alert('Validação', 'Informe nome e matrícula do aluno.');
      return;
    }

    const student = {
      id: editingId || createId('student'),
      name: name.trim(),
      registration: registration.trim(),
    };

    try {
      const ok = editingId ? await updateStudent(student) : await insertStudent(student);
      if (ok) {
        setModalVisible(false);
        resetForm();
        await loadStudents();
      }
    } catch (error) {
      Alert.alert('Erro', `Não foi possível salvar o aluno. ${error.message}`);
    }
  };

  const confirmDelete = (student) => {
    // Pede confirmacao porque a exclusao tambem afeta vinculos e atividades relacionadas.
    Alert.alert(
      'Excluir aluno',
      `Deseja remover ${student.name}? As relações com trabalhos e atividades também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              await loadStudents();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o aluno.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.strongText}>{item.name}</Text>
          <Text style={styles.mutedText}>Matrícula: {item.registration}</Text>
        </View>
      </View>

      {/* Acoes principais disponiveis para cada aluno listado. */}
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
        <Text style={styles.title}>CRUD de Alunos</Text>
        <Text style={styles.helper}>Cadastre, edite e remova os alunos que participarão dos trabalhos.</Text>

        <TouchableOpacity style={[styles.button, { marginBottom: 16 }]} onPress={openCreate}>
          <Text style={styles.buttonText}>+ Novo aluno</Text>
        </TouchableOpacity>

        {students.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.mutedText}>Nenhum aluno cadastrado.</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listGap}
          />
        )}

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <View style={styles.modalCard}>
                {/* O mesmo formulario atende criacao e edicao de aluno. */}
                <Text style={styles.subtitle}>{editingId ? 'Editar aluno' : 'Novo aluno'}</Text>

                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex.: Ana Souza"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.label}>Matrícula</Text>
                <TextInput
                  style={styles.input}
                  value={registration}
                  onChangeText={setRegistration}
                  placeholder="Ex.: 202600123"
                  placeholderTextColor={colors.textMuted}
                />

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
                    onPress={saveStudent}
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
