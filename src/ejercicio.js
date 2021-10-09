
// <============================================ EJERCICIOS ============================================>
// a) Implementar la función:
//
//      GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
//
//    Si la implementación es correcta, podrán hacer rotar la caja correctamente (como en el video). Notar 
//    que esta función no es exactamente la misma que implementaron en el TP4, ya que no recibe por parámetro
//    la matriz de proyección. Es decir, deberá retornar solo la transformación antes de la proyección model-view (MV)
//    Es necesario completar esta implementación para que funcione el control de la luz en la interfaz. 
//    IMPORTANTE: No es recomendable avanzar con los ejercicios b) y c) si este no funciona correctamente. 
//
// b) Implementar los métodos:
//
//      setMesh( vertPos, texCoords, normals )
//      swapYZ( swap )
//      draw( matrixMVP, matrixMV, matrixNormal )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado, asi como también intercambiar 
//    sus coordenadas yz. Notar que es necesario pasar las normales como atributo al VertexShader. 
//    La función draw recibe ahora 3 matrices en column-major: 
//
//       * model-view-projection (MVP de 4x4)
//       * model-view (MV de 4x4)
//       * normal transformation (MV_3x3)
//
//    Estas últimas dos matrices adicionales deben ser utilizadas para transformar las posiciones y las normales del 
//    espacio objeto al esapcio cámara. 
//
// c) Implementar los métodos:
//
//      setTexture( img )
//      showTexture( show )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado y su textura.
//    Notar que los shaders deberán ser modificados entre el ejercicio b) y el c) para incorporar las texturas.
//  
// d) Implementar los métodos:
//
//      setLightDir(x,y,z)
//      setShininess(alpha)
//    
//    Estas funciones se llaman cada vez que se modifican los parámetros del modelo de iluminación en la 
//    interface. No es necesario transformar la dirección de la luz (x,y,z), ya viene en espacio cámara.
//
// Otras aclaraciones: 
//
//      * Utilizaremos una sola fuente de luz direccional en toda la escena
//      * La intensidad I para el modelo de iluminación debe ser seteada como blanca (1.0,1.0,1.0,1.0) en RGB
//      * Es opcional incorporar la componente ambiental (Ka) del modelo de iluminación
//      * Los coeficientes Kd y Ks correspondientes a las componentes difusa y especular del modelo 
//        deben ser seteados con el color blanco. En caso de que se active el uso de texturas, la 
//        componente difusa (Kd) será reemplazada por el valor de textura. 
//        
// <=====================================================================================================>

// Esta función recibe la matriz de proyección (ya calculada), una 
// traslación y dos ángulos de rotación (en radianes). Cada una de 
// las rotaciones se aplican sobre el eje x e y, respectivamente. 
// La función debe retornar la combinación de las transformaciones 
// 3D (rotación, traslación y proyección) en una matriz de 4x4, 
// representada por un arreglo en formato column-major. 

