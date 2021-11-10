'use strict';
let canvas;
let gl;
let rotX = 0, rotY = 0, transZ = 3, autorot = 0;
let models = [];
let toonProgramInfo;
let imageTexture;
let cargada = 0;
let mostrar = 0;
const settings = {
    lightX: 0,
    lightY: 0,
};
function degToRad(d) {
    return d * Math.PI / 180;
}

function updateLightDir() {
    const cy = Math.cos(settings.lightY);
    const sy = Math.sin(settings.lightY);
    const cx = Math.cos(settings.lightX);
    const sx = Math.sin(settings.lightX);
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

function GetModelViewMatrix(
    translationX,
    translationY,
    translationZ,
    rotationX,
    rotationY
) {
    // [COMPLETAR] Modificar el código para formar la matriz de transformación.

    // Matriz de traslación
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

    // Matriz de traslación
    var trans = [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var final = m4.multiply(trans, m4.multiply(matrizX, matrizY));

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

function drawScene(mv, mvp) {
    // Make a view matrix from the camera matrix.
    const nrmTrans = [mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]];
    models.forEach(
        (modelObj) => {
            let prog = toonProgramInfo.program;
            gl.useProgram(prog);
            let Pos = gl.getAttribLocation(prog, "pos");
            let texPos = gl.getAttribLocation(prog, "texPos");
            let normPos = gl.getAttribLocation(prog, "normPos");
            let bufferPos = create_and_set_buffer(modelObj.positionBuffer);
            let bufferTex = create_and_set_buffer(modelObj.texCoordBuffer);
            let bufferNorm = create_and_set_buffer(modelObj.normalBuffer);
            enableArrayAttribute(bufferPos, Pos, 3)
            enableArrayAttribute(bufferTex, texPos, 2)
            enableArrayAttribute(bufferNorm, normPos, 3)
            let programUniforms = {
                mvp: mvp,
                mv: mv,
                mvNormal: nrmTrans,
                invertida: [
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1,
                ],
                color: imageTexture,
                cargada: cargada,
                mostrar: mostrar,
                l: updateLightDir(),
                shininess: Math.pow(10, 50 / 25),
            };
            webglUtils.setUniforms(toonProgramInfo, programUniforms);
            gl.drawArrays(gl.TRIANGLES, 0, modelObj.positionBuffer.length / 3 );
        }
    )
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
    let mv = GetModelViewMatrix(0, 0, transZ, rotX, autorot + rotY);
    let mvp = m4.multiply(perspectiveMatrix, mv);
    drawScene(mv, mvp);
}

function LoadObj(objectUrl) {
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
                models.push(mesh.getVertexBuffers());
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
    cargada = 1;
    mostrar = 1;
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
    imageTexture = loadImageTexture('https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill_001_base_COL.jpg');


    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
        {type: 'slider', key: 'lightX', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
        {type: 'slider', key: 'lightY', min: -1, max: 1, change: render, precision: 2, step: 0.001,},
    ]);

    const fieldOfViewRadians = degToRad(60);
    LoadObj('https://raw.githubusercontent.com/gfxfundamentals/webgl-fundamentals/master/webgl/resources/models/windmill/windmill.obj')

}

window.onload = () => {
    canvas = document.querySelector('#canvas');
    canvas.zoom = function( s )
    {
        transZ *= s/canvas.height + 1;
        render();
    }
    canvas.onwheel = function() { canvas.zoom(0.3*event.deltaY); }

    // Evento de click
    canvas.onmousedown = function()
    {
        var cx = event.clientX;
        var cy = event.clientY;
        if ( event.ctrlKey )
        {
            canvas.onmousemove = function()
            {
                canvas.zoom(5*(event.clientY - cy));
                cy = event.clientY;
            }
        }
        else
        {
            // Si se mueve el mouse, actualizo las matrices de rotación
            canvas.onmousemove = function()
            {
                rotY += (cx - event.clientX)/canvas.width*5;
                rotX += (cy - event.clientY)/canvas.height*5;
                cx = event.clientX;
                cy = event.clientY;
                render();
            }
        }
    }

    // Evento soltar el mouse
    canvas.onmouseup = canvas.onmouseleave = function()
    {
        canvas.onmousemove = null;
    }
    main();
};
window.onresize = () => {
    render()
}

