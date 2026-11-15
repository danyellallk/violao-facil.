import React from "react";
import { View, Text, StyleSheet } from "react-native";

const SHAPES = {
  G: ["3","2","0","0","0","3"],
  D: ["x","x","0","2","3","2"],
  Em: ["0","2","2","0","0","0"],
  C: ["x","3","2","0","1","0"],
  Am: ["x","0","2","2","1","0"],
  A7: ["x","0","2","0","2","0"],
  F: ["1","3","3","2","1","1"]
};

export default function ChordDiagram({ chord }) {
  const shape = SHAPES[chord] || SHAPES[chord.replace(/[0-9]/g, "")] || SHAPES.G;
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{chord}</Text>
      <View style={styles.diagram}>
        {shape.map((finger, i) => (
          <View key={i} style={styles.string}>
            <View style={styles.line} />
            <View style={[styles.dot, finger === "x" || finger === "0" ? styles.open : null]}>
              <Text style={styles.dotText}>{finger === "x" ? "×" : finger === "0" ? "○" : finger}</Text>
            </View>
          </View>
        ))}
        {[0,1,2,3].map(n => <View key={n} style={[styles.fret, { top: 25 + n * 17 }]} />)}
      </View>
      <Text style={styles.caption}>6ª → 1ª corda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:"#172536",borderRadius:14,padding:12,alignItems:"center",minWidth:112},
  name:{color:"#f5c542",fontSize:20,fontWeight:"800",marginBottom:8},
  diagram:{height:88,width:90,flexDirection:"row",justifyContent:"space-between",position:"relative",paddingHorizontal:5},
  string:{width:12,alignItems:"center",height:88},
  line:{position:"absolute",top:0,bottom:0,width:1,backgroundColor:"#aeb9c5"},
  dot:{position:"absolute",top:31,width:17,height:17,borderRadius:9,backgroundColor:"#f5c542",alignItems:"center",justifyContent:"center",zIndex:2},
  open:{backgroundColor:"transparent"},
  dotText:{color:"#172536",fontSize:10,fontWeight:"900"},
  fret:{position:"absolute",left:0,right:0,height:1,backgroundColor:"#718096"},
  caption:{color:"#9eacba",fontSize:10,marginTop:5}
});