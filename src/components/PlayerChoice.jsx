import { Pressable, Text, View, StyleSheet } from 'react-native';

const PlayerChoice = ({ choices = [], onSelect, variant = 'default' }) => {
  const variantStyles = {
    default: {
      container: styles.defaultContainer,
      button: styles.defaultButton,
      buttonText: styles.defaultButtonText,
    },
    vn: {
      container: styles.vnContainer,
      button: styles.vnButton,
      buttonText: styles.vnButtonText,
    },
    overlay: {
      container: styles.overlayContainer,
      button: styles.overlayButton,
      buttonText: styles.overlayButtonText,
    },
  };

  const palette = variantStyles[variant] || variantStyles.default;

  return (
    <View style={[styles.container, palette.container]}>
      {choices.map((choice, index) => (
        <Pressable
          key={`${choice.label}-${index}`}
          style={[styles.button, palette.button]}
          onPress={() => onSelect?.(choice.next, choice.label, choice.cost || 0)}
        >
          <Text style={[styles.buttonText, palette.buttonText]}>
            {choice.label}
            {choice.cost ? ` (-${choice.cost} 💰)` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default PlayerChoice;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  defaultContainer: {
    marginTop: 20,
    zIndex: 10,
  },
  defaultButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 6,
    width: 280,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    borderColor: '#a78bfa',
  },
  defaultButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  vnContainer: {
    alignSelf: 'stretch',
    marginTop: 16,
    gap: 10,
  },
  vnButton: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 22, 56, 0.94)',
    borderColor: 'rgba(219, 201, 255, 0.42)',
  },
  vnButtonText: {
    color: '#f6eeff',
    fontSize: 16,
    lineHeight: 22,
  },
  overlayContainer: {
    alignSelf: 'stretch',
    gap: 8,
  },
  overlayButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 28, 43, 0.94)',
    borderColor: 'rgba(188, 234, 255, 0.36)',
  },
  overlayButtonText: {
    color: '#effbff',
    fontSize: 15,
  },
});
