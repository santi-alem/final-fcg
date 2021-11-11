'use strict';
let canvas;
let gl;
let rotX = 0, rotY = 0, transZ = 3, autorot = 0;
let models = [];
let toonProgramInfo;
let imageTexture;
let cargada = 0;
let mostrar = 0;
let depthTexture;
let checkerboardTexture;
let unusedTexture;
let shadowProgramInfo;

const settings = {
    lightX: 0,
    lightY: 0,
};

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
    ;
    var fov = 3.145 * fov_angle / 180;
    var s = 1 / Math.tan(fov / 2);
    return [
        s / r, 0, 0, 0,
        0, s, 0, 0,
        0, 0, (n + f) / (f - n), 1,
        0, 0, -2 * n * f / (f - n), 0
    ];
}

function ProjectionMatrix(c, z, fov_angle = 60) {
    var r = c.width / c.height;
    var n = (z - 1.74);
    const min_n = 0.001;
    if (n < min_n) n = min_n;
    var f = (z + 1.74);
    ;
    var fov = 3.145 * fov_angle / 180;
    var s = 1 / Math.tan(fov / 2);
    return [
        s / r, 0, 0, 0,
        0, s, 0, 0,
        0, 0, (n + f) / (f - n), 1,
        0, 0, -2 * n * f / (f - n), 0
    ];
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
    let rotation = m4.multiply(matrizX, matrizY);
    return rotation;
}

function GetModelViewMatrix(
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    // [COMPLETAR] Modificar el código para formar la matriz de transformación.

    // Matriz de traslación
    let rotation = rotationMatrix(rotationX, rotationY);

    // Matriz de traslación
    var trans = [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var final = m4.multiply(trans, rotation);

    return final;
}

function create_and_set_buffer(data) {
    let buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function enableArrayAttribute(buffer, attribute, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}

function generateShadows(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix) {
    mv = GetModelViewMatrix(0, 0, transZ, settings.lightX, settings.lightY);
    gl.useProgram(shadowProgramInfo.program);
    webglUtils.setUniforms(shadowProgramInfo, {
        // lightProjectionMatrix * inverse(lightWorldMatrix) * m4.translation(0, 0, 0)
        mvp: m4.multiply(lightProjectionMatrix, lightWorldMatrix)
    });
    models.forEach(
        (modelObj) => {
            modelObj.drawShadow(mv, mvp, shadowProgramInfo)
        }
    )
}

function drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix) {
    gl.useProgram(toonProgramInfo.program);
    const nrmTrans = [mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]];
    let programUniforms = {
        mvp: m4.multiply(lightProjectionMatrix, mv),
        mv: mv,
        mvNormal: nrmTrans,
        invertida: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ],
        cargada: cargada,
        mostrar: mostrar,
        l: updateLightDir(),
        shininess: Math.pow(10, 50 / 25),
    };
    webglUtils.setUniforms(toonProgramInfo, programUniforms);
    models.forEach(
        (modelObj) => {
            modelObj.drawToon(mv, mvp, toonProgramInfo)
        }
    )
}

function drawScene(perspectiveMatrix, lightProjectionMatrix, lightWorldMatrix) {
    // Draw with the toon shader
    let mv = GetModelViewMatrix(3, 0, transZ, rotX, autorot + rotY);
    let mvp = m4.multiply(perspectiveMatrix, mv);
    generateShadows(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
    drawModels(lightWorldMatrix, lightProjectionMatrix, mv, mvp, perspectiveMatrix);
}

// Draw the scene.
function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let perspectiveMatrix = ProjectionMatrix(canvas, transZ);

    let lightProjectionMatrix = ProjectionMatrix(canvas, transZ);

    const lightWorldMatrix = m4.multiply(m4.lookAt(
        [0, 0, transZ],          // position
        [0, 0, 0], // target
        [0, 1, 0],                                              // up
    ), rotationMatrix((-settings.lightX * Math.PI + rotX), (-settings.lightY * Math.PI + rotY)));
    drawScene(perspectiveMatrix, lightProjectionMatrix, lightWorldMatrix);
}

function LoadObj(objectUrl, textureUrl) {
    let texture = loadImageTexture(textureUrl);
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
                models.push(new ModelDrawer(mesh.getVertexBuffers(), texture));
                render();
            }
        )
    })
}


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
        render();
    });
    return texture;
}

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    // setup GLSL programs
    toonProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-toon', 'fragment-shader-toon']);
    shadowProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);
    // imageTexture = loadImageTexture('https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg');


    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
        {type: 'slider', key: 'lightX', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
        {type: 'slider', key: 'lightY', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
    ]);

    const fieldOfViewRadians = degToRad(60);
    LoadObj('https://raw.githubusercontent.com/jaanga/3d-models/gh-pages/obj/sculpture/12335_The_Thinker_v3_l2.obj'
        , 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg')
    LoadObj('https://raw.githubusercontent.com/jaanga/3d-models/gh-pages/obj/sculpture/hand.obj'
        , 'https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg')

    set_checkboard_texture();
    set_depth_textures();
}

function set_checkboard_texture() {
    checkerboardTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,                // mip level
        gl.LUMINANCE,     // internal format
        8,                // width
        8,                // height
        0,                // border
        gl.LUMINANCE,     // format
        gl.UNSIGNED_BYTE, // type
        new Uint8Array([  // data
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        ]));
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function set_depth_textures() {
    depthTexture = gl.createTexture();
    const depthTextureSize = 512;
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

    // attach it to the framebuffer
    unusedTexture = gl.createTexture();
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

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,        // target
        gl.COLOR_ATTACHMENT0,  // attachment point
        gl.TEXTURE_2D,         // texture target
        unusedTexture,         // texture
        0);                    // mip level
}

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
    main();
};
window.onresize = () => {
    render()
}

