import { StyleSheet } from 'react-native';

const colors = {
  primary: '#6200ee',
  primaryLight: '#bb86fc',
  secondary: '#03dac6',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#cf6679',
  text: '#ffffff',
  textSecondary: '#bdbdbd',
  success: '#4caf50',
  warn: '#ff9800',
  pending: '#ffc107',
};

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },

  // Cards e Superfícies
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },

  // Textos
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.text,
  },
  textSecondary: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Inputs
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },

  // Botões
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonError: {
    backgroundColor: colors.error,
  },
  buttonWarn: {
    backgroundColor: colors.warn,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Status badges
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: colors.pending,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusCancelled: {
    backgroundColor: colors.error,
  },
  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Listas
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  listItemText: {
    flex: 1,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  smallButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  // Modals
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },

  // Tabs
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.primary,
    borderTopWidth: 1,
  },
  tabLabel: {
    fontSize: 12,
  },
});

export { colors };
export default styles;