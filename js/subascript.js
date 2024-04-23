

/******************VARIABLES*********************** */
let point = 0
let turno_pass_qtyD
let snfile
let uri
let statusf = 0
let statusp = 0
let statusfinal = 1
let statusfinal1 = 1
let myInterval
let sn  //aqui se declara la variable del serial 
let sn1
const socket = io();
let fullimage = document.getElementById('CanvasFHD') //canvas donde se pondra la imagen original 
let fullimagectx = fullimage.getContext('2d')
let capturedCanvas = document.getElementById('capturedCanvas') //canvas donde se pondra la imagen original 
let capturedCanvasctx = capturedCanvas.getContext('2d')
//console.log(fecha)

let statusx = 0;
let port = '80'
let ip = '172.24.139.7'

function mostrar() {
    document.getElementById('CanvasFHD').style.visibility = "visible"

}

function mapcams() { // ver los id's de las camaras
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const filtered = devices.filter(device => device.kind === 'videoinput');
            console.log('Cameras found', filtered);
        });
}
//funcion para abrir la camara
function open_cam() {// Resolve de 2 segundos //falta poner point de argumento 

    return new Promise(async resolve => {
        let camid
        if (point == 1) { console.log("hola camara 1"); camid = "7b319f79b83c369552d8de848f50b30c55205e50b303013454455ab6cbb56350" } // ID de cada camara 
        // Falta declarar 2 camaras 

        const video = document.querySelector('video')
        const vgaConstraints = {
            video: {
                deviceId: camid,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } //width: {exact: 280}, height: {exact: 280} / deviceId: "5bba2c7c9238e1d8ab5e90e2f2f94aa226749826319f6c705c5bfb5a3d2d5279"
        }
        await navigator.mediaDevices.getUserMedia(vgaConstraints).then((stream) => { video.srcObject = stream }).catch(function (err) { console.log(err.name) })
        setTimeout(function fire() { resolve('resolved'); }, 1000) //tiempo para el opencam
        //setTimeout(function fire(){resolve('resolved');},1000);
    });//Cierra Promise principal
}
function captureimage() {

    return new Promise(async resolve => {

        const video = document.getElementById("video")

        fullimagectx.drawImage(video, 0, 0, fullimage.width, fullimage.height) // Dibuja en el fullimage la captura de la imagen 1
        console.log("estoy en el canvas")
        capturedCanvasctx.drawImage(fullimage, 0, 0, capturedCanvas.width, capturedCanvas.height)
        setTimeout(function fire() { resolve('resolved'); }, 1000) //tiempo para el opencam
        //setTimeout(function fire() { resolve('resolved'); }, 2000);//Temporal para programacion de secuencia
        console.log("FHD Image captured")
        resolve('resolved')
    })

}
let model = new cvstfjs.ObjectDetectionModel()
//**************************************************Modelo cargado de la IA***************************************************************** */
async function loadmodel() {

    await model.loadModelAsync('modelm/model.json')
    console.log(model)

}
//analiza la imagen full 
async function predict(fullimage) {
    fullimage = document.getElementById('CanvasFHD')
    let input_size = model.input_size

    // Take & Pre-process the image
    let image = tf.browser.fromPixels(fullimage, 3)
    image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size]) //  
    let predictions = await model.executeAsync(image)

    console.log(predictions)

    //console.log(input_size)
    await highlightResults(predictions) //espera a esta funcion para verificar si tiene corto o no

}
loadmodel() //ya que hace la prediccion se habla al modelo de IA para que revise si pasa o falla
//************************************************************************************** Funciones pass o fail mandadas al socket ********************************************/

//************************************************************************************** Funciones de recuadros ubica */
var children = []
let criterio = 0.10
let criterio2 = 0.30
//esta funcion es para verificar el corto de l primer punto
async function highlightResults(predictions) {

    for (let n = 0; n < predictions[0].length && statusfinal == 1; n++) {
        // Check scores
        if (predictions[1][n] > criterio) {
            console.log("fallé: " + predictions[1][n])
            statusf = "0"
            //statusfinal = "0"
            console.log("statusfinalf" + statusfinal)
            const p = document.createElement('p')
            p.innerText = TARGET_CLASSES[predictions[2][n]] + ': '
                + Math.round(parseFloat(predictions[1][n]) * 100)
                + '%';

            //statusfinal = "0"
            console.log("Prediction:" + predictions[1][n])
            console.log(p.innerText)
            bboxLeft = (predictions[0][n][0] * 1154) //900 es el Width de la imagen y hace match con el with del overlay
            bboxTop = (predictions[0][n][1] * 560) //540 es el Height de la imagen y hace match con el with del overlay
            bboxWidth = (predictions[0][n][2] * 910) - bboxLeft//800 en vez del video.width
            bboxHeight = (predictions[0][n][3] * 540) - bboxTop//448 en vez del video.width
            console.log("X1:" + bboxLeft, "Y1:" + bboxTop, "W:" + bboxWidth, "H:" + bboxHeight)
            p.style = 'margin-left: ' + bboxLeft + 'px; margin-top: '
                + (bboxTop - 22) + 'px; width: '
                + (bboxWidth - 8) + 'px; top: 0; left: 0;'

            console.log(p.style)
            const highlighter = document.createElement('div')
            highlighter.setAttribute('class', 'highlighter')
            highlighter.style = 'left: ' + bboxLeft + 'px; top: '
                + bboxTop + 'px; width: '
                + bboxWidth + 'px; height: '
                + bboxHeight + 'px;'
            imageOverlay.appendChild(highlighter)
            imageOverlay.appendChild(p)
            children.push(highlighter)
            children.push(p)
            //statusf = 0
            console.log("FALLEEEEEE 1")
            statusfinal = 0
        }
        else {
            console.log("pasé: " + predictions[1][n])
            statusp = "1"
            console.log("PASEEEE 1")


            statusfinal = 1
            console.log("status final " + statusfinal)


        }
        console.log("este es el:" + statusfinal)

    }
}
/********* HighlightResult para la prediccion de la segunda imagen****************************** */
//funcion flujo para mostrarlos el status final de las dos tarjetas
function removeHighlights() {
    for (let i = 0; i < children.length; i++) {
        imageOverlay.removeChild(children[i])
    }
    children = []
}
//apagamos las camaras
function stopcam() {
    return new Promise(async resolve => {
        const video = document.querySelector('video');
        // A video's MediaStream object is available through its srcObject attribute
        const mediaStream = video.srcObject;
        // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
        const tracks = mediaStream.getTracks();
        tracks.forEach(track => { track.stop() })//;console.log(track);
        setTimeout(function fire() { resolve('resolved'); }, 1000);
    });//Cierra Promise principal
}
//startengine(0) //antes de que inicie todo el arduino estara en la posicion 0 (luz azul)
async function sequence() {
    //await startengine(1) //una vez que inicie la secuencia, se pondra en la posicion 1 (luz azul-morado)
    //funcion para aviso de el plc
    //for(point =1;point < 4; point ++){
    await open_cam() //ponerle "point" dentro de los parentesis
    await captureimage()
    await predict()
    await stopcam()
    if (statusfinal == 1) { await pass() }
    else { await fail() }
    setTimeout(function fire() { location.reload() }, 2000);//reiniciamos la pagina despues de 2 segundos
}
async function pass() {
    document.getElementById('tarjeta2').style.background = '#00ff40'
}
async function fail() {
    document.getElementById('tarjeta2').style.background = '#cf010b'
}

