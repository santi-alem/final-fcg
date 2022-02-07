class Scene {
    constructor(modelsSettings) {
        this.models = [];
        for (const model of modelsSettings) {
            this.loadObj(model.meshUrl, model.textureUrl, model.position, model.rotation, model.scale)
        }
    }
    loadObj(meshUrl, textureUrl, position = [0, 0, 0], rotation = [0, 0, 0], modelScale = [1, 1, 1]) {
        // Cargamos la textura desde la url
        let texture = loadImageTexture(textureUrl);
        // Buscamos el .obj en la url y lo cargamos
        fetch(meshUrl).then(response => {
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
                    let model = new ModelDrawer(mesh.getVertexBuffers(), texture, position, rotation, modelScale);
                    this.models.push(model);
                    render();
                }
            )
        })
    }

    drawShadow(programInfo){
        this.models.forEach(
            (modelObj) => {
                modelObj.drawShadow(programInfo)
            }
        )
    }

    drawToon(programInfo) {
        this.models.forEach(
            (modelObj) => {
                modelObj.drawToon(programInfo)
            }
        )
    }

}
