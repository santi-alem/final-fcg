'use strict';
let canvas;
let gl;
let rotX = 90, rotY = 0, transZ = 10, autorot = 0;
let models = [];
let toonProgramInfo;
let cargada = 0;
let mostrar = 0;
let depthTexture;
let unusedTexture;
let depthFramebuffer;
let shadowProgramInfo;
const depthTextureSize = 1024;

// Todo: Sacar los settings que no hacen nada
const settings = {
    lightX: -0.5,
    lightY: -0.38,
    cameraX: 0,
    cameraY: 0,
    height: 1,
    width: 1,
    distance: 80,
    lightDistance: 60,
    shadowBias: -0.01,
    tipoDeRender: true
};

function setUpWebGL() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    gl.getExtension('WEBGL_depth_texture');


    // setup GLSL programs
    toonProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-toon', 'fragment-shader-toon']);
    shadowProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
    // imageTexture = loadImageTexture('https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg');
    set_depth_buffer();
    setSettingUI();
    // Cargamos modelos
    // LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/isometric-low-poly-bedroom.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg')
    // LoadObj('https://raw.githubusercontent.com/jaanga/3d-models/gh-pages/obj/sculpture/12335_The_Thinker_v3_l2.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg', [0, 1, 0])
    // LoadObj('https://raw.githubusercontent.com/jaanga/3d-models/gh-pages/obj/sculpture/elefante.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg', [2, 1, 0])
    LoadObj('https://raw.githubusercontent.com/santi-alem/fcg-2021-1c/main/tp5/models/among%20us.obj?token=AETBCF7MJ63I35JFPMZRRYTBUURXO', 'https://raw.githubusercontent.com/santi-alem/fcg-2021-1c/main/tp5/models/among%20us.jpg?token=AETBCF776WC5EOOPJSW3YGTBUUR4A')
    // LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg', [0, -1, 0])
    LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg', [1, -2, 0])
    // LoadObj('https://raw.githubusercontent.com/jaanga/3d-models/gh-pages/obj/aircraft/tu-160-blackjack/tu-160-blackjack.obj', 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg', [0, 0, 0])
}


// Draw the scene.
function render() {
    // Hacemos el resize del canvas
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.enable(gl.CULL_FACE);
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Rendereamos la escena
    drawScene();
}

function drawScene() {
    // Draw with the toon shader
    let perspectiveMatrix = ProjectionMatrix(canvas, transZ);
    //Creamos la matriz de proyeccion de la camara
    let lightProjectionMatrix = OrthographicMatrix();
    // Armamos la matriz MV para la Iluminacion
    let lightWorldMatrix = m4.lookAt(
        [0, 0, settings.lightDistance],          // position
        [0, 0, 0], // target
        [0, 1, 0],                                              // up
    );
    lightWorldMatrix = m4.xRotate(lightWorldMatrix, settings.lightX * Math.PI)
    lightWorldMatrix = m4.yRotate(lightWorldMatrix, settings.lightY * Math.PI)
    // Armamos el MV y MVP para la pasada del toon shader
    // lightWorldMatrix = GetModelViewMatrix(0, 0, transZ, settings.lightX, settings.lightX);
    let mv = m4.lookAt(
        [0, 0, transZ],          // position
        [0, 0, 0], // target
        [0, 1, 0],                                              // up
    );
    // let mv = GetModelViewMatrix(0, 0, transZ, rotX, autorot + rotY);
    mv = m4.xRotate(mv, rotX)
    mv = m4.zRotate(mv, rotY)
    // Esto es para checkear que la perspectiva de la luz
    // mv = lightWorldMatrix;
    // perspectiveMatrix = lightProjectionMatrix;

    let mvp = m4.multiply(perspectiveMatrix, mv);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE) // Eliminamos Las caras que enfrentan a la camara/luz
    // Rendereamos en el framebuffer la textura de profundidad para la iluminación
    drawShadows(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
    gl.disable(gl.CULL_FACE) // Eliminamos Las caras que enfrentan a la camara/luz
    // Rendereamos la escena de nuevo para el con el toon shader
    drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
}

