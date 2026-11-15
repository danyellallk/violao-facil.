import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView,
  TextInput, StyleSheet, StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import ChordDiagram from "./src/components/ChordDiagram";
import { SONGS } from "./src/data/songs";
import { LESSONS } from "./src/data/lessons";
import { transposeSequence } from "./src/utils/transposer";
import { playChord, stopChord, playMetronomeClick } from "./src/audio/guitarAudio";

const COLORS = { bg:"#0b1420", panel:"#172536", panel2:"#203247", yellow:"#f5c542", text:"#f4f6f8", muted:"#9eacba", green:"#55c995" };

function Btn({ title, onPress, active=false, small=false }) {
  return <TouchableOpacity onPress={onPress} style={[styles.btn, active && styles.btnActive, small && styles.btnSmall]}><Text style={[styles.btnText, active && styles.btnTextActive]}>{title}</Text></TouchableOpacity>;
}

export default function App() {
  const [tab, setTab] = useState("Músicas");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonStep, setLessonStep] = useState(0);
  const [song, setSong] = useState(SONGS[0]);
  const [mode, setMode] = useState("Automático");
  const [bpm, setBpm] = useState(70);
  const [step, setStep] = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [running, setRunning] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [customSongs, setCustomSongs] = useState([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customChords, setCustomChords] = useState("G D Em C");
  const chords = useMemo(() => transposeSequence(song.progression, transpose), [song, transpose]);
  const currentChord = chords[step % chords.length];
  const allSongs = useMemo(() => [...SONGS, ...customSongs], [customSongs]);
  const visibleSongs = useMemo(() => allSongs.filter(item =>
    (categoryFilter === "Todas" || (categoryFilter === "Favoritas" ? favorites.includes(item.id) : item.category === categoryFilter)) &&
    (item.title.toLowerCase().includes(searchText.toLowerCase()) || item.artist.toLowerCase().includes(searchText.toLowerCase()))
  ), [allSongs, categoryFilter, favorites, searchText]);

  useEffect(() => {
    AsyncStorage.getItem("violao-facil-history").then(value => {
      if (value) setHistory(JSON.parse(value));
    }).catch(() => {});
    AsyncStorage.multiGet(["violao-facil-favorites","violao-facil-custom-songs"]).then(values => {
      if (values[0][1]) setFavorites(JSON.parse(values[0][1]));
      if (values[1][1]) setCustomSongs(JSON.parse(values[1][1]));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (running) playChord(currentChord).catch(() => {});
  }, [running, currentChord]);

  useEffect(() => {
    if (!running) return;
    let beat = 0;
    const clickTimer = setInterval(() => {
      playMetronomeClick(beat % 4 === 0).catch(() => {});
      beat += 1;
    }, 60000 / bpm);
    return () => clearInterval(clickTimer);
  }, [running, bpm]);

  useEffect(() => {
    if (!running || mode !== "Automático") return;
    const timer = setInterval(() => {
      setStep(old => (old + 1) % chords.length);
      Haptics.selectionAsync().catch(() => {});
    }, 60000 / bpm * 4);
    return () => clearInterval(timer);
  }, [running, mode, bpm, chords.length]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setPracticeSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  async function finishPractice() {
    setRunning(false);
    if (!practiceSeconds) return;
    const entry = { title:song.title, seconds:practiceSeconds, date:new Date().toISOString() };
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    await AsyncStorage.setItem("violao-facil-history", JSON.stringify(next));
    setPracticeSeconds(0);
  }

  async function toggleFavorite(item) {
    const next = favorites.includes(item.id) ? favorites.filter(id => id !== item.id) : [...favorites, item.id];
    setFavorites(next);
    await AsyncStorage.setItem("violao-facil-favorites", JSON.stringify(next));
  }

  function chooseSong(item) {
    setSong(item); setStep(0); setTranspose(0); setRunning(false); setTab("Tocar");
  }

  function addSong() {
    const parsed = customChords.trim().split(/[ ,;]+/).filter(Boolean);
    if (!customTitle.trim() || parsed.length === 0) return;
    const item = { id:"custom-"+Date.now(), title:customTitle.trim(), artist:"Minha música", category:"Minhas músicas", key:parsed[0][0], chords:parsed, progression:parsed, note:"Cifra adicionada por você." };
    const next = [...customSongs, item];
    setCustomSongs(next);
    AsyncStorage.setItem("violao-facil-custom-songs", JSON.stringify(next)).catch(() => {});
    setCustomTitle(""); setCustomChords("G D Em C"); chooseSong(item);
  }

  const totalSeconds = history.reduce((sum, item) => sum + item.seconds, practiceSeconds);
  const minutes = Math.floor(totalSeconds / 60);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <View><Text style={styles.brand}>VIOLÃO <Text style={{color:COLORS.yellow}}>FÁCIL</Text></Text><Text style={styles.subtitle}>Seu treino, no seu ritmo.</Text></View>
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>ANDROID</Text></View>
      </View>
      <View style={styles.tabs}>
        {["Músicas","Aulas","Tocar","Acordes","Progresso"].map(item => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab===item && styles.tabSelected]}><Text style={[styles.tabText,tab===item && styles.tabTextSelected]}>{item}</Text></TouchableOpacity>)}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "Músicas" && <>
          <Text style={styles.heading}>Biblioteca</Text>
          <Text style={styles.muted}>Escolha uma sequência para praticar.</Text>
          <TextInput value={searchText} onChangeText={setSearchText} placeholder="Buscar música ou artista" placeholderTextColor={COLORS.muted} style={styles.input}/>
          <View style={styles.chordRow}>
            {["Todas","Gospel","Popular","Minhas músicas","Favoritas"].map(filter => <TouchableOpacity key={filter} onPress={() => setCategoryFilter(filter)}><View style={[styles.chip,categoryFilter===filter && styles.chipActive]}><Text style={[styles.chipText,categoryFilter===filter && styles.chipTextActive]}>{filter}</Text></View></TouchableOpacity>)}
          </View>
          {visibleSongs.length===0 ? <Text style={styles.muted}>Nenhuma música encontrada. Experimente outro filtro ou termo.</Text> : visibleSongs.map(item => <View key={item.id} style={styles.songCard}>
            <TouchableOpacity style={styles.songMain} onPress={() => chooseSong(item)}>
              <View style={styles.songIcon}><Text style={styles.songIconText}>♫</Text></View>
              <View style={{flex:1}}><Text style={styles.songTitle}>{item.title}</Text><Text style={styles.muted}>{item.artist} • {item.category}</Text><Text style={styles.chordLine}>{item.progression.join("  ·  ")}</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favoriteButton}><Text style={styles.favoriteText}>{favorites.includes(item.id) ? "♥" : "♡"}</Text></TouchableOpacity>
          </View>)}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Adicionar minha cifra</Text>
            <TextInput value={customTitle} onChangeText={setCustomTitle} placeholder="Nome da música" placeholderTextColor={COLORS.muted} style={styles.input}/>
            <TextInput value={customChords} onChangeText={setCustomChords} placeholder="Ex.: G D Em C" placeholderTextColor={COLORS.muted} style={styles.input}/>
            <Btn title="Adicionar música" onPress={addSong} active/>
          </View>
        </>}
        {tab === "Aulas" && <>
          <Text style={styles.heading}>Aulas guiadas</Text>
          <Text style={styles.muted}>Treinos curtos para evoluir passo a passo.</Text>
          <View style={styles.row}>
            {LESSONS.map((item,index)=><Btn key={item.id} title={"Aula "+item.number} active={lessonIndex===index} onPress={()=>{setLessonIndex(index);setLessonStep(0);}} small/>)}
          </View>
          <View style={styles.panel}>
            <Text style={styles.eyebrow}>{LESSONS[lessonIndex].duration.toUpperCase()} • TREINO GUIADO</Text>
            <Text style={styles.panelTitle}>{LESSONS[lessonIndex].title}</Text>
            <Text style={styles.value}>Foco: {LESSONS[lessonIndex].focus}</Text>
            <Text style={styles.muted}>{LESSONS[lessonIndex].goal}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill,{width:((lessonStep+1)/LESSONS[lessonIndex].steps.length*100)+"%"}]}/></View>
            <Text style={styles.value}>Etapa {lessonStep+1} de {LESSONS[lessonIndex].steps.length}</Text>
            <Text style={styles.songTitle}>{LESSONS[lessonIndex].steps[lessonStep].title}</Text>
            <Text style={styles.muted}>{LESSONS[lessonIndex].steps[lessonStep].detail}</Text>
            <View style={styles.row}>
              <Btn title="‹ Voltar" small onPress={()=>setLessonStep(s=>Math.max(0,s-1))}/>
              <Btn title={lessonStep===LESSONS[lessonIndex].steps.length-1 ? "Recomeçar aula" : "Próxima etapa ›"} active small onPress={()=>setLessonStep(s=>s===LESSONS[lessonIndex].steps.length-1?0:s+1)}/>
            </View>
            <Btn title="Praticar esta sequência" onPress={()=>{setSong(SONGS[0]);setStep(0);setTranspose(0);setRunning(false);setTab("Tocar");}}/>
          </View>
          <Text style={styles.smallNote}>Dica: pare se sentir dor. Faça pausas curtas e priorize um som limpo em vez de velocidade.</Text>
        </>}
        {tab === "Tocar" && <>
          <Text style={styles.eyebrow}>{song.category.toUpperCase()} • MODO DE ESTUDO</Text>
          <Text style={styles.heading}>{song.title}</Text><Text style={styles.muted}>{song.artist}</Text>
          <View style={styles.currentCard}>
            <Text style={styles.muted}>ACORDE ATUAL</Text>
            <Text style={styles.currentChord}>{currentChord}</Text>
            <Text style={styles.muted}>Sequência {step+1} de {chords.length}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill,{width:((step+1)/chords.length*100)+"%"}]}/></View>
          </View>
          <View style={styles.row}>
            <Btn title="‹ Anterior" onPress={() => setStep(s => (s-1+chords.length)%chords.length)} small/>
            <Btn title="Próximo ›" onPress={() => setStep(s => (s+1)%chords.length)} small/>
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Acompanhamento</Text>
            <View style={styles.row}><Btn title="Automático" active={mode==="Automático"} onPress={() => setMode("Automático")}/><Btn title="Manual" active={mode==="Manual"} onPress={() => {setMode("Manual");setRunning(false);}}/></View>
            <View style={styles.rowBetween}><Text style={styles.muted}>Velocidade</Text><Text style={styles.value}>{bpm} BPM</Text></View>
            <View style={styles.row}><Btn title="−" onPress={() => setBpm(v=>Math.max(40,v-5))}/><View style={{flex:1}}><View style={styles.progressTrack}><View style={[styles.progressFill,{width:((bpm-40)/160*100)+"%"}]}/></View></View><Btn title="+" onPress={() => setBpm(v=>Math.min(200,v+5))}/></View>
            <View style={styles.rowBetween}><Text style={styles.muted}>Tom da música</Text><Text style={styles.value}>{transpose===0 ? "Original" : (transpose>0?"+":"")+transpose+" semitons"}</Text></View>
            <View style={styles.row}><Btn title="− Tom" onPress={() => setTranspose(v=>Math.max(-11,v-1))}/><Btn title="Restaurar" onPress={() => setTranspose(0)}/><Btn title="+ Tom" onPress={() => setTranspose(v=>Math.min(11,v+1))}/></View>
            <Btn title={running ? "Pausar acompanhamento" : "Iniciar acompanhamento"} active onPress={() => { if (running) { setRunning(false); stopChord().catch(() => {}); } else { setRunning(true); } }}/><View style={styles.row}><Btn title="▶ Ouvir acorde atual" onPress={() => { setAudioBusy(true); playChord(currentChord).catch(() => {}).finally(() => setAudioBusy(false)); }}/><Btn title="■ Parar áudio" onPress={() => stopChord().catch(() => {})}/></View>
            <Text style={styles.smallNote}>{mode==="Automático" ? "O acorde toca automaticamente a cada compasso, com metrônomo em 4 tempos." : "No modo manual, escolha os acordes e toque quando quiser."}</Text>
          </View>
          <Text style={styles.panelTitle}>Acordes da sequência</Text>
          <View style={styles.chordRow}>{chords.map((c,i)=><TouchableOpacity key={i} onPress={() => setStep(i)}><View style={[styles.chip,step===i && styles.chipActive]}><Text style={[styles.chipText,step===i && styles.chipTextActive]}>{c}</Text></View></TouchableOpacity>)}</View>
          <Text style={styles.smallNote}>{song.note}</Text>
          <Text style={styles.smallNote}>Cronômetro de prática: {Math.floor(practiceSeconds/60)} min {practiceSeconds%60} s</Text>
          <Btn title="Finalizar e salvar treino" onPress={finishPractice}/>
        </>}
        {tab === "Acordes" && <>
          <Text style={styles.heading}>Dicionário de acordes</Text><Text style={styles.muted}>Diagramas básicos para começar.</Text>
          <View style={styles.diagramGrid}>{["G","D","Em","C","Am","A7","F","E","A","Dm","E7","D7","C7","B7","Fmaj7","Em7","Am7","G7"].map(c=><ChordDiagram key={c} chord={c}/>)}</View>
          <Text style={styles.smallNote}>Os números indicam dedos sugeridos; 0 significa corda solta e × significa não tocar.</Text>
        </>}
        {tab === "Progresso" && <>
          <Text style={styles.heading}>Meu progresso</Text>
          <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statNumber}>{history.length}</Text><Text style={styles.muted}>Treinos salvos</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{minutes}</Text><Text style={styles.muted}>Minutos</Text></View></View>
          <View style={styles.panel}><Text style={styles.panelTitle}>Histórico de prática</Text>{history.length===0 ? <Text style={styles.muted}>Seus treinos aparecerão aqui quando você finalizar uma sessão.</Text> : history.map((h,i)=><View key={i} style={styles.historyItem}><Text style={styles.songTitle}>{h.title}</Text><Text style={styles.muted}>{Math.floor(h.seconds/60)} min {h.seconds%60} s • {new Date(h.date).toLocaleDateString("pt-BR")}</Text></View>)}</View>
        </>}
      </ScrollView>
      <View style={styles.footer}><Text style={styles.footerText}>VIOLÃO FÁCIL • APRENDA PRATICANDO</Text></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.bg},
  header:{paddingHorizontal:18,paddingTop:12,paddingBottom:16,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  brand:{fontSize:23,fontWeight:"900",letterSpacing:1,color:COLORS.text},subtitle:{color:COLORS.muted,fontSize:12,marginTop:2},
  headerBadge:{borderWidth:1,borderColor:"#536477",borderRadius:20,paddingHorizontal:10,paddingVertical:5},headerBadgeText:{color:COLORS.yellow,fontSize:10,fontWeight:"800"},
  tabs:{flexDirection:"row",paddingHorizontal:4,borderBottomWidth:1,borderColor:"#243447"},tab:{flex:1,alignItems:"center",paddingVertical:12,minWidth:0},tabSelected:{borderBottomWidth:3,borderColor:COLORS.yellow},tabText:{fontSize:10,color:COLORS.muted,fontWeight:"700"},tabTextSelected:{color:COLORS.yellow},
  content:{padding:16,paddingBottom:35},heading:{fontSize:25,fontWeight:"900",color:COLORS.text,marginTop:5},muted:{color:COLORS.muted,fontSize:12,marginTop:4},eyebrow:{color:COLORS.yellow,fontSize:10,fontWeight:"900",letterSpacing:1},
  songCard:{backgroundColor:COLORS.panel,borderRadius:15,padding:13,marginTop:12,flexDirection:"row",alignItems:"center",gap:8},songMain:{flex:1,flexDirection:"row",alignItems:"center",gap:11},favoriteButton:{padding:8},favoriteText:{fontSize:25,color:COLORS.yellow},songIcon:{width:42,height:42,borderRadius:12,backgroundColor:COLORS.panel2,alignItems:"center",justifyContent:"center"},songIconText:{fontSize:23,color:COLORS.yellow},songTitle:{fontSize:15,color:COLORS.text,fontWeight:"800"},chordLine:{color:COLORS.yellow,fontSize:12,marginTop:7,fontWeight:"700"},arrow:{fontSize:28,color:COLORS.muted},
  panel:{backgroundColor:COLORS.panel,borderRadius:16,padding:15,marginTop:16,gap:12},panelTitle:{fontSize:16,fontWeight:"800",color:COLORS.text,marginTop:13},input:{backgroundColor:COLORS.bg,borderRadius:10,padding:12,color:COLORS.text,borderWidth:1,borderColor:"#34465a"},
  btn:{backgroundColor:COLORS.panel2,borderRadius:11,paddingVertical:11,paddingHorizontal:14,alignItems:"center",justifyContent:"center",flex:1},btnActive:{backgroundColor:COLORS.yellow},btnSmall:{paddingHorizontal:18},btnText:{color:COLORS.text,fontWeight:"800",fontSize:12},btnTextActive:{color:"#172536"},
  currentCard:{backgroundColor:COLORS.panel,borderRadius:18,padding:22,alignItems:"center",marginTop:18},currentChord:{fontSize:66,color:COLORS.yellow,fontWeight:"900",marginVertical:6},progressTrack:{height:6,backgroundColor:"#34465a",borderRadius:5,overflow:"hidden",width:"100%",marginTop:15},progressFill:{height:6,backgroundColor:COLORS.green,borderRadius:5},
  row:{flexDirection:"row",gap:9,alignItems:"center",marginTop:10},rowBetween:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:5},value:{color:COLORS.yellow,fontWeight:"900"},smallNote:{color:COLORS.muted,fontSize:11,lineHeight:17,marginTop:10},
  chordRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},chip:{backgroundColor:COLORS.panel2,borderRadius:9,paddingHorizontal:14,paddingVertical:10},chipActive:{backgroundColor:COLORS.yellow},chipText:{color:COLORS.text,fontWeight:"800"},chipTextActive:{color:"#172536"},
  diagramGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginTop:15},statsRow:{flexDirection:"row",gap:12,marginTop:16},stat:{flex:1,backgroundColor:COLORS.panel,borderRadius:14,padding:18},statNumber:{fontSize:32,fontWeight:"900",color:COLORS.yellow},historyItem:{paddingVertical:11,borderBottomWidth:1,borderColor:"#34465a"},
  footer:{padding:10,alignItems:"center",borderTopWidth:1,borderColor:"#243447"},footerText:{fontSize:9,color:COLORS.muted,fontWeight:"800",letterSpacing:1}
});