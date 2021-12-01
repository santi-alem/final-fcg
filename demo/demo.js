'use strict';
let canvas;
let gl;
let rotX = degToRad(0), rotY = 0, transZ = 10, autorot = 0;
let models = [];
let toonProgramInfo;
let cargada = 1;
let mostrar = 1;
let depthTexture;
let unusedTexture;
let depthFramebuffer;
let shadowProgramInfo;
const depthTextureSize = 2160;

let skyboxProgramInfo;
let skyTexture;
let faceInfos; //Caras del box

// Todo: Sacar los settings que no hacen nada
const settings = {
    lightX: -0.73,
    lightY: -0.35,
    shininess: 60,
    orthoFar: 80,
    lightDistance: 60,
    shadowBias: -0.005,
    shadowTextureTranslate: 0.5,
    tipoDeRender: true,
    sombrasProyectadas: true,
    autoRotate: false,
    contorno: false,
    tamanoTrazo: 0.15,
    tonoTrazo: 0.5,
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
    skyboxProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-sky', 'fragment-shader-sky']);

    faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-x.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-x.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-y.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-y.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-z.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-z.jpg',
        },
    ];
    setSkyBoxTexture();
    // imageTexture = loadImageTexture('https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg');
    set_depth_buffer();
    setSettingUI();
    // Cargamos modelos
     LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/enano.obj', 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/enano_tex.png', [1, -0.5, 0], [0, 0, 0], [0.5, 0.5, 0.5])
     LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/the-adventure-zone-taako.obj', 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/tako_tex.png', [0, 0, 0], [0, 0, 0], [1, 1, 1])
    LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj', 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/teapot.jpg', [0, -1, 0], [0, 0, 0], [1.75, 1.75, 1.75])    // LoadObj('https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/moon-castle.obj', 'http://i.pinimg.com/originals/44/b1/5a/44b15ad5adfc1f0b195a8fe3c2c09033.jpg', [0, 0, 0],[0,0,0],[2,2,2])

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
let lightRotation;
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
    lightWorldMatrix = m4.yRotate(lightWorldMatrix, settings.lightY * Math.PI + autorot)
    // Armamos el MV y MVP para la pasada del toon shader
    // lightWorldMatrix = GetModelViewMatrix(0, 0, transZ, settings.lightX, settings.lightX);
    let mv = m4.lookAt(
        [0, 0, transZ],          // position
        [0, 0, 0], // target
        [0, 1, 0],                                              // up
    );
    // let mv = GetModelViewMatrix(0, 0, transZ, rotX, autorot + rotY);
    mv = m4.xRotate(mv, rotX)
    mv = m4.yRotate(mv, rotY  + autorot)
    // Esto es para checkear que la perspectiva de la luz
    // mv = lightWorldMatrix;
    // perspectiveMatrix = lightProjectionMatrix;

    let mvp = m4.multiply(perspectiveMatrix, mv);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE) // Eliminamos Las caras que enfrentan a la camara/luz
    // // Rendereamos en el framebuffer la textura de profundidad para la iluminación
    drawShadows(lightWorldMatrix, lightProjectionMatrix);
    gl.disable(gl.CULL_FACE) // Eliminamos Las caras que enfrentan a la camara/luz
    // Sacamos el framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Seteamos el viewport del tamaño del canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawSky(mv, perspectiveMatrix);
    // // Rendereamos la escena de nuevo para el con el toon shader
    drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
    //render sky
}

function setSkyBoxTexture() {
    // Create a texture.
    skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.crossOrigin = "anonymous";
        image.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

function drawSky(mv, projectionMatrix) {
    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(mv);
    // We only care about direciton so remove the translation
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;
    var viewDirectionProjectionMatrix =
        m4.multiply(projectionMatrix, viewMatrix);
    var viewDirectionProjectionInverseMatrix =
        m4.inverse(viewDirectionProjectionMatrix);

    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);
    // Draw the geometry.
    // draw the skybox
    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);
    const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);
    gl.useProgram(skyboxProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
    webglUtils.setUniforms(skyboxProgramInfo, {
        u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
        u_skybox: skyTexture,
    });
    webglUtils.drawBufferInfo(gl, quadBufferInfo);

}

