# Tuner/Pitch detection
Detects notes from an audio stream. Previously used Harmonic Product Spectrum for pitch detection. HPS worked well for accurately detecting notes, but was not sensitive enough to detect slight changes in pitch. Now uses autocorrelation, and has much improved responsiveness and performance as a result. Still needs improvements, but it is currently in working state. 

You can try it out at: https://calebcur01.github.io/tuner/ 
