const express = require('express');
const app = express();
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const { readdirSync} = require('fs');
const fs = require('fs');
const Meyda = require('meyda');
const { dir } = require('console');



const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)


app.use(express.json());
app.use(express.urlencoded({extended: false}));

const storage = multer.diskStorage({
    destination: './public/audios',
    filename: function(req, file, cb)
    {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})



const getFileNames = (dir) =>{
    let names = readdirSync('./public/petSound/' + dir + "/");
    return names.map((n) =>{
        return dir + "/" + n;
    })
}



const upload = multer({
    storage: storage
}).single('audio');

var port = process.env.PORT || '5000'
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})


app.get('/download/:filename', (req, res) =>{
    
    console.log(req.body);
    console.log(req.params.filename);
    res.sendFile(__dirname + '/public/petSound/' + req.params.filename);
})


app.get('/', (req, res) =>{
    console.log("here");
    let dirs = getDirectories("./public/petSound/");

    const soundList = dirs.map((dir) => {
        return getFileNames(dir);
    })

    let message = {
        dogSounds: soundList,
    };

    console.log(message);

    res.status(200).send(JSON.stringify(message))
});

const dogMsg = [
    ["I'm not feeling well\nヽ（≧□≦）ノ",
    "Stay away from me\n   o(TヘTo)",
    "Grrrrrrrrrrrrrr\no(*￣︶￣*)o",
    "What time is it?\no(〃＾▽＾〃)o",
    "I'm a big dog! Strong!!!\nΣ(っ °Д °;)っ",
    "I’m hungry\n＞︿＜."],

    ["I need a girl friend!\n(┬┬﹏┬┬)",
    "Come with me\n( •̀ ω •́ )✧",
    "I'm sad! Please play with me\no(*°▽°*)o",
    "I want to play ball\n(/≧▽≦)/",
    "I need something to eat\n(´▽`ʃ♡ƪ)",
    "I'm sleepy\n(✿◡‿◡)"],
    
    ["I’m only a child\n(❁´◡`❁)",
    "I smell something…\n(⊙ˍ⊙)",
    "It's so hot!\n(╬▔皿▔)╯",
    "Come with me\n( •̀ ω •́ )✧",
    "Follow me!\no(*°▽°*)o",
    "I want to play ball\n(/≧▽≦)/",
    "Glad to meet you\n(´▽`ʃ♡ƪ)"]
];


app.post('/upload', (req, res) =>
{


    upload(req, res, (err) =>
    {
        if (err){
            message.name = "error";
            res.status(500).send(JSON.stringify(message))
        }
        else{
            try{
                console.log(req.file);
                analyzeAudio(req.file.path, (res) =>
                {
                    const dogEmoMsg = dogMsg[res]; //Get emo type
                    const randomMsg = dogEmoMsg[Math.floor(Math.random() * dogEmoMsg.length)]; //Random

                    const message = {
                        name: randomMsg,
                    };
                    res.status(200).send(JSON.stringify(message))
                })
            }
            catch (err){
                const dogEmoMsg = dogMsg[0];
                const randomMsg = dogEmoMsg[Math.floor(Math.random() * dogEmoMsg.length)];
                
                const message = {
                    name: randomMsg,
                };
                res.status(200).send(JSON.stringify(message))
            }
        }
    })    
})




let wav = require('node-wav');




const BUFFER_SIZE = 16384;

Meyda.bufferSize = BUFFER_SIZE;
 

//https://stackoverflow.com/questions/32439437/retrieve-an-evenly-distributed-number-of-elements-from-an-array
function distributedCopy(items, n) {
    var elements = [items[0]];
    var totalItems = items.length - 2;
    var interval = Math.floor(totalItems/(n - 2));
    for (var i = 1; i < n - 1; i++) {
        elements.push(items[i * interval]);
    }
    elements.push(items[items.length - 1]);
    return elements;
}


const { getAudioDurationInSeconds } = require('get-audio-duration');
 

const meanFrequency = (array) =>
{
    let sum = 0;
    let sumFre = 0;
    let freMax = 0;
    let maxAmp = 0;
    for (let i = 0; i < array.length; i++){
        let a = array[i];
        if(a > maxAmp)
        {
            freMax = i;
            maxAmp = a;
        }
        sum += a*i;
        sumFre += a;
    };

    console.log(freMax, maxAmp);    
}

let average = (array) => array.reduce((a, b) => a + b) / array.length;

function findAvgIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) { return inp[b] - inp[a]; }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    } 
    return average(outp);
}



const MAX_FRE = [1300, 1480];
const MEAN_FRE = [820, 844];
const AMP_RANGE = [34, 37];
const DURATION = [3, 10];

const calculateChance = (Range, value)=>
{  
    const low = Range[0];
    const high = Range[1];

    const dis = high - low;

    if (value < low)
    {
        return (value - low)/dis;
    }
    if (value > high)
    {
        return (value - high)/dis;
    }
    return 0;    
}

let toWav = require('audiobuffer-to-wav')

// Return values:
//  0: Disturbance
//  1: Isolation
//  2: Playful
const analyzeAudio = (filedir, callbackfunc) =>
{
    let buffer = fs.readFileSync(filedir);
    let result = wav.decode(toWav(buffer));

    let channels = result.channelData; // array of Float32Array
    const signal = channels[0];

    let data = distributedCopy(signal, BUFFER_SIZE);
    const spectrum = Meyda.extract('amplitudeSpectrum', data);
    const meanAllFres = Meyda.extract('spectralCentroid', data); // Mean of all frequences
    const amRange = Meyda.extract('perceptualSpread', data); // Amplitude range
    const maxFres = findAvgIndicesOfMax(spectrum, 10); //Mean of the top 10 loudess frequences
    getAudioDurationInSeconds(filedir).then((duration) => {
      let sum = 0;
      sum += calculateChance(MEAN_FRE, meanAllFres);
      sum += calculateChance(MAX_FRE, maxFres);
      sum += calculateChance(AMP_RANGE, amRange);
      
      const A = calculateChance(DURATION, duration);
      if (A > 0)
      {
          sum -= A;
      }
      else if (A == 0)
      {
          sum += 0.2;
      }

      const val = calculateChance([-1, 1], sum);
      let res = 1;
      if (val < 0)
      {
          res = 0;
      }
      else if (val > 0)
      {
          res = 2;
      }
      callbackfunc(res);     
      return res;
    });
    
}