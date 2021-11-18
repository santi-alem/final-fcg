class ModelDrawer {
    constructor(meshData, texture, position, rotation) {
        this.bufferPos = create_and_set_buffer(meshData.positionBuffer);
        this.bufferTex = create_and_set_buffer(meshData.texCoordBuffer);
        this.bufferNorm = create_and_set_buffer(meshData.normalBuffer);
        this.size = meshData.positionBuffer.length / 3;
        this.texture = texture;

    }

    drawToon(mv, mvp, programInfo) {
        const prog = programInfo.program;
        let Pos = gl.getAttribLocation(prog, "pos");
        let texPos = gl.getAttribLocation(prog, "texPos");
        let normPos = gl.getAttribLocation(prog, "normPos");
        enableArrayAttribute(this.bufferPos, Pos, 3)
        enableArrayAttribute(this.bufferTex, texPos, 2)
        enableArrayAttribute(this.bufferNorm, normPos, 3)
        webglUtils.setUniforms(programInfo, {
            color:this.texture,
        });
        gl.drawArrays(gl.TRIANGLES, 0, this.size );
    }
    drawShadow(mv, mvp, programInfo){
        const prog = programInfo.program;
        let Pos = gl.getAttribLocation(prog, "pos");
        enableArrayAttribute(this.bufferPos, Pos, 3)
        gl.drawArrays(gl.TRIANGLES, 0, this.size );
    }
}
