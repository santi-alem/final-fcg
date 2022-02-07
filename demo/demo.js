'use strict';
let canvas;
let gl;
let rotX = degToRad(0), rotY = 0, transZ = 10, autorot = 0;
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
let scenes;
// Todo: Sacar los settings que no hacen nada
const settings = {
    lightX: -0.73,
    lightY: -0.35,
    shininess: 60,
    orthoFar: 20,
    lightDistance: 2.0,
    shadowBias: -0.0001,
    tipoDeRender: true,
    sombrasProyectadas: true,
    autoRotate: false,
    contorno: false,
    tamanoTrazo: 0.15,
    tonoTrazo: 0.0,
    mostrarTextura: true,
    cullFaces: true,
    numeroFases: 1,
    escena: 0,
};

function setUpWebGL() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    // Activamos las extensiones
    gl.getExtension('WEBGL_depth_texture');
    gl.getExtension('OES_standard_derivatives');
    gl.getExtension('EXT_shader_texture_lod');
    // Utilizamos webglUtils.createProgramInfo para crear los programas y manejar las variables asociadas a cada uno
    toonProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-toon', 'fragment-shader-toon']);
    shadowProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
    skyboxProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-sky', 'fragment-shader-sky']);

    faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/top.png',

        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/bottom.png',

        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/right.png',

        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/left.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/front.png',

        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/skybox/back.png',
        },
    ];
    //Cargamos las texturas a la skyBox
    setSkyBoxTexture();
    // Seteamos la textura y el framebuffer para el shadow map
    set_depth_buffer();

    let defaultScene = new Scene([
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/enano.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/enano_tex.png',
            position: [0.8, -0.5, 0],
            rotation: [0, 1, 0],
            scale: [0.5, 0.5, 0.5]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/the-adventure-zone-taako.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/tako_tex.png',
            position: [-0.4, -0.009, 0.1],
            rotation: [0, 0.89, 0],
            scale: [1, 1, 1]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/torre.jpg',
            position: [0, -1, 0],
            rotation: [0, 0, 0],
            scale: [2, 1, 2]
        }
    ]);
    let amongUS = new Scene([
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/among us.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/among us.jpg',
            position: [0.12, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/torre.jpg',
            position: [0, -1, 0],
            rotation: [0, 0, 0],
            scale: [2, 1, 2]
        }
    ]);
    let amongUS2 = new Scene([
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/among us.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/main/demo/models/among%20us2.jpg',
            position: [1, 1, 1.5],
            rotation: [0, 1, 0],
            scale: [0.5, 0.5, 0.5]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/among us.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/among us.jpg',
            position: [0.0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/torre.jpg',
            position: [0, -1, 0],
            rotation: [0, 0, 0],
            scale: [2, 1, 2]
        }
    ]);

    let casaScene = new Scene([
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/main/demo/models/medieval-house-008.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/main/demo/models/casa.jpg',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [3.4, 3.4, 3.4]
        },
    ]);
    let teaPot = new Scene([
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/teapot.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/teapot.jpg',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        },
        {
            meshUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/plano.obj',
            textureUrl: 'https://raw.githubusercontent.com/santi-alem/final-fcg/demo/demo/models/torre.jpg',
            position: [0, -1, 0],
            rotation: [0, 0, 0],
            scale: [2, 1, 2]
        }
    ]);
    scenes = [
        amongUS,
        amongUS2,
        teaPot,
        defaultScene,
        casaScene,
    ];

}

function render() {
    // Hacemos el resize del canvas
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Rendereamos la escena
    drawScene();
}

let lightRotation;

function drawScene() {
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
    let mv = m4.lookAt(
        [0, 0, transZ],          // position
        [0, 0, 0], // target
        [0, 1, 0],                                              // up
    );
    mv = m4.xRotate(mv, rotX)
    mv = m4.yRotate(mv, rotY + autorot)
    // Esto es para checkear que la perspectiva de la luz
    let mvp = m4.multiply(perspectiveMatrix, mv);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    if(settings.cullFaces) gl.enable(gl.CULL_FACE); // Eliminamos Las caras que enfrentan a la camara/luz
    // Rendereamos en el framebuffer la textura de profundidad para la iluminación
    drawShadows(lightWorldMatrix, lightProjectionMatrix);
    gl.disable(gl.CULL_FACE) // Eliminamos Las caras que enfrentan a la camara/luz
    // Sacamos el framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Seteamos el viewport del tamaño del canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //render sky
    drawSky(mv, perspectiveMatrix);

    gl.depthFunc(gl.LESS);
    // // Rendereamos la escena de nuevo para el con el toon shader
    drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
}

function setSkyBoxTexture() {
    // Create a texture.
    skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    faceInfos.forEach((faceInfo) => {
        //Target: cara que vamos a cargar
        //URL: dirección de la textura
        const {target, url} = faceInfo;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.crossOrigin = "anonymous";
        image.addEventListener('load', function () {
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
    var viewMatrix = m4.inverse(mv);
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;
    var viewDirectionProjectionMatrix =
        m4.multiply(projectionMatrix, viewMatrix);
    var viewDirectionProjectionInverseMatrix =
        m4.inverse(viewDirectionProjectionMatrix);

    gl.depthFunc(gl.LEQUAL);
    // primitives.createXYQuadBufferInfo nos sirve para generar la geometría del skybox
    const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);
    gl.useProgram(skyboxProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
    webglUtils.setUniforms(skyboxProgramInfo, {
        u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
        u_skybox: skyTexture,
    });
    webglUtils.drawBufferInfo(gl, quadBufferInfo);

}

function drawShadows(lightWorldMatrix, lightProjectionMatrix) {
    gl.useProgram(shadowProgramInfo.program);
    // Hacemos el binding del Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    // Seteamos el viewport del tamaño de la textura
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    // Seteamos las variables uniformes
    webglUtils.setUniforms(shadowProgramInfo, {
        viewMatrix: lightWorldMatrix,
        projectionMatrix: lightProjectionMatrix
    });

    // Dibujamos cada objeto
    scenes[settings.escena].drawShadow(shadowProgramInfo)
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
        mostrar: settings.mostrarTextura,
        numeroFases: settings.numeroFases,
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
    scenes[settings.escena].drawToon(toonProgramInfo)
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
        0);             // mip level, tiene que estar desactivado el mip mapping para esta textura

    // Hay que crear una textura de color aunque no se use
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

    // Realizamos el binding al framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        unusedTexture,
        0);
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



// Funcion para cargar una textura de una URL

function loadImageTexture(url) {
    // Creamos la textura
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fallback por si la textura no carga
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));

    // Cargamos la imagen desde la url
    const image = new Image();
    image.crossOrigin = "";
    image.src = url;
    image.addEventListener('load', function () {
        // Realizamos el binding de la textura y asociamos la imagen
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });
    return texture;
}

// todo: Mover a un Archivo propio
function degToRad(d) {
    return d * Math.PI / 180;
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
