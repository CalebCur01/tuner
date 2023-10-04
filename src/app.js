import PitchAnalyser from 'pitch-analyser';

//notes and frequencies 
const noteFrequencies = {
    "C0" : 16.35,
    "C#0/Db0" : 17.32,
    "D0" : 18.35,
    "D#0/Eb0" : 19.45,
    "E0" : 20.6,
    "F0" : 21.83,
    "F#0/Gb0" : 23.12,
    "G0" : 24.5,
    "G#0/Ab0" : 25.96,
    "A0" : 27.5,
    "A#0/Bb0" : 29.14,
    "B0" : 30.87,
    "C1" : 32.7,
    "C#1/Db1" : 34.65,
    "D1" : 36.71,
    "D#1/Eb1" : 38.89,
    "E1" : 41.2,
    "F1" : 43.65,
    "F#1/Gb1" : 46.25,
    "G1" : 49.0,
    "G#1/Ab1" : 51.91,
    "A1" : 55.0,
    "A#1/Bb1" : 58.27,
    "B1" : 61.74,
    "C2" : 65.41,
    "C#2/Db2" : 69.3,
    "D2" : 73.42,
    "D#2/Eb2" : 77.78,
    "E2" : 82.41,
    "F2" : 87.31,
    "F#2/Gb2" : 92.5,
    "G2" : 98.0,
    "G#2/Ab2" : 103.83,
    "A2" : 110.0,
    "A#2/Bb2" : 116.54,
    "B2" : 123.47,
    "C3" : 130.81,
    "C#3/Db3" : 138.59,
    "D3" : 146.83,
    "D#3/Eb3" : 155.56,
    "E3" : 164.81,
    "F3" : 174.61,
    "F#3/Gb3" : 185.0,
    "G3" : 196.0,
    "G#3/Ab3" : 207.65,
    "A3" : 220.0,
    "A#3/Bb3" : 233.08,
    "B3" : 246.94,
    "C4" : 261.63,
    "C#4/Db4" : 277.18,
    "D4" : 293.66,
    "D#4/Eb4" : 311.13,
    "E4" : 329.63,
    "F4" : 349.23,
    "F#4/Gb4" : 369.99,
    "G4" : 392.0,
    "G#4/Ab4" : 415.3,
    "A4" : 440.0,
    "A#4/Bb4" : 466.16,
    "B4" : 493.88,
    "C5" : 523.25,
    "C#5/Db5" : 554.37,
    "D5" : 587.33,
    "D#5/Eb5" : 622.25,
    "E5" : 659.25,
    "F5" : 698.46,
    "F#5/Gb5" : 739.99,
    "G5" : 783.99,
    "G#5/Ab5" : 830.61,
    "A5" : 880.0,
    "A#5/Bb5" : 932.33,
    "B5" : 987.77,
    "C6" : 1046.5,
    "C#6/Db6" : 1108.73,
    "D6" : 1174.66,
    "D#6/Eb6" : 1244.51,
    "E6" : 1318.51,
    "F6" : 1396.91,
    "F#6/Gb6" : 1479.98,
    "G6" : 1567.98,
    "G#6/Ab6" : 1661.22,
    "A6" : 1760.0,
    "A#6/Bb6" : 1864.66,
    "B6" : 1975.53,
    "C7" : 2093.0,
    "C#7/Db7" : 2217.46,
    "D7" : 2349.32,
    "D#7/Eb7" : 2489.02,
    "E7" : 2637.02,
    "F7" : 2793.83,
    "F#7/Gb7" : 2959.96,
    "G7" : 3135.96,
    "G#7/Ab7" : 3322.44,
    "A7" : 3520.0,
    "A#7/Bb7" : 3729.31,
    "B7" : 3951.07,
    "C8" : 4186.01,
    "C#8/Db8" : 4434.92,
    "D8" : 4698.63,
    "D#8/Eb8" : 4978.03,
    "E8" : 5274.04,
    "F8" : 5587.65,
    "F#8/Gb8" : 5919.91,
    "G8" : 6271.93,
    "G#8/Ab8" : 6644.88,
    "A8" : 7040.0,
    "A#8/Bb8" : 7458.62,
    "B8" : 7902.13,
};
const orderedNotes = Object.keys(noteFrequencies);

//svg elements
const needle = document.getElementById('needle');
var topNote = document.getElementById('topText'); 
var leftNote = document.getElementById('leftText'); 
var rightNote = document.getElementById('rightText'); 

let lastNote = null;
let consistentNoteCount = 0;
const CONSISTENT_READINGS_THRESHOLD = 3; 
 
//rotate based on cents
function updateNeedleRotation(cents) {
    const rotationDegrees = cents * 0.3;
    needle.style.transform = `rotate(${rotationDegrees}deg)`;
}


//update the displayed notes
function updateDisplayedNote(note, cents) {
    let newNote = note;
    if (cents > 50) {
        newNote = getNextNote(note);
    } else if (cents < -50) {
        newNote = getPreviousNote(note);
    }
    topNote.textContent = newNote;
    leftNote.textContent = getPreviousNote(newNote);
    rightNote.textContent = getNextNote(newNote);
}

//functions for getting next and previous notes
function getNextNote(note) {
    const index = orderedNotes.indexOf(note);
    if (index === -1 || index === orderedNotes.length - 1) {
      return orderedNotes[0] //wrap around
    }
    return orderedNotes[index + 1];
  }
 
  function getPreviousNote(note) {
    const index = orderedNotes.indexOf(note);
    if (index <= 0) {
      return orderedNotes[orderedNotes.length - 1] //wrap around
    }
    return orderedNotes[index - 1];
  }


//get mic access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('microphone access granted!')
    analyser.initAnalyser().then(() => {
        console.log('Analyser initialized');
    }).catch(handleError);
  })
  .catch(err => {
    console.error("Error accessing the microphone:", err);
  });


function analyserCallback(payload) {
    console.log(payload);

    // Update needle rotation
    updateNeedleRotation(payload.cents)
    
     // Stabilize note changes
     if (lastNote === payload.note) {
        consistentNoteCount++;
    } else {
        consistentNoteCount = 0;
    }
    lastNote = payload.note;
    
    //update the displayed note only if the same note is detected consistently
    if (consistentNoteCount >= CONSISTENT_READINGS_THRESHOLD) {
        updateDisplayedNote(payload.note, payload.cents);
    }
}
//to avoid too many rapid updates
let lastUpdateTime = 0;
const throttleTime = 400; //milliseconds

function throttledCallback(payload) {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime >= throttleTime) {
        lastUpdateTime = currentTime;
        analyserCallback(payload);
    }
}
const analyserOptions = {
    callback: throttledCallback,
    returnNote: true,
    returnCents: true,
    decimals: 2,
};
const analyser = new PitchAnalyser(analyserOptions);


document.getElementById('start-analyser').addEventListener('click', () => {
    console.log('button pressed')

    analyser.startAnalyser();
});

function handleError(err) {
    console.error(`Error with pitch-analyser: ${err}`);
}



