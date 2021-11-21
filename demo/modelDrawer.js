class ModelDrawer {
    constructor(meshData, texture, position, rotationX, rotationY, scale) {
        // TODO: Usar las posiciones y la rotacion
        this.bufferPos = createAndSetBuffer(meshData.positionBuffer);
        this.bufferTex = createAndSetBuffer(meshData.texCoordBuffer);
        this.bufferNorm = createAndSetBuffer(meshData.normalBuffer);
        this.size = meshData.positionBuffer.length / 3;
        this.texture = texture;
        // Todo add rotation and scale
        this.translation = m4.translation(position[0],position[1],position[2])
    }

    drawToon(programInfo) {
        const prog = programInfo.program;
        // Seteamos los atributos y los buffer para el
        let Pos = gl.getAttribLocation(prog, "pos");
        let texPos = gl.getAttribLocation(prog, "texPos");
        let normPos = gl.getAttribLocation(prog, "normPos");
        enableArrayAttribute(this.bufferPos, Pos, 3)
        enableArrayAttribute(this.bufferTex, texPos, 2)
        enableArrayAttribute(this.bufferNorm, normPos, 3)
        // Seteamos la textura
        webglUtils.setUniforms(programInfo, {
            color: this.texture,
            objectMatrix : this.translation,
        });
        // Dibujamos
        gl.drawArrays(gl.TRIANGLES, 0, this.size);
    }

    drawShadow(programInfo) {
        const prog = programInfo.program;
        // Seteamos solo el buffer de posiciones
        let Pos = gl.getAttribLocation(prog, "pos");
        enableArrayAttribute(this.bufferPos, Pos, 3)
        webglUtils.setUniforms(programInfo, {
            color: this.texture,
            objectMatrix : this.translation,
        });
        gl.drawArrays(gl.TRIANGLES, 0, this.size);
    }

}

function createAndSetBuffer(data) {
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