function drawShadows(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix) {
    gl.useProgram(shadowProgramInfo.program);
    // Hacemos el binding del Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    // Seteamos el viewport del tamaño de la textura
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Seteamos las variables uniformes
    let mvpLight = m4.multiply(lightProjectionMatrix, lightWorldMatrix);
    webglUtils.setUniforms(shadowProgramInfo, {
        // lightProjectionMatrix * inverse(lightWorldMatrix) * m4.translation(0, 0, 0)
        viewMatrix: lightWorldMatrix,
        projectionMatrix: lightProjectionMatrix
    });

    // Dibujamos cada objeto
    models.forEach(
        (modelObj) => {
            modelObj.drawShadow(shadowProgramInfo)
        }
    )
}


function drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix) {
    gl.useProgram(toonProgramInfo.program);
    // Sacamos el framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Seteamos el viewport del tamaño del canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Creamos una matrix para transformar los puntos del MV en el mundo de iluminacion
    let textureMatrix = m4.identity();
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
    // use the inverse of this world matrix to make
    // a matrix that will transform other positions
    // to be relative this world space.
    textureMatrix = m4.multiply(
        textureMatrix,
        lightWorldMatrix);
    // MV para normales
    // mv = lightWorldMatrix;
    // perspectiveMatrix = lightProjectionMatrix;
    // Seteamos todas las uniformes
    let programUniforms = {
        viewMatrix: mv,
        projectionMatrix: perspectiveMatrix,
        u_textureMatrix: textureMatrix,
        invertida: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ],
        cargada: cargada,
        mostrar: mostrar,
        l: lightWorldMatrix.slice(8, 11),
        shininess: Math.pow(10, 50 / 25),
        u_projectedTexture: depthTexture,
        bias: settings.shadowBias,
        tipoLuz: settings.tipoDeRender,
    };
    webglUtils.setUniforms(toonProgramInfo, programUniforms);
    models.forEach(
        (modelObj) => {
            modelObj.drawToon(toonProgramInfo)
        }
    )
}


function set_depth_buffer() {
    // Creamos la textura de profundidad en dónde vamos a tener la sombras
    depthTexture = gl.createTexture();
    // El frame buffer donde rendereamos lo que esta iluminado
    depthFramebuffer = gl.createFramebuffer();
    // Una textura sin usar para completar el framebuffer si no supuestamente no anda
    unusedTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT, // internal format
        depthTextureSize,   // width
        depthTextureSize,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.UNSIGNED_INT,    // type
        null);              // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0);                   // mip level

    // create a color texture of the same size as the depth texture
    // see article why this is needed_
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        depthTextureSize,
        depthTextureSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // attach it to the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,        // target
        gl.COLOR_ATTACHMENT0,  // attachment point
        gl.TEXTURE_2D,         // texture target
        unusedTexture,         // texture
        0);                    // mip level
}


// Seteamos los eventos

window.onload = () => {
    canvas = document.querySelector('#canvas');
    canvas.zoom = function (s) {
        transZ *= s / canvas.height + 1;
        render();
    }
    canvas.onwheel = function () {
        canvas.zoom(0.3 * event.deltaY);
    }

    // Evento de click
    canvas.onmousedown = function () {
        var cx = event.clientX;
        var cy = event.clientY;
        if (event.ctrlKey) {
            canvas.onmousemove = function () {
                canvas.zoom(5 * (event.clientY - cy));
                cy = event.clientY;
            }
        } else {
            // Si se mueve el mouse, actualizo las matrices de rotación
            canvas.onmousemove = function () {
                rotY += (cx - event.clientX) / canvas.width * 5;
                rotX += (cy - event.clientY) / canvas.height * 5;
                cx = event.clientX;
                cy = event.clientY;
                render();
            }
        }
    }

    // Evento soltar el mouse
    canvas.onmouseup = canvas.onmouseleave = function () {
        canvas.onmousemove = null;
    }
    setUpWebGL();
};
window.onresize = () => {
    render()
}