function GetModelViewMatrix(
	translationX,
	translationY,
	translationZ,
	rotationX,
	rotationY
) {
	// [COMPLETAR] Modificar el código para formar la matriz de transformación.

	// Matriz de traslación
	var matrizX = [1,0,0,0,
		0,Math.cos(rotationX),Math.sin(rotationX),0,
		0,-Math.sin(rotationX),Math.cos(rotationX),0,
		0,0,0,1
	];

	var matrizY = [Math.cos(rotationY),0,-Math.sin(rotationY),0,
		0,1,0,0,
		Math.sin(rotationY),0,Math.cos(rotationY),0,
		0,0,0,1
	];

	// Matriz de traslación
	var trans = [1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var final = MatrixMult(trans, MatrixMult(matrizX, matrizY));

	return final;
}

// [COMPLETAR] Completar la implementación de esta clase.
class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		let inicio = true;

		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.toon = InitShaderProgram(null, pokeFS);

		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation(this.prog, "mvp");
		this.mv = gl.getUniformLocation(this.prog, "mv");
		this.mvNormal = gl.getUniformLocation(this.prog, "mvNormal");
		this.invertida = gl.getUniformLocation(this.prog, "invertida");
		this.mostrar = gl.getUniformLocation(this.prog, "mostrar");
		this.cargada = gl.getUniformLocation(this.prog, "cargada");
		this.color = gl.getUniformLocation(this.prog, "color");

		//COSAS SOBEL
		this.sobel_y = gl.getUniformLocation(this.toon, "sobel_y");
		this.sobel_x = gl.getUniformLocation(this.toon, "sobel_x");
		this.texColor = gl.getUniformLocation(this.toon, "uTexColor");
		this.texNormal = gl.getUniformLocation(this.toon, "uTexNormals");
		this.resolusion = gl.getUniformLocation(this.toon, "uResolution");

		this.l = gl.getUniformLocation(this.prog, "l");
		this.shininess= gl.getUniformLocation(this.prog, "shininess");

		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.Pos = gl.getAttribLocation(this.prog, "pos");
		this.texPos = gl.getAttribLocation(this.prog, "texPos");
		this.normPos = gl.getAttribLocation(this.prog, "normPos");

		// 4. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.texture = gl.createTexture();
		this.bufferPos = gl.createBuffer();
		this.bufferTex = gl.createBuffer();
		this.bufferNorm = gl.createBuffer();
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, 100.0);
		gl.uniform3f(this.l, 1, 1, 1);
		gl.uniform1f(this.mostrar, 1.0);
		gl.uniform1f(this.cargada, 0);
		gl.uniformMatrix4fv(this.invertida, false, [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]);

		//Inicializamos las variables Sobel
		gl.uniformMatrix3fv(this.sobel_y, false, [
			1.0, 0.0, -1.0,
			2.0, 0.0, -2.0,
			1.0, 0.0, -1.0 
		]);
		gl.uniformMatrix3fv(this.sobel_x, false, [
			1.0, 2.0, 1.0,
			0.0, 0.0, 0.0,
			-1.0, -2.0, -1.0 
		]);

		gl.uniform2f(this.resolusion, window.screen.availWidth * window.devicePixelRatio,
			window.screen.availHeight * window.devicePixelRatio);
		// ...
	}
	
	// Esta función se llama cada vez que el usuario carga un nuevo
	// archivo OBJ. En los argumentos de esta función llegan un areglo
	// con las posiciones 3D de los vértices, un arreglo 2D con las
	// coordenadas de textura y las normales correspondientes a cada 
	// vértice. Todos los items en estos arreglos son del tipo float. 
	// Los vértices y normales se componen de a tres elementos 
	// consecutivos en el arreglo vertPos [x0,y0,z0,x1,y1,z1,..] y 
	// normals [n0,n0,n0,n1,n1,n1,...]. De manera similar, las 
	// cooredenadas de textura se componen de a 2 elementos 
	// consecutivos y se  asocian a cada vértice en orden. 
	setMesh( vertPos, texCoords, normals )
	{
		// [COMPLETAR] Actualizar el contenido del buffer de vértices
		this.numTriangles = vertPos.length / 3 / 3;
		this.inicio = false;
		this.vertPos = vertPos;
		this.texCoords = texCoords;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferTex);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);	

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferNorm);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Intercambiar Y-Z'
	// El argumento es un boleano que indica si el checkbox está tildado
	swapYZ( swap )
	{
		// [COMPLETAR] Setear variables uniformes en el vertex shader
		var invertida = [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1];

		var identidad = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		gl.useProgram(this.prog);
		if (swap) gl.uniformMatrix4fv(this.invertida, false, invertida);
		else gl.uniformMatrix4fv(this.invertida, false, identidad);
	}
	
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz model-view-projection (matrixMVP),
	// la matriz model-view (matrixMV) que es retornada por 
	// GetModelViewProjection y la matriz de transformación de las 
	// normales (matrixNormal) que es la inversa transpuesta de matrixMV
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [COMPLETAR] Completar con lo necesario para dibujar la colección de triángulos en WebGL
		
		// 1. Seleccionamos el shader
		gl.useProgram(this.prog);

		// 2. Setear matriz de transformacion
		//ACÁ HAY QUE REHACER LA MATRIZ DE TRANSFORMACIÓN
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix3fv(this.mvNormal, false, matrixNormal);

		// 3.Binding de los buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
		gl.vertexAttribPointer(this.Pos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.Pos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferTex);
		gl.vertexAttribPointer(this.texPos, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferNorm);
		gl.vertexAttribPointer(this.normPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normPos);

		gl.useProgram(this.toon);

		// ...
		// Dibujamos
		if(!this.inicio)
			gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles * 3);
   		// 4. AGREGAR LAS COSAS DE LAS NORMALES
	}
	
	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
		// [COMPLETAR] Binding de la textura

		// Pueden setear la textura utilizando esta función:

		gl.useProgram(this.prog);
		gl.uniform1f(this.cargada, 1);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(this.color, 0); //QUE ONDA ESTO?
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);


		// [COMPLETAR] Ahora que la textura ya está seteada, debemos setear 
		// parámetros uniformes en el fragment shader para que pueda usarla. 
	}
		
        // Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture( show )
	{
		// [COMPLETAR] Setear variables uniformes en el fragment shader para indicar si debe o no usar la textura
		if (show) {
			gl.useProgram(this.prog);
			gl.uniform1f(this.mostrar, 1.0);
		} else {
			gl.useProgram(this.prog);
			gl.uniform1f(this.mostrar, 0.0);
		}
	}
	
	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir( x, y, z )
	{		
		// [COMPLETAR] Setear variables uniformes en el fragment shader para especificar la dirección de la luz
		gl.useProgram(this.prog);
		gl.uniform3f(this.l, x, y, z);
	}
		
	// Este método se llama al actualizar el brillo del material 
	setShininess( shininess )
	{		
		// [COMPLETAR] Setear variables uniformes en el fragment shader para especificar el brillo.
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);
	}
}



