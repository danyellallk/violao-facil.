import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Os valores representam a casa pressionada em cada corda: 0 = solta, x = não tocar.
const SHAPES = {
  G: ["3","2","0","0","0","3"],
  D: ["x","x","0","2","3","2"],
  Em: ["0","2","2","0","0","0"],
  C: ["x","3","2","0","1","0"],
  Am: ["x","0","2","2","1","0"],
  A7: ["x","0","2","0","2","0"],
  F: ["1","3","3","2","1","1"],
  E: ["0","2","2","1","0","0"],
  A: ["x","0","2","2","2","0"],
  Dm: ["x","x","0","2","3","1"],
  E7: ["0","2","0","1","0","0"],
  D7: ["x","x","0","2","1","2"],
  C7: ["x","3","2","3","1","0"],
  B7: ["x","2","1","2","0","2"],
  Fmaj7: ["x","x","3","2","1","0"],
  Em7: ["0","2","0","0","0","0"],
  Am7: ["x","0","2","0","1","0"],
  G7: ["3","2","0","0","0","1"]
};

export default function ChordDiagram({ chord }) {
  const shape = SHAPES[chord] || SHAPES.G;
  const left = 16, top = 24, stringGap = 18, fretGap = 17;
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{chord}</Text>
      <View style={styles.topMarks}>
        {shape.map((value, index) => <Text key={index} style={styles.mark}>{value === "x" ? "×" : value === "0" ? "○" : ""}</Text>)}
      </View>
      <View style={styles.board}>
        {[0,1,2,3,4,5].map(index => <View key={"s"+index} style={[styles.stringLine,{left:left+index*stringGap}]}/>)}
        {[0,1,2,3,4].map(index => <View key={"f"+index} style={[styles.fretLine,{top:top+index*fretGap}]}/>)}
        {shape.map((value,index) => {
          const fret = Number(value);
          if (!fret) return null;
          return <View key={"d"+index} style={[styles.dot,{left:left+index*stringGap-6,top:top+(fret-0.5)*fretGap-6}]}/>;
        })}
      </View>
      <Text style={styles.caption}>6ª corda  →  1ª corda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:"#172536",borderRadius:14,padding:10,alignItems:"center",width:148,marginBottom:2},
  name:{color:"#f5c542",fontSize:19,fontWeight:"800",marginBottom:3},
  topMarks:{width:108,marginLeft:10,flexDirection:"row",justifyContent:"space-between",height:17},
  mark:{width:18,textAlign:"center",color:"#f4f6f8",fontSize:12,fontWeight:"800"},
  board:{width:108,height:94,position:"relative"},
  stringLine:{position:"absolute",top:24,bottom:0,width:1.4,backgroundColor:"#c0cad4"},
  fretLine:{position:"absolute",left:16,right:2,height:1.4,backgroundColor:"#718096"},
  dot:{position:"absolute",width:12,height:12,borderRadius:6,backgroundColor:"#f5c542",zIndex:2},
  caption:{color:"#9eacba",fontSize:9,marginTop:4}
});
