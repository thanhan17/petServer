const express = require('express');
const app = express();
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const { readdirSync, fs } = require('fs');
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

app.get('/getSounds', (req, res) =>{
    const soundList = dirs.map((dir) => {
        return getFileNames(dir);
    })

    soundList = ["34", "35", "dgg"];


    const message = {
        dogSounds: soundList,
    };

    console.log(message);

    // if (soundList.length <= 0)
    // {
    //     res.status(500);
    //     return;
    // }

    console.log("here");
    res.status(200).send(JSON.stringify(message))
})

const dogMsg = [
    // "I love you",
    // "I want to play with you!",
    // "Get away from me!!",
    // "You're in danger", 
    // "I'm not felling well",
    // "Go pet me",
    "Let's play outdoor\nヽ（≧□≦）ノ",
    "I'm very hungry\n   o(TヘTo)",
    "I can fly\no(*￣︶￣*)o",
    "What time is it?\no(〃＾▽＾〃)o",
    "I saw a giant bird!\nΣ(っ °Д °;)っ",
    "I'm thirsty\n（〃｀ 3′〃）",
    "I’m hungry\n＞︿＜.",
    "I need a girl friend!\n(┬┬﹏┬┬)",
    "Come with me\n( •̀ ω •́ )✧",
    "Follow me!\no(*°▽°*)o",
    "I want to play ball\n(/≧▽≦)/",
    "Glad to meet you\n(´▽`ʃ♡ƪ)",
    "I'm sleepy\n(✿◡‿◡)",
    "I’m only a child\n(❁´◡`❁)",
    "I smell something…\n(⊙ˍ⊙)",
    "It's so hot!\n(╬▔皿▔)╯"
];


app.post('/upload', (req, res) =>
{
    const randomMsg = dogMsg[Math.floor(Math.random() * dogMsg.length)];

    const message = {
        name: randomMsg,
    };

    upload(req, res, (err) =>
    {
        if (err){
            message.name = "error";
        }
        else{
            console.log(req.file);
        }
    })    

    

    res.status(200).send(JSON.stringify(message))
})