// [COMPLETAR] Calcular iluminación utilizando Blinn-Phong.

// Recordar que: 
// Si declarás las variables pero no las usás, es como que no las declaraste
// y va a tirar error. Siempre va punto y coma al finalizar la sentencia. 
// Las constantes en punto flotante necesitan ser expresadas como x.y, 
// incluso si son enteros: ejemplo, para 4 escribimos 4.0.

// Vertex Shader
var meshVS = `
	attribute vec3 pos;
	attribute vec2 texPos;
	attribute vec3 normPos;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 mvNormal;
	uniform mat4 invertida;
	// uniform vec3 l;
	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;
	varying vec4 vecMV;

	void main()
	{ 
		gl_Position = mvp * invertida * vec4(pos, 1);
		vertCoord = vec4(pos, 1);
		texCoord = texPos;
		normCoord = mvNormal * normPos;
		vecMV = mv * vec4(pos, 1);

	}
`;

// Fragment Shader
// Algunas funciones útiles para escribir este shader:
// Dot product: https://thebookofshaders.com/glossary/?search=dot
// Normalize:   https://thebookofshaders.com/glossary/?search=normalize
// Pow:         https://thebookofshaders.com/glossary/?search=pow

var meshFS =`
precision mediump float;
uniform mat3 mn;
uniform vec3 l;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;
varying vec4 vecMV;

uniform float mostrar;
uniform float cargada;
uniform float shininess;
uniform sampler2D color;
const float niveles = 4.0;
const float p0 = 0.0;
const float p1 = 0.2;
const float p2 = 0.2;
const float p3 = 0.5;

void main()
{
	float luzNormal = max(0.0,dot(l,normCoord)); //Brightness
	float nivel = ceil(luzNormal *  niveles);
	luzNormal = nivel / niveles;
	luzNormal = p0
		+ max(0.0,sign(luzNormal - p0)) * p1
		+ max(0.0,sign(luzNormal - p0 - p1)) * p2
		+ max(0.0,sign(luzNormal - p0 - p1 - p2)) * p3;
	vec3 vista = vec3(-vecMV[0], -vecMV[1], -vecMV[2]);
	vec4 textureColor = texture2D(color, texCoord);
	vec4 ks = vec4(0.8, 0.8, 0.8, 1.0);
	vec3 h = normalize(l + normalize(vista));
	float vistaR = dot(h,normalize(normCoord));
	float borde = dot(normalize(vista),normalize(normCoord));
	vec4 diffuseColor = (mostrar != 0.0 && cargada == 1.0) ? textureColor : vec4(1.0,0.0,gl_FragCoord.z*gl_FragCoord.z,1.0);
	if (abs(borde) < 0.15){
		gl_FragColor = diffuseColor + vec4(1.0,1.0,1.0, 1.0 - borde);
	}else{
		gl_FragColor =  diffuseColor * vec4(0.1, 0.1, 0.1, 1) + luzNormal * (diffuseColor);
	}
}`
	;


