
//svg elements
const needle = document.getElementById('needle');
var topNote = document.getElementById('topText'); 
var leftNote = document.getElementById('leftText'); 
var rightNote = document.getElementById('rightText'); 

let currentRotation = 0; // Start with 0 degrees

function rotateNeedle(degrees) {
    const cx = 200; // x-coordinate of the center of rotation
    const cy = 200; // y-coordinate of the center of rotation

    // Apply rotation transform around the center
    needle.setAttribute('transform', `rotate(${degrees}, ${cx}, ${cy})`);
}

//rotate based on cents
function updateNeedleRotation(cents) {
    if(cents === -Infinity || cents === Infinity || isNaN(cents)) {
        cents = 0;
    }
    const rotationDegrees = cents * 0.3 * 5;
    rotateNeedle(rotationDegrees);
}

//update the displayed notes
function updateDisplayedNote(newNote) {
    topNote.textContent = newNote;
    leftNote.textContent = getPreviousNote(newNote);
    rightNote.textContent = getNextNote(newNote);
}
//function to find closest note 
function getClosestNote(frequency) {
    let minDiff = Infinity; //so that it will always pick some note to start off
    let closestNote;
    
    for (const note in noteFrequencies) {
        const diff = Math.abs(noteFrequencies[note] - frequency);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }
    return closestNote;
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
  //function to play sound effect to indicate note is in tune
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var bellCoolDown = false; //flag so the bell sound won't keep playing too rapidly
function playBell() {
    if(!bellCoolDown) {
      fetch('bell.mp3')
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(buffer => {
        let source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        bellCoolDown = true;

        setTimeout(() => {
          bellCoolDown = false;
        },3000); // set cooldown in ms
    })
    .catch(err => console.log(err));
  }
  }



  //width of each bin = max_frequency / frequencyBinCount 
  //frequencyBinCount = FFT.size / 2  
  //max_frequency = sampleRate / 2 = 24000 
function analyzeAudio(stream) {
    const audioContext = new AudioContext(); 
    const analyser = audioContext.createAnalyser();
    analyser.fftSize =  8192 //should give us bin width of 5.86Hz
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    function startAnalysis() {
        setInterval(() => {
          var timeArray = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(timeArray);
          var noteFrequency = autoCorrelate(timeArray,audioContext.sampleRate);
          if(noteFrequency == -1) { //if its too quiet, don't do anything
            return
          }
          const detectedNote = getClosestNote(noteFrequency);
          
          //calculate how many cents off detected Hz is from closest note's actual Hz
          const centsOff = 1200 * Math.log2(noteFrequency / noteFrequencies[detectedNote]);
          console.log(`${detectedNote} ${noteFrequency}Hz off by ${centsOff}cents`); //we will consider +/- 5 cents to be in tune
          if(centsOff > 100) {
            return //ignore occasional extreme values
          }
          //update gauge
          updateDisplayedNote(detectedNote);
          if(centsOff >= -5 && centsOff <= 5) { // in range [-5,5] cents, we want no rotation
            updateNeedleRotation(0);
            playBell();
          } 
          else {
            updateNeedleRotation(centsOff);
          }

        }, 750); // 750ms delay prevents needle from updating too rapidly
    }
    startAnalysis();  //Start the repeated analysis
}
//get mic access
document.getElementById('start-analyser').addEventListener('click', function() {
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    //indicate tuner is now turned on
    this.textContent = "Tuner Active";
    this.classList.remove('btn-primary');
    this.classList.add('btn-danger');
    analyzeAudio(stream);
  })
  .catch(err => {
    alert("Error accessing the microphone:", err);
  });
});

//autoCorrelate function: source https://alexanderell.is/posts/tuner/tuner.js
function autoCorrelate(buffer, sampleRate) {
  //root-mean-square to determine if there's enough signal
  var SIZE = buffer.length;
  var sumOfSquares = 0;
  for(var i = 0; i< SIZE; i++) {
      var val = buffer[i];
      sumOfSquares += val * val;
  }
  var rootMeanSquare = Math.sqrt(sumOfSquares/SIZE)
  if(rootMeanSquare < 0.01) {
      return -1; //too quiet, we return -1
  }
  var r1 = 0;
  var r2 = SIZE - 1;
  var threshold = 0.2
  // walk up for r1
  for (var i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  // walk down for r2
  for (var i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }
  // trim the buffer to [r1,r2] and update SIZE.
  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length
  
  //create a new array of sums of offsets to perform the autocorrelation
  var c = new Array(SIZE).fill(0);
  //for each potential offset, calculate sum of each buffer value * offset value
  for(let i = 0; i < SIZE; i++) {
    for(let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j+i];
    }
  }
  //find the last index where the value is greater than the next one
  var d = 0;
  while (c[d] > c[d+1]) {
    d++;
  }
  //go from d to the end to find the maximum
  var maxValue = -1;
  var maxIndex = -1;
  for(var i = d; i < SIZE; i++){
    if(c[i] > maxValue){
        maxValue = c[i];
        maxIndex = i;
    }
  }

var T0 = maxIndex;
  // "interpolation is parabolic interpolation. It helps with precision. We suppose that a parabola pass through the
  // three points that comprise the peak. 'a' and 'b' are the unknowns from the linear equation system and b/(2a) is
  // the "error" in the abscissa. Well x1,x2,x3 should be y1,y2,y3 because they are the ordinates." - from original author
var x1 = c[T0 - 1];
var x2 = c[T0];
var x3 = c[T0 + 1]

var a = (x1 + x3 - 2 * x2) / 2;
var b = (x3 - x1) / 2
if (a) {
T0 = T0 - b / (2 * a);
}

return sampleRate/T0;
}

function HPS(dataArray, R) { //Harmonic Product Spectrum method of finding fundamental frequency
    function downSample(dataArray, factor) {
        return dataArray.filter((_, index) => index % factor === 0); //keep only every i'th value where i = factor
    }
    
    let productArray = new Float32Array(dataArray.length); //for multiplying we need the same length
    dataArray.forEach((value, index) => {
        productArray[index] = value; // initialize with the original dataArray values
    }); 
    
    for(let i = 2;i <= R; i++){
        let downSampledArr = downSample(dataArray,i);
        for (let j = 0; j < downSampledArr.length; j++) {
            productArray[j] *= downSampledArr[j]; //now we actually multiply the values with the original
        }
    
   
    }
    //find the peak frequency index and return
    const peakIndex = productArray.indexOf(Math.max(...productArray));
    return peakIndex;
}

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