// Fill the buffer with the values that define a quad.
//FUNCIÓN PARA EL SKY
function setGeometry(gl) {
    var positions = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function drawShadows(lightWorldMatrix, lightProjectionMatrix) {
    gl.useProgram(shadowProgramInfo.program);
    // Hacemos el binding del Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    // Seteamos el viewport del tamaño de la textura
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    // gl.clearColor(0.1, 0.2, 0.5, 1);
    gl.clear( gl.DEPTH_BUFFER_BIT);
    // Seteamos las variables uniformes
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


    // Creamos una matrix para transformar los puntos del MV en el mundo de iluminacion
    let textureMatrix = m4.identity();
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
    textureMatrix = m4.multiply(
        textureMatrix,
        lightWorldMatrix);
        // m4.inverse(lightWorldMatrix));
    // Seteamos todas las uniformes
    let programUniforms = {
        viewMatrix: mv,
        inverseViewMatrix: m4.inverse(m4.transpose(mv)),
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
        l: m4.inverse(lightWorldMatrix).slice(8, 11),
        shininess: Math.pow(settings.shininess, 50 / 25),
        u_projectedTexture: depthTexture,
        bias: settings.shadowBias,
        tipoLuz: settings.tipoDeRender,
        sombrasProyectadas: settings.sombrasProyectadas,
        contorno: settings.contorno,
        tamanoTrazo: settings.tamanoTrazo,
        tonoTrazo: settings.tonoTrazo,
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


function LoadObj(objectUrl, textureUrl, position = [0, 0, 0], rotation = [0, 0, 0], scaleObject = [1, 1, 1]) {
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
                models.push(new ModelDrawer(mesh.getVertexBuffers(), texture, position, rotation, scaleObject));
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
        {type: 'slider', key: 'lightDistance', min: 0, max: 50, change: render, precision: 2, step: 0.1,},
        {type: 'slider', key: 'orthoFar', min: 0, max: 500, change: render, precision: 2, step: 1,},
        {type: 'slider', key: 'shadowBias', min: -0.01, max: 0.00001, change: render, precision: 4, step: 0.0001,},
        {type: 'slider', key: 'shininess', min: 30, max: 100, change: render, precision: 4, step: 0.0001,},
        {type: 'slider', key: 'shadowTextureTranslate', min: 0, max: 1, change: render, precision: 4, step: 0.0001,},
        {type: 'checkbox', key: 'tipoDeRender', change: render,},
        {type: 'checkbox', key: 'sombrasProyectadas', change: render,},
        {type: 'checkbox', key: 'contorno', change: render,},
        {type: 'slider', key: 'tamanoTrazo', min: 0, max: 0.2, change: render, precision: 4, step: 0.0001,},
        {type: 'slider', key: 'tonoTrazo', min: 0, max: 1, change: render, precision: 2, step: 0.1,},
        {type: 'checkbox', key: 'autoRotate', change: AutoRotate,}
    ]);
}

// todo: Mover a un Archivo propio
function degToRad(d) {
    return d * Math.PI / 180;
}

function updateLightDir() {
    const cy = Math.cos(settings.lightY + autorot);
    const sy = Math.sin(settings.lightY + autorot);
    const cx = Math.cos(settings.lightX);
    const sx = Math.sin(settings.lightX);
    return [-sy, cy * sx, -cy * cx];
    // return [, settings.lightY, settings.lightZ]

}

const offset = 5;

// Calcula la matriz de perspectiva (column-major)
function ProjectionMatrix(c, z, fov_angle = 60) {
    var r = c.width / c.height;
    var n = (z - offset);
    const min_n = 0.001;
    if (n < min_n) n = min_n;
    var f = (z + offset);
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
    var f = (transZ + offset);

    let projWidth = r * f;
    let projHeight = r * f;
    var left = -projWidth / 2;
    var right = projWidth / 2;
    var bottom = -projHeight / 2;
    var top = projHeight / 2;
    var near = 0.1;
    var far = -settings.orthoFar;
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


let timer;

function AutoRotate() {
    // Si hay que girar...
    if (settings.autoRotate) {
        // Vamos rotando una cantiad constante cada 30 ms
        timer = setInterval(function () {
                autorot += 0.005;
                if (autorot > 2 * Math.PI) autorot -= 2 * Math.PI;
                // Reenderizamos
                render();
            }, 30
        );
    } else {
        clearInterval(timer);
    }
}