var pokeFS = `
// first render target from the first pass
uniform sampler2D uTexColor;
// second render target from the first pass
uniform sampler2D uTexNormals;

uniform vec2 uResolution;

in vec2 fsInUV;

out vec4 fsOut0;

void main(void)
{
  float dx = 1.0 / uResolution.x;
  float dy = 1.0 / uResolution.y;

  vec3 center = sampleNrm( uTexNormals, vec2(0.0, 0.0) );

  // sampling just these 3 neighboring fragments keeps the outline thin.
  vec3 top = sampleNrm( uTexNormals, vec2(0.0, dy) );
  vec3 topRight = sampleNrm( uTexNormals, vec2(dx, dy) );
  vec3 right = sampleNrm( uTexNormals, vec2(dx, 0.0) );

  // the rest is pretty arbitrary, but seemed to give me the
  // best-looking results for whatever reason.

  vec3 t = center - top;
  vec3 r = center - right;
  vec3 tr = center - topRight;

  t = abs( t );
  r = abs( r );
  tr = abs( tr );

  float n;
  n = max( n, t.x );
  n = max( n, t.y );
  n = max( n, t.z );
  n = max( n, r.x );
  n = max( n, r.y );
  n = max( n, r.z );
  n = max( n, tr.x );
  n = max( n, tr.y );
  n = max( n, tr.z );

  // threshold and scale.
  n = 1.0 - clamp( clamp((n * 2.0) - 0.8, 0.0, 1.0) * 1.5, 0.0, 1.0 );

  fsOut0.rgb = texture(uTexColor, fsInUV).rgb * (0.1 + 0.9*n);
}

`;


var sobelFS = `
out vec4 FragColor;
in vec2 TexCoords;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float far;
uniform float near;
uniform vec2 uResolution;

float LinearizeDepth(float z)
{
     float n = near;
     float f = far;
     return (2.0 * n) / (f + n - z * (f - n));  
}

void main()
{ 
    vec3 colorDiff = texture(colorTexture, TexCoords).rgb;
    mat3 I;
    vec3 texel;
    for (int i=-1; i<2; i++) {
        for (int j=-1; j<2; j++) {
            float depth = LinearizeDepth(texture(depthTexture, TexCoords + vec2(i-1, j-1)).r);
            I[i + 1][j + 1] = depth; 
        }
    }
    float gx = dot(sobel_x[0], I[0]) + dot(sobel_x[1], I[1]) + dot(sobel_x[2], I[2]); 
    float gy = dot(sobel_y[0], I[0]) + dot(sobel_y[1], I[1]) + dot(sobel_y[2], I[2]);

    float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));

    FragColor = vec4(colorDiff - vec3(g), 1.0);
}
`
	;