function LoadObj(objectUrl, textureUrl, position = [0, 0, 0], rotation = [0, 0, 0]) {
    // Cargamos la textura desde la url
    let texture = loadImageTexture(textureUrl);
    // BUscamos el .obj en la url y lo cargamos
    fetch(objectUrl).then(response => {
        response.text().then(
            text => {
                var mesh = new ObjMesh;
                mesh.parse(text);
                var box = mesh.getBoundingBox();
                var shift = [
                    -(box.min[0] + box.max[0]) / 2,
                    -(box.min[1] + box.max[1]) / 2,
                    -(box.min[2] + box.max[2]) / 2
                ];
                var size = [
                    (box.max[0] - box.min[0]) / 2,
                    (box.max[1] - box.min[1]) / 2,
                    (box.max[2] - box.min[2]) / 2
                ];
                var maxSize = Math.max(size[0], size[1], size[2]);
                var scale = 1 / maxSize;
                mesh.shiftAndScale(shift, scale);
                models.push(new ModelDrawer(mesh.getVertexBuffers(), texture, position));
                render();
            }
        )
    })
}

// Funcion para cargar una textura de una URL
function loadImageTexture(url) {
    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    const image = new Image();
    image.crossOrigin = "";
    image.src = url;
    image.addEventListener('load', function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // assumes this texture is a power of 2
        gl.generateMipmap(gl.TEXTURE_2D);
    });
    return texture;
}

// Funcion para cargar una textura de una URL

function setSettingUI() {
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
        {type: 'slider', key: 'lightX', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
        {type: 'slider', key: 'lightY', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
        {type: 'slider', key: 'distance', min: 0, max: 1000, change: render, precision: 2, step: 1,},
        {type: 'slider', key: 'lightDistance', min: 0, max: 50, change: render, precision: 2, step: 0.1,},
        { type: 'slider', key: 'shadowBias', min: -0.01, max: 0.00001, change: render, precision: 4, step: 0.0001, },
        { type: 'checkbox', key: 'tipoDeRender', change: render, }
    ]);
}

// todo: Mover a un Archivo propio
function degToRad(d) {
    return d * Math.PI / 180;
}

function updateLightDir() {
    const cy = Math.cos(settings.lightY * Math.PI);
    const sy = Math.sin(settings.lightY * Math.PI);
    const cx = Math.cos(settings.lightX * Math.PI);
    const sx = Math.sin(settings.lightX * Math.PI);
    return [-sy, cy * sx, -cy * cx];
    // return [, settings.lightY, settings.lightZ]

}

function ProjectionMatrix(c, z, fov_angle = 60) {
    var r = c.width / c.height;
    var n = (z - 1.74);
    const min_n = 0.001;
    if (n < min_n) n = min_n;
    var f = (z + 1.74);
    var fov = 3.145 * fov_angle / 180;
    var s = 1 / Math.tan(fov / 2);
    return [
        s / r, 0, 0, 0,
        0, s, 0, 0,
        0, 0, (n + f) / (f - n), 1,
        0, 0, -2 * n * f / (f - n), 0
    ];
}

function OrthographicMatrix() {
    var r = canvas.height / canvas.width;
    var n = (transZ - 1.74);
    const min_n = 0.001;
    if (n < min_n) n = min_n;
    var f = (transZ + 1.74);

    let projWidth = r * f;
    let projHeight = r * f;
    var left = - projWidth /2;
    var right = projWidth/2;
    var bottom = - projHeight/2;
    var top = projHeight/2;
    var near = 0.1;
    var far = -settings.distance;
    return m4.orthographic(left, right, bottom, top, near, far);
}

function rotationMatrix(rotationX, rotationY) {
    var matrizX = [1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    var matrizY = [Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];
    return m4.multiply(matrizX, matrizY);
}

function GetModelViewMatrix(
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    // Matriz de traslación
    let rotation = rotationMatrix(rotationX, rotationY);

    // Matriz de traslación
    var trans = [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    return m4.multiply(trans, rotation);
}



