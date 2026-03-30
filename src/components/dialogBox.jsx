import { StyleSheet, Text, View, useColorScheme } from 'react-native';
//import Colors from "../constants/Colors";

/*
Call this function using 
*/

const TitleCard = ({ style, charaName, txt, ...props }) => {
  //const colorScheme = useColorScheme();
  //const theme = Colors[colorScheme] ?? Colors.light;
  
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Text style={styles.heading}>
        {charaName}
      </Text>
      <View 
        style={[
          styles.card, 
          style
        ]}
        {...props}
      >
        <Text>{txt}</Text>
      </View>
    </View>
  );
};

export default TitleCard;

const styles = StyleSheet.create({
    card: {
      padding: 20,
      minWidth: 280,
      maxWidth: 320,
      borderRadius: 8,
      backgroundColor: '#dba5e3' ,
      shadowColor: '#483d50',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    heading: {
      fontWeight: "bold", 
      fontSize: 24,
      textAlign: 'left',
      marginBottom: 10,
      color: "white",
      
    },
});