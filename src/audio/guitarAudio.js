import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const NOTES = {
  C: [130.81,164.81,196.00,261.63,329.63],
  "C#": [138.59,174.61,207.65,277.18,349.23],
  D: [146.83,185.00,220.00,293.66,369.99],
  "D#": [155.56,196.00,233.08,311.13,392.00],
  E: [82.41,123.47,164.81,207.65,246.94],
  F: [87.31,130.81,174.61,220.00,261.63],
  "F#": [92.50,138.59,185.00,233.08,277.18],
  G: [98.00,146.83,196.00,246.94,293.66],
  "G#": [103.83,155.56,207.65,261.63,311.13],
  A: [110.00,164.81,220.00,277.18,329.63],
  "A#": [116.54,174.61,233.08,293.66,349.23],
  B: [123.47,185.00,246.94,311.13,369.99]
};

const SHAPES = {
  C:[0,4,7,0,4], "C#":[1,5,8,1,5], D:[0,5,9,0,5],
  "D#":[1,6,10,1,6], E:[0,7,12,0,7], F:[0,5,9,0,5],
  "F#":[1,6,10,1,6], G:[0,7,12,0,7], "G#":[1,8,12,1,8],
  A:[0,7,12,0,7], "A#":[1,8,13,1,8], B:[0,7,12,0,7]
};

const QUALITY = {
  "": [0,4,7], m:[0,3,7], "7":[0,4,7,10], m7:[0,3,7,10],
  maj7:[0,4,7,11], sus4:[0,5,7], dim:[0,3,6]
};

let currentSound = null;
let currentUri = null;

function base64(bytes) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i=0;i<bytes.length;i+=3) {
    const a=bytes[i], hasB=i+1<bytes.length, hasC=i+2<bytes.length;
    const b=hasB?bytes[i+1]:0, c=hasC?bytes[i+2]:0;
    result += chars[a>>2] + chars[((a&3)<<4)|(b>>4)] +
      (hasB?chars[((b&15)<<2)|(c>>6)]:"=") + (hasC?chars[c&63]:"=");
  }
  return result;
}

function makeWav(chord) {
  const rootMatch = chord.match(/^([A-G](?:#|b)?)/);
  if (!rootMatch) throw new Error("Acorde inválido");
  const aliases={Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#"};
  const root=aliases[rootMatch[1]]||rootMatch[1];
  const suffix=chord.slice(rootMatch[0].length).replace(/\/.+$/,"");
  const rootIndex=Object.keys(NOTES).indexOf(root);
  if (rootIndex<0) throw new Error("Nota não suportada");
  const intervals=QUALITY[suffix] || QUALITY[""];
  const rootFreq=NOTES[root][0];
  const freqs=intervals.map((interval,i)=>rootFreq*Math.pow(2,interval/12)*Math.pow(2,Math.floor(i/3)));
  const sampleRate=22050, duration=1.45, count=Math.floor(sampleRate*duration);
  const data=new Uint8Array(44+count*2);
  const view=new DataView(data.buffer);
  const write=(offset,str)=>{for(let i=0;i<str.length;i++)data[offset+i]=str.charCodeAt(i);};
  write(0,"RIFF"); view.setUint32(4,36+count*2,true); write(8,"WAVE");
  write(12,"fmt "); view.setUint32(16,16,true); view.setUint16(20,1,true);
  view.setUint16(22,1,true); view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*2,true); view.setUint16(32,2,true);
  view.setUint16(34,16,true); write(36,"data"); view.setUint32(40,count*2,true);
  for(let n=0;n<count;n++) {
    const t=n/sampleRate;
    let sample=0;
    freqs.forEach((frequency,i)=>{
      const delay=i*0.012;
      if(t>=delay) {
        const local=t-delay;
        const fundamental=Math.sin(2*Math.PI*frequency*local);
        const harmonic=0.32*Math.sin(4*Math.PI*frequency*local);
        const shimmer=0.12*Math.sin(6*Math.PI*frequency*local);
        sample+=(fundamental+harmonic+shimmer)*Math.exp(-local*2.6);
      }
    });
    sample=Math.max(-1,Math.min(1,sample*0.16));
    view.setInt16(44+n*2,Math.round(sample*32767),true);
  }
  return base64(data);
}

export async function stopChord() {
  if(currentSound) {
    try { await currentSound.stopAsync(); await currentSound.unloadAsync(); } catch {}
    currentSound=null;
  }
}

export async function playChord(chord) {
  await stopChord();
  await Audio.setAudioModeAsync({playsInSilentModeIOS:true,shouldDuckAndroid:true,playThroughEarpieceAndroid:false});
  const encoded=makeWav(chord);
  const uri=(FileSystem.cacheDirectory||FileSystem.documentDirectory)+"chord-"+chord.replace(/[^A-Za-z0-9]/g,"_")+".wav";
  await FileSystem.writeAsStringAsync(uri,encoded,{encoding:FileSystem.EncodingType.Base64});
  currentUri=uri;
  const result=await Audio.Sound.createAsync({uri},{shouldPlay:true,volume:0.9});
  currentSound=result.sound;
  return currentSound;
}

const clickSounds = { strong: null, soft: null };
const clickPromises = { strong: null, soft: null };

function makeClickWav(accent=false) {
  const frequency=accent?1200:850;
  const sampleRate=22050, count=Math.floor(sampleRate*0.045);
  const data=new Uint8Array(44+count*2), view=new DataView(data.buffer);
  const write=(offset,str)=>{for(let i=0;i<str.length;i++)data[offset+i]=str.charCodeAt(i);};
  write(0,"RIFF");view.setUint32(4,36+count*2,true);write(8,"WAVE");write(12,"fmt ");
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,count*2,true);
  for(let i=0;i<count;i++){
    const t=i/sampleRate;
    const v=Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*75);
    view.setInt16(44+i*2,Math.round(v*18000),true);
  }
  return base64(data);
}

async function getClickSound(accent=false) {
  const key=accent?"strong":"soft";
  if(clickSounds[key]) return clickSounds[key];
  if(!clickPromises[key]) {
    clickPromises[key]=(async()=>{
      const uri=(FileSystem.cacheDirectory||FileSystem.documentDirectory)+"metronome-"+key+".wav";
      await FileSystem.writeAsStringAsync(uri,makeClickWav(accent),{encoding:FileSystem.EncodingType.Base64});
      const result=await Audio.Sound.createAsync({uri},{shouldPlay:false,volume:0.55});
      clickSounds[key]=result.sound;
      return result.sound;
    })().catch(error=>{clickPromises[key]=null;throw error;});
  }
  return clickPromises[key];
}

export async function playMetronomeClick(accent=false) {
  const sound=await getClickSound(accent);
  await sound.replayAsync();
}

export async function stopMetronome() {
  const sounds=Object.values(clickSounds).filter(Boolean);
  await Promise.all(sounds.map(async sound=>{
    try { await sound.stopAsync(); await sound.unloadAsync(); } catch {}
  }));
  clickSounds.strong=null; clickSounds.soft=null;
  clickPromises.strong=null; clickPromises.soft=null;
}
