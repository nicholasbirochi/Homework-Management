import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import styles, { colors } from '../styles';
import { getWorkChartData, getWorks } from '../services/db';

const chartWidth = 320;
const barHeight = 22;
const leftLabelWidth = 130;
const progressAreaWidth = 130;

export default function ChartsScreen() {
  const [works, setWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [chartData, setChartData] = useState({
    activities: [],
    estimatedTotal: 0,
    completedTotal: 0,
    completionPercent: 0,
  });

  const loadWorks = async () => {
    // Carrega os trabalhos e define automaticamente o primeiro como selecionado.
    const result = await getWorks();
    setWorks(result);
    if (!selectedWorkId && result.length > 0) {
      setSelectedWorkId(result[0].id);
    }
  };

  const loadChart = async (workId) => {
    // Limpa ou atualiza os dados do grafico conforme o trabalho selecionado.
    if (!workId) {
      setChartData({ activities: [], estimatedTotal: 0, completedTotal: 0, completionPercent: 0 });
      return;
    }
    const result = await getWorkChartData(workId);
    setChartData(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadWorks();
    }, [selectedWorkId])
  );

  useFocusEffect(
    useCallback(() => {
      loadChart(selectedWorkId);
    }, [selectedWorkId])
  );

  const selectedWork = useMemo(
    // Recupera o objeto completo do trabalho ativo para preencher o cabecalho da tela.
    () => works.find((work) => work.id === selectedWorkId) || null,
    [works, selectedWorkId]
  );

  // Ajusta a altura do SVG de acordo com a quantidade de atividades exibidas.
  const chartHeight = Math.max(chartData.activities.length * 48 + 20, 90);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.listGap}>
        <Text style={styles.title}>Gráfico das Atividades</Text>
        <Text style={styles.helper}>Visualize horas totais e percentual concluído de cada atividade e do trabalho inteiro.</Text>

        {works.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.mutedText}>Cadastre um trabalho para visualizar o gráfico.</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Escolha um trabalho</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={works}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const active = item.id === selectedWorkId;
                  return (
                    <TouchableOpacity
                      style={[styles.pill, active && styles.pillActive, { marginRight: 8 }]}
                      onPress={() => setSelectedWorkId(item.id)}
                    >
                      <Text style={styles.pillText}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {selectedWork && (
              <View style={styles.card}>
                <Text style={styles.strongText}>{selectedWork.name}</Text>
                <Text style={styles.mutedText}>Entrega: {selectedWork.due_date}</Text>
                <Text style={styles.mutedText}>Horas do trabalho: {chartData.completedTotal}h / {chartData.estimatedTotal}h</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${chartData.completionPercent}%` }]} />
                </View>
                <Text style={[styles.mutedText, { marginTop: 8 }]}>
                  Percentual concluído do trabalho: {chartData.completionPercent.toFixed(0)}%
                </Text>
              </View>
            )}

            {chartData.activities.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.mutedText}>Este trabalho ainda não possui atividades cadastradas.</Text>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.subtitle}>Horas por atividade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <Svg width={chartWidth} height={chartHeight}>
                    {chartData.activities.map((activity, index) => {
                      // Cada linha combina rotulo, trilha e preenchimento proporcional ao progresso.
                      const y = 20 + index * 48;
                      const estimated = Number(activity.estimated_hours || 0);
                      const completed = Number(activity.completed_hours || 0);
                      const percent = estimated > 0 ? Math.min((completed / estimated) * 100, 100) : 0;
                      const fillWidth = (percent / 100) * progressAreaWidth;

                      return (
                        <React.Fragment key={activity.id}>
                          <SvgText x={0} y={y + 14} fill={colors.text} fontSize="11" fontWeight="700">
                            {activity.description.length > 18
                              ? `${activity.description.slice(0, 18)}...`
                              : activity.description}
                          </SvgText>
                          <Rect
                            x={leftLabelWidth}
                            y={y}
                            rx={8}
                            ry={8}
                            width={progressAreaWidth}
                            height={barHeight}
                            fill={colors.surfaceAlt}
                          />
                          <Rect
                            x={leftLabelWidth}
                            y={y}
                            rx={8}
                            ry={8}
                            width={fillWidth}
                            height={barHeight}
                            fill={colors.success}
                          />
                          <SvgText
                            x={leftLabelWidth + progressAreaWidth + 12}
                            y={y + 14}
                            fill={colors.textMuted}
                            fontSize="11"
                          >
                            {`${completed}h / ${estimated}h (${percent.toFixed(0)}%)`}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </ScrollView>

                <View style={styles.divider} />

                {chartData.activities.map((activity) => {
                  const estimated = Number(activity.estimated_hours || 0);
                  const completed = Number(activity.completed_hours || 0);
                  const percent = estimated > 0 ? Math.min((completed / estimated) * 100, 100) : 0;
                  return (
                    <View key={activity.id} style={{ marginBottom: 10 }}>
                      <Text style={styles.strongText}>{activity.description}</Text>
                      <Text style={styles.mutedText}>
                        Responsável: {activity.student_name || 'Não identificado'} | {completed}h / {estimated}h | {percent.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
